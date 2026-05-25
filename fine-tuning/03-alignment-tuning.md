# 03 — Alignment & Preference Tuning: SFT → DPO → GRPO

> **Level**: Intermediate–Advanced  
> **Time**: ~90 minutes  
> **Goal**: Choose the right alignment method. Implement SFT, DPO, ORPO, or GRPO. Explain why each was invented.

---

## Why Alignment Fine-Tuning Exists

SFT (Supervised Fine-Tuning) teaches a model *what to do*. It trains on examples of correct behavior. But correct behavior alone is not sufficient for production AI systems.

Consider a medical information model trained on (question, answer) pairs. It learns to produce factually accurate answers. But:
- It might also produce harmful self-harm advice when prompted cleverly
- It might give confident answers when uncertainty is more appropriate
- It might respond to a clear and simple question with an overly technical lecture

These are not *knowledge* failures. They're *preference* failures. The model doesn't know how to prioritize safety, appropriate confidence, or calibrated communication level. No (question, correct-answer) pair teaches it this.

**Alignment fine-tuning teaches models to prefer the kinds of responses humans prefer** — across safety, helpfulness, honesty, and format.

---

## The Alignment Stack: A Historical Arc

Understanding the history prevents you from reinventing wheels and explains why each technique exists:

```
2022: RLHF (Reinforcement Learning from Human Feedback)
      → Works, but complex: requires reward model + PPO training
      
2023: DPO (Direct Preference Optimization)
      → Same result as RLHF, no reward model needed
      → Simpler, more stable, faster
      
2024: ORPO (Odds Ratio Preference Optimization)
      → DPO still needs a reference model (extra memory)
      → ORPO: no reference model, SFT and alignment in one pass
      
2024: SimPO (Simple Preference Optimization)
      → Reference-free like ORPO, but uses length-normalized rewards
      → More stable, outperforms DPO on benchmarks
      
2025: GRPO (Group Relative Policy Optimization)
      → For reasoning/tool use: verifiable rewards, no preference pairs needed
      → Used in DeepSeek R1; enables reinforcement of reasoning traces
```

Each technique was invented to solve a specific limitation of its predecessor. Knowing this history lets you pick the right tool for the right problem instead of defaulting to the most famous one.

---

## Stage 1: SFT — The Foundation

**What it is**: Training on (instruction, response) pairs where the response represents the *desired* behavior. This is Document 02's focus applied to alignment data rather than task data.

**Why it comes first**: Even for preference training (DPO/ORPO), you usually SFT first. A base model that can't follow instructions can't usefully learn from preference comparisons.

**SFT data for alignment**:
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful, honest, and harmless AI assistant."},
    {"role": "user", "content": "How do I break into my neighbor's house if I lost my key?"},
    {"role": "assistant", "content": "If you're locked out and need access to your own property, I'd recommend calling a locksmith, contacting your landlord, or checking with your neighbor if they have a spare key for you. If this is about your neighbor's property, I'm not able to help with that."}
  ]
}
```

**SFT for alignment vs. SFT for task**: The difference is in the data. Task SFT teaches "do this specific thing." Alignment SFT teaches "always be this kind of assistant" — safer, more helpful, appropriately calibrated.

---

## Stage 2: DPO — Direct Preference Optimization

### The problem with RLHF

RLHF (from InstructGPT / ChatGPT) works like this:
1. Collect preference data: humans compare two responses and pick the better one
2. Train a reward model to predict which response humans prefer
3. Fine-tune the policy (your model) using PPO to maximize the reward model's score

This works. It produced ChatGPT. But it's operationally complex:
- You maintain a separate reward model (another large model in memory)
- PPO is notoriously sensitive to hyperparameters and can be unstable
- The reward model can be "gamed" by the policy — it learns to get high reward scores rather than be actually good

### DPO's insight

DPO (Rafailov et al., 2023) proved mathematically that the RLHF objective has an equivalent closed-form solution. You don't need a separate reward model or PPO. You can train directly on preference data with a simple classification loss.

**The DPO loss**:
```
L_DPO = -E[log σ(β * log(π_θ(y_w|x) / π_ref(y_w|x)) - β * log(π_θ(y_l|x) / π_ref(y_l|x)))]
```

Where:
- `y_w` = the "chosen" (preferred) response
- `y_l` = the "rejected" (dispreferred) response
- `π_θ` = the model being trained
- `π_ref` = the reference model (a frozen copy of the initial SFT model)
- `β` = temperature parameter controlling deviation from reference

**Intuition**: DPO increases the probability of chosen responses and decreases the probability of rejected responses, while keeping the overall distribution close to the reference model (controlled by β).

### DPO preference data format

```json
{
  "prompt": "Explain quantum entanglement to a 10-year-old.",
  "chosen": "Imagine two magic coins. Whenever you flip one, the other always lands on the opposite side — no matter how far apart they are. That's quantum entanglement: two particles that always 'know' what the other is doing, even across huge distances. Scientists call this 'spooky action at a distance.'",
  "rejected": "Quantum entanglement is a phenomenon in quantum mechanics where the quantum states of two or more particles become correlated such that the quantum state of each particle cannot be described independently of the state of the others, even when separated by large distances."
}
```

The chosen response is more accessible and age-appropriate. The rejected response is accurate but fails the task. DPO trains the model to prefer the chosen style.

### β: The most important DPO hyperparameter

β controls how far the trained model is allowed to deviate from the reference model.

| β value | Effect |
|---------|--------|
| 0.01–0.05 | Aggressive: model changes substantially, may drift from reference |
| 0.1 | **Default**. Good balance for most use cases |
| 0.3–0.5 | Conservative: small changes, stays close to reference |
| > 0.5 | Very conservative; learning signal may be too weak |

**Higher β = more conservative = safer but less alignment**. Start at 0.1. If the model's general capabilities degrade after DPO, increase β.

### DPO with Hugging Face TRL

```python
from trl import DPOTrainer, DPOConfig

dpo_config = DPOConfig(
    beta=0.1,
    learning_rate=5e-6,          # Lower than SFT — fine-grained preference adjustment
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    num_train_epochs=1,           # Usually 1–3 epochs for DPO
    max_length=1024,
    max_prompt_length=512,
    bf16=True,
)

trainer = DPOTrainer(
    model=model,                  # SFT model to further train
    ref_model=ref_model,          # Frozen copy of the SFT model
    args=dpo_config,
    train_dataset=dpo_dataset,
    tokenizer=tokenizer,
)
trainer.train()
```

**Key point**: `ref_model` is a frozen copy of the model *before* DPO training. It defines the "baseline behavior" you're adjusting away from. Usually, this is your SFT checkpoint.

---

## Stage 3: ORPO — SFT and Alignment in One Pass

### The problem DPO has

DPO requires a reference model in memory — a frozen copy of the SFT model. For large models, this means:
- You have your training model (7B parameters)
- And your reference model (another 7B parameters)
- Both in GPU memory simultaneously

For a 7B model, this roughly doubles the memory requirement compared to plain SFT.

### ORPO's solution

ORPO (Hong et al., 2024) eliminates the reference model. Instead, it adds an "odds ratio penalty" directly to the SFT loss:

```
L_ORPO = L_SFT + λ * L_OR
```

Where:
- `L_SFT` is the standard causal language modeling loss on chosen responses
- `L_OR` is the odds ratio term that penalizes the model for assigning high probability to rejected responses
- `λ` controls the relative weight (default: 0.1)

**The key insight**: By training simultaneously on "produce chosen responses" (SFT objective) and "don't produce rejected responses" (odds ratio objective), you get both instruction-following AND preference alignment in a single training pass.

### ORPO preference data format

Same as DPO: (prompt, chosen, rejected) triplets. The implementation handles the rest.

```python
from trl import ORPOTrainer, ORPOConfig

orpo_config = ORPOConfig(
    learning_rate=8e-6,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    num_train_epochs=1,
    max_length=1024,
    max_prompt_length=512,
    beta=0.1,              # λ in ORPO: weight of the odds ratio term
    bf16=True,
)

# No ref_model needed
trainer = ORPOTrainer(
    model=base_model,       # Fine-tune from base or SFT checkpoint
    args=orpo_config,
    train_dataset=orpo_dataset,
    tokenizer=tokenizer,
)
trainer.train()
```

### When to prefer ORPO over DPO

| Factor | Use ORPO | Use DPO |
|--------|----------|---------|
| Memory budget | Tight (one GPU) | More available |
| Pipeline simplicity | Prefer single-pass | OK with multi-stage |
| Strong SFT checkpoint | Not required | Required |
| Training time | Prefer single pass | OK with multiple |
| Starting from base model | Ideal — SFT+align in one | Not ideal — need SFT first |

**Summary**: ORPO is more efficient. DPO gives you more control via the reference model. For most practical enterprise deployments, ORPO's efficiency advantage makes it the better default unless you have a specific reason to need the reference model's behavior.

---

## SimPO: Simple Preference Optimization

SimPO (Meng et al., 2024) is reference-free like ORPO but with two distinct improvements:

1. **Length-normalized rewards**: Averages log-likelihood over response length, preventing the model from favoring shorter responses just because they have fewer tokens to assign probability to.

2. **Target reward margin**: Adds a margin `γ` to ensure the chosen response is not just marginally better than the rejected one, but better by a defined threshold.

**SimPO results**: +6.4 points on AlpacaEval 2 compared to DPO on some benchmarks. More stable training than DPO (no reference model artifacts).

```python
# SimPO is in TRL as of recent versions
from trl import SimPOTrainer, SimPOConfig

simpo_config = SimPOConfig(
    beta=2.0,       # SimPO uses higher beta than DPO
    gamma=1.0,      # Target reward margin
    learning_rate=1e-6,
    ...
)
```

**When SimPO is the right choice**: When DPO is unstable (common with high-quality datasets where chosen/rejected pairs are close), when you want reference-free training with length-normalized rewards, when you need the extra benchmark points.

---

## Stage 4: GRPO — Group Relative Policy Optimization

### When DPO/ORPO/SimPO are NOT the right tool

These preference optimization methods share an assumption: **you have human preference labels** (chosen vs. rejected pairs). Collecting these labels is expensive and slow.

They also assume: **the quality of responses is hard to verify programmatically**. This is true for style, safety, and general helpfulness — you need human judgment.

But for some tasks, quality is **verifiable**:
- Mathematical reasoning: the answer is either right or wrong
- Code generation: the code either passes tests or it doesn't
- Structured extraction: the output either conforms to the schema or it doesn't
- Tool use: the tool call either produces the correct result or it doesn't

For verifiable tasks, GRPO is a better fit than DPO/ORPO. You don't need human preference labels. You need a reward function.

### What GRPO does

GRPO (Shao et al., 2024, used in DeepSeek R1) is a reinforcement learning method that:

1. For each prompt, generates K responses (e.g., K=8) from the current model
2. Evaluates each response with a reward function (verifiable reward)
3. Uses the within-group reward distribution to estimate advantages (which responses are better than average for this prompt)
4. Updates the model to increase probability of high-reward responses and decrease probability of low-reward responses

**The "group relative" in GRPO**: Advantages are computed relative to the group of K responses for each prompt, not relative to some global baseline. This makes the training signal more stable and avoids reward scaling issues.

**Why no critic?**: Traditional RL methods (PPO) use a separate value network (critic) to estimate expected return. GRPO doesn't need one — the group average reward serves as a baseline. This simplifies the setup significantly.

### GRPO reward functions for verifiable tasks

```python
# Example: reward function for structured extraction task
def extraction_reward_fn(response: str, ground_truth: dict) -> float:
    try:
        parsed = json.loads(response)
        if parsed == ground_truth:
            return 1.0
        # Partial credit: count matching fields
        matching = sum(1 for k, v in ground_truth.items() 
                      if parsed.get(k) == v)
        return matching / len(ground_truth)
    except json.JSONDecodeError:
        return 0.0  # Invalid JSON = zero reward
```

```python
# Example: reward function for math reasoning (DeepSeek R1 style)
def math_reward_fn(response: str, correct_answer: str) -> float:
    # Extract answer from response (usually in <answer>...</answer> tags)
    extracted = extract_answer(response)
    if extracted == correct_answer:
        return 1.0
    elif extracted is not None:
        return 0.1  # Partial credit for attempting
    return 0.0
```

**Format reward (critical for GRPO)**: Add a small reward for following the expected output format, separate from the content reward. This prevents the model from learning to give correct answers in unstructured ways.

```python
def combined_reward(response: str, ground_truth) -> float:
    format_reward = 0.1 if is_valid_json(response) else 0.0
    content_reward = extraction_reward_fn(response, ground_truth)
    return 0.1 * format_reward + 0.9 * content_reward
```

### GRPO configuration

```python
from trl import GRPOTrainer, GRPOConfig

grpo_config = GRPOConfig(
    num_generations=8,           # K: responses per prompt
    learning_rate=1e-6,          # Very low — RL training is sensitive
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    num_train_epochs=1,
    temperature=0.7,             # Sampling temperature for response generation
    kl_coef=0.04,                # KL divergence penalty (prevents too much drift)
    bf16=True,
)

trainer = GRPOTrainer(
    model=model,
    args=grpo_config,
    reward_funcs=combined_reward,
    train_dataset=grpo_dataset,   # Just prompts + ground truth, no preference pairs
    tokenizer=tokenizer,
)
```

### GRPO vs DPO: Decision Guide

| Factor | Use DPO / ORPO | Use GRPO |
|--------|---------------|----------|
| Task type | Style, safety, helpfulness | Math, code, extraction, tool use |
| Reward availability | Human preference labels | Programmatic verifier |
| Data format | (prompt, chosen, rejected) | (prompt, ground_truth) |
| Training stability | High | Medium (RL is more sensitive) |
| Use in DeepSeek R1 | No | Yes |
| Best for | General assistant behavior | Reasoning, structured output |

---

## Choosing the Right Alignment Method: Decision Tree

```
Are you doing alignment for the first time?
    ↓ Yes
    → Start with SFT only. Measure if alignment is even needed.
    
Do you have preference labels (chosen/rejected)?
    ↓ No
    Is the task verifiable programmatically?
        ↓ Yes → GRPO
        ↓ No  → Collect preference labels, then DPO/ORPO
    
    ↓ Yes
    Is memory constrained / do you prefer one-pass training?
        ↓ Yes → ORPO (or SimPO for more stability)
        ↓ No  → DPO (or SimPO for benchmarks)
        
Are your chosen/rejected pairs high quality and clearly separable?
    ↓ Yes → DPO (β=0.1)
    ↓ No, pairs are close in quality → SimPO (better handling of marginal differences)
    
Are you training for reasoning / mathematical problem solving?
    → GRPO with verified reward functions
    
Are you training for general assistant behavior (safety, helpfulness)?
    → SFT → DPO or ORPO
```

---

## Common Alignment Failure Modes

### Reward hacking (GRPO)

The model finds high-reward responses that don't actually achieve the intended goal. Example: a math model learns to copy the answer format without working through the problem, by pattern-matching from the prompt.

**Prevention**: Multi-component reward functions that test multiple properties. Include "process" rewards if possible (reward the reasoning trace, not just the final answer).

### DPO mode collapse

The model collapses to a narrow response distribution — it finds a few response templates that DPO favors and produces variations of those exclusively.

**Prevention**: Diverse preference data. High β. Monitor response diversity during training (measure unique n-grams in model outputs).

### Length drift

Models trained with DPO often learn to produce shorter responses (the chosen response in your dataset may be shorter than the rejected one on average). This is a distributional artifact, not genuine alignment.

**Prevention**: Control for length in your preference labels. Use SimPO (length-normalized rewards). Audit response length distribution before and after DPO.

### Alignment tax

After alignment training, the model scores worse on standard benchmarks (MT-Bench, MMLU). This is called the "alignment tax" — the model became more aligned but less capable.

**Prevention**: The alignment tax is real but manageable. Use lower β in DPO. Don't over-train on preference data. Monitor benchmark scores on a frozen eval set alongside preference metrics.

### Catastrophic forgetting during alignment

The aligned model forgets capabilities from the SFT stage.

**Prevention**: Very low learning rates (5e-6 or less). Few epochs (1–2 for alignment, not 5+). Mix a small percentage of SFT data into alignment training (5–10% of examples).

---

## Building a Preference Dataset: Practical Guidance

The quality of preference labels determines the quality of alignment. Three collection approaches:

### Human annotation (highest quality, highest cost)

- Hire domain experts to compare pairs of model responses
- Require annotators to explain their choice in writing
- Calculate inter-annotator agreement — target κ ≥ 0.7
- Use multiple annotators per pair for high-stakes decisions

**Good for**: Safety evaluation, high-stakes domains, final production quality gates

### LLM-as-judge (scalable, quality depends on judge)

Use a stronger model (GPT-4, Claude) to compare response pairs:

```python
def llm_judge_preference(prompt: str, response_a: str, response_b: str) -> str:
    judge_prompt = f"""
Compare these two responses to the prompt below and decide which is better.
Respond with "A" or "B" and a one-sentence reason.

Prompt: {prompt}
Response A: {response_a}
Response B: {response_b}

Which response is better (A or B)?"""
    
    # Call judge model
    return judge_model.generate(judge_prompt)
```

**Caveat**: LLM judges have known biases (prefer longer responses, prefer more confident responses, prefer whichever response is shown first). Randomize A/B order. Run both orderings for a sample.

**Good for**: Large-scale preference dataset generation for style and format tasks. Not reliable for safety evaluation.

### Reward model scoring

Use an existing reward model (e.g., OpenAssistant's reward model, Llama-based reward models) to score responses, and create pairs based on score differences.

**Good for**: Bootstrapping large preference datasets quickly. Use human annotation to validate a sample.

---

## Teach It Back

1. A colleague says "DPO is better than RLHF because it's simpler." What's the more precise statement? Under what conditions is RLHF still the right choice?

2. Your team needs to train a model to produce better mathematical reasoning. You have a dataset of math problems with verified correct answers. Which alignment method do you use and why?

3. After DPO training, your model's MT-Bench score dropped from 7.2 to 6.8. What are the likely causes and what do you adjust?

4. Explain GRPO's "group relative" advantage to someone who knows RL basics. Why is this better than using a global baseline?

---

## Knowledge Check

**Q1**: You've trained a DPO model with β=0.05. The model's preference win rate on your test set is excellent (85%), but its MMLU benchmark dropped 8 points. What does this tell you and how do you fix it?

**A**: Low β caused aggressive divergence from the reference model — the model optimized strongly for preference signals at the cost of general capability (alignment tax). Fix: retrain with β=0.1 or β=0.2. The model needs the KL constraint to preserve general capabilities. Also check if preference data has biases (e.g., chosen responses always use a specific format that's easy to mimic).

---

**Q2**: You have 500 preference pairs for a customer service alignment task, but when you sample responses from both the trained and untrained model, you notice the DPO-trained model always responds in 2–3 sentences while the untrained model varies widely. What happened?

**A**: Length drift. Your chosen responses are consistently shorter than your rejected responses, so DPO learned "short = preferred." Fix: audit your preference dataset for length correlation, control for length when collecting labels, or switch to SimPO (length-normalized rewards).

---

*Continue to [04 — Training Infrastructure: Multi-GPU, FSDP, DeepSpeed](./04-training-infrastructure.md)*

*Last reviewed: May 2026. TRL API evolves rapidly; check the current TRL documentation for exact configuration parameters.*
