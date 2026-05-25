# 00 — Foundations & Decision Framework

> **Level**: Beginner  
> **Time**: ~90 minutes  
> **Goal**: Walk away able to explain the fine-tuning decision to a non-ML stakeholder — and defend it under scrutiny.

---

## The One Mental Model You Need First

Before touching a single hyperparameter, burn this into your thinking:

```
Fine-tuning changes what a model KNOWS or HOW IT BEHAVES.
It does not make a model smarter than its architecture allows.
```

A model trained on 1 trillion tokens has compressed a view of language and the world. Fine-tuning reshapes that view for a specific purpose. It cannot add facts the base model cannot represent, and it cannot fundamentally improve reasoning if the base model lacks it. Knowing this prevents the #1 misuse of fine-tuning: training a weak model to do a hard task instead of just choosing a better model.

---

## What Fine-Tuning Actually Is

**Technical definition**: Fine-tuning is continued training of a pre-trained model on a new, domain-specific dataset. Gradients are computed from your data and used to update model weights — either all weights (full fine-tuning) or a small adapter (PEFT).

**Mental model that sticks**: Think of a pre-trained model as a brilliant polyglot who has read most of the internet. Fine-tuning is not teaching them — they already know. It's coaching them to communicate in your specific dialect, follow your specific format, and handle your specific task with precision.

**What changes after fine-tuning**:
- Output format and structure (most reliably)
- Domain-specific vocabulary and terminology (reliably)
- Task-specific behavior (e.g., always extract dates in ISO 8601) (reliably)
- Tone, register, persona (reliably)
- Factual knowledge embedded in the dataset (partially — with risk of hallucination if the dataset is noisy)
- Reasoning capability (marginally, if fine-tuned on reasoning traces)

**What does NOT reliably change**:
- The model's fundamental reasoning capacity
- Knowledge outside the training data
- Context window size
- Inference speed (for full FT; PEFT adapters add negligible overhead)

---

## The Taxonomy: Four Kinds of Fine-Tuning

Understanding the taxonomy prevents you from using the wrong technique for the wrong goal.

### 1. Instruction Fine-Tuning (IFT) / Supervised Fine-Tuning (SFT)

**Goal**: Teach the model to follow instructions and respond in a desired format.

**How it works**: Training on (instruction, response) pairs. The model learns to map input formats to output formats. Most commercial models are instruction-tuned on top of a base model before release.

**When to use it**: You need the model to produce a specific format, follow domain-specific instructions, or handle tasks not well-represented in the base model's instruction data.

**Data format** (ChatML example):
```
<|im_start|>system
You are a financial compliance analyst at a regulated bank.
<|im_end|>
<|im_start|>user
Extract all counterparty names from this SWIFT message: [MESSAGE]
<|im_end|>
<|im_start|>assistant
Counterparties identified: ...
<|im_end|>
```

---

### 2. Domain-Adaptive Pre-Training (DAPT)

**Goal**: Saturate the model with domain vocabulary, concepts, and text patterns before task-specific fine-tuning.

**How it works**: Continued pre-training on domain text (legal, financial, medical) using the same next-token-prediction objective as original pre-training. No instruction format, no Q&A pairs — just raw domain text.

**When to use it**: Your domain has specialized jargon the base model rarely encounters (e.g., ISDA agreements, radiology reports, COBOL codebases), and you need the model to internalize that language before task adaptation.

**Cost**: Expensive. Requires millions to hundreds of millions of tokens of domain text. Rarely justified unless domain vocabulary is genuinely out-of-distribution.

**Practical signal**: If the base model perplexity on your domain text is much higher than on general text, DAPT may help. If not, skip it.

---

### 3. Parameter-Efficient Fine-Tuning (PEFT)

**Goal**: Achieve most of the benefit of full fine-tuning at a fraction of the compute and memory cost.

**How it works**: Freeze most of the model. Train only a small set of adapter weights (LoRA, QLoRA, DoRA) or a small set of prompt tokens (prefix tuning, prompt tuning). The adapter learns the delta — the difference in behavior needed for your task.

**When to use it**: Almost always for base models ≥7B parameters, given GPU memory constraints. PEFT is the dominant practical technique in 2025–2026.

**Coverage**: Document 02 is entirely about PEFT. We introduce it here just to place it in the taxonomy.

---

### 4. Alignment Fine-Tuning (RLHF / DPO / GRPO)

**Goal**: Adjust model behavior according to human preferences — make outputs safer, more helpful, more aligned with a specific value system.

**How it works**: Train on preference data (chosen vs. rejected response pairs) rather than simple (input, output) pairs. The model learns to prefer the kind of responses humans prefer.

**When to use it**: After SFT, when you need the model to behave better, not just know more — for safety, helpfulness, tone, or accuracy on ambiguous tasks.

**Coverage**: Document 03 covers the full progression: SFT → DPO → ORPO → GRPO.

---

## The Decision Framework: Fine-Tune vs. Everything Else

This is the most important judgment call in the entire pipeline. Every wrong answer here costs weeks.

### Start with the question hierarchy

```
1. Can prompt engineering alone solve this?
      ↓ No
2. Can RAG (retrieval-augmented generation) solve this?
      ↓ No (or only partially)
3. Is fine-tuning the right tool?
      ↓ Evaluate below
4. What fine-tuning technique?
      ↓ See Quick Reference in README
```

Work through these in order. Skip to fine-tuning only after the simpler tools are genuinely exhausted.

---

### When Prompt Engineering Is Enough

Prompt engineering should be your first move, not your fallback. A well-crafted system prompt with few-shot examples can achieve 80% of what fine-tuning achieves for format and style tasks at zero cost.

**Use prompt engineering when**:
- The task is well-defined and the base model already knows how to do it
- You need format or style adjustment that can be demonstrated in 3–10 examples
- You're prototyping and don't yet know if the task is achievable at all
- Latency matters and you don't want adapter loading overhead
- The task changes frequently (prompts are easier to update than models)

**Signal that prompting has hit its limit**:
- You've tried 20+ prompt variations and performance plateaus
- The desired output requires knowledge the model doesn't have
- You need sub-50ms response times on cheap hardware
- The model consistently ignores formatting constraints even with examples

---

### When RAG Is the Right Answer

Retrieval-Augmented Generation is the right tool when the problem is **knowledge access**, not **behavior**. If you need the model to know specific documents, facts, or data that weren't in training, put them in context via retrieval — don't try to bake them into weights.

**Use RAG when**:
- Knowledge is frequently updated (regulations, prices, recent events)
- Knowledge is sensitive and you cannot embed it in model weights (PII, proprietary data)
- Knowledge volume exceeds what fine-tuning can reliably learn (millions of documents)
- You need citations and provenance for compliance
- You need to swap knowledge domains without retraining

**RAG limitations that push you toward fine-tuning**:
- Retrieval misses: if the relevant context is hard to retrieve, the model won't have it
- Context length limits: you can only stuff so much into a window
- Latency: retrieval adds a round-trip; fine-tuning does not
- Behavior, not knowledge: RAG can't teach the model to follow a specific format or adopt a persona

---

### When Fine-Tuning Is the Right Answer

**Use fine-tuning when the problem is BEHAVIOR, FORMAT, or STYLE — not knowledge**:

| Signal | Example |
|--------|---------|
| Consistent output format the model ignores in prompts | Always extract JSON with exactly these 7 fields |
| Domain-specific task not in training distribution | COBOL code documentation in a specific template |
| Persona or voice that must be maintained | A bank's formal compliance tone on every response |
| Latency budget too tight for long system prompts | Edge devices, real-time applications |
| Cost: eliminating long system prompts at scale | 500K calls/day × 1K token prompt = significant spend |
| Task requires combining format + domain + persona | All three, reliably, at scale |

**Do NOT use fine-tuning when**:
- Knowledge is the gap (use RAG or a better base model)
- You have fewer than 500 examples (start with RAG + prompting)
- The base model can't do the task at all (fine-tuning a weak model is expensive failure)
- Data eligibility isn't cleared (see Enterprise Non-Negotiables below)

---

### The Combined Architecture (Fine-Tune + RAG)

The most capable enterprise deployments combine both:

```
Query → [Fine-Tuned Model (behavior)] + [RAG (knowledge)] → Response
```

The fine-tuned model handles: format, tone, persona, reasoning style.
RAG handles: current facts, proprietary knowledge, citations.

Example: A fine-tuned compliance model + retrieval over current regulatory documents.

**When to combine**: When you have both a behavior problem (the model doesn't respond in your format/style) and a knowledge problem (it doesn't know your current documents).

---

## Mental Models for Non-ML Stakeholders

You will be asked to explain this to people who don't know what a gradient is. Here are the framings that work:

### The recipe analogy

"A pre-trained model knows how to cook any dish. Fine-tuning is like giving a chef a restaurant's specific recipes, presentation standards, and plating style. They don't get smarter — they get specialized."

### The consultant analogy

"We hired a generalist consultant who knows everything about finance. Fine-tuning is onboarding them to our specific procedures, our document templates, and our vocabulary. They still have all their general knowledge — now they apply it in our exact way."

### The cost framing

"Without fine-tuning, we send 2,000 tokens of instructions with every request, at 500,000 requests/day. That's 1 billion tokens a day in overhead. Fine-tuning embeds those instructions into the model. The instruction cost drops to zero at inference time."

---

## The Decision Checklist (Before Starting Any Fine-Tuning Project)

Answer all six before writing a single line of training code:

```
□ 1. GOAL: What specific behavior is wrong with the current model?
       Define the failure mode precisely. Vague goals produce vague models.

□ 2. DATA ELIGIBILITY: Do I have written approval for every data source?
       PII/PCI/sensitive data identified, classified, and handled?

□ 3. BASELINE: Have I tested prompt engineering and RAG seriously?
       Have I tried 10+ prompt variants? Have I tried few-shot + RAG?

□ 4. BASE MODEL: Does the base model have the underlying capability?
       Test the task on the frontier model first. If even GPT-4 struggles, 
       fine-tuning a smaller model won't fix it.

□ 5. EVALUATION: Do I have a frozen evaluation set (BEFORE training)?
       Defined pass/fail criteria? Test cases that cover failure modes?

□ 6. PRODUCTION PATH: What replaces the current system if the model regresses?
       Rollback plan? Monitoring strategy? Human escalation path?
```

If any box is unchecked, stop here. Not to slow the project — to prevent the specific failure mode that comes from that missing piece.

---

## The Hierarchy of Fine-Tuning Success Factors

Research consistently points to the same ranked list:

```
1. Data quality          ← 60% of the outcome
2. Base model choice     ← 20% of the outcome
3. Training technique    ← 10% of the outcome
4. Hyperparameters       ← 10% of the outcome
```

This is not a license to be careless about technique and hyperparameters. It IS a strong warning that optimizing hyperparameters on poor-quality data produces a well-optimized bad model. The curriculum is ordered accordingly: data engineering comes before PEFT techniques.

---

## Key Terms Glossary

| Term | Definition |
|------|-----------|
| **Base model** | A pre-trained model before any fine-tuning. Foundation, not product. |
| **Instruction-tuned model** | A base model fine-tuned to follow instructions (e.g., Llama-3.1-8B-Instruct). |
| **Adapter** | Small trainable weights attached to a frozen base model (PEFT approach). |
| **Full fine-tuning** | All model weights are trainable. High cost, highest customization. |
| **PEFT** | Parameter-Efficient Fine-Tuning. Trainable adapter, frozen backbone. |
| **SFT** | Supervised Fine-Tuning. Train on (input, output) pairs with supervision. |
| **RLHF** | Reinforcement Learning from Human Feedback. Preference-based training. |
| **DPO** | Direct Preference Optimization. RLHF without a separate reward model. |
| **LoRA** | Low-Rank Adaptation. The most common PEFT technique. |
| **QLoRA** | Quantized LoRA. LoRA on a 4-bit quantized base model. |
| **Frozen weights** | Model parameters that don't change during training. |
| **Trainable parameters** | The parameters being updated by gradient descent. |
| **Overfitting** | Model memorizes training data but fails on new inputs. |
| **Catastrophic forgetting** | Model loses general capability while learning a new task. |

---

## Teach It Back

Before moving to Document 01, answer these out loud or in writing:

1. A colleague says "we should fine-tune the model so it knows our product catalog." What's wrong with this reasoning, and what would you suggest instead?

2. Draw the four-level taxonomy of fine-tuning types on a whiteboard. When does each apply?

3. A PM asks "why can't we just write better prompts instead of fine-tuning?" Walk them through the decision framework — when prompting is the right answer, and when it isn't.

4. What is the #1 factor in fine-tuning success, and why does this mean you should read Document 01 before Document 02?

---

## Knowledge Check

**Q1**: Your team needs to build a model that always formats financial reports in a specific 15-field JSON structure with strict field types. The base model produces the right content but inconsistent format. You have 2,000 labeled examples. What's the right approach?

**A**: SFT with PEFT (QLoRA). The problem is format consistency (behavior), not knowledge. 2,000 examples is sufficient for format learning. Prompt engineering has failed (you have 2,000 labeled examples, implying iteration). RAG won't fix format. Fine-tuning on (input, target-format-output) pairs solves this.

---

**Q2**: A compliance team wants a model that can answer questions about the current version of a 500-page regulatory document that gets updated quarterly. What's the right approach?

**A**: RAG. The problem is knowledge access, not behavior. The document is large, changes frequently, and requires citations for compliance. Fine-tuning would embed a snapshot of the document that immediately becomes stale.

---

**Q3**: You're evaluating whether to fine-tune a 7B model or use a larger 70B model with prompting. What questions determine this tradeoff?

**A**: Latency budget (70B is slower), cost per call (70B is more expensive), whether the 7B base model has the underlying capability (test first), whether the task requires consistent format (FT advantage), data availability (have you cleared eligibility?), and whether the 70B model's performance is already acceptable (if so, skip fine-tuning entirely).

---

## Lab Exercise

**Setup**: No code needed for this exercise.

**Task**: Take a task you're actually considering fine-tuning for. Work through the decision checklist in this document. Write one sentence for each of the six questions. Then determine:
- Is fine-tuning necessary, or does prompt engineering or RAG solve it?
- If fine-tuning is necessary, which of the four types applies?
- What does your data eligibility situation look like?

This exercise is complete when you can defend your recommendation to a skeptical senior engineer in 5 minutes.

---

*Continue to [01 — Data Engineering for Fine-Tuning](./01-data-engineering.md)*

*Last reviewed: May 2026. Model capabilities and tool recommendations evolve; verify current model benchmarks before base model selection.*
