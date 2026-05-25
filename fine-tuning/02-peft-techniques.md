# 02 — PEFT Deep Dive: LoRA, QLoRA, DoRA & Beyond

> **Level**: Intermediate–Advanced  
> **Time**: ~90 minutes  
> **Goal**: Configure any PEFT technique correctly. Explain every hyperparameter. Know when to deviate from defaults.

---

## The Problem PEFT Solves

Full fine-tuning a 7B parameter model requires storing gradients and optimizer states for 7 billion parameters. With Adam optimizer, that's:
- Parameters: 7B × 2 bytes (fp16) = 14 GB
- Gradients: 7B × 2 bytes = 14 GB  
- Optimizer states (Adam has 2): 7B × 4 bytes × 2 = 56 GB

**Total: ~84 GB** to fine-tune a 7B model. That's three A100 80GB GPUs minimum, before accounting for activations and batch data.

PEFT's insight: you don't need to update all 7 billion parameters to change behavior. **A small set of additional parameters, applied to the right parts of the model, achieves most of the benefit at a fraction of the cost.**

---

## The Intuition Behind Low-Rank Adaptation

Before the math: the key insight.

Pre-trained model weights encode a lot of information. When you fine-tune for a specific task, the **weight update** (the change you need to make) tends to have a much lower "intrinsic rank" than the full weight matrix. That is, the meaningful change lives in a low-dimensional subspace.

LoRA exploits this. Instead of learning a full-rank weight update ΔW ∈ ℝ^(d×k), it learns two smaller matrices:
- A ∈ ℝ^(d×r)  (down-projection)
- B ∈ ℝ^(r×k)  (up-projection)

Where r << d (r is typically 4–64, d might be 4096). The weight update is: **ΔW = BA**

**The savings**: Instead of d×k parameters (e.g., 4096 × 4096 = 16.7M), you train r×(d+k) parameters (e.g., 16 × (4096+4096) = 131K). For r=16, that's 127× fewer parameters for this matrix.

**The tradeoff**: You assume the useful update lives in a rank-r subspace. This holds well for most fine-tuning tasks. It breaks down for tasks that require very different behavior from the base model across many directions simultaneously.

---

## LoRA: The Mechanics

### Where LoRA is applied

LoRA is applied to weight matrices in the Transformer's attention mechanism. In practice, the most impactful targets are:

- **Q (query) and V (value) projection matrices** — the original paper applied LoRA here; most impactful for style and format
- **K (key) projection** — can add further benefit
- **All projection matrices** including output projection, up/down projection in FFN layers — highest adaptation capacity, at higher parameter cost

The `target_modules` hyperparameter controls this. A common starting configuration:

```python
target_modules = ["q_proj", "v_proj"]  # Original LoRA paper default
# OR
target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"]  # More coverage
# OR 
target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", 
                  "gate_proj", "up_proj", "down_proj"]  # Maximum coverage
```

---

### LoRA Hyperparameters: The Complete Reference

**`r` — Rank** (most important parameter)

The rank of the low-rank matrices A and B. Controls the expressivity of the adapter.

| r value | Use case |
|---------|----------|
| 4 | Very task-specific, minimal behavioral change, minimal parameters |
| 8 | Light task adaptation, format tuning |
| 16 | **Default starting point.** Good balance for most tasks. |
| 32 | More complex behavioral changes, multi-task |
| 64 | Complex tasks, when r=32 doesn't converge well |
| 128+ | Approaching full fine-tuning territory; usually not justified |

**Rule**: Start at r=16. Only increase if the model isn't learning the task. Don't start at r=64 thinking "bigger is better" — you're adding parameters without knowing you need them.

---

**`lora_alpha` — Scaling factor**

Controls the scale of the LoRA update relative to the base weights. The effective scaling applied to the weight update is `alpha / r`.

**The standard approach**: Set `lora_alpha = r`. This makes the effective scaling factor 1.0, and the learning rate for LoRA parameters matches your base learning rate.

**Common mistake**: Setting `lora_alpha = 32` while `r = 16` without adjusting learning rate. This effectively doubles the learning rate for LoRA weights, which can cause instability.

**RSLoRA exception**: See below.

---

**`lora_dropout`**

Dropout applied to LoRA weights during training. Regularizes the adapter and reduces overfitting on small datasets.

| Dataset size | Recommended dropout |
|-------------|-------------------|
| < 1,000 examples | 0.1–0.2 |
| 1,000–10,000 | 0.05–0.1 |
| > 10,000 | 0 or 0.05 |

---

**`bias`**

Whether to include bias parameters in training. Options: `"none"` (default), `"all"`, `"lora_only"`.

Default `"none"` is almost always correct. Bias training adds minimal benefit and can interfere with base model behavior.

---

### Standard LoRA Configuration (PEFT library)

```python
from peft import LoraConfig, get_peft_model

lora_config = LoraConfig(
    r=16,
    lora_alpha=16,        # Match r for stable scaling
    lora_dropout=0.05,    # Light regularization
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(base_model, lora_config)
model.print_trainable_parameters()
# trainable params: 41,943,040 || all params: 8,030,261,248 || trainable%: 0.52%
```

---

## QLoRA: LoRA on a Quantized Model

QLoRA (Dettmers et al., 2023) made fine-tuning 7B+ models accessible on a single consumer GPU by combining:

1. **4-bit NF4 quantization** of the base model weights
2. **LoRA adapters** in full precision (fp16/bf16) on top
3. **Double quantization** of quantization constants (small additional saving)

### The memory calculation

For a 7B model with QLoRA:
- Base model weights (4-bit NF4): 7B × 0.5 bytes = 3.5 GB
- LoRA adapter weights (bf16, r=16): ~500 MB
- Optimizer states (only for adapter weights): ~1 GB
- Activations: varies with batch size and sequence length

**Total: ~6–8 GB** — fits on a single 16 GB GPU for many configurations.

Compare to full fine-tuning: 84 GB. This is why QLoRA matters.

### The quality tradeoff

QLoRA produces models that are slightly lower quality than full fine-tuning of the same base model, primarily because:
- Gradients are computed with respect to the frozen 4-bit base weights (less precise)
- The quantization introduces a small amount of irreducible noise

In practice, for most task-specific fine-tuning, the quality gap is small (~1–3% on task metrics). For complex reasoning tasks, the gap can be larger.

### QLoRA Configuration

```python
from transformers import BitsAndBytesConfig
import torch

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,       # Double quantization
    bnb_4bit_quant_type="nf4",            # NF4 is optimal for LLM weight distributions
    bnb_4bit_compute_dtype=torch.bfloat16  # Computation in bfloat16
)

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    quantization_config=bnb_config,
    device_map="auto"
)
```

Then apply LoRA as before. The bitsandbytes library handles the quantized base model; PEFT handles the LoRA adapters.

**When to use bf16 vs fp16**: Use `bfloat16` on Ampere GPUs and newer (A100, RTX 3090/4090). Use `float16` on older hardware. bf16 has more numerical range (important for training stability) but less precision.

---

## RSLoRA: Rank-Stable Scaling

**Problem LoRA has**: As you increase rank r, the weight update scale changes non-linearly. This means a rank-16 LoRA and a rank-64 LoRA need different learning rates — making hyperparameter tuning across ranks difficult.

**RSLoRA's fix**: Instead of scaling by `alpha/r`, scale by `alpha/√r`. This makes the update magnitude consistent across ranks, so you can change r without re-tuning your learning rate.

```python
lora_config = LoraConfig(
    r=32,
    lora_alpha=32,
    use_rslora=True,   # Enable RSLoRA scaling (alpha/sqrt(r))
    ...
)
```

**When to use RSLoRA**: When you're exploring different rank configurations and want to compare them without adjusting learning rates for each. When r > 16. RSLoRA is now available in the PEFT library and adds no computational cost.

**Default recommendation**: Enable RSLoRA for r ≥ 32. For r=16, the difference is small.

---

## DoRA: Weight-Decomposed Low-Rank Adaptation

**The problem with LoRA**: LoRA learns a single weight update matrix ΔW = BA. This couples changes in weight magnitude and direction in a single representation, which limits learning capacity.

**DoRA's insight**: Decompose weight updates into two components:
- **Magnitude** (scalar per output dimension): How strong each output feature is
- **Direction** (unit vector): Which direction in feature space the output points

Mathematically, DoRA initializes:
- `m` = column-wise magnitude of the pre-trained weight W
- `V` = direction component of W (column-normalized)
- During fine-tuning: updates `m` (scalar) and applies LoRA to `V` (direction)

**Why this is better**: Learning magnitude separately from direction is an easier optimization problem. The model can adjust the "strength" of a feature independently from "what it means." Empirically, DoRA:
- Learns more with the same parameter count
- Converges more stably
- Shows improvements particularly on instruction-following and coding tasks

```python
lora_config = LoraConfig(
    r=16,
    lora_alpha=16,
    use_dora=True,    # Enable DoRA
    ...
)
```

**When to use DoRA**: Make it your default over plain LoRA. DoRA is available in PEFT and has no significant computational overhead (magnitude vectors are tiny). The question "when to use plain LoRA" is increasingly "when you need backward compatibility or when your framework doesn't support DoRA."

**Practical recommendation for 2025–2026**: QLoRA + DoRA + RSLoRA (for r ≥ 32) as the default starting configuration.

---

## LoftQ: Quantization-Aware LoRA Initialization

**The problem**: When you apply QLoRA, quantizing the base model introduces quantization error. LoRA adapters are initialized to zero (no initial update), so initially the model performance is degraded by the quantization noise. The adapters then spend the first part of training just recovering from quantization error.

**LoftQ's solution**: Initialize LoRA adapters such that they compensate for quantization error from the start. This is achieved through an alternating optimization that finds the best quantization and LoRA initialization jointly.

**When LoftQ matters**:
- Tasks that are sensitive to the pre-quantization baseline (complex reasoning, math)
- When using aggressive quantization (4-bit or lower)
- When training budget is limited (LoftQ starts from a better position)

**When LoftQ is overkill**:
- Format/structure tasks where the model starts near the target anyway
- Large training budgets where the model can recover from quantization noise

```python
from peft import LoftQConfig, get_peft_model

loftq_config = LoftQConfig(loftq_bits=4)
lora_config = LoraConfig(
    init_lora_weights="loftq",
    loftq_config=loftq_config,
    r=16,
    ...
)
```

---

## The Learning Rate: The Hyperparameter That Kills Most LoRA Runs

Learning rate is more impactful than rank in most fine-tuning runs. The wrong learning rate produces:
- Too high: loss diverges, or model rapidly forgets base capabilities
- Too low: adapter doesn't learn, or convergence is extremely slow

### Practical learning rate ranges for LoRA

| Scenario | Range | Starting Point |
|----------|-------|---------------|
| Standard SFT, LoRA r=16 | 1e-5 – 3e-4 | **2e-4** |
| QLoRA (4-bit base) | 1e-5 – 1e-4 | **2e-4** |
| Small dataset (<1K examples) | 1e-5 – 5e-5 | **2e-5** |
| Alignment (DPO) | 1e-6 – 5e-5 | **5e-6** |

**Why LoRA uses higher learning rates than full fine-tuning**: The adapter has far fewer parameters. Higher learning rate per parameter is needed to actually move the loss. With full fine-tuning, you update 7B parameters at 1e-5; with LoRA, you update 50M parameters at 2e-4. The total update magnitude is approximately similar.

### Learning rate schedulers

```python
# Cosine decay with warmup — standard for SFT
from transformers import get_cosine_schedule_with_warmup

scheduler = get_cosine_schedule_with_warmup(
    optimizer,
    num_warmup_steps=0.03 * total_steps,  # 3% warmup
    num_training_steps=total_steps
)
```

Warmup prevents large gradient updates at the start of training when the adapter weights are near-zero. 3–5% of total steps is a good range.

---

## Practical Training Configuration Reference

The configuration that should be your starting point for most SFT tasks (2025–2026):

```python
# Base model: load in 4-bit
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
)

# LoRA: DoRA + RSLoRA for r=16
lora_config = LoraConfig(
    r=16,
    lora_alpha=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    use_dora=True,       # DoRA enabled
    use_rslora=False,    # RSLoRA less critical at r=16; enable for r>=32
)

# Training arguments
training_args = TrainingArguments(
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,    # Effective batch = 16
    num_train_epochs=3,
    learning_rate=2e-4,
    fp16=False,
    bf16=True,                         # Better on Ampere+
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
    logging_steps=10,
    save_strategy="epoch",
    eval_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
)
```

---

## Gradient Checkpointing and Memory Optimization

For large models or small GPUs, gradient checkpointing trades compute for memory:

```python
model.gradient_checkpointing_enable()
```

This recomputes activations during the backward pass instead of storing them. Roughly 20–30% more compute time, but can reduce GPU memory usage by 30–60%.

**Rule of thumb**: Enable gradient checkpointing if you're running into OOM errors or want to increase batch size. The compute overhead is acceptable in most fine-tuning runs.

---

## Merging Adapters: From Adapter to Standalone Model

After training, you have a base model + LoRA adapter. You can either:

1. **Keep them separate** (PEFT approach): Load base model, load adapter at inference. Flexible — swap adapters for different tasks. Adapter load adds ~100ms startup time.

2. **Merge the adapter into the base model**: Create a single model with the adapter weights baked in. Inference is identical to the base model. No startup overhead.

```python
# Merge and unload adapter into base model
model = model.merge_and_unload()

# Save merged model
model.save_pretrained("./merged-model")
tokenizer.save_pretrained("./merged-model")
```

**When to merge**: For production deployment of a single task model. When you want to export to GGUF (requires merged weights).

**When to keep separate**: When you're A/B testing multiple adapters. When you serve multiple tasks from one base model. When you're still iterating on adapters.

---

## Multiple Adapters: Serving Multiple Tasks from One Base

With PEFT, you can load one base model and switch between multiple LoRA adapters at inference time:

```python
from peft import PeftModel

# Load base once
base_model = AutoModelForCausalLM.from_pretrained(base_model_id, ...)

# Add multiple adapters
model = PeftModel.from_pretrained(base_model, "adapter-task-a", adapter_name="task_a")
model.load_adapter("adapter-task-b", adapter_name="task_b")

# Switch at inference
model.set_adapter("task_a")
output_a = model.generate(...)

model.set_adapter("task_b")
output_b = model.generate(...)
```

**This is powerful for**: Multi-tenant serving (one deployment, multiple customers), multi-task routing, A/B testing.

**Memory cost**: Each additional adapter adds ~50–200MB depending on rank and target modules. Negligible compared to base model size.

---

## Technique Comparison Summary

| Technique | Memory | Quality vs Full FT | Speed | When to Use |
|-----------|--------|-------------------|-------|-------------|
| Full fine-tuning | Highest | Baseline | Fastest convergence | Research, <7B models on large GPU clusters |
| LoRA | Moderate | ~5% below | Fast | Base technique |
| QLoRA | Low | ~7–10% below | Good | Standard single-GPU training |
| DoRA | Moderate | ~2–4% below | Fast | Default over plain LoRA |
| QLoRA + DoRA | Low | ~4–7% below | Good | **Recommended default** |
| RSLoRA | Same as LoRA | Same + stable | Same | r ≥ 32, hyperparameter search |
| LoftQ | Low | ~3–5% below | Good | Reasoning tasks, tight compute budget |

**Note on quality gaps**: These are approximate and task-dependent. For format and structure tasks, the gap between full FT and QLoRA+DoRA is often <1%. For complex reasoning tasks, the gap can be larger.

---

## Diagnosing Common PEFT Failures

### Loss doesn't decrease after warmup

- Learning rate too low: try 10× higher
- Rank too low for task complexity: try r=32 or r=64
- Target modules missing: add FFN layers to `target_modules`
- Format mismatch: data format doesn't match model's expected template

### Loss decreases then plateaus early

- Dataset too small or too narrow (low diversity): add more varied examples
- Learning rate too high causing oscillation: try cosine decay
- Overfitting: add or increase `lora_dropout`

### Loss decreases but model outputs are wrong format

- Training data format inconsistency: audit for format violations
- `lora_alpha` too high: model changing too fast, losing base format knowledge
- Too many epochs on small dataset: overfitting to format of training examples

### Loss is good but model regresses on non-fine-tuned tasks

- Catastrophic forgetting: too many epochs, or learning rate too high
- Fix: reduce epochs, add general capability examples to training data (5–15% of dataset), use lower learning rate

---

## Teach It Back

1. Explain LoRA's core intuition to a software engineer who doesn't know ML. Use an analogy.

2. Your fine-tuning run with r=16, lora_alpha=32 is unstable — the loss oscillates. What's the first thing you check, and why?

3. Someone asks: "Should I use LoRA or DoRA?" What's your recommendation and reasoning?

4. You need to serve three different department-specific versions of the same compliance model. Describe the architecture using multiple LoRA adapters.

---

## Knowledge Check

**Q1**: A colleague sets `r=128, lora_alpha=128` and says "higher rank means better quality." What are the tradeoffs you'd point out?

**A**: Higher rank increases the number of trainable parameters (better expressivity), but: (1) Also increases memory usage and training time. (2) Higher risk of overfitting on small datasets. (3) Doesn't improve quality if the task doesn't require that expressivity. (4) r=128 with QLoRA approaches the memory cost of a non-quantized full fine-tune of the adapter layers. Start at r=16 and increase only if the model demonstrably fails to learn.

---

**Q2**: You're fine-tuning a 13B model on a single A100 80GB. You're getting OOM errors with batch_size=4, r=16, target_modules all layers. What are three knobs to turn?

**A**: (1) Reduce target_modules to q_proj and v_proj only (half the adapter parameters). (2) Enable gradient_checkpointing (frees activation memory). (3) Reduce per_device_train_batch_size to 2 and double gradient_accumulation_steps (maintains effective batch size). If still OOM: reduce sequence length or switch to QLoRA (4-bit base).

---

*Continue to [03 — Alignment & Preference Tuning: SFT → DPO → GRPO](./03-alignment-tuning.md)*

*Last reviewed: May 2026. PEFT library API changes frequently; check the Hugging Face PEFT documentation for current parameter names.*
