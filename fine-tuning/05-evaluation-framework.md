# 05 — Evaluation Framework: Proving Your Model Works

> **Level**: Advanced  
> **Time**: ~90 minutes  
> **Goal**: Build evaluation suites that survive scrutiny. Set enterprise pass/fail gates. Detect hallucination and regression.

---

## Why Evaluation Is the Hardest Part

Reducing loss during training is straightforward. Proving the model does what you claim — for the actual use case, on realistic inputs, at production quality, with no regressions — is genuinely hard.

Most fine-tuning projects fail not during training but during evaluation: the model looks good on training metrics, passes a manual spot check, and then fails in the first week of production. The evaluation wasn't wrong — it was incomplete.

**The central evaluation challenge**: Training metrics (loss, perplexity) are necessary but not sufficient. A model can have excellent training loss while:
- Hallucinating on specific input patterns not in the training set
- Failing on inputs 20% longer than its training distribution
- Regressing on general capability (forgetting how to do tasks it did before)
- Performing well on simple cases but failing on edge cases that matter most

This document is about building an evaluation framework that catches these failures before production.

---

## The Three Layers of Evaluation

Think of evaluation as three concentric circles, each necessary and none sufficient:

```
Layer 1: Automatic Metrics (fast, scalable, imprecise)
Layer 2: Task-Specific Evaluation (precise for your task, requires design)
Layer 3: Human Evaluation (ground truth, expensive, non-scalable)
```

A production evaluation framework uses all three. The typical error is using only Layer 1.

---

## Layer 1: Automatic Metrics

### Loss and Perplexity

**Eval loss** (cross-entropy on your evaluation set) is the primary training signal and should be tracked throughout:

```python
TrainingArguments(
    eval_strategy="steps",
    eval_steps=200,
    metric_for_best_model="eval_loss",
    load_best_model_at_end=True,
)
```

**Perplexity** = exp(eval_loss). Easier to reason about: lower is better, and the scale is interpretable (perplexity of 5 means the model is as uncertain as if it had 5 equally likely choices at each token).

**Critical limitation**: Eval loss measures how well the model predicts the training distribution. It does NOT measure whether the model produces correct outputs for your task. A model can have low eval loss and still produce wrong answers if the training distribution doesn't align with what you care about.

---

### Token Accuracy and Task Accuracy

For classification or structured extraction tasks, measure accuracy directly:

```python
def compute_metrics(eval_preds):
    predictions, labels = eval_preds
    # Decode predictions and labels
    decoded_preds = tokenizer.batch_decode(predictions, skip_special_tokens=True)
    decoded_labels = tokenizer.batch_decode(labels, skip_special_tokens=True)
    
    # Task-specific accuracy
    correct = sum(p.strip() == l.strip() for p, l in zip(decoded_preds, decoded_labels))
    accuracy = correct / len(decoded_preds)
    
    return {"accuracy": accuracy}
```

---

### ROUGE / BLEU (for generation tasks)

ROUGE measures n-gram overlap between model output and reference text. Used for summarization and translation.

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)

def compute_rouge(predictions, references):
    scores = [scorer.score(ref, pred) for pred, ref in zip(predictions, references)]
    return {
        'rouge1': sum(s['rouge1'].fmeasure for s in scores) / len(scores),
        'rouge2': sum(s['rouge2'].fmeasure for s in scores) / len(scores),
        'rougeL': sum(s['rougeL'].fmeasure for s in scores) / len(scores),
    }
```

**Important caveat**: ROUGE measures surface-level overlap. A model can have high ROUGE by producing plausible-sounding but factually wrong text. ROUGE is a proxy, not a ground truth.

**When ROUGE is useful**: When evaluating stylistic alignment (does the output sound like the reference style?), not factual accuracy.

---

## Layer 2: Task-Specific Evaluation

### Structured Output Validation

For extraction tasks, validate the structure before validating the content:

```python
from jsonschema import validate, ValidationError

# Define the expected output schema
EXTRACTION_SCHEMA = {
    "type": "object",
    "required": ["entities", "amounts", "dates"],
    "properties": {
        "entities": {"type": "array", "items": {"type": "string"}},
        "amounts": {"type": "array", "items": {"type": "number"}},
        "dates": {"type": "array", "items": {"type": "string", "format": "date"}}
    }
}

def evaluate_extraction(model_output: str, expected: dict) -> dict:
    results = {
        "valid_json": False,
        "schema_valid": False,
        "field_accuracy": 0.0,
        "exact_match": False,
    }
    
    try:
        parsed = json.loads(model_output)
        results["valid_json"] = True
    except json.JSONDecodeError:
        return results
    
    try:
        validate(parsed, EXTRACTION_SCHEMA)
        results["schema_valid"] = True
    except ValidationError:
        return results
    
    # Field-level accuracy
    matching_fields = sum(
        1 for k in expected if parsed.get(k) == expected[k]
    )
    results["field_accuracy"] = matching_fields / len(expected)
    results["exact_match"] = (parsed == expected)
    
    return results
```

**The metric hierarchy for extraction tasks**:
1. Format validity (is the JSON parseable?)
2. Schema compliance (does it have the right fields and types?)
3. Field accuracy (are individual fields correct?)
4. Exact match (is the entire output correct?)

Report all four. A model at 95% field accuracy but 40% exact match is still useful. A model at 60% schema compliance is not production-ready.

---

### Semantic Similarity (for generation tasks)

When exact match is too strict (paraphrases are acceptable), use embedding similarity:

```python
from sentence_transformers import SentenceTransformer, util

model_embed = SentenceTransformer('all-MiniLM-L6-v2')

def semantic_similarity(predicted: str, reference: str) -> float:
    emb_pred = model_embed.encode(predicted, convert_to_tensor=True)
    emb_ref = model_embed.encode(reference, convert_to_tensor=True)
    return float(util.cos_sim(emb_pred, emb_ref)[0][0])

# Consider "correct" if similarity > 0.85
```

**Calibration**: Validate your similarity threshold by manually reviewing pairs at different score ranges. Is 0.85 threshold actually capturing meaningful equivalence? Calibrate on your specific domain.

---

### LLM-as-Judge

For tasks where output quality is hard to measure automatically, use a strong LLM as an evaluator:

```python
def llm_judge_score(prompt: str, model_output: str, criteria: str) -> dict:
    judge_prompt = f"""
Evaluate the following model response on a scale of 1-5 for each criterion.

Original prompt: {prompt}
Model response: {model_output}

Evaluation criteria:
{criteria}

Respond in JSON format:
{{"criteria_1": <score>, "criteria_2": <score>, ..., "reasoning": "<brief explanation>"}}
"""
    response = judge_model.generate(judge_prompt)
    return json.loads(response)
```

**Criteria for different task types**:

*Summarization*: Faithfulness (no invented facts), Coverage (key points included), Conciseness (appropriate length)

*Classification*: Accuracy, Confidence calibration, Appropriate hedging on ambiguous inputs

*Instruction following*: Format compliance, Completeness, Constraint satisfaction

**LLM-as-judge limitations**:
- Positional bias: judges favor the first response when comparing two
- Length bias: judges favor longer, more detailed responses
- Self-serving bias: a model judging itself or similar models is unreliable

**Mitigations**: Randomize order in comparisons, use a different family of models (use Claude to judge a Llama-based model), calibrate judge scores against human ratings on a sample.

---

## Layer 3: Human Evaluation

Human evaluation is expensive and non-scalable but is the ground truth. Use it for:

1. **Initial calibration**: Before deploying any automatic metric, validate it correlates with human judgment on 100–200 examples.

2. **Failure mode discovery**: Sample model outputs regularly and have domain experts review them. Humans find failure modes that automatic metrics miss.

3. **Final production gate**: Before any major deployment, require human review of a statistically significant sample.

### Human evaluation protocol

```
1. Random sample of 100–200 examples from eval set
2. Include stratified samples: easy, medium, hard, edge cases
3. Two independent reviewers per example
4. Each reviewer: rate quality (1–5) and flag any safety/accuracy issues
5. Calculate inter-rater agreement (Cohen's κ)
   - κ < 0.6: criteria are ambiguous, revise before proceeding
   - κ ≥ 0.7: criteria are clear enough
6. Resolve disagreements by consensus or a third reviewer
7. Report: mean score, distribution, percentage of flagged examples
```

---

## Hallucination Detection

Hallucinations — confident but false statements — are the highest-stakes evaluation concern for most enterprise deployments.

### Types of hallucinations in fine-tuned models

**Intrinsic hallucinations**: The model produces output that contradicts the input. Example: extraction task where input says "amount: $50,000" but model outputs "amount: $500,000."

**Extrinsic hallucinations**: The model adds information not present in the input. Example: extraction task adds fields not present in source document.

**Calibration failure**: The model expresses high confidence on incorrect outputs. Often harder to detect than factual errors.

### Automated hallucination checks

```python
def check_intrinsic_hallucination(input_text: str, model_output: str) -> dict:
    """Check if model output is grounded in the input."""
    # For extraction tasks: every extracted value should appear in the input
    extracted_values = extract_values_from_output(model_output)
    
    ungrounded = []
    for value in extracted_values:
        if str(value) not in input_text:
            ungrounded.append(value)
    
    return {
        "total_extracted": len(extracted_values),
        "ungrounded_count": len(ungrounded),
        "ungrounded_values": ungrounded,
        "hallucination_rate": len(ungrounded) / max(len(extracted_values), 1)
    }
```

**NLI-based faithfulness**: For longer generation, use a Natural Language Inference model to check if claims in the output are entailed by the input:

```python
from transformers import pipeline

nli_model = pipeline("text-classification", model="facebook/bart-large-mnli")

def check_faithfulness(premise: str, hypothesis: str) -> float:
    """Return entailment probability (1.0 = fully entailed, 0.0 = contradicted)."""
    result = nli_model(f"{premise} </s></s> {hypothesis}", truncation=True)
    for item in result:
        if item['label'] == 'ENTAILMENT':
            return item['score']
    return 0.0
```

---

## Regression Testing

Regression testing answers: "Did this new model version break anything the previous version did correctly?"

### The regression test suite structure

```
regression_suite/
├── core_capabilities/
│   ├── basic_instruction_following.jsonl  # 50 examples
│   ├── format_compliance.jsonl            # 30 examples  
│   └── refusal_appropriate.jsonl          # 20 examples
├── domain_tasks/
│   ├── extraction_easy.jsonl              # 50 examples
│   ├── extraction_hard.jsonl              # 30 examples
│   └── classification.jsonl              # 40 examples
└── edge_cases/
    ├── empty_input.jsonl                  # 10 examples
    ├── very_long_input.jsonl              # 10 examples
    └── adversarial_format.jsonl           # 20 examples
```

### Running regression comparison

```python
def regression_compare(
    baseline_model, 
    candidate_model, 
    test_suite: list[dict],
    tolerance: float = 0.02  # 2% regression tolerance
) -> dict:
    
    baseline_scores = evaluate_model(baseline_model, test_suite)
    candidate_scores = evaluate_model(candidate_model, test_suite)
    
    regressions = {}
    for metric in baseline_scores:
        delta = candidate_scores[metric] - baseline_scores[metric]
        if delta < -tolerance:
            regressions[metric] = {
                "baseline": baseline_scores[metric],
                "candidate": candidate_scores[metric],
                "delta": delta
            }
    
    return {
        "regressions_detected": len(regressions) > 0,
        "regressions": regressions,
        "baseline_scores": baseline_scores,
        "candidate_scores": candidate_scores
    }
```

**Regression gates**: Define which metrics are blocking (must not regress) vs. informational (tracked but not blocking):

| Metric | Blocking? | Max Allowed Regression |
|--------|-----------|----------------------|
| Format compliance | Yes | 0% |
| Task accuracy (primary) | Yes | 2% |
| Core capability benchmark | Yes | 3% |
| Edge case accuracy | No | 10% |
| Latency (p99) | Yes (if > 20% slower) | 20% |

---

## Enterprise Pass/Fail Gates

Enterprise evaluation requires explicit pass/fail criteria established BEFORE training begins. "Looks good" is not a gate.

### The Gate Framework

**Gate 1: Data Quality Gate** (before training)
```
□ Format validation: 100% of training examples parse correctly
□ Deduplication: < 1% near-duplicate examples remain
□ PII audit: documented, reviewer signed off
□ Eval set: frozen before training, hash recorded
□ Coverage: all critical input patterns represented
```

**Gate 2: Training Health Gate** (during training)
```
□ Loss curve: eval loss decreasing and not diverging
□ No NaN gradients after warmup
□ Eval loss < training loss (no overfitting detected) or acceptable gap
□ Gradient norm: stable (not exploding or vanishing)
```

**Gate 3: Task Performance Gate** (post training)
```
□ Primary metric: ≥ threshold defined in spec (e.g., F1 ≥ 0.85)
□ Format compliance: ≥ 99% valid format
□ Hallucination rate: ≤ 2% (for extraction tasks)
□ Edge case accuracy: ≥ defined threshold
□ No complete failures on core examples
```

**Gate 4: Regression Gate** (post training, compare to baseline)
```
□ Core capability: ≤ 3% regression vs. baseline
□ Primary task: ≥ 2% improvement OR ≤ 1% regression with other gains
□ Human evaluation: net positive judgment vs. baseline
□ Latency: within acceptable range
```

**Gate 5: Safety and Compliance Gate** (post training, pre-deployment)
```
□ Adversarial inputs: no safety violations on red team set
□ Bias evaluation: no prohibited discriminatory behavior on protected classes
□ Refusal behavior: appropriate refusals on out-of-scope inputs
□ Confidential data handling: no leakage patterns
□ Sign-off: model risk owner, legal/compliance reviewer (for regulated domains)
```

### Gate accountability

Each gate has an owner. The owner is responsible for:
- Defining the criteria before training
- Running the evaluation
- Making the pass/fail call
- Documenting the decision and any exceptions

No model proceeds to the next stage without an explicit pass decision from the gate owner.

---

## Benchmark Suites for Capability Regression

Beyond task-specific evaluation, monitor general capabilities to detect the alignment tax and catastrophic forgetting:

### Recommended benchmarks for enterprise models

| Benchmark | What It Tests | When to Use |
|-----------|--------------|-------------|
| **MT-Bench** | Multi-turn conversation quality (1–10 score) | General assistant alignment |
| **MMLU** | World knowledge, reasoning (accuracy) | General capability regression |
| **HumanEval / MBPP** | Code generation correctness | Code-capable models |
| **HellaSwag** | Commonsense reasoning | General capability |
| **TruthfulQA** | Truthfulness, calibration | Hallucination risk assessment |
| **GSM8K** | Math reasoning accuracy | Math-focused models |

**Practical approach**: Don't run all of these. Pick 2–3 that are relevant to your use case and run them consistently as regression markers. MT-Bench and one domain-specific benchmark is sufficient for most enterprise deployments.

---

## Evaluation Reporting

A credible evaluation report answers:

```
1. What did we test?
   - Eval set version and hash
   - Number and composition of examples
   - Human evaluation participation (if any)

2. What metrics did we use?
   - Primary metric and why
   - Secondary metrics
   - Hallucination checks
   - Regression comparison

3. What are the results?
   - Primary metric: {score} (pass/fail: {result})
   - Compared to baseline: {delta}
   - Failure analysis: top 3 failure modes observed
   - Edge case performance: {summary}

4. What are the limitations?
   - What the eval set DOES NOT cover
   - Known failure modes that are out-of-scope for this version
   - Caveats on benchmark interpretation

5. Who reviewed this?
   - Evaluation lead
   - Domain expert reviewer
   - Model risk owner (for enterprise deployment)
```

**The limitations section is not optional.** A report without limitations appears dishonest to scrutinizing reviewers. State what you didn't test and why.

---

## Anti-Patterns in Evaluation

**Evaluating on training data** (the most dangerous mistake): The evaluation set must be fully isolated from training data. If even a few training examples contaminate your eval set, your reported metrics are inflated and untrustworthy.

**Building the eval set after training**: Creates the risk of unconscious selection bias — you pick examples the trained model handles well. Create the eval set before training.

**Using only automatic metrics**: Automatic metrics miss many real failure modes. Human review of a sample is non-optional for production deployments.

**Optimizing for the benchmark, not the task**: If you tune hyperparameters based on benchmark scores, you're effectively using the benchmark as a validation set. Reserve a final test set that's only touched once.

**Over-claiming improvement**: "Model improved by 12%" is meaningless without context: 12% on what? Compared to what? Using which metric? On which input distribution? Be specific or be silent.

---

## Teach It Back

1. Your model shows 95% accuracy on the evaluation set, but in the first week of production you get reports of failures. What are three possible explanations, and what evaluation changes would catch them?

2. A colleague says "our eval loss went down during training, so the model improved." Why is this incomplete, and what would you add?

3. Define the five enterprise evaluation gates. For which gate should the criteria be defined before training begins?

4. You need to evaluate a summarization model for hallucinations. Describe two complementary approaches, including their limitations.

---

## Knowledge Check

**Q1**: You're evaluating a compliance document extraction model. You report 94% field accuracy and 78% exact match. A stakeholder says "94% is good enough." What's the right response?

**A**: Depends on the use case. 78% exact match means 22% of extractions have at least one field error. For compliance documents, even one wrong field can be material. The right questions: What fields have the errors? How severe are the errors (single-field vs. multi-field)? What's the downstream consequence of an extraction error? The stakeholder's claim isn't obviously wrong, but it requires understanding the error distribution, not just the headline number.

---

**Q2**: After fine-tuning, your model's MT-Bench score dropped from 7.2 to 6.5. Your task-specific evaluation shows 20% improvement. Should you deploy this model?

**A**: Not without investigation. A 0.7-point MT-Bench drop indicates meaningful general capability degradation (the alignment tax). Before deploying: (1) Check which MT-Bench categories degraded — is it your task domain (acceptable) or general reasoning (concerning)? (2) Run human evaluation on both models for the production task to validate the 20% improvement is real. (3) Consider retraining with lower learning rate or fewer epochs to preserve general capability while keeping task improvement. (4) Check if a smaller improvement on the task (say 15%) is achievable without the regression.

---

*Continue to [06 — Enterprise Architecture Patterns](./06-enterprise-patterns.md)*

*Last reviewed: May 2026.*
