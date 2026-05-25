# 01 — Data Engineering for Fine-Tuning

> **Level**: Beginner–Intermediate  
> **Time**: ~90 minutes  
> **Goal**: Design a data pipeline. Audit a dataset for quality. Understand why data is the #1 cause of fine-tuning failures.

---

## The One Mental Model You Need First

```
Model quality is bounded by data quality.
No technique, no architecture, no hyperparameter search compensates for bad data.
```

This is not a platitude. It's a predictable failure mode that kills fine-tuning projects regularly. Teams spend weeks on LoRA configurations and learning rate schedules while the actual problem is duplicated examples, format inconsistencies, or mislabeled outputs.

The order of this curriculum is not accidental. Data engineering comes before PEFT techniques because the best PEFT configuration on bad data produces a bad model efficiently.

---

## What Makes Fine-Tuning Data Different from Pre-Training Data

Pre-training data is about volume and diversity: expose the model to as much of human language and knowledge as possible. Quality matters, but scale compensates for noise.

Fine-tuning data is the opposite: **volume is less important than precision**. You're not trying to teach the model everything. You're trying to reshape a specific behavior. That means:

- 500 high-quality examples often outperform 5,000 noisy ones
- Every example should represent exactly the behavior you want
- Format inconsistencies propagate into model output inconsistencies
- A single category of bad examples can corrupt an entire capability

The mental model: pre-training data is a river, broad and deep. Fine-tuning data is a surgical instrument — small, precise, and the exact shape of the incision you're making.

---

## The Dataset Specification: Start Here, Not After

Before collecting a single example, write the dataset specification. This is a short document that answers:

```
1. Task definition
   What exactly does the model need to do?
   What counts as a correct output? (Be specific enough to label.)

2. Input format
   What does a valid input look like? What's the range of inputs?
   Edge cases? Missing fields? Multiple formats?

3. Output format
   Exact format. JSON schema? Plain text? Structured extraction?
   What's the maximum output length? Minimum?

4. Quality criteria
   What makes an output GOOD vs ACCEPTABLE vs WRONG?
   Write 3 examples of each before collection begins.

5. Scope boundaries
   What should the model NOT do?
   Out-of-scope inputs: how should the model handle them?

6. Source eligibility
   Where is each example sourced from?
   Who has reviewed and approved each data source?
   PII/PCI status of each source?
```

Teams that skip this step discover at evaluation time that half their collected data is off-task, in the wrong format, or legally ineligible. Write the spec first.

---

## Dataset Size: Practical Guidelines

Dataset size requirements vary by task. These are practical ranges based on current evidence (2025–2026), not magic numbers:

| Task Type | Minimum Viable | Production Target | Notes |
|-----------|---------------|-------------------|-------|
| Format/structure learning | 200–500 | 1,000–3,000 | Models learn format fast |
| Domain classification | 500–1,000 | 3,000–5,000 | More classes = more data |
| Instruction following | 1,000–2,000 | 5,000–10,000 | Diversity matters more than volume |
| Complex reasoning | 5,000+ | 20,000+ | Each example should show reasoning trace |
| Domain knowledge | 10,000+ | 50,000–500,000 | Use DAPT, not SFT, for knowledge injection |
| Alignment (DPO/ORPO) | 1,000 (pairs) | 5,000–20,000 (pairs) | Quality of preference signal matters most |

**The diversity trap**: Having 10,000 examples that are all variations of the same input type trains the model to handle that type well and potentially overfits to it. 1,000 examples covering 10 different input patterns often generalizes better.

**The scaling trap**: Bigger datasets are not strictly better. A 50,000-example dataset that's 30% duplicates and 15% mislabeled is worse than a 5,000-example dataset that's clean.

---

## Data Format: The Three Standard Shapes

### 1. Conversational / Chat Format (ChatML)

Used for: instruction-tuned models, multi-turn dialogue, Q&A systems.

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a financial compliance analyst. Extract structured data from transaction records. Always respond in valid JSON."
    },
    {
      "role": "user",
      "content": "Extract the key entities from this transaction: SENDER: Acme Corp | RECEIVER: FinTech Ltd | AMOUNT: USD 150,000 | DATE: 2024-03-15 | REF: TXN-98765"
    },
    {
      "role": "assistant",
      "content": "{\"sender\": \"Acme Corp\", \"receiver\": \"FinTech Ltd\", \"amount\": 150000, \"currency\": \"USD\", \"date\": \"2024-03-15\", \"reference\": \"TXN-98765\"}"
    }
  ]
}
```

**Important**: System prompts are part of your training data. If you want the model to internalize a persona or set of constraints, include it consistently in every training example. Inconsistent system prompts produce inconsistent model behavior.

---

### 2. Completion / Prompt-Response Format

Used for: task-specific models, legacy pipelines, non-conversational tasks.

```json
{
  "prompt": "Classify the following customer complaint by severity (low/medium/high/critical) and department (billing/technical/fraud/other).\n\nComplaint: I've been double charged for three consecutive months and my account is now overdrawn. I've called three times.\n\nClassification:",
  "completion": "severity: high | department: billing"
}
```

---

### 3. Instruction-Input-Output Format (Alpaca-style)

Used for: instruction-following fine-tuning when there's no multi-turn structure.

```json
{
  "instruction": "Identify and redact all Personally Identifiable Information (PII) from the following document excerpt. Replace each PII instance with [REDACTED-TYPE].",
  "input": "John Smith (DOB: 03/15/1982, SSN: 123-45-6789) applied for the loan on behalf of his company.",
  "output": "[REDACTED-NAME] (DOB: [REDACTED-DOB], SSN: [REDACTED-SSN]) applied for the loan on behalf of his company."
}
```

**Which format to use**: Match the format expected by your base model's template. Check the model card. Llama-3 uses ChatML; Mistral uses its own instruction format. Using the wrong template silently degrades performance.

---

## Data Quality: The Five-Dimension Audit

Before any training, audit your dataset on these five dimensions:

### Dimension 1: Correctness

Are the outputs actually correct? This sounds obvious. It is the most frequently violated rule.

**How to check**:
- Random sample 100 examples. Review every output manually.
- For classification: calculate inter-annotator agreement if multiple labelers.
- For generation: have a domain expert review 50 samples blind (without knowing it's training data).

**Common failure mode**: Using model-generated outputs as training data without verification. "Model-generated" ≠ correct. A model that hallucinates in production will also hallucinate in a synthetic dataset — and you'll train the fine-tuned model to hallucinate in the same way.

---

### Dimension 2: Consistency

Do similar inputs produce similarly formatted outputs? Inconsistency teaches the model to be inconsistent.

**How to check**:
- Sort all outputs. Look for format variations.
- Check: are all JSON fields present in every example? Same field names? Same data types?
- Check: are all classification labels from the same label set?
- Check: are there multiple acceptable answers for the same input type? If so, pick one and standardize.

**Common failure mode**: Mixed capitalizations (`"status": "HIGH"` vs `"status": "high"`), inconsistent field presence (`reference` field appears in 70% of examples), trailing commas, escaped vs unescaped characters.

---

### Dimension 3: Diversity

Does your dataset cover the full input distribution you'll see in production?

**How to check**:
- Cluster your inputs (by embedding similarity). Are some clusters heavily overrepresented?
- Check for edge cases: empty inputs, very long inputs, inputs with unusual characters, non-English content, ambiguous cases.
- Compare input diversity to the production input distribution if you have usage data.

**Common failure mode**: Collected training data from the "easy" cases because they were readily available. Model learns to handle easy cases well, fails on the long tail that actually matters.

---

### Dimension 4: Balance

For classification tasks: is your class distribution representative of the actual task distribution?

**How to check**:
- Count examples per class. If production distribution is known, compare.
- If classes are severely imbalanced: oversample the minority class or undersample the majority class.
- Be careful about oversampling rare but high-stakes classes — duplicate examples overfit.

**Common failure mode**: Binary classification dataset is 95% negative / 5% positive. Model learns to predict negative for everything and achieves 95% "accuracy." Worthless for real use.

---

### Dimension 5: Contamination

**Two types of contamination you must prevent**:

**Type 1 — Evaluation contamination**: Examples from your evaluation set appear in training data. Result: inflated training metrics that disappear in production.

**How to prevent**: Create your evaluation set first, before data collection. Hash every evaluation example. Filter training data to remove anything with the same or similar hash.

**Type 2 — Data source contamination**: Training data includes examples that are impermissible — proprietary data, PII, PCI, licensed content, data you don't have rights to use.

**How to prevent**: Data eligibility review before collection, not after. Approved sources list. PII detection pipeline (using tools like Microsoft Presidio, spaCy NER, or commercial solutions). Legal review for any third-party data.

---

## The Data Pipeline Architecture

A production-grade data pipeline has these stages in order:

```
SOURCE COLLECTION
    ↓
ELIGIBILITY FILTER
  (Source approval, PII detection, license check)
    ↓
DEDUPLICATION
  (Exact, fuzzy, semantic)
    ↓
QUALITY FILTER
  (Perplexity, length, format validation)
    ↓
FORMAT STANDARDIZATION
  (Normalize to target template)
    ↓
REVIEW SAMPLE
  (Human review of 100–500 random examples)
    ↓
TRAIN / EVAL SPLIT
  (Eval first, train from remainder)
    ↓
VERSION AND LOCK
  (Hash the dataset, store with metadata)
```

Each stage is a gate. If a stage fails, you stop and fix — you don't proceed with known-bad data.

---

## Deduplication: Why It Matters More Than You Think

Training on duplicate examples has two costs:
1. The model assigns artificially high importance to duplicated patterns (data imbalance)
2. You waste compute training on the same gradient signal repeatedly

Three levels of deduplication, in order of cost and precision:

### Exact deduplication

Hash the input field (SHA-256). Remove any example whose input hash appears more than once.

```python
import hashlib

def deduplicate_exact(examples: list[dict], field: str = "input") -> list[dict]:
    seen = set()
    unique = []
    for ex in examples:
        h = hashlib.sha256(ex[field].encode()).hexdigest()
        if h not in seen:
            seen.add(h)
            unique.append(ex)
    return unique
```

This catches verbatim duplicates. Does not catch near-duplicates.

---

### Fuzzy deduplication (MinHash)

Use MinHash + Locality-Sensitive Hashing (LSH) to find near-duplicates. Two examples with >80% Jaccard similarity on character 5-grams are likely too similar to keep both.

```python
from datasketch import MinHash, MinHashLSH

def build_minhash(text: str, num_perm: int = 128, n: int = 5) -> MinHash:
    """Build MinHash from character n-grams (not word tokens)."""
    m = MinHash(num_perm=num_perm)
    text_lower = text.lower()
    # Character n-grams — more robust than word tokens for catching paraphrases
    for i in range(len(text_lower) - n + 1):
        ngram = text_lower[i:i + n]
        m.update(ngram.encode('utf8'))
    return m

def deduplicate_fuzzy(examples: list[dict], field: str = "input",
                      threshold: float = 0.8) -> list[dict]:
    lsh = MinHashLSH(threshold=threshold, num_perm=128)
    unique_indices = []

    for i, ex in enumerate(examples):
        mh = build_minhash(ex[field])
        result = lsh.query(mh)
        if not result:  # No near-duplicates found
            lsh.insert(str(i), mh)
            unique_indices.append(i)
    
    return [examples[i] for i in unique_indices]

# Usage
unique_examples = deduplicate_fuzzy(examples, field="input", threshold=0.8)
```

**Why character n-grams (not word tokens)**: Word-level MinHash misses paraphrases with different word choices but similar structure. Character 5-grams catch these while still being fast. The `text-dedup` library provides optimized implementations for large datasets.

Libraries that handle this at scale: `datasketch`, `text-dedup`.

---

### Semantic deduplication

Embed all examples and remove examples whose embedding cosine similarity exceeds 0.95 with any other example. More expensive but catches paraphrases that fool MinHash.

Practical approach: use sentence-transformers for cheap embeddings, then deduplicate with `FAISS` or `sklearn cosine_similarity`.

**When to go to semantic dedup**: When you suspect your data generation process (e.g., a prompt template + small variations) produced many semantically identical but lexically distinct examples.

---

## Quality Filtering

Beyond deduplication, filter examples that will degrade model quality:

### Length filtering

```python
def length_filter(example: dict, min_tokens: int = 10, max_tokens: int = 2048) -> bool:
    output_tokens = len(example["output"].split())  # rough token count
    return min_tokens <= output_tokens <= max_tokens
```

Very short outputs often represent incomplete or failed generation. Very long outputs may represent context overflow from the original data pipeline.

### Format validation

If your target output is JSON, validate it:

```python
import json

def validate_json_output(example: dict) -> bool:
    try:
        json.loads(example["output"])
        return True
    except json.JSONDecodeError:
        return False
```

### Perplexity filtering (optional, for large datasets)

Train a lightweight n-gram language model on your domain corpus. Filter out examples whose perplexity is very high (likely gibberish or out-of-domain) or very low (likely duplicates of training corpus).

This technique comes from the RedPajama and Dolma data pipelines and is most useful for datasets >100K examples.

---

## Train / Eval Split: The Most Important Structural Decision

**The rule**: Create your evaluation set BEFORE you start data collection. Not after.

**Why**: If you collect data, then split, your evaluation set is drawn from the same distribution as your training set. That sounds fine — until you realize you've built an evaluation set that tests for "can the model learn this specific data?" rather than "does the model generalize?"

**How to split**:
- Hold out 10–20% as evaluation, 80–90% as training
- For small datasets (<500 examples): hold out 100–150 examples, use the rest for training
- Split by meaningful strata, not randomly: if you have multiple categories, ensure each category is represented in eval
- For temporal data: split by time (train on older, eval on newer). Random split leaks future into past.

**Lock the evaluation set**: Version it. Hash it. Never modify it during development. If you improve your data pipeline and re-collect training data, the evaluation set stays frozen.

---

## Synthetic Data: When and How

Synthetic data (model-generated) is increasingly useful for bootstrapping fine-tuning datasets, with important caveats:

**When synthetic data works well**:
- Format/structure examples where the structure is the signal, not specific knowledge
- Generating variations of verified real examples
- Bootstrapping when real data is scarce, with human review of a sample

**When synthetic data fails**:
- Knowledge-critical tasks (hallucinations in synthetic data become training signal)
- Tasks where the model being used to generate data can't reliably do the task
- Any task where subtle errors are costly (medical, legal, financial)

**The verification rule for synthetic data**: Never use a synthetic example as training data without human verification of a statistically significant sample (minimum 5–10% of the synthetic set, stratified by category).

**Self-instruct and Evol-Instruct**: These are techniques for generating increasingly complex instruction-response pairs from seed examples using a teacher model. They work well for instruction diversity. They require careful quality review.

---

## PII and Sensitive Data Handling

This section is non-negotiable for enterprise deployment.

### Detection pipeline

Use a combination of:
- Rule-based patterns: SSN, credit card numbers, email addresses, phone numbers (high precision, limited recall)
- NER-based detection: spaCy, Microsoft Presidio, AWS Comprehend (higher recall, some false positives)
- LLM-based review for ambiguous cases

```python
# Example: Microsoft Presidio integration
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

def redact_pii(text: str) -> str:
    results = analyzer.analyze(text=text, language='en')
    anonymized = anonymizer.anonymize(text=text, analyzer_results=results)
    return anonymized.text
```

### Redaction vs. removal

Two philosophies:
- **Redact**: Replace PII with a placeholder (`[REDACTED-SSN]`). Preserves training signal while removing sensitive data. Preferred for extraction tasks where the model needs to know what a PII field looks like.
- **Remove**: Delete the example entirely. Appropriate when the PII is entangled with the task signal in a way that can't be separated.

### Documentation

For every data source: document what PII was present, what mitigation was applied, and who approved the mitigation. This documentation is part of the model risk record.

---

## Dataset Versioning

A fine-tuned model is only as reproducible as its training data. Version everything:

```python
# Minimal dataset metadata record
{
  "dataset_version": "v1.3.0",
  "created_at": "2025-11-15T14:32:00Z",
  "created_by": "data-team@company.com",
  "source_documents": [
    {"name": "internal_transactions_2024", "approved_by": "legal@company.com", "approval_date": "2025-10-01"},
    {"name": "compliance_templates_v2", "approved_by": "compliance@company.com", "approval_date": "2025-09-15"}
  ],
  "pii_review": "completed",
  "pii_reviewer": "privacy-team@company.com",
  "num_train": 4823,
  "num_eval": 602,
  "train_hash": "sha256:a3f7...",
  "eval_hash": "sha256:c92d...",
  "deduplication": "exact+fuzzy(threshold=0.85)",
  "format": "ChatML",
  "tasks": ["entity_extraction", "classification"]
}
```

Store this metadata alongside the dataset. The training run should reference the exact dataset version. This allows you to reproduce any training run and understand exactly what data produced any given model.

---

## The Data Quality Scoring Framework

Before proceeding to training, score your dataset on these dimensions (1–5 scale):

| Dimension | Score 1 | Score 3 | Score 5 |
|-----------|---------|---------|---------|
| Correctness | >10% known errors | 2–5% errors | <1% errors |
| Consistency | No enforced format | Partially standardized | 100% format-compliant |
| Diversity | Single pattern | Some variation | Production-representative |
| Balance | Severe imbalance | Moderate imbalance | Proportional to task |
| Contamination | Eval overlap unknown | Some audit done | Verified clean, documented |

**Minimum to proceed**: All dimensions ≥ 3. If any dimension scores 1 or 2, fix it before training.

**Enterprise gate**: All dimensions ≥ 4. Data eligibility documented.

---

## Data Mixture Strategies

When fine-tuning for a specific task, mixing your task data with other data sources is often better than training on task data alone:

### Task data + general capability data

Adding 5–15% general instruction-following data prevents catastrophic forgetting (Anti-Pattern 5 in Document 07):

```python
from datasets import Dataset, concatenate_datasets

# Your task-specific data
task_dataset = Dataset.from_list(task_examples)

# General capability examples (from open datasets like FLAN, Dolly, or your own)
general_examples = load_general_capability_examples(n=int(0.10 * len(task_examples)))
general_dataset = Dataset.from_list(general_examples)

# Combine and shuffle
mixed_dataset = concatenate_datasets([task_dataset, general_dataset]).shuffle(seed=42)
```

### Multi-task mixture

When fine-tuning for multiple related tasks simultaneously:

```python
# Weight datasets to balance task importance
from datasets import interleave_datasets

extraction_dataset = Dataset.from_list(extraction_examples)
classification_dataset = Dataset.from_list(classification_examples)
summarization_dataset = Dataset.from_list(summarization_examples)

# Probabilities control effective sampling rate
mixed = interleave_datasets(
    [extraction_dataset, classification_dataset, summarization_dataset],
    probabilities=[0.6, 0.3, 0.1],  # 60% extraction, 30% classification, 10% summarization
    seed=42,
    stopping_strategy="all_exhausted"  # Run until all datasets exhausted
)
```

**When multi-task helps**: Tasks share reasoning patterns (extraction + classification). One task has very few examples (shared representation helps).

**When single-task is better**: Tasks require conflicting output formats. Task-specific fine-tune quality is more important than generalization.

### The mixture ratio heuristic

```
Primary task data:       80–90%
General capability:       5–15%
Related tasks:            0–10%
Edge case augmentation:   1–5%

Total should be 100%.
More general capability = less catastrophic forgetting but slower task improvement.
More primary task = higher task metric but higher forgetting risk.
```

---

## Data Labeling Tools

For tasks requiring human annotation:

- **Argilla** (formerly Rubrix): Open-source, strong support for NLP annotation, active fine-tuning community. Self-hostable.
- **Label Studio**: General annotation platform, supports text, image, audio. Good for diverse annotation pipelines.
- **Scale AI / Labelbox**: Enterprise annotation with QC workflows; appropriate when large annotator teams or SLA-backed quality guarantees are required.
- **AWS Ground Truth**: Integrated with AWS SageMaker training pipelines; good for teams already on AWS.

**Minimum setup for enterprise annotation**:
1. Annotation guidelines document (what is correct/acceptable/wrong — see Dataset Specification)
2. At least 2 annotators per example for inter-annotator agreement measurement
3. Target κ ≥ 0.7 before production use
4. Annotator training set (50 examples with known answers, measure against these first)

---

## Anti-Patterns Specific to Data Engineering

These appear in real projects, repeatedly:

**"We'll collect data and fix quality issues later."**
Quality issues compound. Format inconsistencies propagate. Incorrect labels become training signal. Fix quality before training, or you're training a model to reproduce the bugs in your data.

**"More data is always better."**
At fine-tuning scale, quality beats quantity. 1,000 clean examples typically outperform 5,000 noisy examples. The cleaning pass is not optional overhead — it is training.

**"We used ChatGPT to generate the dataset."**
Model-generated data is a tool, not a pipeline. Without verification, you're training your model to replicate GPT-4's behavior — including its failure modes — rather than your desired behavior.

**"We'll create the evaluation set from the same data collection run."**
Random split from the same collection creates a training/eval correlation. Held-out examples are not truly held-out if they're drawn from the same source distribution at the same time. Separate collection runs, or temporal splits, are more rigorous.

**"We don't need PII redaction because the data is internal."**
Internal data that contains PII becomes a regulatory liability when embedded in model weights. Several regulator interpretations consider PII in model weights as PII storage — requiring the same protections as structured data storage.

---

## Teach It Back

Before moving to Document 02, answer these:

1. Your team has collected 8,000 examples for a fine-tuning project but hasn't done quality review yet. A colleague says "let's just start training and see how it goes." What do you say?

2. Walk through the five-dimension data quality audit on a hypothetical dataset of customer support ticket classifications.

3. What is evaluation set contamination, and what is the one structural rule that prevents it?

4. Someone proposes generating 50,000 training examples using GPT-4 for a medical diagnosis task. What's wrong with this, and what would you require before allowing it?

---

## Knowledge Check

**Q1**: You have 3,000 training examples. A deduplication run reveals 400 near-duplicate pairs. Your colleague says "it's only 13% duplicates, not a big deal." What's the real impact and should you remove them?

**A**: Remove them. 400 duplicate pairs means certain patterns are seen 2× more often than others during training, creating an implicit class imbalance. The model will assign too much weight to those patterns. The cost of deduplication is low (minutes of compute); the cost of not deduplicating is a biased model.

---

**Q2**: You're building a dataset for a compliance document extraction task. You plan to split 80/20 train/eval using a random shuffle. What's the flaw in this plan?

**A**: Multiple flaws. (1) Eval set should be created BEFORE training data collection, not from the same batch. (2) Random split doesn't guarantee the eval set covers all relevant input patterns — use stratified sampling. (3) If examples come from the same source documents, both sets may contain the same document's information (content overlap), which inflates eval metrics.

---

*Continue to [02 — PEFT Deep Dive: LoRA, QLoRA, DoRA & Beyond](./02-peft-techniques.md)*

*Last reviewed: May 2026. Framework-specific APIs change; verify with current documentation.*
