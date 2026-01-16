# Heuristics Engine Specification
## Prompt Reality Cockpit – Advanced Mode

## Purpose
The heuristics engine powers the **insight layer** of the Prompt Reality Cockpit.

Its role is not to optimize or fix prompts, but to:
- detect structural risk
- surface system constraints
- translate raw metrics into judgment-level insights

The engine must be **deterministic, explainable, and conservative**.

---

## Design Principles

- Deterministic: Same input always produces the same insights
- Explainable: Every insight maps to a clear rule
- Conservative: Prefer under-warning to false authority
- Non-prescriptive: Never suggests how to fix

---

## Heuristic Categories

1. Context Capacity
2. Truncation Risk
3. Instruction Dilution
4. Structural Ambiguity
5. Cost Pressure

Each category produces **alerts**, not scores.

---

## 1. Context Capacity Heuristics

### Rule CC-1: Context Overflow
**Condition**
- Total tokens > configured context window

**Insight Triggered**
> Context overflow detected. Later parts of this prompt are unlikely to be processed.

**Severity**
- High

---

### Rule CC-2: Near Capacity
**Condition**
- Token usage > 85% of context window

**Insight Triggered**
> This prompt is approaching the context limit. Small additions may cause truncation.

**Severity**
- Medium

---

## 2. Truncation Risk Heuristics

### Rule TR-1: Critical Content After Cutoff
**Condition**
- Task-defining sentences appear after overflow boundary

**Insight Triggered**
> Core task instructions may be ignored due to truncation.

**Severity**
- High

---

## 3. Instruction Dilution Heuristics

### Rule ID-1: Multiple Role Definitions
**Condition**
- More than one role-setting phrase detected (e.g., “You are a…”, “Act as…”)

**Insight Triggered**
> Instruction dilution detected. Competing role definitions reduce clarity.

**Severity**
- Medium

---

### Rule ID-2: Excessive Instruction Density
**Condition**
- Instruction tokens > 40% of total prompt

**Insight Triggered**
> Most tokens are consumed by instructions before the main task begins.

**Severity**
- Medium

---

## 4. Structural Ambiguity Heuristics

### Rule SA-1: Multiple Primary Tasks
**Condition**
- More than one imperative task verb cluster detected

**Insight Triggered**
> Multiple primary tasks detected. Output focus may be inconsistent.

**Severity**
- Medium

---

### Rule SA-2: Late Task Definition
**Condition**
- Main task appears after 50% of token count

**Insight Triggered**
> The main task is defined late in the prompt, increasing ambiguity.

**Severity**
- Low

---

## 5. Cost Pressure Heuristics

### Rule CP-1: High Fixed Cost Prompt
**Condition**
- Fixed instruction tokens > 70% of total tokens

**Insight Triggered**
> High fixed cost per call. This prompt may be expensive at scale.

**Severity**
- Medium

---

### Rule CP-2: Cost Disproportionate to Task
**Condition**
- Instruction length disproportionately exceeds task length

**Insight Triggered**
> Cost is driven more by setup than by task complexity.

**Severity**
- Low

---

## Insight Prioritization Rules

- High severity insights always shown
- Medium severity shown if no High exists
- Low severity shown only if space allows

Max visible insights: 3

---

## Explicit Non-Goals

The heuristics engine must NOT:
- rewrite prompts
- recommend alternatives
- score prompt quality
- rank users
- compare models

---

## Future Extension Points

- Retrieval-related heuristics (separate cockpit)
- Agent planning heuristics (separate cockpit)
- Runtime feedback loops (out of scope)

---

## Internal Guardrail Statement

> If an insight cannot be traced back to a simple rule, it must not exist.