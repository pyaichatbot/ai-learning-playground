# 04 — Training Infrastructure: Multi-GPU, FSDP, DeepSpeed

> **Level**: Advanced  
> **Time**: ~90 minutes  
> **Goal**: Estimate memory requirements exactly. Configure distributed training. Debug OOM errors confidently.

---

## The Memory Problem at Scale

You cannot fine-tune productively without understanding GPU memory. Every OOM error, every "why is this so slow," every budget discussion with infrastructure teams — it comes back to memory.

### The Four Memory Consumers

For any training run, GPU memory is consumed by four things:

```
TOTAL MEMORY = Model Weights + Gradients + Optimizer States + Activations
```

Let's size each for a 7B parameter model in fp16/bf16:

**1. Model Weights**
- fp32: 7B × 4 bytes = 28 GB
- fp16/bf16: 7B × 2 bytes = 14 GB
- 4-bit (QLoRA): 7B × 0.5 bytes = 3.5 GB

**2. Gradients** (only for trainable parameters)
- Full fine-tuning, fp16: 7B × 2 bytes = 14 GB
- LoRA r=16 (all layers), fp16: ~50M × 2 bytes = 0.1 GB
- Conclusion: LoRA gradients are negligible

**3. Optimizer States** (only for trainable parameters)
- Adam has two states per parameter (first and second moments): 2 × parameters × 4 bytes (fp32)
- Full fine-tuning with Adam, fp32 states: 7B × 2 × 4 = 56 GB
- LoRA r=16 with Adam: 50M × 2 × 4 = 0.4 GB
- Conclusion: LoRA optimizer states are negligible

**4. Activations**
- Depends on: batch size × sequence length × hidden dimension × number of layers
- Most variable component. Gradient checkpointing trades compute for memory here.
- Rough estimate: 2–10 GB depending on configuration (see below)

### The Quick Memory Formula

For QLoRA training with LoRA:
```
Required VRAM (single GPU) ≈ (Model size in 4-bit) + 1.5 GB (adapter + optimizer) + activation_memory
```

Where activation_memory ≈ 0.5 × batch_size × seq_len/1024 × model_size_in_GB

**Examples**:
- Llama 3.1 8B, QLoRA, batch=4, seq=2048: 3.5 + 1.5 + ~2 ≈ 7 GB → fits in 16 GB GPU
- Llama 3.1 70B, QLoRA, batch=4, seq=2048: 35 + 1.5 + ~8 ≈ 45 GB → needs 2× A100 40GB

For full fine-tuning with Adam in mixed precision (without sharding):
```
Required VRAM total ≈ 16 bytes × model_params (= 16 × model_size_in_B GB)
```

This is the **total** memory across all GPUs, not per GPU. Breakdown: 2 bytes (fp16 weights) + 2 bytes (fp16 gradients) + 4 bytes (fp32 optimizer state 1) + 4 bytes (fp32 optimizer state 2) + 4 bytes (fp32 master weights) = 16 bytes/param.

- 7B model: 7 × 16 = **112 GB total** → 2× A100 80GB minimum (FSDP shards this across GPUs)
- 70B model: 70 × 16 = **1,120 GB total** → 14+ A100 80GB with ZeRO-3

With ZeRO-3 / FSDP FULL_SHARD, each GPU holds ≈ total / num_gpus (plus activations). The worked examples in the "Memory Math" section below show per-GPU calculations.

This is why QLoRA is the practical default for everything ≥ 7B.

---

## Single GPU Optimization (The Starting Point)

Before going multi-GPU, maximize single-GPU efficiency. Multi-GPU is complexity and cost; single-GPU is simplicity.

### Configuration hierarchy for fitting larger models/batches:

1. **Enable gradient checkpointing** — recompute activations during backward pass
   ```python
   model.gradient_checkpointing_enable()
   # Or in TrainingArguments:
   gradient_checkpointing=True
   ```
   Memory savings: 30–60%. Compute overhead: 20–30%.

2. **Use gradient accumulation** — effective batch size = batch_size × accumulation_steps
   ```python
   TrainingArguments(
       per_device_train_batch_size=2,
       gradient_accumulation_steps=8,  # effective batch = 16
   )
   ```
   Memory: batch_size=2 uses proportionally less activation memory than batch_size=16.

3. **Use bfloat16** (not float16 on Ampere+)
   ```python
   TrainingArguments(bf16=True, fp16=False)
   ```
   bf16 avoids the overflow issues of fp16 while using half the memory of fp32.

3a. **Set gradient clipping** — prevents catastrophic loss spikes, especially in early LoRA training when adapter weights are near-zero
   ```python
   TrainingArguments(max_grad_norm=1.0)
   ```
   Gradient clipping is commonly omitted but critical: without it, a single bad batch can send the adapter weights into an unrecoverable state. Default 1.0 works for most configurations. If loss oscillates after warmup, try 0.3.

4. **Use flash attention** — fused attention kernel with O(N) memory instead of O(N²)
   ```python
   model = AutoModelForCausalLM.from_pretrained(
       model_id,
       attn_implementation="flash_attention_2"
   )
   ```
   Requires `flash-attn` package, CUDA 11.6+, Ampere GPU or newer. Significant speedup for long sequences.

5. **Pack sequences** — concatenate multiple short examples into a single sequence with attention masks to prevent cross-contamination. Eliminates padding overhead.
   ```python
   # In SFTTrainer (TRL)
   SFTConfig(packing=True)
   ```

### Memory profiling before you start

```python
# Print VRAM usage at key points
import torch

def print_gpu_memory(msg=""):
    allocated = torch.cuda.memory_allocated() / 1e9
    reserved = torch.cuda.memory_reserved() / 1e9
    print(f"{msg} | Allocated: {allocated:.2f}GB | Reserved: {reserved:.2f}GB")

# After model load
print_gpu_memory("After model load")

# After first forward pass
print_gpu_memory("After first forward pass")
```

---

## Multi-GPU Training: When and Why

Single GPU becomes the bottleneck in two scenarios:
1. **Model doesn't fit**: The model is too large to load in a single GPU's memory
2. **Training is too slow**: Training time exceeds acceptable wall-clock time

For scenario 1, you need **model parallelism** (split the model across GPUs).
For scenario 2, you need **data parallelism** (each GPU trains on different batches simultaneously).

Modern approaches handle both with a unified strategy.

---

## Distributed Training Strategies

### Data Parallelism (DP)

Each GPU holds a complete copy of the model. Different GPUs process different batches. Gradients are averaged across GPUs after each step.

```
GPU 0: model_copy | batch_0 → gradients_0
GPU 1: model_copy | batch_1 → gradients_1
GPU 2: model_copy | batch_2 → gradients_2
GPU 3: model_copy | batch_3 → gradients_3
                      ↓
               Average gradients
                      ↓
              Update all model copies
```

**Effective batch size = per_gpu_batch_size × num_gpus × gradient_accumulation_steps**

**Limitation**: Requires model + optimizer states to fit on a single GPU. For 7B full fine-tuning (~112 GB per GPU with optimizer), this means each GPU needs 112 GB — impractical.

**When to use**: QLoRA + LoRA training where the model fits on one GPU. Scaling data throughput with multiple identical GPUs.

---

### Fully Sharded Data Parallel (FSDP)

PyTorch's native solution. Shards model weights, gradients, and optimizer states across GPUs. Each GPU holds only 1/N of all these tensors. Before each operation, the relevant shard is gathered from all GPUs, the operation runs, then the gathered tensor is discarded.

```
GPU 0: shard_0(weights) | shard_0(gradients) | shard_0(optimizer_states)
GPU 1: shard_1(weights) | shard_1(gradients) | shard_1(optimizer_states)
GPU 2: shard_2(weights) | shard_2(gradients) | shard_2(optimizer_states)
GPU 3: shard_3(weights) | shard_3(gradients) | shard_3(optimizer_states)
```

**Memory per GPU**: Total_memory / N (approximately)

FSDP configuration in Hugging Face:

```python
# fsdp_config.json
{
    "fsdp_auto_wrap_policy": "TRANSFORMER_BASED_WRAP",
    "fsdp_backward_prefetch_policy": "BACKWARD_PRE",
    "fsdp_forward_prefetch": "false",
    "fsdp_offload_params": "false",     # True to offload to CPU (slow but saves GPU)
    "fsdp_sharding_strategy": 1,         # 1=FULL_SHARD, 2=SHARD_GRAD_OP, 3=NO_SHARD
    "fsdp_state_dict_type": "FULL_STATE_DICT",
    "fsdp_cpu_ram_efficient_loading": "true"
}
```

```
accelerate launch --config_file fsdp_config.json train.py
```

**FSDP Sharding Strategy**:
- `FULL_SHARD` (ZeRO-3 equivalent): Shards everything — weights, gradients, optimizer states. Maximum memory efficiency.
- `SHARD_GRAD_OP` (ZeRO-2 equivalent): Shards gradients and optimizer states only. Weights replicated.
- `NO_SHARD`: Standard data parallel. No sharding.

**FSDP2**: PyTorch 2.1+ introduces FSDP2 with per-parameter sharding (instead of per-layer), better composability with activation checkpointing and quantization, and cleaner integration with torch.compile. Prefer FSDP2 for new training setups.

---

### DeepSpeed ZeRO

Microsoft's Deep Learning Optimization Engine. Similar to FSDP but with different implementation and additional features (ZeRO-Infinity).

**ZeRO stages**:

| Stage | What's Sharded | Memory Reduction |
|-------|---------------|-----------------|
| ZeRO-0 | Nothing (baseline) | 1× |
| ZeRO-1 | Optimizer states | ~4× |
| ZeRO-2 | + Gradients | ~8× |
| ZeRO-3 | + Parameters | ~N× (where N = GPU count) |
| ZeRO-Infinity | + Offload to NVMe | Near-unlimited model size |

```json
// deepspeed_config_z3.json
{
  "zero_optimization": {
    "stage": 3,
    "allgather_partitions": true,
    "allgather_bucket_size": 2e8,
    "reduce_scatter": true,
    "reduce_bucket_size": 2e8,
    "overlap_comm": true,
    "contiguous_gradients": true,
    "sub_group_size": 1e9,
    "stage3_prefetch_bucket_size": 5e7,
    "stage3_param_persistence_threshold": 1e6,
    "stage3_gather_16bit_weights_on_model_save": true
  },
  "bf16": {
    "enabled": true
  },
  "optimizer": {
    "type": "AdamW",
    "params": {
      "lr": "auto",
      "betas": "auto",
      "eps": "auto",
      "weight_decay": "auto"
    }
  },
  "train_batch_size": "auto",
  "gradient_accumulation_steps": "auto"
}
```

```
deepspeed --num_gpus=8 train.py --deepspeed deepspeed_config_z3.json
```

**FSDP vs DeepSpeed**: Both achieve similar memory efficiency. FSDP is native PyTorch — no additional dependency, better support in the ecosystem, recommended for new projects. DeepSpeed has a longer track record, better documentation for extreme-scale training (100B+ models), and ZeRO-Infinity for CPU/NVMe offload.

---

## Memory Math Examples: Worked Cases

### Case 1: Fine-tune Llama 3.1 8B with full fine-tuning on 4× A100 80GB

Memory per GPU with FSDP FULL_SHARD:
- Weights: 8B × 2 bytes = 16 GB / 4 GPUs = 4 GB
- Gradients: 8B × 2 bytes = 16 GB / 4 GPUs = 4 GB  
- Optimizer: 8B × 8 bytes (Adam fp32) = 64 GB / 4 GPUs = 16 GB
- Activations: ~4 GB at batch=4, seq=2048

**Total per GPU: ~28 GB** → Fits on A100 80GB. Use batch_size=8 for more throughput.

---

### Case 2: Fine-tune Llama 3.1 70B with QLoRA on 4× A100 80GB

- Base model (4-bit): 70B × 0.5 bytes = 35 GB / 4 GPUs = 8.75 GB
- LoRA adapters (r=16, bf16): ~500 MB / 4 GPUs = trivial
- Optimizer for LoRA: ~1 GB / 4 GPUs = trivial
- Activations: ~4 GB at batch=2, seq=2048

**Total per GPU: ~14 GB** → Fits on a single A100 80GB per GPU. Multi-GPU here increases throughput, not necessity.

---

### Case 3: Full fine-tune Llama 3.1 70B on 16× H100 80GB

- Weights: 70B × 2 bytes = 140 GB / 16 GPUs = 8.75 GB
- Gradients: 140 GB / 16 GPUs = 8.75 GB
- Optimizer: 70B × 8 bytes = 560 GB / 16 GPUs = 35 GB
- Activations: ~4 GB at batch=2, seq=2048

**Total per GPU: ~56 GB** → Fits on H100 80GB with ZeRO-3 or FSDP FULL_SHARD.

---

## Debugging OOM Errors

OOM (Out of Memory) errors are the most common infrastructure failure in LLM training. Systematic diagnosis:

### Step 1: Identify which memory consumer is the culprit

```python
# Profile memory after each major step
torch.cuda.empty_cache()
print_gpu_memory("Before model load")

model = load_model(...)
print_gpu_memory("After model load")  # ← If this fails: model too large for GPU

optimizer = AdamW(model.parameters(), ...)
print_gpu_memory("After optimizer init")  # ← If this fails: optimizer states too large

# Run one forward+backward pass
outputs = model(**batch)
loss = outputs.loss
print_gpu_memory("After forward pass")  # ← If this fails: activations too large
loss.backward()
print_gpu_memory("After backward pass")  # ← If this fails: gradients too large
```

### Step 2: Apply targeted fixes

| Culprit | Fix |
|---------|-----|
| Model weights | Use quantization (4-bit QLoRA), use smaller model |
| Optimizer states | Use LoRA (reduces trainable params by 99%), use paged AdamW |
| Activations | Enable gradient checkpointing, reduce batch size, reduce sequence length |
| Gradients | Use LoRA (gradients only for adapter params), use ZeRO-2/3 or FSDP |

### Common OOM pattern: OOM only after several iterations

This is usually due to memory fragmentation. The first several batches fit, but as the allocator fragments memory, later allocations fail.

```python
# Add to training loop
if step % 100 == 0:
    torch.cuda.empty_cache()
```

Not a real fix for memory pressure — but helps identify if fragmentation (vs. just too little memory) is the issue.

### Paged optimizer states

For AdamW when optimizer states are large:

```python
from bitsandbytes import optim

optimizer = optim.PagedAdamW8bit(
    model.parameters(),
    lr=2e-4,
    weight_decay=0.01
)
```

Paged AdamW stores optimizer states in CPU memory and pages them into GPU as needed. Slower than GPU Adam, but enables much larger models on limited GPU memory.

---

## Throughput Optimization

Memory efficiency is about fitting the training run. Throughput efficiency is about making it fast.

### Metric: tokens/second

```python
# Measure during training
tokens_per_batch = per_device_batch_size * sequence_length * num_gpus
tokens_per_second = tokens_per_batch / step_time
```

**Typical throughput (reference numbers, verify against your hardware)**:
- Single A100 80GB, QLoRA, Llama 3.1 8B, seq=2048: ~8,000–12,000 tokens/sec
- 4× A100 80GB, full FT, Llama 3.1 8B, seq=2048: ~25,000–40,000 tokens/sec

These numbers vary substantially by model architecture, driver version, and configuration. Measure on your hardware before projecting training time.

### torch.compile

```python
model = torch.compile(model)
```

JIT-compiles the model for the current hardware. Can provide 10–30% throughput improvement. May conflict with some PEFT operations — test carefully.

**Compatibility note**: torch.compile + FSDP2 is now well-supported in PyTorch 2.3+. torch.compile + DeepSpeed ZeRO-3 is more complex — check current compatibility before relying on it.

### Flash Attention 2/3

Fused attention kernel that computes attention in tiles without materializing the full N×N attention matrix. 2–4× faster than standard attention for long sequences. Memory: O(N) instead of O(N²).

```python
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    attn_implementation="flash_attention_2"
)
```

**Flash Attention 3** (2025): Further optimizations for H100's tensor core architecture. 1.5–2× faster than FA2 on H100. Available via `flash-attn >= 2.6.0`.

---

## Training Frameworks Comparison

You don't always need to write raw PyTorch training loops. Three frameworks are worth knowing:

### LLaMA-Factory

- **Strength**: Broadest model support (100+ architectures), web UI for configuration, supports SFT/DPO/ORPO/GRPO all from config files
- **Use case**: Teams that want configuration-driven training without writing training code
- **Multi-GPU**: Supported via DeepSpeed or FSDP integration
- **GitHub**: hiyouga/LLaMA-Factory

```yaml
# llama_factory config example
model_name_or_path: meta-llama/Llama-3.1-8B-Instruct
finetuning_type: lora
lora_rank: 16
lora_alpha: 16
lora_target: all
dataset: your_dataset
template: llama3
num_train_epochs: 3.0
learning_rate: 2.0e-4
output_dir: ./output
```

### Unsloth

- **Strength**: 2–5× faster training, custom CUDA kernels, 60% less VRAM than standard implementations
- **Use case**: Resource-constrained environments, fast iteration
- **Key feature**: Drop-in replacement for HF model loading — minimal code change
- **Multi-GPU**: Available in Unsloth Pro (commercial)

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/llama-3-8b-bnb-4bit",
    max_seq_length=2048,
    dtype=None,
    load_in_4bit=True,
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    use_gradient_checkpointing="unsloth",  # Custom memory-efficient checkpointing
    use_rslora=False,
)
```

### Axolotl

- **Strength**: Production-grade pipeline, strong support for complex configurations, widely used for alignment training
- **Use case**: Production training runs, complex dataset mixing, multi-stage pipelines
- **Multi-GPU**: Native support via DeepSpeed and FSDP

```yaml
# axolotl config example
base_model: meta-llama/Llama-3.1-8B-Instruct
load_in_4bit: true
adapter: lora
lora_r: 16
lora_alpha: 16
datasets:
  - path: your_dataset
    type: chat_template
output_dir: ./output
sequence_len: 2048
micro_batch_size: 4
gradient_accumulation_steps: 4
num_epochs: 3
optimizer: adamw_8bit
lr_scheduler: cosine
learning_rate: 0.0002
```

**Which to use**: Start with Unsloth or LLaMA-Factory for rapid iteration. Move to Axolotl for production multi-stage pipelines.

---

## Cloud GPU Selection (2025–2026 Reference)

Fine-tuning runs on cloud GPU instances. These are commonly available instance types — verify current pricing and availability on your provider:

| Instance | GPU | VRAM | Use For |
|----------|-----|------|---------|
| AWS `p3.2xlarge` | 1× V100 16GB | 16 GB | QLoRA 7–8B, development |
| AWS `p4d.24xlarge` | 8× A100 40GB | 320 GB | QLoRA 70B, full FT 7–13B |
| AWS `p4de.24xlarge` | 8× A100 80GB | 640 GB | Full FT up to ~30B, QLoRA any |
| AWS `p5.48xlarge` | 8× H100 80GB | 640 GB | Full FT 70B+, fastest training |
| GCP `a2-highgpu-1g` | 1× A100 40GB | 40 GB | QLoRA 13–30B |
| GCP `a2-megagpu-16g` | 16× A100 40GB | 640 GB | Full FT 70B |
| Azure `NC24ads A100 v4` | 1× A100 80GB | 80 GB | QLoRA any, full FT ≤13B |

**Spot/Preemptible instances**: 60–80% cheaper. Set checkpoint saves every 100–200 steps and use `resume_from_checkpoint` to handle preemptions. For runs > 2 hours on spot instances, checkpointing is not optional.

**Rule**: For a new project, start development on the cheapest GPU that fits. Move to larger instances only for the final production training run.

---

## Checkpointing Strategy

Losing a long training run to a crash is painful. Checkpoint intelligently:

```python
TrainingArguments(
    save_strategy="steps",         # Save every N steps
    save_steps=500,                # For long runs
    save_total_limit=3,            # Keep only 3 most recent checkpoints
    load_best_model_at_end=True,   # Load best eval checkpoint at end of training
    metric_for_best_model="eval_loss",
)
```

**For multi-GPU with FSDP**: State dict saving requires coordination. Use `FULL_STATE_DICT` for human-readable checkpoints, `LOCAL_STATE_DICT` for faster checkpoint I/O.

```python
# FSDP full state dict saving (required for model reuse)
from torch.distributed.fsdp import FullStateDictConfig, StateDictType

with FSDP.state_dict_type(
    model,
    StateDictType.FULL_STATE_DICT,
    FullStateDictConfig(offload_to_cpu=True, rank0_only=True),
):
    state_dict = model.state_dict()
    if dist.get_rank() == 0:
        torch.save(state_dict, "checkpoint.pt")
```

---

## Teach It Back

1. A model that takes 14 GB in fp16 will take how much memory for full fine-tuning with Adam optimizer? Walk through the calculation.

2. Explain the difference between FSDP FULL_SHARD and SHARD_GRAD_OP to an engineer who knows what data parallelism is but not ZeRO.

3. You're running a 4-GPU training job and get OOM after 50 steps (but not at step 1). What's the likely cause and how do you debug it?

4. Your team is choosing between Unsloth and Axolotl for a production training pipeline. What questions determine the choice?

---

## Knowledge Check

**Q1**: You want to full fine-tune Llama 3.1 70B. How many A100 80GB GPUs do you need, and what sharding strategy?

**A**: Memory requirement: ~70B × 16 bytes (weights + gradients + optimizer in mixed precision) ≈ 1.1 TB. With 8× A100 80GB (640 GB total) using FSDP FULL_SHARD or DeepSpeed ZeRO-3: ~137 GB per GPU including activations — too tight. Minimum: 16× A100 80GB (1.28 TB). In practice, 16 H100s (80GB each) is the standard configuration for 70B full fine-tuning in 2025–2026.

---

**Q2**: Your training throughput is 3,000 tokens/sec on a single A100 80GB. Your dataset is 10M tokens. Roughly how long will training take for 3 epochs?

**A**: Total tokens = 10M × 3 = 30M tokens. At 3,000 tokens/sec: 30M / 3,000 = 10,000 seconds ≈ 2.8 hours. This is a rough calculation — actual throughput varies. Add 10–20% for data loading, checkpoint I/O, and evaluation steps.

---

*Continue to [05 — Evaluation Framework: Proving Your Model Works](./05-evaluation-framework.md)*

*Last reviewed: May 2026. Hardware recommendations and framework performance evolve; benchmark on your specific hardware before planning large runs.*
