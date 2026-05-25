# Fine-Tuning Mastery — Beginner to SME

> A curriculum for engineers who want to understand fine-tuning well enough to teach it, build it, and defend every decision under scrutiny.

**Status**: Enterprise training material. Verify all hardware estimates and model facts before planning or procurement.  
**Audience**: ML engineers, AI architects, technical leads in regulated industries.  
**Goal**: You finish this curriculum able to walk a room of peers through any fine-tuning decision — data, technique, architecture, evaluation, governance — with citations and honest caveats.

---

## Learning Path

```
BEGINNER          → INTERMEDIATE      → ADVANCED          → SME
What is FT?          LoRA / QLoRA        Training infra      Enterprise architecture
When to use it       Alignment (DPO)     Multi-GPU           Anti-patterns
Data basics          RLHF / GRPO         Evaluation          Governance
Mental models        PEFT ecosystem      Failure modes       Teach it to peers
```

---

## Curriculum Map

| # | Document | Level | What You Can Do After |
|---|----------|-------|----------------------|
| [00](./00-foundations.md) | **Foundations & Decision Framework** | Beginner | Decide whether fine-tuning is the right tool. Explain the taxonomy to a non-ML stakeholder. |
| [01](./01-data-engineering.md) | **Data Engineering for Fine-Tuning** | Beginner–Intermediate | Design a data pipeline. Audit a dataset for quality. Prevent the #1 cause of fine-tuning failures. |
| [02](./02-peft-techniques.md) | **PEFT Deep Dive: LoRA, QLoRA, DoRA & Beyond** | Intermediate–Advanced | Configure any PEFT technique correctly. Explain every hyperparameter. Know when to deviate from defaults. |
| [03](./03-alignment-tuning.md) | **Alignment & Preference Tuning: SFT → DPO → GRPO** | Intermediate–Advanced | Choose the right alignment method. Implement SFT, DPO, ORPO, or GRPO. Explain why each was invented. |
| [04](./04-training-infrastructure.md) | **Training Infrastructure: Multi-GPU, FSDP, DeepSpeed** | Advanced | Estimate memory requirements exactly. Configure distributed training. Debug OOM errors. |
| [05](./05-evaluation-framework.md) | **Evaluation Framework: Proving Your Model Works** | Advanced | Build evaluation suites that survive scrutiny. Set enterprise pass/fail gates. Detect hallucination and regression. |
| [06](./06-enterprise-patterns.md) | **Enterprise Architecture Patterns** | Expert | Design fine-tune + RAG + tooling architectures. Present a model risk framework. Pass a governance review. |
| [07](./07-anti-patterns.md) | **Anti-Patterns and Failure Modes** | Expert–SME | Recognize the 18 ways fine-tuning projects die. Fix them before they happen. |
| [08](./08-base-model-selection.md) | **Base Model Selection Guide** | Intermediate–Advanced | Pick the right base model. Evaluate capability, license, and quantization-friendliness. Never discover mid-project that your model can't do the task. |
| [09](./09-end-to-end-lab.md) | **End-to-End Lab: Financial Entity Extraction** | Intermediate–SME | Build a complete fine-tuning pipeline. Every concept from the curriculum in one working project. |
| [Bonus](./fiserv-elm-models-usecases.md) | **Fiserv ELM Use Cases & Readiness Gates** | SME | Apply the full framework to financial-services use cases. Build a production-ready ELM roadmap. |
| [Bonus](./lighthouse-attention-tutorial.md) | **Lighthouse Attention: Long-Context ELM Training** | SME | Explain the Lighthouse mechanism. Design a 128K+ context pretraining recipe. |

---

## How to Use This Curriculum

**Self-study**: Work through in order. Each doc has a "Teach It Back" prompt — answer it before moving on. Do the end-to-end lab (09) after completing 00–07.

**Workshop delivery**: Each doc (00–08) maps to a 90-minute session. Doc 09 is a half-day hands-on workshop.

**SME sprint**: Cover 00–03 in week 1, 04–07 in week 2, 08–09 in week 3. Deliver the lab as capstone.

---

## The Mental Model You're Building

```
┌─────────────────────────────────────────────────────────┐
│                    DATA                                  │
│  "Fine-tuning quality is bounded by data quality."       │
│  No technique compensates for bad data.                  │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────▼───────────────┐
          │         TECHNIQUE             │
          │  PEFT selects efficiency      │
          │  Alignment selects behavior   │
          └───────────────┬───────────────┘
                          │
          ┌───────────────▼───────────────┐
          │        EVALUATION             │
          │  Proves the model does        │
          │  what you claim it does       │
          └───────────────┬───────────────┘
                          │
          ┌───────────────▼───────────────┐
          │        GOVERNANCE             │
          │  Data rights, model risk,     │
          │  human oversight, audit trail │
          └───────────────────────────────┘
```

**The hierarchy is real**: A perfect LoRA configuration on bad data produces a bad model. Perfect data + perfect technique + no evaluation produces an undeployable model. All four layers must be sound.

---

## Quick Reference: Technique Selection

| Situation | Recommended Technique |
|-----------|----------------------|
| Stable task, labeled data, limited GPU | QLoRA + SFT |
| Style / tone / format alignment | SFT → DPO or ORPO |
| Reasoning / tool use improvement | SFT → GRPO |
| Multi-task, swap adapters at runtime | LoRA with multiple adapters |
| Sub-1B model, edge deployment | QAT or GGUF quantization |
| Very long context pretraining | Lighthouse Attention + dense recovery |
| Knowledge-heavy, frequently updated facts | RAG (not fine-tuning) |
| Sensitive regulated data, no weight embedding | RAG-first, fine-tune behavior only |

---

## Enterprise Non-Negotiables

These apply regardless of technique, model, or use case:

1. **Data eligibility before the first token.** Written approval for every data source. PII/PCI/sensitive data classified and redacted.
2. **Frozen evaluation set.** Created before training. Never touched during development.
3. **Model risk registration.** Intended use, limitations, validation plan, owner.
4. **Human oversight workflow.** Explicitly defined: which decisions require human approval, what the escalation path is.
5. **Rollback plan.** How to revert to a previous version or the base model.

---

*Last updated: May 2026. Verify model cards, licenses, and framework documentation before use — these change.*
