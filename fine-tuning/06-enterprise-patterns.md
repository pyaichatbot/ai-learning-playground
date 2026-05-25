# 06 — Enterprise Architecture Patterns

> **Level**: Expert  
> **Time**: ~90 minutes  
> **Goal**: Design fine-tune + RAG + tooling architectures. Present a model risk framework. Pass a governance review.

---

## What "Enterprise" Means for LLM Architecture

"Enterprise" is not a style. It's a set of constraints that change what "correct" looks like:

- **Regulatory compliance**: Audit trails, explainability, data residency requirements
- **Operational reliability**: 99.9%+ uptime, predictable latency, graceful degradation
- **Organizational accountability**: Model risk ownership, change management, rollback capability
- **Data sovereignty**: Where does the data go? Who can see it? What is retained?
- **Scale economics**: Thousands of requests/day minimum; costs must be predictable
- **Human oversight**: For high-stakes decisions, a human must be in the loop

An architecture that works for a startup's internal tool may fail every one of these. Enterprise architecture designs for them explicitly.

---

## The Four Foundational Architecture Patterns

### Pattern 1: Prompt Engineering (No Fine-Tuning)

```
User Request → [System Prompt + Few-Shot Examples] → LLM API → Response
```

**When this is right**:
- Task is well-defined and LLM already has the capability
- High change velocity (prompts update in hours, model retraining takes weeks)
- Small volume (system prompt costs don't dominate)
- External LLM API is acceptable (data isn't proprietary/regulated)

**Enterprise limitations**:
- Prompt injection vulnerability: system prompt can be extracted or overridden
- Consistency: model behavior can change with provider updates
- Data: your prompts and data go to the provider
- Cost at scale: long system prompts × high request volume = significant cost

---

### Pattern 2: RAG (Retrieval-Augmented Generation)

```
User Request
     ↓
[Embedding Model] → query vector
     ↓
[Vector Database] → retrieved chunks
     ↓
[LLM: system_prompt + context + query] → Response
```

**When this is right**:
- The problem is knowledge access, not behavior
- Knowledge is updated frequently (regulations, product catalog, support docs)
- Compliance requires citations (you can trace every claim to a source)
- Knowledge is sensitive (retrieval at query time rather than embedded in weights)

**Key design decisions for enterprise RAG**:

*Chunking strategy*: How you split documents affects retrieval quality significantly. Simple fixed-size chunking is fast but splits semantic units. Recursive character splitting, semantic chunking, and document-structure-aware chunking all produce better retrieval at higher implementation cost.

*Embedding model choice*: OpenAI text-embedding-3-large (API, data leaves your org) vs. a self-hosted model (Nomic, BGE, E5). For sensitive data, self-hosted is often required. For multilingual content, verify your embedding model's language coverage.

*Retrieval strategy*: Pure vector search works well for semantic similarity. Hybrid search (vector + BM25 keyword) outperforms pure vector for exact term matching (product codes, regulation numbers). Re-ranking with a cross-encoder after retrieval improves precision at higher latency cost.

*Context window management*: You have N chunks of retrieved context. How many fit? How do you handle relevance when chunks are scattered? Current LLM context windows (128K+) reduce this concern for most use cases, but token cost still matters.

---

### Pattern 3: Fine-Tuning Only

```
User Request → [Fine-Tuned Model] → Response
```

**When this is right**:
- Behavior/format/style is the problem (not knowledge)
- Latency budget is tight (no retrieval round-trip)
- Volume is high enough to justify training cost
- Data can be embedded in weights (not too sensitive)

**Enterprise architecture for fine-tuning only**:

```
Development:
  Training Data → [Quality Pipeline] → [Training Run] → [Evaluation] → Model Registry

Deployment:
  User Request → [Load Balancer] → [Inference Server (vLLM)] → Response
  
  Inference Server:
  - Hosts base model + LoRA adapter(s)
  - Auto-scales on request volume
  - Logs requests and responses (for monitoring and audit)
  - Rate limits per tenant/user
```

**LoRA adapter switching** enables cost-efficient multi-tenant serving:
```
User Request + Tenant ID
     ↓
[Routing: identify tenant's adapter]
     ↓
[Base Model + Tenant-Specific Adapter] → Response
```
One base model instance, multiple tenants, adapter swap at inference time.

---

### Pattern 4: Fine-Tuning + RAG (The Production Standard)

```
User Request
     ↓
[Fine-Tuned Model] + [Retrieved Context]
     ↓
Response
```

The fine-tuned model handles: format, tone, persona, reasoning style, task-specific behavior.
RAG handles: current facts, proprietary knowledge, citations.

**This is the architecture most enterprise LLM deployments converge to** for knowledge-intensive tasks with consistent behavior requirements.

**Full architecture diagram**:

```
                           ┌─────────────────────────────────┐
                           │         KNOWLEDGE LAYER          │
                           │                                  │
User Request ──────────────┤  ┌──────────────┐               │
                           │  │ Doc Ingestion│               │
                           │  │ + Chunking   │               │
                           │  └──────┬───────┘               │
                           │         │                        │
                           │  ┌──────▼───────┐               │
                           │  │  Embedding   │               │
                           │  │    Model     │               │
                           │  └──────┬───────┘               │
                           │         │                        │
                           │  ┌──────▼───────┐               │
                           │  │    Vector    │               │
                           │  │     DB       │               │
                           │  └──────┬───────┘               │
                           └─────────│───────────────────────┘
                                     │ Retrieved Chunks
                                     │
                           ┌─────────▼───────────────────────┐
                           │         MODEL LAYER              │
                           │                                  │
                           │  [System Prompt]                 │
                           │  [Retrieved Context]             │
                           │  [User Request]                  │
                           │         │                        │
                           │  ┌──────▼───────┐               │
                           │  │ Fine-Tuned   │               │
                           │  │    LLM       │               │
                           │  └──────┬───────┘               │
                           └─────────│───────────────────────┘
                                     │
                           ┌─────────▼───────────────────────┐
                           │         CONTROL LAYER            │
                           │                                  │
                           │  - Output validation             │
                           │  - Safety checks                 │
                           │  - Human escalation routing      │
                           │  - Audit logging                 │
                           └─────────────────────────────────┘
```

---

## Architecture Decision: Fine-Tune vs RAG vs Combine

Use this framework when you're asked to recommend an architecture for a new use case:

```
Step 1: What is the core problem?
  → Knowledge gap (facts, documents): RAG
  → Behavior gap (format, style, task): Fine-tuning
  → Both: Combine

Step 2: What are the data sensitivity requirements?
  → Data can go to API provider: External API + prompting/RAG
  → Data must stay on-premise: Self-hosted model + local vector DB

Step 3: What is the change velocity?
  → Content changes daily/weekly: RAG (faster updates)
  → Behavior changes rarely: Fine-tuning (amortize training cost)

Step 4: What are the compliance requirements?
  → Need citations/provenance: RAG (every response citable)
  → Need predictable format: Fine-tuning (baked into weights)
  → Need audit trail: Logging layer regardless of choice

Step 5: What is the latency budget?
  → < 100ms first token: Fine-tuning (no retrieval RTT)
  → < 500ms first token: RAG may work with fast retrieval
  → Flexible: Either works
```

---

## Model Serving Infrastructure

### vLLM: The Production Inference Engine

vLLM is the dominant open-source LLM inference engine for production deployments (as of 2025–2026). Key features:

**PagedAttention**: Manages KV cache in non-contiguous memory pages, dramatically reducing memory waste. Enables much higher throughput than naïve implementations.

**Continuous batching**: Processes requests as they arrive instead of waiting for a fixed batch to fill. Reduces latency variance.

**Multi-LoRA serving**: vLLM supports serving a single base model with multiple LoRA adapters concurrently:

```python
from vllm import LLM
from vllm.lora.request import LoRARequest

llm = LLM(
    model="meta-llama/Llama-3.1-8B-Instruct",
    enable_lora=True,
    max_lora_rank=64
)

# Route to different adapters per request
response = llm.generate(
    prompt,
    lora_request=LoRARequest("tenant_a", 1, "/adapters/tenant_a")
)
```

**Speculative decoding**: Use a smaller draft model to propose tokens, verify with the large model. Reduces latency for long generation tasks.

### Kubernetes Deployment Pattern

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-inference
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        args:
          - "--model=meta-llama/Llama-3.1-8B-Instruct"
          - "--enable-lora"
          - "--max-lora-rank=64"
          - "--tensor-parallel-size=1"
          - "--gpu-memory-utilization=0.90"
        resources:
          limits:
            nvidia.com/gpu: "1"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
```

---

## The Model Risk Framework

For regulated industries, every fine-tuned model that makes or influences decisions needs a model risk record. This is not optional for financial services, healthcare, or legal applications.

### Model Risk Document Template

```markdown
## Model Risk Record

**Model ID**: [unique identifier]
**Version**: [version tag]
**Owner**: [team and individual accountable]
**Date**: [creation date]
**Last Updated**: [update date]

### 1. Model Purpose
- Primary use case: [specific task the model performs]
- Decision context: [what decisions this model influences]
- Users: [who or what system consumes model outputs]
- Volume: [estimated requests/day at production]

### 2. Intended Use Boundaries
- In-scope inputs: [description with examples]
- Out-of-scope inputs: [what the model should NOT be used for]
- Geographic/regulatory scope: [applicable jurisdictions]

### 3. Training Data
- Sources: [with approval documentation references]
- Date range: [training data temporal coverage]
- Volume: [training set size]
- PII/sensitive data: [classification and handling]
- Dataset version: [hash or version ID]

### 4. Model Architecture
- Base model: [name, version, license]
- Fine-tuning technique: [PEFT method, parameters]
- Alignment: [if applicable]

### 5. Validation Results
- Evaluation set: [version, size, composition]
- Primary metric: [score and threshold]
- Regression results: [vs. baseline]
- Human evaluation: [results and protocol]
- Known limitations: [explicit statement of where model fails]

### 6. Human Oversight
- Oversight level: [automated / human-in-loop / human-on-loop]
- Escalation triggers: [conditions under which human review is required]
- Escalation path: [who reviews, SLA for review]
- Override mechanism: [how humans can override/correct model]

### 7. Monitoring Plan
- Metrics monitored: [what is tracked in production]
- Drift detection: [input distribution, output distribution]
- Alert thresholds: [what triggers a review or rollback]
- Review cadence: [how often model performance is formally reviewed]

### 8. Rollback Plan
- Rollback trigger: [conditions requiring rollback]
- Rollback procedure: [steps to revert to previous version]
- Recovery time objective: [how fast rollback must complete]
- Previous version: [identifier of version to fall back to]

### 9. Approvals
- Technical validation: [name, date]
- Model risk review: [name, date]  
- Legal/compliance review: [name, date] (for regulated domains)
- Business owner sign-off: [name, date]
```

---

## The Eight Readiness Gates (Enterprise Deployment)

A model is not ready for production until it passes all eight. These gates apply regardless of technique or use case.

**Gate 1 — Data Eligibility**
Written approval for every data source. PII/PCI classified and handled. Data eligibility documented before the first training run.

**Gate 2 — Redaction and Privacy**
All PII/sensitive data in training set identified, redacted, or removed. Redaction reviewed by privacy team. Data hash recorded in model risk document.

**Gate 3 — Model Risk Registration**
Model risk record created (per template above). Intended use, boundaries, and limitations explicitly stated. Model risk owner assigned.

**Gate 4 — Technical Validation**
Evaluation suite run on frozen test set. Pass/fail gates defined and met. Regression results vs. baseline documented.

**Gate 5 — Explainability**
For decision-influencing models: can outputs be explained to affected parties? For extraction: can you trace every extracted value to a source? For classification: can you identify which features drove the decision?

**Gate 6 — Human Oversight Definition**
Explicit statement: which decisions require human approval before action, which are automated? Escalation path exists and has been tested. Human reviewers trained.

**Gate 7 — Security Review**
Prompt injection testing completed. Output filtering/validation in place. Access controls on model API. No confidential data in system prompts or context that shouldn't be exposed.

**Gate 8 — Legal and Compliance Sign-Off**
For regulated domains: legal review of use case, data handling, and model behavior. Compliance review of any decisions the model influences. Regulatory notification if required.

---

## Monitoring in Production

### What to monitor

**Input distribution drift**: Are the inputs the model receives in production similar to its training distribution? Use embedding-based drift detection.

```python
from scipy.stats import ks_2samp

def detect_drift(baseline_embeddings, production_embeddings, threshold=0.05):
    """KS test on embedding dimensions for drift detection."""
    p_values = []
    for dim in range(baseline_embeddings.shape[1]):
        _, p_value = ks_2samp(
            baseline_embeddings[:, dim],
            production_embeddings[:, dim]
        )
        p_values.append(p_value)
    
    # Flag if majority of dimensions show significant drift
    drift_fraction = sum(p < threshold for p in p_values) / len(p_values)
    return drift_fraction > 0.1  # More than 10% of dims drifted
```

**Output quality metrics**: Track proxy quality metrics that can be computed automatically — format compliance rate, schema validation pass rate, output length distribution.

**User feedback signals**: Thumbs up/down, explicit corrections, escalation rates.

**Latency and throughput**: p50, p95, p99 latency. Tokens per second. Queue depth.

### Alerting thresholds (enterprise baseline)

| Metric | Alert Threshold | Escalation Threshold |
|--------|----------------|---------------------|
| Format compliance rate | < 98% | < 95% |
| Latency p95 | > 2× baseline | > 3× baseline |
| Error rate | > 0.1% | > 1% |
| Input drift score | > 0.15 | > 0.30 |
| User feedback negative rate | > 5% | > 15% |

---

## Output Safety and Guardrails

A fine-tuned model is not the last line of defense. Enterprise deployments layer guardrails around model outputs.

### LlamaGuard

Meta's LlamaGuard (and LlamaGuard 3) is a purpose-built safety classification model that evaluates inputs and outputs against a configurable safety taxonomy:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

# LlamaGuard 3 8B — runs as a classifier on model I/O
GUARD_MODEL = "meta-llama/Llama-Guard-3-8B"
guard_tokenizer = AutoTokenizer.from_pretrained(GUARD_MODEL)
guard_model = AutoModelForCausalLM.from_pretrained(GUARD_MODEL, device_map="auto")

def check_safety(user_message: str, model_response: str) -> dict:
    """Returns {'safe': bool, 'category': str | None}"""
    # LlamaGuard uses a specific conversation format
    messages = [
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": model_response},
    ]
    formatted = guard_tokenizer.apply_chat_template(messages, tokenize=False)
    inputs = guard_tokenizer(formatted, return_tensors="pt").to(guard_model.device)
    
    with torch.no_grad():
        output = guard_model.generate(**inputs, max_new_tokens=20)
    
    verdict = guard_tokenizer.decode(output[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
    safe = verdict.strip().startswith("safe")
    category = None if safe else verdict.strip().split("\n")[-1]
    return {"safe": safe, "category": category}
```

LlamaGuard runs as a separate inference call — add ~50–100ms to latency. For synchronous, latency-sensitive pipelines, run it asynchronously or sample (check 10% of responses) rather than every request.

### NeMo Guardrails (NVIDIA)

For more complex policy enforcement (multi-turn, topic control, jailbreak resistance), NeMo Guardrails provides a programmable rule layer:

```yaml
# rails/config.yml — define what the model will and won't do
models:
  - type: main
    engine: openai  # or your local endpoint
    model: your-fine-tuned-model

rails:
  input:
    flows:
      - check user message

  output:
    flows:
      - check bot response

define flow check user message
  $allowed = execute check_topic(topic=$user_message)
  if not $allowed
    bot refuse to discuss

define flow check bot response
  if $bot_message contains "confidential"
    bot apologize and redirect
```

NeMo Guardrails is appropriate when policy rules are complex and change frequently — it separates policy from model behavior.

---

## Model Compression for Deployment

Fine-tuned models are trained in bf16 or 4-bit. Production serving often requires further compression for cost or latency:

### GGUF (for CPU / edge inference)

After merging LoRA into the base model, convert to GGUF using llama.cpp:

```bash
# Install llama.cpp with conversion tools
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make

# Convert HuggingFace model to GGUF (Q4_K_M is the standard quality/size balance)
python convert_hf_to_gguf.py /path/to/merged-model --outtype q4_k_m
# Output: model-Q4_K_M.gguf (~4.5 GB for a 7B model)

# Serve locally with llama-server
./llama-server -m model-Q4_K_M.gguf --port 8080
```

GGUF Q4_K_M: 7B model runs on Apple M3 Pro, 16 GB RAM. First-token latency ~200–500ms on CPU. Right for edge and developer tooling, not for high-concurrency APIs.

### AWQ (Activation-aware Weight Quantization)

AWQ quantizes to 4-bit but preserves precision on the most important weights, producing better quality than naive 4-bit at the same size. Supported natively in vLLM:

```python
# AWQ model — produced by autoawq during quantization
from awq import AutoAWQForCausalLM

model = AutoAWQForCausalLM.from_pretrained("your-merged-model")
quant_config = {"zero_point": True, "q_group_size": 128, "w_bit": 4, "version": "GEMM"}
model.quantize(tokenizer, quant_config=quant_config)
model.save_quantized("./models/financial-extraction-v1-awq")

# vLLM serves AWQ natively:
# python -m vllm.entrypoints.openai.api_server --model ./models/... --quantization awq
```

AWQ gives ~1.5× throughput improvement over bf16 on GPU, with quality loss typically <1% on task metrics. Default for high-throughput serving if GPU cost is a constraint.

### GPTQ

Similar to AWQ but uses a different optimization method. Broadly equivalent quality, slightly different tradeoffs on different model families. Both are supported in vLLM. Use AWQ as the default unless benchmarking shows GPTQ superior for your specific model.

---

## Multi-Model Architectures

As organizations mature, they often run multiple specialized models rather than one general model. This creates routing and orchestration challenges.

### Router Pattern

```
User Request
     ↓
[Classifier: intent detection]
     ↓
┌────────────────────────────────────┐
│  intent = "extraction"             │ → [Extraction Model]
│  intent = "classification"         │ → [Classification Model]
│  intent = "generation"             │ → [Generation Model]
│  intent = "out_of_scope"           │ → [Decline or Escalate]
└────────────────────────────────────┘
```

**The classifier can be**: A small fine-tuned model, a prompt-based LLM call, or a rules-based system (faster and more predictable for narrow intent sets).

**Routing failure modes**: The classifier misidentifies intent and routes to the wrong model, producing confidently wrong output. Test your classifier rigorously with out-of-scope inputs.

### Cascade Pattern

Use a cheaper model for easy cases, route to a more capable (and expensive) model when the easy model is uncertain:

```
Request → [Small Fast Model] → Confidence score
               ↓
         If confidence > 0.9: return response
         If confidence ≤ 0.9: route to [Large Capable Model]
```

**Savings**: If 70% of requests are easy cases handled by the small model, you pay large-model cost for only 30% of requests.

**Calibration requirement**: The small model's confidence score must be well-calibrated. A model that always outputs 90% confidence is useless for routing.

---

## The Total Cost of Ownership Calculation

Infrastructure teams will ask for cost projections. Here's how to do it:

```
Training cost = GPU-hours × GPU price/hour × number of runs
(Include: development runs, final run, evaluation runs)

Storage cost = Model size × number of versions × storage price
(Include: base model, fine-tuned versions, adapter checkpoints)

Inference cost = requests/day × avg_tokens_per_request × token_price
OR
Inference cost = GPU-hours/day × GPU price/hour
(For self-hosted: includes GPU reservation, not pay-per-token)

Maintenance cost = engineer-days/month × engineer cost
(Model monitoring, retraining triggers, evaluation)

Total cost = Training + Storage + Inference + Maintenance
```

**The make-vs-buy calculation**: Compare self-hosted fine-tuned model costs against commercial API costs. For high-volume, stable tasks, self-hosted fine-tuning often has lower marginal cost. For low-volume or variable tasks, commercial APIs are more cost-efficient.

---

## Teach It Back

1. Your team is building a regulatory compliance Q&A system. The knowledge base updates quarterly. Draw and justify the architecture.

2. Walk through all eight readiness gates for a credit risk classification model. Which gates are blocking for financial services regulation?

3. A product manager asks "can we serve all our customers from one model?" Describe the multi-LoRA adapter architecture and its tradeoffs.

4. Production alerting shows format compliance dropped from 99.8% to 96.5% over the past week without any model changes. What do you investigate first?

---

## Knowledge Check

**Q1**: A compliance team requires that every claim in a model's output be traceable to a source document. Can you achieve this with a fine-tuned model? What architecture do you recommend?

**A**: A fine-tuned model alone cannot provide traceable citations — the knowledge is baked into weights, not pointed at source documents. Use RAG. Architecture: retrieve relevant document chunks, pass them as context to the model, require the model to cite its sources (chunk reference) in every claim. Fine-tuning is still useful on top of RAG to teach citation format and retrieval-augmented reasoning style.

---

**Q2**: You're operating a fine-tuned model that classifies loan applications. The model risk owner asks "how do you know when the model needs retraining?" What is your answer?

**A**: Monitoring-driven retraining triggers: (1) Input distribution drift exceeds threshold (applications from new demographic segments or products not in training data), (2) Accuracy regression detected via ground-truth comparison on a sample of recent applications, (3) Scheduled periodic revalidation (e.g., quarterly), (4) Regulatory or policy change that affects classification criteria (requires immediate retraining or rollback), (5) Model risk review identifies new concerns. Automated alerts for (1); human-triggered for (3), (4), (5); near-real-time for (2) if labeled feedback is available.

---

*Continue to [07 — Anti-Patterns and Failure Modes](./07-anti-patterns.md)*

*Last reviewed: May 2026.*
