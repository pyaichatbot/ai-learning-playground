# 09 — End-to-End Lab: Financial Entity Extraction

> **Level**: Intermediate–SME  
> **Time**: ~3 hours (plus training time)  
> **Goal**: Build a complete fine-tuning pipeline from raw data to a served model. Every concept from the curriculum in one working project.

---

## Why This Lab Exists

The other documents teach concepts. This document makes them real.

You will build a model that extracts structured entity data from financial SWIFT payment messages into a strict JSON schema. This task is:
- Realistic (actual financial operations use cases)
- Clearly verifiable (JSON output is right or wrong)
- Representative (format + domain + structured output — hits three fine-tuning motivators simultaneously)
- Right-sized (manageable data, fits on a single GPU)

Every decision in this lab maps to a documented pattern in the curriculum. When you make a decision, you will know why — not just what command to run.

---

## The Task Definition (Write This First)

**Input**: A SWIFT MT103 payment message or financial transaction record  
**Output**: Structured JSON with exactly 7 fields:

```json
{
  "sender": "string",
  "receiver": "string", 
  "amount": number,
  "currency": "string (3-letter ISO 4217)",
  "value_date": "string (YYYY-MM-DD)",
  "reference": "string",
  "purpose": "string"
}
```

**Why this format**: Downstream systems consume this JSON. Field naming is locked (changing it breaks integrations). Numeric amount (not string). ISO dates (not "March 15"). No missing fields allowed.

**Why fine-tuning (not prompting)**:
- Format must be exactly right 99%+ of the time across high volume
- Field naming is non-standard (our schema, not common NLP convention)
- Latency budget: 100ms first token, no long system prompt overhead
- Volume: 500K requests/day — eliminating 2K-token system prompts saves ~$30K/month in tokens

This is the decision analysis from Document 00, applied.

---

## Environment Setup

```bash
# Python 3.11+
pip install torch transformers peft trl bitsandbytes accelerate
pip install sentence-transformers datasets jsonschema
pip install presidio-analyzer presidio-anonymizer
# Optional but recommended
pip install unsloth  # 2x faster training on supported hardware
```

**Hardware target**: Single A100 40GB or A100 80GB. The lab also works on a 16GB GPU (reduce batch size and sequence length).

---

## Phase 1: Data Engineering

### Step 1.1: Write the Dataset Specification

Before generating a single example, write the spec:

```python
DATASET_SPEC = {
    "task": "Extract 7 structured fields from financial payment messages",
    "input_format": "Structured text in MT103-like format, optionally with noise (extra fields, mixed casing, legacy formats)",
    "output_format": "JSON with exactly 7 fields per schema above",
    "quality_criteria": {
        "correct": "All 7 fields present, correct types, correct values extracted from input",
        "acceptable": "6/7 fields correct; amount/dates within format tolerance",
        "wrong": "Any field fabricated (not in input), any field missing, wrong JSON"
    },
    "scope_boundaries": {
        "in_scope": "MT103, MT202, ACH-style records, SWIFT FIN messages",
        "out_of_scope": "Securities settlement, FX trade confirmations — model should return empty JSON with error key"
    },
    "sources": [
        {"name": "internal_transaction_archive_2023", "approved_by": "legal@company.com"},
        {"name": "synthetic_generated", "review_required": True}
    ]
}
```

This document exists before collection. Everyone who touches the data has read it.

### Step 1.2: Generate Synthetic Training Data

For this lab, we use synthetic generation because real SWIFT messages contain customer PII. The generation approach is: use a template + variation + human audit.

```python
import json
import random
import hashlib
from datetime import datetime, timedelta

# Seed data: real patterns, no real customer data
COMPANIES = [
    "Acme Corp", "Global Logistics Ltd", "TechPay Solutions", 
    "MetroBank International", "Nordic Trade AS", "Pacific Rim Exports",
    "Consolidated Finance Group", "Apex Ventures LLC"
]

CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "SGD"]

PURPOSES = [
    "Invoice payment", "Loan repayment", "Trade settlement", 
    "Service fee", "Contract milestone payment", "Interbank transfer",
    "Dividend payment", "Subscription renewal"
]

def generate_date(base_date=None):
    if base_date is None:
        base_date = datetime(2024, 1, 1)
    offset = random.randint(0, 365)
    d = base_date + timedelta(days=offset)
    return d.strftime("%Y-%m-%d")

def generate_amount():
    # Financial amounts: realistic ranges, some edge cases
    magnitude = random.choice([1, 2, 3, 4, 5])
    base = random.randint(1, 999)
    amount = base * (10 ** magnitude)
    # Sometimes add cents
    if random.random() < 0.3:
        amount = round(amount + random.randint(1, 99) / 100, 2)
    return amount

def generate_reference():
    prefix = random.choice(["TXN", "INV", "PMT", "REF", "XFR"])
    return f"{prefix}-{random.randint(10000, 99999)}"

def generate_example() -> dict:
    sender = random.choice(COMPANIES)
    receiver = random.choice([c for c in COMPANIES if c != sender])
    amount = generate_amount()
    currency = random.choice(CURRENCIES)
    value_date = generate_date()
    reference = generate_reference()
    purpose = random.choice(PURPOSES)
    
    # Ground truth (what the model should output)
    ground_truth = {
        "sender": sender,
        "receiver": receiver,
        "amount": amount,
        "currency": currency,
        "value_date": value_date,
        "reference": reference,
        "purpose": purpose
    }
    
    # Input format: varies to create diversity
    format_type = random.choice(["swift_style", "csv_style", "prose_style", "structured_style"])
    
    if format_type == "swift_style":
        input_text = (
            f":32A:{value_date.replace('-', '')}{currency}{str(amount).replace('.', ',')}\n"
            f":50K:{sender}\n"
            f":59:{receiver}\n"
            f":70:{purpose}\n"
            f":21:{reference}"
        )
    elif format_type == "csv_style":
        input_text = f"FROM={sender}|TO={receiver}|AMT={currency} {amount}|DATE={value_date}|REF={reference}|DESC={purpose}"
    elif format_type == "prose_style":
        input_text = (
            f"Payment instruction: {sender} is sending {currency} {amount:,.2f} to {receiver} "
            f"with value date {value_date}. Reference: {reference}. Purpose: {purpose}."
        )
    else:  # structured_style
        input_text = (
            f"SENDER: {sender}\nRECEIVER: {receiver}\nAMOUNT: {amount} {currency}\n"
            f"VALUE DATE: {value_date}\nREFERENCE: {reference}\nPURPOSE: {purpose}"
        )
    
    return {
        "input": input_text,
        "output": json.dumps(ground_truth),
        "ground_truth": ground_truth,
        "format_type": format_type
    }

# Generate examples
random.seed(42)
examples = [generate_example() for _ in range(2500)]
print(f"Generated {len(examples)} examples")
print(f"Format distribution: {dict((k, sum(1 for e in examples if e['format_type'] == k)) for k in ['swift_style', 'csv_style', 'prose_style', 'structured_style'])}")
```

### Step 1.3: Quality Audit (Human Review)

Before any training, audit 100 examples manually. This is not optional.

```python
import random

def audit_sample(examples, n=100):
    sample = random.sample(examples, n)
    
    issues = {
        "output_not_valid_json": [],
        "missing_fields": [],
        "value_not_in_input": [],
        "format_issue": []
    }
    
    for i, ex in enumerate(sample):
        # Check JSON validity
        try:
            parsed = json.loads(ex["output"])
        except json.JSONDecodeError:
            issues["output_not_valid_json"].append(i)
            continue
        
        # Check all 7 fields present
        required = ["sender", "receiver", "amount", "currency", "value_date", "reference", "purpose"]
        missing = [f for f in required if f not in parsed]
        if missing:
            issues["missing_fields"].append((i, missing))
        
        # Check values are grounded in input
        for field in ["sender", "receiver"]:
            if field in parsed and parsed[field] not in ex["input"]:
                issues["value_not_in_input"].append((i, field, parsed[field]))
    
    print(f"Audit Results ({n} samples):")
    print(f"  Invalid JSON: {len(issues['output_not_valid_json'])}")
    print(f"  Missing fields: {len(issues['missing_fields'])}")
    print(f"  Values not in input: {len(issues['value_not_in_input'])}")
    
    total_issues = sum(len(v) for v in issues.values())
    print(f"  Total issues: {total_issues}/{n} ({100*total_issues/n:.1f}%)")
    
    return issues

audit_results = audit_sample(examples, n=100)
```

**Expectation**: For clean synthetic data from a controlled template, issues should be <2%. If higher, find the bug in generation before proceeding.

### Step 1.4: Deduplication

```python
import hashlib

def deduplicate_exact(examples):
    seen = set()
    unique = []
    for ex in examples:
        h = hashlib.sha256(ex["input"].encode()).hexdigest()
        if h not in seen:
            seen.add(h)
            unique.append(ex)
    print(f"Deduplication: {len(examples)} → {len(unique)} ({len(examples) - len(unique)} removed)")
    return unique

examples = deduplicate_exact(examples)
```

### Step 1.5: Train/Eval Split (Eval First)

```python
import random

random.seed(42)
random.shuffle(examples)

# Create eval FIRST — stratified by format type
eval_examples = []
train_examples = []

# Hold out 25 examples per format type for eval = 100 total eval
format_counts = {}
for ex in examples:
    ft = ex["format_type"]
    if ft not in format_counts:
        format_counts[ft] = {"eval": 0, "train": 0}

for ex in examples:
    ft = ex["format_type"]
    if format_counts[ft]["eval"] < 25:
        eval_examples.append(ex)
        format_counts[ft]["eval"] += 1
    else:
        train_examples.append(ex)
        format_counts[ft]["train"] += 1

print(f"Train: {len(train_examples)} | Eval: {len(eval_examples)}")

# Hash and lock the eval set
import json
eval_hash = hashlib.sha256(json.dumps([e["input"] for e in eval_examples], sort_keys=True).encode()).hexdigest()
print(f"Eval set hash: {eval_hash[:16]}...")
# Save this hash. Never modify eval set.
```

### Step 1.6: Format for Training (ChatML)

```python
from datasets import Dataset

SYSTEM_PROMPT = (
    "You are a financial transaction parser. Extract structured data from payment messages. "
    "Always respond with valid JSON containing exactly these fields: "
    "sender, receiver, amount (numeric), currency (3-letter ISO), value_date (YYYY-MM-DD), reference, purpose. "
    "Do not add fields not in the schema. Do not invent values not present in the input."
)

def format_as_chat(example):
    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Extract entities from this payment record:\n\n{example['input']}"},
            {"role": "assistant", "content": example["output"]}
        ]
    }

train_dataset = Dataset.from_list([format_as_chat(e) for e in train_examples])
eval_dataset = Dataset.from_list([format_as_chat(e) for e in eval_examples])

print(f"Train dataset: {len(train_dataset)} examples")
print(f"Eval dataset: {len(eval_dataset)} examples")
```

---

## Phase 2: Base Model Selection

Following Document 08's capability verification protocol:

**Zero-shot test** (run this before committing to any model):

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

MODEL_ID = "meta-llama/Llama-3.1-8B-Instruct"

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID, 
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

def test_zero_shot(input_text: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Extract entities from this payment record:\n\n{input_text}"},
    ]
    formatted = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(formatted, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=256, temperature=0.1, do_sample=False)
    return tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)

# Test on 20 examples from eval set
correct = 0
for ex in eval_examples[:20]:
    response = test_zero_shot(ex["input"])
    try:
        parsed = json.loads(response)
        if parsed == ex["ground_truth"]:
            correct += 1
    except:
        pass

print(f"Zero-shot exact match: {correct}/20 = {100*correct/20:.0f}%")
```

**Expected**: 30–60% zero-shot on Llama 3.1 8B Instruct for this task. The model understands the task but produces format variations (different field names, string amounts, varied date formats). This is exactly the fine-tuning sweet spot — model understands, needs format consistency.

---

## Phase 3: Training

### Step 3.1: Configure QLoRA + DoRA

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TrainingArguments
from peft import LoraConfig, get_peft_model
from trl import SFTConfig, SFTTrainer
import torch

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, padding_side="right")
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

# Load model in 4-bit
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
    attn_implementation="flash_attention_2",  # Requires flash-attn
)
model.config.use_cache = False  # Must disable for gradient checkpointing

# LoRA config — DoRA for better learning, RSLoRA not needed at r=16
lora_config = LoraConfig(
    r=16,
    lora_alpha=16,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    use_dora=True,  # DoRA: better learning with same parameters
)
```

### Step 3.2: Training Arguments

```python
sft_config = SFTConfig(
    # Core training
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,       # Effective batch = 16
    per_device_eval_batch_size=4,
    
    # Learning rate
    learning_rate=2e-4,                  # Standard for QLoRA SFT
    lr_scheduler_type="cosine",
    warmup_ratio=0.03,                   # 3% warmup steps
    max_grad_norm=1.0,                   # Gradient clipping — prevents spikes
    
    # Memory
    bf16=True,
    fp16=False,
    gradient_checkpointing=True,         # Trade compute for memory
    
    # Sequence
    max_seq_length=512,                  # Our inputs are short; adjust if needed
    packing=True,                        # Pack multiple short examples per sequence
    
    # Evaluation and checkpointing
    eval_strategy="steps",
    eval_steps=100,
    save_strategy="steps",
    save_steps=100,
    save_total_limit=3,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    
    # Logging
    logging_steps=10,
    report_to="none",                    # Change to "wandb" for experiment tracking
    
    # Output
    output_dir="./checkpoints/financial-extraction",
)
```

### Step 3.3: Trainer Setup and Run

```python
trainer = SFTTrainer(
    model=model,
    args=sft_config,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    peft_config=lora_config,
    processing_class=tokenizer,
)

# Print memory usage before training
import torch
print(f"GPU memory allocated: {torch.cuda.memory_allocated() / 1e9:.2f} GB")
print(f"Trainable params: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

# Train
trainer.train()

# Save adapter
trainer.save_model("./adapters/financial-extraction-v1")
tokenizer.save_pretrained("./adapters/financial-extraction-v1")
```

**What to watch during training**:
- `eval_loss` should decrease for at least the first 2 epochs
- `train_loss` - `eval_loss` gap should be small (< 0.2) — larger gap means overfitting
- GPU memory usage should be stable (not growing) — growing memory = memory leak

**Expected training time**:
- Single A100 80GB: ~25–35 minutes for 3 epochs on 2,400 examples
- Single A100 40GB: ~35–45 minutes
- Single 16GB GPU (reduced batch): ~60–90 minutes

---

## Phase 4: Evaluation

### Step 4.1: Task-Specific Evaluation Suite

```python
from jsonschema import validate, ValidationError
import json

OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["sender", "receiver", "amount", "currency", "value_date", "reference", "purpose"],
    "properties": {
        "sender": {"type": "string"},
        "receiver": {"type": "string"},
        "amount": {"type": "number"},
        "currency": {"type": "string", "pattern": "^[A-Z]{3}$"},
        "value_date": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
        "reference": {"type": "string"},
        "purpose": {"type": "string"}
    },
    "additionalProperties": False   # Reject hallucinated extra fields
}

def evaluate_extraction(model_output: str, ground_truth: dict) -> dict:
    result = {
        "valid_json": False,
        "schema_valid": False,
        "field_count_correct": False,
        "field_accuracy": 0.0,
        "exact_match": False,
        "hallucinated_fields": [],
    }
    
    try:
        parsed = json.loads(model_output.strip())
        result["valid_json"] = True
    except json.JSONDecodeError:
        return result
    
    try:
        validate(parsed, OUTPUT_SCHEMA)
        result["schema_valid"] = True
    except ValidationError as e:
        pass
    
    # Extra field detection (hallucination)
    allowed = set(OUTPUT_SCHEMA["required"])
    result["hallucinated_fields"] = [k for k in parsed if k not in allowed]
    
    # Field-level accuracy
    matching = sum(
        1 for k in ground_truth
        if str(parsed.get(k)) == str(ground_truth[k])
    )
    result["field_accuracy"] = matching / len(ground_truth)
    result["exact_match"] = (parsed == ground_truth)
    result["field_count_correct"] = len(parsed) == len(ground_truth)
    
    return result
```

### Step 4.2: Run Full Evaluation

```python
from peft import PeftModel

# Load fine-tuned model for evaluation
base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
)
ft_model = PeftModel.from_pretrained(base_model, "./adapters/financial-extraction-v1")

def generate_prediction(model, tokenizer, input_text: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Extract entities from this payment record:\n\n{input_text}"},
    ]
    formatted = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(formatted, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=0.0,     # Greedy for evaluation
            do_sample=False,
        )
    return tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)

# Evaluate on full eval set
results = []
for ex in eval_examples:
    prediction = generate_prediction(ft_model, tokenizer, ex["input"])
    eval_result = evaluate_extraction(prediction, ex["ground_truth"])
    eval_result["format_type"] = ex["format_type"]
    results.append(eval_result)

# Aggregate metrics
print("=== Evaluation Results ===")
print(f"Valid JSON:       {sum(r['valid_json'] for r in results) / len(results):.1%}")
print(f"Schema Valid:     {sum(r['schema_valid'] for r in results) / len(results):.1%}")
print(f"Field Accuracy:   {sum(r['field_accuracy'] for r in results) / len(results):.1%}")
print(f"Exact Match:      {sum(r['exact_match'] for r in results) / len(results):.1%}")
print(f"Hallucination Rate: {sum(len(r['hallucinated_fields'])>0 for r in results) / len(results):.1%}")

# Break down by format type
for fmt in ["swift_style", "csv_style", "prose_style", "structured_style"]:
    fmt_results = [r for r in results if r["format_type"] == fmt]
    print(f"\n{fmt}: {sum(r['exact_match'] for r in fmt_results)}/{len(fmt_results)} exact match")
```

**Expected results after fine-tuning**:
- Valid JSON: 98–99%
- Schema Valid: 96–98%
- Field Accuracy: 94–97%
- Exact Match: 85–92%
- Hallucination Rate: <2%

If you're significantly below these: check training loss curve, check if eval set is contaminated, check prompt template consistency.

### Step 4.3: Compare Against Baseline

```python
# Baseline: same model, zero-shot (run before fine-tuning and save results)
# Or run now by swapping base_model instead of ft_model above

print("\n=== Improvement vs Zero-Shot ===")
print(f"Exact Match: baseline → fine-tuned")
print(f"Format compliance: baseline → fine-tuned")

# This is the number you show to stakeholders:
# X% improvement in exact match, Y% reduction in format errors.
# Without this comparison, "92% exact match" is meaningless.
```

### Step 4.4: Edge Case Evaluation

```python
# Test cases the model may not have seen
edge_cases = [
    {
        "description": "Missing purpose field",
        "input": "SENDER: Acme Corp | RECEIVER: TechPay | AMOUNT: USD 50000 | DATE: 2024-06-15 | REF: TXN-12345",
        "expected": "should return purpose: null or reasonable inference"
    },
    {
        "description": "Amount with commas (European format)",
        "input": "FROM: Acme Corp\nTO: Nordic AS\nAMT: EUR 1.250.000,50\nDATE: 2024-03-01\nREF: PMT-88888\nDESC: Service payment",
        "expected": "amount: 1250000.5"
    },
    {
        "description": "Out-of-scope input (securities settlement)",
        "input": "ISIN: US0378331005 | QUANTITY: 1000 SHARES | SETTLEMENT: 2024-06-18 | COUNTERPARTY: Morgan Stanley",
        "expected": "model should indicate out-of-scope or produce minimal output"
    },
]

print("\n=== Edge Case Evaluation ===")
for ec in edge_cases:
    prediction = generate_prediction(ft_model, tokenizer, ec["input"])
    print(f"\nCase: {ec['description']}")
    print(f"Expected: {ec['expected']}")
    print(f"Got: {prediction[:200]}")
```

---

## Phase 5: Deploying with vLLM

### Step 5.1: Merge Adapter into Base Model

For production serving, merge the adapter:

```python
# After training is complete and evaluation passes
from peft import PeftModel

base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.bfloat16,
    device_map="auto",
)
peft_model = PeftModel.from_pretrained(base_model, "./adapters/financial-extraction-v1")

# Merge adapter into base model weights
merged_model = peft_model.merge_and_unload()

# Save merged model
merged_model.save_pretrained("./models/financial-extraction-v1-merged")
tokenizer.save_pretrained("./models/financial-extraction-v1-merged")
print("Merged model saved.")
```

### Step 5.2: Serve with vLLM

```bash
# Install vLLM
pip install vllm

# Serve the merged model (OpenAI-compatible API)
python -m vllm.entrypoints.openai.api_server \
    --model ./models/financial-extraction-v1-merged \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 1024 \
    --gpu-memory-utilization 0.85 \
    --dtype bfloat16
```

### Step 5.3: Test the Served Endpoint

```python
import requests

def call_model_api(input_text: str) -> str:
    response = requests.post(
        "http://localhost:8000/v1/chat/completions",
        json={
            "model": "financial-extraction-v1-merged",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract entities from this payment record:\n\n{input_text}"},
            ],
            "max_tokens": 256,
            "temperature": 0.0,
        }
    )
    return response.json()["choices"][0]["message"]["content"]

# Quick smoke test
test_input = "SENDER: Test Corp | RECEIVER: Alpha Ltd | AMOUNT: USD 75000 | DATE: 2024-08-01 | REF: TST-99999 | DESC: Test payment"
result = call_model_api(test_input)
print(f"API response: {result}")
print(f"Valid JSON: {is_valid_json(result)}")
```

### Step 5.4: Alternative — Serve LoRA Adapter Separately (Multi-Tenant Pattern)

If you have multiple tenant adapters and don't want to maintain separate merged models:

```bash
python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-3.1-8B-Instruct \
    --enable-lora \
    --max-lora-rank 16 \
    --lora-modules \
        financial-extraction-v1=/path/to/adapters/financial-extraction-v1 \
        legal-extraction-v1=/path/to/adapters/legal-extraction-v1 \
    --port 8000
```

Route by specifying `"model": "financial-extraction-v1"` in the API call.

---

## Phase 6: Production Monitoring

### Minimal monitoring you must have on day 1:

```python
import time
import json
from datetime import datetime

class ModelMonitor:
    def __init__(self):
        self.metrics = {
            "requests": 0,
            "valid_json": 0,
            "schema_valid": 0,
            "latency_p50": [],
            "latency_p95": [],
        }
    
    def record_request(self, input_text: str, output: str, latency_ms: float):
        self.metrics["requests"] += 1
        self.metrics["latency_p50"].append(latency_ms)
        
        # Check format compliance (cheap, run on every request)
        try:
            parsed = json.loads(output)
            self.metrics["valid_json"] += 1
            validate(parsed, OUTPUT_SCHEMA)
            self.metrics["schema_valid"] += 1
        except:
            # Log the failure for investigation
            print(f"[ALERT] Format failure at {datetime.utcnow().isoformat()}")
            print(f"Input: {input_text[:100]}...")
            print(f"Output: {output[:200]}...")
    
    def report(self):
        n = self.metrics["requests"]
        if n == 0:
            return
        
        latencies = sorted(self.metrics["latency_p50"])
        p50_idx = int(0.5 * len(latencies))
        p95_idx = int(0.95 * len(latencies))
        
        print(f"Requests: {n}")
        print(f"Valid JSON rate: {self.metrics['valid_json']/n:.1%}")
        print(f"Schema valid rate: {self.metrics['schema_valid']/n:.1%}")
        print(f"Latency p50: {latencies[p50_idx]:.0f}ms")
        print(f"Latency p95: {latencies[p95_idx]:.0f}ms")

monitor = ModelMonitor()
```

**Alert thresholds** (from Document 06):
- Valid JSON < 98% → investigate immediately
- Schema valid < 96% → page on-call
- p95 latency > 500ms → check GPU utilization

---

## Connecting the Dots: Every Decision Traced

| Decision | Document | Reasoning Applied |
|----------|----------|-------------------|
| Fine-tune (not prompt/RAG) | 00 | Format consistency problem + latency + cost |
| Dataset spec written first | 01 | Prevents off-task data collection |
| 2,500 examples, 100 eval | 01 | Format task = low data requirement; eval created before train |
| Synthetic data audited | 01 | Verified 100 examples before use |
| Llama 3.1 8B Instruct | 08 | Zero-shot test showed task understanding; instruction-tuned correct |
| QLoRA (4-bit) + DoRA | 02 | Memory efficiency; DoRA better learning than plain LoRA |
| r=16, alpha=16, dropout=0.05 | 02 | Standard starting config; task is format-focused (low rank sufficient) |
| lr=2e-4, cosine, 3% warmup | 02 | Standard QLoRA SFT starting point |
| max_grad_norm=1.0 | 04 | Prevents gradient spikes common in early LoRA training |
| packing=True | 04 | Short examples → low GPU utilization without packing |
| eval every 100 steps | 05 | Monitor for overfitting in real time |
| Four-tier evaluation (JSON → schema → field → exact) | 05 | Complete picture, not just headline number |
| Edge case evaluation included | 07 | Anti-pattern 13: evaluating only easy cases |
| Baseline comparison documented | 07 | Anti-pattern 9: no baseline |
| vLLM for serving | 06 | PagedAttention + continuous batching for production throughput |
| Format compliance monitoring | 06 | First production metric to track |

---

## What Comes Next: The Iteration Loop

This lab gets you to a working v1. Production reality requires iteration:

**Iteration triggers** (from Document 07, Anti-Pattern 14):
1. Format compliance rate drops below threshold
2. New input format appears in production (e.g., a new upstream system)
3. Edge cases discovered through monitoring
4. Business requirement adds an 8th field to the schema

**Data flywheel**: Collect production failures → label correct outputs → add to training set → retrain. Every failure is a training example for v2.

**Retraining discipline**: Don't retrain because something "could be better." Retrain when a specific metric crosses a specific threshold. Define those thresholds now, in writing, before they're needed.

---

## Teach It Back

1. You've run this lab and got 85% exact match. A stakeholder says it needs to be 95%. What are the three levers you'd pull, in priority order?

2. After two weeks in production, format compliance drops from 99.2% to 92%. No model changes were made. Walk through your investigation process.

3. You need to add a new field (`correspondent_bank`) to the JSON schema. What is the complete sequence of steps to deploy this change?

4. Explain why we created the evaluation set before training, and what would have gone wrong if we'd done a random 80/20 split on the generated data.

---

*Return to [README — Curriculum Map](./README.md)*

*Last reviewed: May 2026. Library APIs (TRL, PEFT, vLLM) evolve frequently; verify with current documentation before running.*
