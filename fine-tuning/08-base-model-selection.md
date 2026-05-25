# 08 — Base Model Selection: Choosing Your Starting Point

> **Level**: Intermediate–Advanced  
> **Time**: ~60 minutes  
> **Goal**: Pick the right base model for any fine-tuning project. Understand license, capability, and architecture tradeoffs. Never discover mid-project that your model can't do the task.

---

## The Decision Nobody Talks About

Most fine-tuning tutorials start with `meta-llama/Llama-3.1-8B-Instruct` as if the choice is obvious. It isn't. The wrong base model is the silent project killer:

- Model can't do the task architecturally → fine-tuning won't fix it
- License doesn't allow your use case → legal forces a restart
- Model doesn't quantize well → doesn't fit your GPU budget
- Model isn't strong in your language → fails in production

Base model selection comes **before** data collection, before PEFT configuration, before anything. Get it wrong and you've built on a broken foundation.

---

## The Two-Dimensional Selection Space

Every base model sits somewhere on two axes:

```
CAPABILITY
    │
    │  70B+     ░░░░░░░░ Complex reasoning, multilingual, long context
    │            ░░░░░░░░
    │  13–30B   ░░░░░░░░ Most enterprise tasks, good cost/quality
    │            ░░░░░░░░
    │  7–8B     ░░░░░░░░ Format, classification, instruction following
    │            ░░░░░░░░
    │  1–4B     ░░░░░░░░ Edge deployment, simple tasks only
    │
    └──────────────────────────────────── DOMAIN SPECIFICITY
       General               Medical/Legal/Code
```

You want the **smallest model that can do your task**. Not the best model available — the smallest sufficient one. Every size increase multiplies training cost, inference cost, and latency.

---

## The Model Families (Mid-2026)

This is a snapshot. Model release cycles are months. Verify current recommendations against [Hugging Face Open LLM Leaderboard](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard) and model cards before any major project commitment.

### Meta Llama 3.x

**Models**: 1B, 3B, 8B, 70B, 405B  
**License**: Llama 3 Community License — commercial use permitted for most organizations (>700M MAU requires separate agreement)  
**Strengths**: Strong English performance, well-documented, extensive community adapters  
**Weaknesses**: Moderate multilingual capability below 70B; license has restrictions for very large platforms  

**When to choose Llama 3**:  
- English-primary task
- Strong community support needed (most fine-tuning examples target Llama)
- You need the 70B quality tier with broad community tooling

**Fine-tuning note**: Llama 3 uses a specific chat template (`<|begin_of_text|>`, `<|start_header_id|>`, etc.). Always use `tokenizer.apply_chat_template()` — manual construction frequently breaks.

---

### Mistral / Mixtral

**Models**: Mistral 7B, Mistral 12B, Mixtral 8x7B (MoE), Mixtral 8x22B (MoE)  
**License**: Apache 2.0  
**Strengths**: Very strong 7B performance relative to model size; Apache 2.0 with no restrictions; MoE models have excellent quality-per-inference-token ratio  
**Weaknesses**: Context window is 32K (Mistral 7B); MoE inference requires more GPU memory than a dense model of equivalent quality  

**When to choose Mistral**:  
- Strict open-source license required (Apache 2.0 with no additional terms)
- Quality-per-compute-dollar matters most
- MoE when inference throughput matters more than memory

**Fine-tuning note**: Mixtral 8x7B for fine-tuning requires significant memory — even with QLoRA, the 46.7B parameter count (8×7B) requires ~25 GB for 4-bit loading. Not a single-16GB-GPU model.

---

### Microsoft Phi-3 / Phi-4

**Models**: Phi-3.5 Mini (3.8B), Phi-3 Medium (14B), Phi-4 (14B)  
**License**: MIT  
**Strengths**: Exceptional performance for parameter count; excellent for edge deployment; strong reasoning relative to size  
**Weaknesses**: Primarily trained on English; context window 128K but quality degrades at very long contexts  

**When to choose Phi**:  
- Edge or mobile deployment (3.8B fits in <4 GB on device)
- Memory-constrained environments
- Tasks where reasoning capability is needed at small model size
- MIT license required

**Fine-tuning note**: Phi models are trained on "textbook-quality" data, which gives them unusual reasoning capability at small size. They are also more sensitive to training data quality than Llama-scale models — noisy data has a disproportionate impact.

---

### Google Gemma 2

**Models**: Gemma 2 2B, 9B, 27B  
**License**: Gemma Terms of Use — commercial use permitted with conditions  
**Strengths**: State-of-the-art performance at 9B and 27B tiers; strong multilingual capability; excellent instruction following from base  
**Weaknesses**: License restricts certain use cases (review the Gemma Terms); 2B tier competitive but not dominant  

**When to choose Gemma**:  
- 9B or 27B tier where you need strong quality without 70B cost
- Multilingual tasks (stronger than Llama below 70B)
- Projects that can accept the Gemma license terms

---

### Alibaba Qwen 2.5

**Models**: 0.5B, 1.5B, 3B, 7B, 14B, 32B, 72B  
**License**: Apache 2.0 (for most sizes)  
**Strengths**: Outstanding multilingual performance (72 languages); excellent code capabilities; very strong Chinese-English bilingual  
**Weaknesses**: Less Western community tooling than Llama; some larger versions have usage restrictions  

**When to choose Qwen**:  
- Multilingual applications, especially Asian languages
- Code generation tasks (Qwen2.5-Coder variants)
- You need model diversity across a wide parameter range (0.5B to 72B in one family)

---

### DeepSeek V3 / R1

**Models**: DeepSeek-V3 (671B MoE), DeepSeek-R1 (671B MoE)  
**License**: MIT (R1); check current DeepSeek license for V3  
**Strengths**: R1 is state-of-the-art for reasoning tasks; V3 is one of the strongest models available at any price  
**Weaknesses**: 671B parameters — inference requires significant infrastructure; smaller distilled variants (R1-Distill-Qwen-7B, R1-Distill-Llama-8B) are fine-tuning starting points  

**When to choose DeepSeek distilled**:  
- Reasoning-heavy tasks (math, code, structured logic) where you want R1 capability baked into a fine-tunable 7B
- Starting point for GRPO training (the distilled model already has reasoning traces)

---

## The Critical Question: Base Model vs Instruction-Tuned?

Most tutorials assume instruction-tuned models. The choice matters:

| | Base Model | Instruction-Tuned |
|---|---|---|
| **Training objective** | Next-token prediction | Instruction following (via SFT + RLHF/DPO) |
| **Starting behavior** | Continues text, doesn't follow instructions | Follows instructions, already aligned |
| **When to fine-tune on** | DAPT, alignment training from scratch, GRPO | SFT for behavior/format, most enterprise tasks |
| **Risk** | Model may not follow format without more data | May have alignment tax that conflicts with task |
| **Example** | `Llama-3.1-8B` (base) | `Llama-3.1-8B-Instruct` |

**The rule for most enterprise fine-tuning**: Start with the instruction-tuned model.

Instruction-tuned models already know how to follow instructions, respond in a format, and refuse harmful requests. You're fine-tuning to specialize, not to teach basic instruction following from scratch. Starting from base requires substantially more data and training to get to the same starting quality.

**When to start from base**:
- You're doing DAPT (domain-adaptive pre-training) before any task fine-tuning
- You're training your own alignment from scratch with RLHF/DPO
- The instruction-tuned model's alignment conflicts with your task (rare)
- You're training for a new language the instruction-tuned model barely supports

---

## The Capability Verification Protocol

Never select a base model without running this test. It takes 30 minutes and prevents weeks of wasted fine-tuning.

### Step 1: Test the frontier ceiling

Run your exact task against the best model you can access (GPT-4, Claude 3.5 Sonnet, or similar). Write the best system prompt you can.

- If the frontier model gets it wrong consistently → the task is poorly defined. Fix the task before selecting a model.
- If the frontier model gets it right → you have a ceiling. Now find the smallest model that matches.

### Step 2: Test your target model zero-shot

Run 20–30 representative examples against your candidate base model with the same system prompt.

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model_id = "meta-llama/Llama-3.1-8B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id, device_map="auto")

# Use the model's chat template
messages = [
    {"role": "system", "content": "Your task description here."},
    {"role": "user", "content": "Test input here."},
]
formatted = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

inputs = tokenizer(formatted, return_tensors="pt").to(model.device)
outputs = model.generate(**inputs, max_new_tokens=512, temperature=0.1)
response = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
print(response)
```

**Evaluate these 20–30 outputs manually**:
- Does the model understand the task at all?
- Does it produce the right output structure (even if imperfectly)?
- Does it fail completely on certain input patterns?

If the model **fundamentally cannot do the task** zero-shot — not just imperfectly, but not at all — fine-tuning probably won't fix it. Choose a larger model or a different base.

### Step 3: Check domain perplexity (for DAPT decisions)

If you're considering DAPT, measure how out-of-distribution your domain text is:

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

def compute_perplexity(model, tokenizer, text: str) -> float:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model(**inputs, labels=inputs['input_ids'])
    
    return torch.exp(outputs.loss).item()

# Compare general text vs your domain text
general_text = "The quick brown fox jumps over the lazy dog."
domain_text = "The counterparty's notional principal under the ISDA Master Agreement..."

general_ppl = compute_perplexity(model, tokenizer, general_text)
domain_ppl = compute_perplexity(model, tokenizer, domain_text)

print(f"General perplexity: {general_ppl:.1f}")
print(f"Domain perplexity: {domain_ppl:.1f}")
print(f"Ratio: {domain_ppl / general_ppl:.1f}x")
```

**Interpreting results**:
- Ratio < 2×: Domain text is within the base model's distribution. DAPT unlikely to help.
- Ratio 2–5×: Consider DAPT for specialized vocabulary tasks.
- Ratio > 5×: Domain is significantly out-of-distribution. DAPT is worth the investment.

---

## License Due Diligence: The Checklist

License violations with model weights are permanent and expensive to remediate. Run this before any project starts.

```
□ Commercial use permitted for your use case?
    → Llama 3: Yes (check MAU restriction if >700M)
    → Mistral/Qwen: Apache 2.0, yes
    → Phi: MIT, yes
    → Gemma: Check Gemma Terms of Use

□ Fine-tuning permitted?
    → All major open models permit this
    → Check if fine-tuned derivatives have redistribution restrictions

□ Distribution of fine-tuned model permitted?
    → Llama 3: Yes, with attribution and same license
    → Apache 2.0: Yes
    → Some models restrict redistribution of modified weights

□ Attribution requirements?
    → Document what the model card requires
    → Some require specific language in documentation

□ Use case restrictions?
    → Llama 3: Prohibited uses list in the license
    → Review prohibited uses for your domain (medical advice, certain high-risk applications)
```

**For regulated industries**: Legal review of the model license is not optional. Get written approval documenting that your use case is compliant.

---

## The Quantization-Friendliness Test

Some models quantize poorly. Before committing to QLoRA on a model, test the quantized model's quality:

```python
from transformers import BitsAndBytesConfig, AutoModelForCausalLM
import torch

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

model_4bit = AutoModelForCausalLM.from_pretrained(
    model_id,
    quantization_config=bnb_config,
    device_map="auto",
)
```

Run the same 20–30 test examples on both the full-precision and 4-bit model. If quality drops significantly (more than subjective degradation on simple tasks), consider:
1. Using 8-bit quantization instead of 4-bit
2. Starting from a larger model (7B quantized to 4-bit vs 13B quantized to 4-bit — sometimes the 7B full-precision wins)
3. Investigating whether the specific model architecture has known quantization sensitivity

---

## The Selection Decision Matrix

Run through these in order:

```
Step 1: Language requirement?
   → Primarily English: Llama 3.x or Mistral
   → Multilingual: Qwen 2.5 or Gemma 2
   → Code-heavy: Qwen 2.5-Coder or DeepSeek-Coder
   → Reasoning-heavy: DeepSeek R1-Distill variants

Step 2: Parameter size (capability test first, then choose smallest sufficient)
   → Simple format/classification tasks: 7–8B
   → Complex instruction following: 8–13B
   → Nuanced reasoning, long context: 30–70B
   → State-of-the-art required: 70B+ or external API

Step 3: License constraint?
   → Strictest open (no restrictions): Apache 2.0 → Mistral or Qwen
   → Standard open (some restrictions): Llama 3 or Gemma
   → Commercial API OK: GPT-4, Claude via API

Step 4: Deployment target?
   → Single A100 80GB: Up to 70B with QLoRA
   → Single 16GB GPU: Up to 8B with QLoRA; up to 3B full FT
   → Edge (mobile/embedded): Phi 3.5 Mini (3.8B) or Qwen 0.5B–1.5B
   → Multi-GPU cluster: Any size with FSDP/DeepSpeed

Step 5: Instruction-tuned or base?
   → Standard enterprise SFT: Instruction-tuned
   → Alignment from scratch or DAPT: Base
```

---

## Model Card Evaluation: Reading Between the Lines

Every model on Hugging Face has a model card. Read it critically before selection:

**What a good model card tells you**:
- Training data composition (what domains is the model strong in?)
- Known limitations (explicitly stated failure modes)
- Evaluation benchmarks and scores (with dates — benchmarks age)
- Recommended prompting approach (including template)
- License (explicit, not buried)

**Red flags in model cards**:
- No known limitations stated → the authors didn't test thoroughly
- Benchmark scores without dates → may be comparing against outdated baselines
- Vague training data description → you don't know what it was trained on
- Missing license or ambiguous license → legal risk

**Benchmarks to cross-reference (as of 2025–2026)**:
- MMLU: General knowledge and reasoning
- HumanEval / MBPP: Code generation
- MT-Bench: Multi-turn conversation quality
- GSM8K: Mathematical reasoning
- MATH: Advanced math
- Note: Leaderboard numbers are zero-shot prompting performance, not fine-tuned performance

---

## Quick Reference: Model Selection for Common Enterprise Tasks

| Task | Recommended Starting Point | Why |
|------|---------------------------|-----|
| Document classification (English) | Llama 3.1 8B Instruct | Strong English, good classification, fits single GPU |
| Structured extraction (JSON output) | Llama 3.1 8B or Mistral 7B Instruct | Format learning, community examples |
| Multi-turn customer support | Llama 3.1 8B or 70B Instruct | Strong instruction following |
| Code review / generation | Qwen2.5-Coder-7B or DeepSeek-Coder | Purpose-trained for code |
| Medical / scientific text | Llama 3.1 70B (or domain-specific) | Reasoning needed; test capability first |
| Multilingual NER / extraction | Qwen2.5-7B or Gemma 2 9B | Strong non-English performance |
| Edge deployment (<4 GB) | Phi-3.5 Mini (3.8B) or Qwen2.5-3B | Small but capable |
| Mathematical reasoning | DeepSeek-R1-Distill-Qwen-7B | R1 reasoning in a fine-tunable size |
| Summarization | Any 7–8B instruction model | Models are generally strong here |
| Alignment training from scratch | Llama 3.1 8B (base, not Instruct) | No pre-existing alignment to conflict |

---

## The Two-Hour Model Selection Sprint

When you need to pick a model quickly, run this structured sprint:

**Hour 1: Paper testing**
1. Check license for your use case (10 min)
2. Review model card for capability and known limitations (10 min)
3. Check current Open LLM Leaderboard for your task category (10 min)
4. Shortlist 2–3 candidates (5 min)

**Hour 2: Empirical testing**
1. Write 10 representative task examples (20 min)
2. Test each candidate model zero-shot with a good prompt (20 min)
3. Compare outputs qualitatively (10 min)
4. Check quantized version of winner (10 min)

At the end of 2 hours, you have an evidence-based model selection, not a gut feeling.

---

## Teach It Back

1. A colleague says "let's just use Llama 3.1 8B, it's what everyone uses." What three questions do you ask before agreeing?

2. You need a model for a medical documentation task that must work with French, German, and English. Walk through the model selection decision.

3. A team wants to fine-tune a model for edge deployment on a device with 6 GB RAM. What are your candidate models and why?

4. What is the one test you must run before selecting any base model, regardless of size or family?

---

## Knowledge Check

**Q1**: Your team has a strict requirement for Apache 2.0 licensed models only. You need to fine-tune for a 7B-class task with strong English performance. What are your options?

**A**: Mistral 7B (Apache 2.0) and Qwen 2.5-7B (Apache 2.0 for 7B tier) are the primary options. Both have strong English performance. Mistral has stronger Western community tooling; Qwen has better multilingual capability if that matters. Run the capability verification test on both with your specific task. Apache 2.0 means no additional restrictions on use, modification, or distribution.

---

**Q2**: After running the capability verification test, you find your target 7B model gets 40% of examples correct zero-shot, while GPT-4 gets 90%. Is this a good candidate for fine-tuning?

**A**: Conditionally yes, but investigate the failures first. 40% zero-shot is low but may indicate a format/style problem (fixable with fine-tuning) vs. a capability gap (not fixable). Examine the 60% failures: are they wrong format but right content? Or wrong content entirely? If wrong format → fine-tuning likely helps significantly. If wrong content (model doesn't understand the task at all) → test a larger model first. Don't commit to fine-tuning until you understand the failure mode.

---

*Continue to [09 — End-to-End Lab: From Data to Deployment](./09-end-to-end-lab.md)*  
*Or return to [README — Curriculum Map](./README.md)*

*Last reviewed: May 2026. Model landscape evolves rapidly; verify against current leaderboards and model cards before selection.*
