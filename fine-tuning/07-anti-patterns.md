# 07 — Anti-Patterns and Failure Modes

> **Level**: Expert–SME  
> **Time**: ~90 minutes  
> **Goal**: Recognize the 15 ways fine-tuning projects die. Fix them before they happen.

---

## Why Anti-Patterns First?

Reading the "what to do" curriculum teaches you the theory. Reading the "what goes wrong" catalog teaches you how projects actually fail — and why they fail in the same ways, repeatedly, across organizations.

These anti-patterns are collected from real failure modes, not invented scenarios. They occur because smart teams under delivery pressure make locally reasonable decisions that create systemic problems.

Each anti-pattern follows the same structure:
- **What it looks like**: The observable behavior
- **Why it happens**: The local logic that makes it seem reasonable
- **Why it fails**: The actual consequence
- **The fix**: What to do instead

---

## Anti-Pattern 1: Fine-Tuning When You Should RAG

**What it looks like**: Team builds a fine-tuning pipeline to teach the model their product documentation, internal policies, or knowledge base.

**Why it happens**: "We need the model to know our content" — and fine-tuning sounds like "teaching."

**Why it fails**: Fine-tuning embeds a snapshot of knowledge in model weights. That snapshot immediately starts aging. When policies change, you retrain. When products update, you retrain. Training cycles take days to weeks. Meanwhile the model confidently cites outdated information.

Additionally: the model may confabulate connections between trained facts, hallucinating relationships between policy A and regulation B that don't exist.

**The fix**: Use RAG for knowledge. Reserve fine-tuning for behavior — format, tone, task-specific reasoning, persona. If you do both, fine-tune for behavior and RAG for knowledge. See Document 06.

**Diagnostic question**: "Would the knowledge in our training data need to change in the next 6 months?" If yes, RAG is probably the right tool.

---

## Anti-Pattern 2: Training on Model-Generated Data Without Verification

**What it looks like**: Team generates 50,000 training examples using GPT-4 or another strong model, then trains on the full set without review.

**Why it happens**: Real labeled data is expensive and slow. A language model can generate thousands of examples in hours.

**Why it fails**: Model-generated data inherits the generator's failure modes. If GPT-4 hallucinations at 2%, your synthetic dataset is 2% wrong. Training on wrong examples teaches the model to replicate that error pattern. You're not training on "GPT-4's best behavior" — you're training on GPT-4's statistical behavior including its systematic biases and failure modes.

Specific documented failure mode: a model trained on synthetic medical question-answer data learned to sound confident on incorrect answers, because the generator model produced confident-sounding but wrong answers.

**The fix**: Verify a statistically significant sample of synthetic data (minimum 5–10%, stratified by category) before using it for training. For high-stakes domains, require human expert review on all examples, or don't use synthetic data.

---

## Anti-Pattern 3: Skipping the Pre-Training Capability Check

**What it looks like**: Team selects a model (e.g., a small 1B or 3B parameter model) for cost reasons, then spends weeks fine-tuning, and discovers the model is fundamentally unable to do the task.

**Why it happens**: Smaller models are cheaper and faster. The thinking is "fine-tuning will teach it."

**Why it fails**: Fine-tuning cannot add capability the architecture doesn't have. If the base model can't reason through a multi-step extraction task, fine-tuning on extraction examples won't give it that capability. It will learn to produce outputs that look like extractions without actually understanding the task.

**The fix**: Before committing to a base model, run the target task against it WITHOUT fine-tuning using the best prompts you can write. Test at least 20–30 examples manually. If the model fails fundamentally on the task (not just in format or style, but in capability), no amount of fine-tuning will fix it.

**Rule of thumb**: If GPT-4 struggles with the task, a 7B model fine-tuned on examples won't solve it. If GPT-4 nails it but your 7B model fails with the same prompts, fine-tuning is worth trying.

---

## Anti-Pattern 4: Evaluation Set Created After Training

**What it looks like**: Team collects a large dataset, trains the model, and then splits off an evaluation set to measure performance.

**Why it happens**: It's the natural sequence when you think of training first and evaluation second.

**Why it fails**: The evaluation set is drawn from the same collection run as the training set. It's subject to the same biases, the same time period, the same sources. It measures "can the model reproduce this specific data" rather than "can the model generalize."

More insidiously: if you iterate on training (try different hyperparameters, retrain on more data), you're implicitly using the evaluation set for hyperparameter selection — making it a de facto validation set, not a true test set. When you eventually deploy, the model has been optimized for that "held-out" set.

**The fix**: Create the evaluation set BEFORE data collection. Create it from a different collection run or a different time period if possible. Lock and hash it. Never touch it during development. Use a separate validation set for hyperparameter selection.

---

## Anti-Pattern 5: Ignoring Catastrophic Forgetting

**What it looks like**: After fine-tuning, the model performs well on the target task but has visibly regressed on general capabilities — basic reasoning, instruction following, or non-fine-tuned tasks.

**Why it happens**: Fine-tuning updates model weights toward the new task distribution. If the training distribution is narrow, the model drifts away from its original, broader distribution. This is catastrophic forgetting.

**Why it fails**: In production, models are rarely used exclusively for the fine-tuned task. Users ask adjacent questions. The system handles edge cases. A model that forgot how to do basic arithmetic while becoming a better document extractor is a support problem.

**The fix**:
1. **Preventive**: Mix 5–15% general capability examples into your training data. Examples that exercise reasoning, instruction following, and adjacent tasks.
2. **Hyperparameter reduction**: Lower learning rate (more conservative weight updates) and fewer epochs (less drift).
3. **LoRA instead of full FT**: LoRA's limited parameter count inherently constrains the scope of forgetting.
4. **Monitor**: Run general capability benchmarks (MT-Bench, MMLU) before and after fine-tuning. Set regression gates.

**Detection**: After fine-tuning, ask the model to do things it was clearly good at before. Simple math, common-sense reasoning, language tasks unrelated to your fine-tuning domain. Degradation here is catastrophic forgetting.

---

## Anti-Pattern 6: Format Inconsistency in Training Data

**What it looks like**: The model's output format is inconsistent — sometimes outputs valid JSON, sometimes JSON with trailing commas, sometimes doesn't produce JSON at all.

**Why it happens**: Training data has format inconsistencies that weren't audited. Different annotators, different generations, different templates all produced slightly different output formats.

**Why it fails**: The model learns to be inconsistent. It's not a hyperparameter problem — you've trained inconsistency into the model's weights. No amount of inference-time prompting can fully overcome it because the inconsistency is in the learned distribution.

**The fix**:
1. Run format validation on every training example before training.
2. Define the exact output format specification in writing before data collection.
3. Reject (or fix) any example that doesn't conform.
4. Include the format specification in your system prompt consistently across ALL training examples.

---

## Anti-Pattern 7: Learning Rate Too High

**What it looks like**: Loss decreases rapidly in the first few steps, then the model produces degraded outputs — generic, repetitive, or broken format.

**Why it happens**: Engineers familiar with supervised learning transfer learning rates from image classification (1e-3, 1e-2) to LLM fine-tuning. LLMs are different.

**Why it fails**: With a high learning rate, the adapter weights update aggressively and overwrite the base model's representations. The model "forgets" its general knowledge and the fine-tuned behavior becomes fragile and overfit.

**The fix**: Start with learning_rate=2e-4 for QLoRA SFT. For alignment (DPO/ORPO), start at 5e-6. Use cosine decay with 3% warmup. If loss diverges, halve the learning rate. If convergence is too slow, double it — but start conservative.

**Warning signs of too-high learning rate**: Loss decreases then suddenly spikes, gradient norm explodes after warmup, eval loss goes up while training loss goes down.

---

## Anti-Pattern 8: Overfitting on Small Datasets

**What it looks like**: Training loss continues to decrease, but evaluation loss stops decreasing and starts increasing. Model produces almost verbatim copies of training examples. Performance on unseen inputs is poor.

**Why it happens**: Dataset is too small for the number of training steps, or the model is trained for too many epochs.

**Why it fails**: The model has memorized the training examples rather than learning generalizable patterns. It produces outputs only when inputs closely match the training distribution.

**The fix**:
1. Monitor training vs. eval loss curves. Stop training when eval loss stops improving.
2. Use `load_best_model_at_end=True` to take the best checkpoint.
3. Add or increase `lora_dropout` (0.1 for small datasets).
4. Reduce number of epochs (often 1–2 epochs are sufficient for small fine-tuning sets).
5. Augment training data with paraphrases or similar examples if dataset is too small.

**Rule of thumb**: For datasets < 1,000 examples, 1–2 epochs is usually right. For datasets > 10,000 examples, 3–5 epochs may be appropriate.

---

## Anti-Pattern 9: No Baseline Comparison

**What it looks like**: Team reports "the model achieves 87% accuracy" and considers the project successful.

**Why it happens**: 87% sounds good. The team didn't have a baseline to compare against.

**Why it fails**: 87% on what? Compared to what? If the simple rule-based approach achieves 92%, or if GPT-4 zero-shot achieves 94%, your fine-tuned model at 87% is not an achievement — it's a step backward. Without a baseline, you can't evaluate whether the investment was worth it.

**The fix**: Before any fine-tuning project, establish:
1. **Zero-shot baseline**: The best model you can access with the best prompt you can write.
2. **Rule-based baseline**: What does a simple regex / rule-based system achieve? (Often surprisingly good for structured tasks.)
3. **Human baseline**: What would a human annotator achieve on the same eval set?

Your fine-tuned model should exceed the zero-shot baseline. If it doesn't, the fine-tuning added cost without adding value.

---

## Anti-Pattern 10: Rank Too High for the Task

**What it looks like**: Team uses r=64 or r=128 by default because "more is better."

**Why it happens**: Intuition that higher rank = more expressive = better results.

**Why it fails**: Higher rank means more parameters. More parameters means more risk of overfitting on small datasets, longer training time, and larger adapter files. For most practical fine-tuning tasks (format, style, domain), r=16 is sufficient. Using r=128 on a 2,000-example dataset is almost certainly overfitting.

**The fix**: Start with r=16. Only increase if the model demonstrably fails to learn the task — and "fails to learn" means both eval loss not decreasing AND qualitative failures on examples, not just "could be better." Many teams find that r=4 or r=8 is sufficient for pure format tasks.

**Exception**: Complex reasoning tasks or tasks that require large weight changes across many dimensions may benefit from r=32 or r=64.

---

## Anti-Pattern 11: Deploying Without a Rollback Plan

**What it looks like**: Model is deployed to production. Within a week, a regression is discovered. Team scrambles to figure out how to revert — previous model artifacts may not have been saved, deployment config may not support version rollback.

**Why it happens**: Rollback planning is boring. Projects are under deadline. "We'll figure it out if something goes wrong."

**Why it fails**: When production failures occur, they're urgent. Teams under pressure make hasty decisions. Without a prepared rollback procedure, the fix takes 10× longer than it would have.

**The fix**:
1. Version every model artifact: base model (reference), adapter weights, evaluation results.
2. Test rollback before the first production deployment, not after a failure.
3. Document the rollback procedure: exactly what commands, who executes, what the expected downtime is.
4. Keep the previous version deployed (idle) until the new version passes a stability period.

---

## Anti-Pattern 12: Prompt Template Mismatch

**What it looks like**: The fine-tuned model produces partial outputs, outputs with extra special tokens, or completely garbled responses.

**Why it happens**: Each base model has a specific template for how inputs should be formatted (ChatML, Llama, Mistral, Phi, etc.). Training data used the wrong template, or inference is using a different template than training used.

**Why it fails**: The model learned to produce outputs that follow its training template. If the template changes between training and inference, the model is producing correct output in the wrong context — which looks wrong.

**The fix**: Verify the correct template for your base model before any training or inference. Use the model's tokenizer's `apply_chat_template` method rather than manually constructing templates:

```python
# Correct way: use tokenizer's template
messages = [{"role": "user", "content": "Extract entities from: ..."}]
formatted = tokenizer.apply_chat_template(messages, tokenize=False)

# Also in TRL
SFTConfig(
    chat_template="llama3"  # Or whatever your model uses
)
```

**Check**: After training, run 5 examples through the inference pipeline and verify outputs look sane. Template problems are obvious immediately.

---

## Anti-Pattern 13: Evaluating Only on Easy Cases

**What it looks like**: Evaluation shows 94% accuracy. In production, failure rate is 15%. Stakeholders are confused.

**Why it happens**: Evaluation set was built from easy, representative cases. Edge cases — empty inputs, unusual formats, adversarial inputs, very long inputs — weren't included because they were harder to label.

**Why it fails**: Easy cases are the majority, so they dominate aggregate accuracy. Edge cases are where the model fails, but they're underrepresented in the eval set. Production inputs include edge cases that the eval set missed.

**The fix**: Explicitly build edge cases into your evaluation set:
- Empty or minimal inputs
- Inputs at max sequence length
- Inputs with unusual characters or formatting
- Adversarial inputs designed to confuse the model
- Out-of-scope inputs (what does the model do when asked something it shouldn't handle?)
- Ambiguous inputs where even humans disagree

These edge cases should be a distinct evaluation category with their own pass/fail thresholds.

---

## Anti-Pattern 14: Treating Fine-Tuning as a One-Time Event

**What it looks like**: Model is trained, deployed, and never retrained. Months later, performance has gradually degraded without anyone noticing.

**Why it happens**: Retraining has operational overhead. Once deployed, there's organizational pressure to move on to the next project.

**Why it fails**: Production data distribution shifts. Users find new ways to interact with the model. Business requirements evolve. Without retraining, the model's alignment with actual needs slowly degrades — a process called "model drift."

**The fix**: Before deployment, define:
1. **Retraining triggers**: What metrics, when breached, trigger a retraining cycle
2. **Review cadence**: Regular review of model performance (quarterly minimum)
3. **Data collection pipeline**: Continuously collecting and labeling production examples for future training
4. **Versioning discipline**: Infrastructure to support multiple model versions simultaneously

Fine-tuning is a process, not an event. Organizations that treat it as one-time discover they've built a depreciating asset.

---

## Anti-Pattern 15: No Data Eligibility Before Training

**What it looks like**: Team trains a model on internal data. Post-deployment, legal discovers the training data included customer PII, proprietary third-party data, or content with licensing restrictions.

**Why it happens**: Data eligibility is viewed as overhead. Engineers want to start training. Legal review takes time.

**Why it fails**: PII embedded in model weights is a regulatory liability. Several regulatory interpretations consider model weights containing PII as a form of PII storage — with associated deletion rights, access requirements, and breach notification obligations. Licensing violations on training data can result in the model being required to be pulled from production entirely.

The retroactive fix is much more expensive than the proactive review: you may have to discard the model, retrain from scratch with compliant data, and in some cases notify affected parties.

**The fix**: Written data eligibility review is the first gate — before a single training example is collected. No exceptions. For each data source:
1. Confirm legal right to use for model training
2. Identify and handle PII/PCI/sensitive data
3. Get written approval from legal/compliance
4. Document the approval in the model risk record

---

## Anti-Pattern 16: Vague Task Definition

**What it looks like**: The project brief is "build a model that understands our documents" or "make the model smarter about our domain."

**Why it happens**: Business requirements are often expressed as goals, not specifications. Engineers accept them without pushing for precision because specificity feels like gatekeeping.

**Why it fails**: You cannot collect correct training data for a vague task. You cannot define an evaluation metric. You cannot set a pass/fail threshold. You cannot tell if fine-tuning helped. Every decision in the pipeline — format, data collection, evaluation — requires a precise task definition.

**The fix**: Before collecting a single training example, write this in one sentence:
```
Given [input format], the model should produce [exact output format] 
by [specific method or behavior], and success means [measurable criterion].
```

If you can't write this sentence, the task isn't defined. Push back until it is.

**Test**: Can you write a function `is_correct(model_output, ground_truth) -> bool`? If not, your task definition is still vague.

---

## Anti-Pattern 17: Training on an Instruction-Tuned Model When You Should Use Base (or Vice Versa)

**What it looks like**: Team starts from a base model for a format-consistency task, struggles to get basic instruction following, and spends weeks debugging what should be trivial.

*Or the reverse*: Team starts from an instruction-tuned model for alignment training from scratch, discovers the model's existing alignment values conflict with the target alignment, and gets worse results than if they'd started from base.

**Why it happens**: The distinction between base and instruction-tuned models isn't always obvious. "The 8B model" could refer to either.

**Why it fails**: 
- **Base model for SFT**: Base models don't follow instructions. They complete text. You need substantially more data and training for the model to learn "this is an instruction, follow it" — work the instruction-tuned model has already done.
- **Instruction-tuned model for alignment**: The existing alignment creates a strong prior that conflicts with your target preferences, especially for safety-adjacent behaviors. The reference model in DPO is already aligned, not neutral.

**The fix**: 
- For SFT (task specialization, format, domain): Start from instruction-tuned (`*-Instruct`, `*-Chat`, etc.)
- For alignment training, DAPT, or GRPO from scratch: Start from base
- For ORPO/SimPO starting from scratch: Base model works and is often preferred (ORPO does SFT + alignment in one pass)
- When uncertain: test both. A 30-minute zero-shot comparison on 20 examples tells you which starting point is closer to your goal.

**Identifier check**: Model names ending in `-Instruct`, `-Chat`, `-it` are instruction-tuned. No suffix (e.g., `Llama-3.1-8B`) is base. Some providers use different conventions — check the model card.

---

## Anti-Pattern 18: Benchmark Contamination in Training Data

**What it looks like**: Fine-tuned model shows impressive gains on MMLU, HumanEval, or other standard benchmarks — far more than expected from the training data. These gains don't appear in actual production performance.

**Why it happens**: Training data that was web-scraped or generated from internet sources may include benchmark questions and their answers. The model memorizes benchmark answers rather than learning generalizable skills.

**Why it fails**: Benchmark scores become meaningless. You report progress that doesn't exist. Decisions are made on false signal. Regulatory or compliance evaluations that rely on benchmark scores are invalidated.

**Detection**:
```python
# Check if your training data contains benchmark examples
def check_benchmark_contamination(train_texts: list[str], benchmark_questions: list[str]) -> list[tuple]:
    """Find training examples that are suspiciously similar to benchmark questions."""
    contaminated = []
    for bq in benchmark_questions:
        bq_words = set(bq.lower().split())
        for i, text in enumerate(train_texts):
            text_words = set(text.lower().split())
            overlap = len(bq_words & text_words) / len(bq_words)
            if overlap > 0.7:  # 70% word overlap is suspicious
                contaminated.append((i, bq, overlap))
    return contaminated
```

**The fix**: 
1. If you use web-scraped data in training, deduplicate against known benchmark datasets before training
2. Use benchmark scores as regression markers (did we break something?) not as primary performance metrics
3. Use your own held-out task evaluation as the primary signal
4. For synthetic data: do not generate from prompts that contain benchmark questions

---

## The Failure Mode Taxonomy

Looking across these 18 anti-patterns, they cluster into five root causes:

```
ROOT CAUSE 1: Wrong tool or model selection (Anti-patterns 1, 3, 17)
  → Fine-tuning when RAG is correct; wrong base model size or type

ROOT CAUSE 2: Data quality failures (Anti-patterns 2, 6, 13, 15, 16, 18)
  → Unverified data, format inconsistency, vague task definition, 
     missing edge cases, ineligible data, benchmark contamination

ROOT CAUSE 3: Evaluation failures (Anti-patterns 4, 9, 13, 18)
  → No baseline, contaminated eval set, missing edge cases, fake benchmark scores

ROOT CAUSE 4: Training configuration errors (Anti-patterns 7, 8, 10, 12)
  → Learning rate, epochs, rank, template mismatches

ROOT CAUSE 5: Organizational failures (Anti-patterns 5, 11, 14, 15)
  → No monitoring, no rollback, no retraining process, no eligibility review
```

Most projects that fail can be traced to one or two of these root causes. Diagnosing the root cause, not just the symptom, is how you fix it.

---

## The Pre-Training Checklist (Anti-Anti-Pattern Guide)

Run through this before the first training run:

```
TASK DEFINITION
□ Task written as: "Given [input], model produces [output], success = [measurable criterion]"?
□ Can you write is_correct(model_output, ground_truth) -> bool?

DATA
□ Dataset specification written before collection?
□ All data sources have written eligibility approval?
□ PII/sensitive data identified, classified, handled?
□ Format validated (100% parseable, consistent)?
□ Deduplication completed (exact + fuzzy)?
□ Evaluation set created BEFORE training data, and locked?
□ Edge cases explicitly included in evaluation set?
□ Training data checked for benchmark contamination?

MODEL
□ Base model capability verified on target task without fine-tuning?
□ Base vs instruction-tuned model: correct type chosen for your approach?
□ Model license verified for your use case?
□ Correct prompt template confirmed for base model?
□ Memory requirements calculated for chosen technique?

EVALUATION
□ Pass/fail criteria defined for primary metric?
□ Baseline comparison defined (zero-shot, rule-based)?
□ Catastrophic forgetting check included in evaluation?
□ Regression test suite ready?

PROCESS
□ Model risk record created?
□ Rollback plan documented and tested?
□ Monitoring strategy defined?
□ Retraining triggers defined?
□ Human oversight workflow defined?
```

No training run should start with unchecked boxes. If a box is genuinely inapplicable, document why — don't just skip it.

---

## Teach It Back

1. A colleague says "we've been iterating on our evaluation set throughout development, and we're now at 94% accuracy. We're ready to deploy." What are two anti-patterns operating here, and what do you tell them?

2. Your fine-tuned model's production accuracy is 10 points below your evaluation accuracy. Without looking at the model, what are the likely causes?

3. Someone shows you a fine-tuning project where the training data was generated using GPT-4, the eval set was split from the training data after training, and the model achieves 91% accuracy. Why can't you trust this 91%?

4. Walk through the five root causes of fine-tuning failure and give one example of how each manifests in a real project.

---

## Knowledge Check

**Q1**: A team reports their model achieves 89% exact match on their evaluation set after 5 epochs of training. Their training accuracy is 97%. What is happening and what should they do?

**A**: Overfitting. The 8-point gap between training and eval accuracy, combined with 5 epochs on (presumably) a limited fine-tuning dataset, indicates the model has memorized training examples. Fix: use `load_best_model_at_end=True` with the eval loss as the selection metric, add lora_dropout=0.1, reduce epochs to 1–2, and evaluate against the checkpoint with best eval performance (not final checkpoint).

---

**Q2**: Post-deployment, a production monitoring alert fires: format compliance rate dropped from 99.8% to 89% over two days. No model changes were made. What do you investigate?

**A**: Input distribution shift is the first suspect — production inputs are structurally different from training distribution (e.g., new edge cases, change in client behavior). Investigate: (1) Check if input patterns changed (new clients, new use case, upstream system change). (2) Sample the failing inputs — what do they have in common? (3) Check for infrastructure issues (wrong model version deployed, routing error). (4) Check if a dependency (tokenizer version, serving configuration) changed without being flagged as a model change. This is almost certainly a data distribution shift or deployment configuration issue, not a model degradation.

---

*Return to [README — Curriculum Map](./README.md)*

*Last reviewed: May 2026.*
