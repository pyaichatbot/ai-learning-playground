# Lighthouse Attention: Complete Enterprise ELM Tutorial

### From Zero to SME — Building Enterprise Language Models

**Source**: arXiv:2605.06554 | Nous Research (Bowen Peng, Subho Ghosh, Jeffrey Quesnelle) | May 2026  
**Code**: <https://github.com/ighoshsubho/lighthouse-attention>  
**Target**: Beginner → Master | Fiserv/Enterprise Domain  
**Critical Framing**: Lighthouse addresses one important training-efficiency problem. Enterprise readiness still requires separate validation, governance, retrieval, serving, and training-design work.

**Training Status**: Draft enterprise training material. The paper reports preliminary small-scale pretraining results; do not present the method as enterprise-proven without local reproduction and model-risk review.

-----

## Table of Contents

1. [Critical Framing — Read First](#critical-framing)
1. [Part 1 — Foundations (Beginner)](#part-1)
1. [Part 2 — The Problem Lighthouse Solves (Intermediate)](#part-2)
1. [Part 3 — How Lighthouse Works: All 4 Stages (Intermediate–Advanced)](#part-3)
1. [Part 4 — Implementation Deep Dive (Advanced)](#part-4)
1. [Part 5 — Building ELMs with Lighthouse (Expert)](#part-5)
1. [Part 6 — The 13 Enterprise Gaps Lighthouse Does NOT Solve (Expert–Master)](#part-6)
1. [Part 7 — Complete Enterprise ELM System Architecture (Master)](#part-7)
1. [Part 8 — Fiserv Deployment Playbook (Master)](#part-8)
1. [Quick Reference Card](#quick-ref)
1. [Enterprise Training Readiness Pack](#training-readiness)
1. [4-Week SME Learning Path](#learning-path)

-----

## ⚠️ Critical Framing — Read First {#critical-framing}

Lighthouse Attention is a genuine and important architectural innovation.  
It solves one major systems problem: **efficient long-context pretraining.**

Enterprise ELMs, however, fail for many other reasons:

- Retrieval failures
- Governance gaps
- Catastrophic forgetting
- Evaluation blind spots
- Legal explainability requirements
- Memory hierarchy limitations
- Multi-document grounding failures
- Inference economics at scale
- Operational reliability

**Lighthouse solves the training substrate problem. Enterprise intelligence is mostly a systems orchestration problem.**

This tutorial covers the technical mechanism and the surrounding enterprise architecture concerns. It does not by itself approve a production deployment; that requires source-backed model selection, data governance, evaluation, legal review, model risk management, and human oversight.

-----

## Part 1 — Foundations (Beginner) {#part-1}

### 1.1 What is Attention? Plain English

Imagine reading a 500-page compliance document. When you encounter the word “penalty,” your brain doesn’t re-read every word — it jumps to the relevant clauses. That selective focus is **attention**.

In a language model, every word (token) asks: *“Which other words in this document matter for understanding me?”* The model computes a relevance score between every pair of tokens, then uses those scores to build meaning.

**The standard formula:**

```
Attention(Q, K, V) = softmax(Q × Kᵀ / √d) × V
```

- **Q (Query)** — “What am I looking for?”
- **K (Key)** — “What does each token offer?”
- **V (Value)** — “What is each token’s actual content?”

The query for “penalty” scans all keys, finds “regulation §47” scores highest, and imports that value into the representation. Every token does this for every other token — simultaneously.

### 1.2 The Quadratic Cost Problem

|Context Length|Attention Pairs|GPU Memory (fp16)|
|--------------|---------------|-----------------|
|4K tokens     |16M            |~128 MB          |
|32K tokens    |1B             |~8 GB            |
|128K tokens   |16B            |~128 GB          |
|512K tokens   |262B           |~2 TB            |
|1M tokens     |1 trillion     |~8 TB            |

The cost is **quadratic**: double the context → quadruple the compute and memory. For ELMs processing full regulatory PDFs, audit trails, or multi-document portfolios, this is the primary training bottleneck.

### 1.3 What is an ELM (Enterprise Language Model)?

An ELM is a domain-specialized LLM pre-trained or fine-tuned on enterprise corpora with:

- **Long context windows** (128K–1M tokens) for full-document processing
- **Domain vocabulary** — SWIFT, PCI-DSS, Basel III, ISO 20022, SOX
- **Grounding mechanisms** — RAG, structured knowledge, graph memory
- **Compliance requirements** — deterministic outputs, audit trails, explainability
- **Governance architecture** — PII isolation, jurisdiction-aware data handling

The long-context requirement makes ELMs the primary target architecture for Lighthouse Attention.

### 1.4 Why “Just Use a Bigger GPU” Doesn’t Work

Even with A100/H100/B200 GPUs, pure engineering cannot eliminate O(N²) scaling:

- At 128K context: a single forward+backward pass requires ~128 GB attention memory
- At 512K: ~2 TB — impossible on any single GPU today
- Distributed training helps, but communication overhead grows with sequence length
- **FlashAttention** reduces memory bandwidth pressure, but does not reduce total compute

A fundamentally different algorithmic approach is required. That is what Lighthouse provides — for training. What happens at inference is a separate problem (covered in Part 6).

-----

## Part 2 — The Problem Lighthouse Solves (Intermediate) {#part-2}

### 2.1 FlashAttention: The Current Baseline

FlashAttention (FA2, FA3) is today’s standard. It tiles the attention computation to minimize slow HBM memory reads, keeping intermediate data in fast SRAM. Think of it as a faster car on the same highway — the highway still has physical limits.

FlashAttention does NOT reduce O(N²) computation. At 512K tokens on a B200, standard FlashAttention forward+backward is ~17× slower than Lighthouse attention (paper’s measurement).

### 2.2 Existing Sparse Approaches and Their Failure Modes

**Block-level sparse methods** (MoBA, Native Sparse Attention):

- Select contiguous token blocks per query
- Miss long-range dependencies (e.g., a clause referencing a definition 300 pages away in a regulatory document)

**Token-level sparse methods** (DeepSeek Sparse Attention, HISA):

- Score every token via a learned indexer, attend only the top-K
- **Problem 1 — Asymmetry**: Queries stay at full resolution while keys/values are pooled. The hierarchy is just compressed memory, not a multi-scale representation.
- **Problem 2 — Architectural entanglement**: Selection lives inside the attention kernel, blocking reuse of optimized FlashAttention. Every sparse method ships its own kernel — fragile and slow to improve.

**The training-correctness problem**: Inference-time sparse methods are evaluated against a dense forward pass, so they inherit dense model quality for free. A training-time sparse method faces a harder test: once training is done on sparse attention, does the resulting model still function as a competent dense-attention model?

Lighthouse is an early method that directly tests this question with matched preliminary experiments. Treat the result as promising, not as enterprise-scale proof.

### 2.3 The Core Lighthouse Insight

> **Use hierarchical sparse attention during ~90% of training to reduce compute. Switch to full dense attention for the final ~10% to recover dense-model quality. Deploy as a standard full-attention model.**

This is scaffolding logic: use it during construction, remove it before deployment. The structure stands on its own.

The implication for enterprise: long-context pretraining may become more affordable at context lengths that were previously cost-prohibitive. The deployed model can be standard dense attention, but the training recipe still needs local reproduction, quality gates, and production serving benchmarks.

-----

## Part 3 — How Lighthouse Works: All 4 Stages (Intermediate–Advanced) {#part-3}

### 3.1 The Four-Stage Forward Pass

Every attention layer during Lighthouse pre-training runs this pipeline:

```
Input Sequence (N tokens, Q/K/V projections done)
        │
        ▼
┌────────────────────────┐
│  STAGE 1               │
│  PYRAMID CONSTRUCTION  │  Pool Q, K, V symmetrically at L levels
│                        │  Preserve left-to-right causality throughout
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│  STAGE 2               │
│  SCORING & SELECTION   │  Bidirectional dot-product scoring (no params)
│                        │  Top-K via chunked-bitonic GPU kernel
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│  STAGE 3               │
│  GATHERED ATTENTION    │  Assemble selected tokens → dense sub-sequence
│                        │  Run stock FlashAttention on this sub-sequence
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│  STAGE 4               │
│  SCATTER RECONSTRUCTION│  Place outputs at original positions
│                        │  Deterministic kernel, no randomness
└────────────────────────┘
        │
        ▼
Output (N tokens — identical shape to standard attention output)
```

### 3.2 Stage 1 — Pyramid Construction

**The key innovation: pool Q, K, and V symmetrically.**

Previous methods pool only K and V, leaving Q at full resolution. This asymmetry means the hierarchy only serves as compressed memory, not a true multi-scale representation. Lighthouse pools all three together.

```
Level 0 (Full):     [t1, t2, t3, t4, t5, t6, t7, t8]   N tokens
                              ↓ pool by factor p=2
Level 1 (Half):     [t1-2, t3-4, t5-6, t7-8]            N/2 tokens
                              ↓ pool by factor p=2
Level 2 (Quarter):  [t1-4, t5-8]                         N/4 tokens
```

Pooling is average pooling along the sequence dimension:

```python
# Per level: halve sequence length by averaging adjacent pairs
def pool(x, p):
    B, N, D = x.shape
    return x.reshape(B, N // p, p, D).mean(dim=2)

# Pyramid construction
levels = [(q, k, v)]
for l in range(L - 1):
    q, k, v = pool(q, p), pool(k, p), pool(v, p)
    levels.append((q, k, v))
```

**Causality must be enforced at every level**: a pooled representation may be used only by query positions whose causal past includes the entire pooled span. A naive adjacent average such as `[t1, t2]` leaks `t2` if it is exposed to the query at `t1`. Production implementations need causal alignment, masking, or span-bound checks so every selected pyramid entry is fully in the query token's past.

The result is a genuine multi-scale representation: fine-grained at level 0, coarse but comprehensive at level L-1. Like reading a document at different zoom levels simultaneously.

### 3.3 Stage 2 — Scoring and Selection

**Scoring**: For each query token, compute relevance scores against every pyramid entry across all levels. The scorer is **parameter-free** — pure dot products:

```
score(q_i, k_j_at_level_l) = q_i · k_j_level_l
```

**Bidirectional scoring**: Entries are scored both from coarse-to-fine and fine-to-coarse perspectives, capturing both global relevance and local precision.

**Why parameter-free?** Adding learned scorer parameters would require differentiating through the selection step (a non-differentiable argmax). Parameter-free scoring keeps backward pass clean and avoids the complexity (and instability) of straight-through estimators.

**Top-K selection**: Select the K highest-scoring pyramid entries. The selection is **non-differentiable** — like argmax. No straight-through estimator is used.

Gradient flow works as follows:

```
Forward:  Input → Pool → Score → Top-K (no grad) → Gather → FlashAttention → Scatter → Output

Backward: Output ← Scatter ← FlashAttention ← Gather ← W_Q, W_K, W_V
          (gradient does NOT flow through Top-K indices)

Result:   W_Q, W_K, W_V learn to produce embeddings that are useful WHEN selected.
          The model learns which tokens matter by observing what happens when they are chosen.
```

This is self-supervised curriculum learning: weights adapt naturally to selection without any auxiliary losses or STE approximations.

**Chunked-bitonic Top-K kernel**: Standard `torch.topk` is not efficiently parallelizable at sequence lengths of 128K+. Lighthouse uses a fused CUDA kernel based on bitonic sort, chunked across the sequence for full GPU parallelism. This prevents selection from becoming the new bottleneck.

### 3.4 Stage 3 — Gathered-Sequence Attention

Selected K entries from all pyramid levels are gathered into a **contiguous dense sub-sequence**. Its size is:

```
O(L × p × K  +  N / p^(L-1))
```

With optimal depth L = log_p(N/K), this simplifies to **O(N log N)** — subquadratic.

This dense sub-sequence is passed to **stock FlashAttention**. No custom sparse attention kernel. The expensive step is standard, maximally-optimized FA on a much smaller input. This architectural choice is what makes Lighthouse practically fast rather than theoretically fast.

### 3.5 Stage 4 — Scatter-Back Reconstruction

Attention outputs for selected positions are placed back at their original sequence positions via a deterministic scatter kernel. Non-selected positions receive outputs from coarser pyramid levels, ensuring no token is completely unattended.

When the causal span checks are implemented correctly, the forward+backward pass maintains causal consistency: each token attends only to past tokens, even across pyramid levels and resolutions.

### 3.6 The Two-Stage Training Recipe

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STAGE 1: Lighthouse Pre-training  (~85–95% of token budget)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Full target sequence length (128K, 512K, 1M tokens)
  • Lighthouse attention active in all layers
  • 1.4–1.7× wall-clock speedup at 98K context
  • ~17× faster attention fwd+bwd at 512K on single B200
  • Model learns multi-scale representations, selection-aware embeddings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STAGE 2: Dense Recovery  (~5–15% of token budget)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Lighthouse wrapper removed — revert to stock FlashAttention
  • Short stage — representations already strong from Stage 1
  • Reported to match or beat fully-dense baseline loss after recovery in preliminary experiments
  • Provides preliminary evidence for the central correctness criterion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DEPLOYMENT: Standard Dense Model
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • No Lighthouse code at inference
  • No architectural changes
  • Serve with vLLM, TGI, or any standard inference stack
  • Dense-attention deployment path; quality must be validated at the target context length
```

**Reported empirical result**: In the paper's preliminary matched experiments, Lighthouse-trained models after Stage 2 recovery match or beat a fully-dense SDPA baseline trained from scratch on the same token budget, with faster total training time and lower final loss. Before using this in enterprise training or planning, require local reproduction at the target model scale and corpus mix.

-----

## Part 4 — Implementation Deep Dive (Advanced) {#part-4}

### 4.1 Complexity Analysis

|Method          |Attention Cost|Memory        |Notes                |
|----------------|--------------|--------------|---------------------|
|Dense SDPA      |O(N²)         |O(N²)         |Quadratic wall       |
|FlashAttention  |O(N²) compute |O(N)          |Memory efficient only|
|**Lighthouse**  |**O(N log N)**|**O(N log N)**|With optimal L       |
|Linear Attention|O(N)          |O(N)          |Quality degradation  |

At N=512K, K=1024, p=2, L=9:

- Dense: ~262 billion attention pairs
- Lighthouse: ~4.7 million pairs — **55,000× fewer attention operations**
- Wall-clock: ~17× faster for the attention step (fwd+bwd)

### 4.2 Key Hyperparameters and Their Effect

|Parameter     |Symbol|Description                |Typical Value|Effect                                     |
|--------------|------|---------------------------|-------------|-------------------------------------------|
|Pooling factor|p     |Compression ratio per level|2 or 4       |p=2: better quality; p=4: faster           |
|Pyramid depth |L     |Number of levels           |log_p(N/K)   |More levels = better; diminishing returns  |
|Top-K budget  |K     |Tokens selected per query  |512–2048     |Scale with N; K≈N/500 heuristic            |
|Recovery ratio|—     |% of tokens in Stage 2     |5–15%        |Shorter = cheaper; too short = quality loss|

**Paper ablation findings:**

- p=2 (binary pooling) outperforms p=4 in model quality
- Optimal L is log_p(N/K); more levels above this yield no gain
- K should scale with context; insufficient K causes attention bottleneck
- Recovery stage cannot be omitted — short but essential for dense quality

### 4.3 Gradient Flow in Detail

```
WHAT IS DIFFERENTIABLE:
  ✓ Pyramid pooling (average pooling, smooth gradient)
  ✓ Dot-product scoring (linear, clean gradient)
  ✓ Gather operation (fixed permutation)
  ✓ FlashAttention (full gradient w.r.t. Q, K, V)
  ✓ Scatter-back (deterministic inverse of gather)
  ✓ Output projection

WHAT IS NOT DIFFERENTIABLE:
  ✗ Top-K index selection (discrete argmax)

HOW TRAINING STILL WORKS:
  Gradients flow: Output → Scatter → FlashAttention → Gather → W_Q/W_K/W_V
  The weights learn: "produce embeddings that rank highly for relevant queries"
  No STE noise, no auxiliary losses, no complex backward kernel needed
  Result: cleaner gradient signal than STE-based approaches
```

### 4.4 Custom GPU Kernels

Three custom kernels are required for practical speed. The details below are conceptual; production correctness depends on the repository implementation and kernel-level tests.

**1. Chunked-Bitonic Top-K**

- `torch.topk` serializes across long sequences — unacceptable at 128K+
- Bitonic sort is fully data-parallel on CUDA
- Chunked implementation processes sequence blocks, merges results
- Fused with scoring to minimize HBM round-trips
- Output: sorted indices and scores, ready for gather

**2. Gather Kernel**

- Input: full Q/K/V tensors + selected indices
- Output: contiguous dense sub-sequence for FlashAttention
- FlashAttention requires contiguous memory — this kernel ensures it
- Avoids overhead of sparse tensor formats (e.g., COO, CSR)

**3. Scatter-Back Kernel**

- Deterministic inverse of gather
- Places attention outputs at original sequence positions
- Handles bf16/fp32 mixed precision
- Non-selected positions receive coarse-level pyramid values

### 4.5 Context Parallelism (CP) for Very Long Sequences

For sequences >256K tokens, single-GPU VRAM is insufficient even with Lighthouse. Context Parallel training splits the sequence across GPUs:

```
Sequence split across 4 GPUs:
  GPU 0: tokens [0,      N/4)
  GPU 1: tokens [N/4,    N/2)
  GPU 2: tokens [N/2,    3N/4)
  GPU 3: tokens [3N/4,   N)

Stage 1 (Lighthouse): Selection runs shard-locally — no cross-GPU communication needed
Stage 2 (Dense):      Ring-attention for cross-shard causal consistency
```

Configuration (torchtitan):

```toml
# configs/cp/norm_cp2_dp4.toml
context_parallel_degree = 2
enable_load_balance = true
```

Launch:

```bash
torchrun --nnodes 1 --nproc-per-node 8 ./torchtitan/train.py \
  --job.config_file ./configs/cp/norm_cp2_dp4.toml
```

### 4.6 Integration Code Pattern

The following code is **non-runnable pseudocode** for orientation. It omits production details such as pyramid-level index mapping, causal span validation, fused selection/gather kernels, tensor layout constraints, distributed context parallelism, and exact scatter reconstruction. Use the official repository and its tests for implementation work.

```python
import torch
import torch.nn as nn
from flash_attn import flash_attn_func

class LighthouseAttention(nn.Module):
    """
    Conceptual wrapper around a standard attention layer.
    This is not production-ready code.
    """
    def __init__(self, base_attention, pyramid_levels=4, pooling_factor=2, top_k=1024):
        super().__init__()
        self.base_attn = base_attention
        self.L = pyramid_levels
        self.p = pooling_factor
        self.K = top_k

    def forward(self, x, attention_mask=None):
        B, N, D = x.shape

        # Project Q, K, V using base attention's weights
        q, k, v = self.base_attn.qkv_proj(x)  # [B, N, H, d]

        # Stage 1: Build multi-level pyramid
        pyramid = self._build_pyramid(q, k, v)

        # Stage 2: Score and select top-K (gradient-free)
        indices = self._top_k_select(q, pyramid)  # [B, N, K]

        # Stage 3: Gather → FlashAttention on dense sub-sequence
        q_g, k_g, v_g = self._gather(q, k, v, indices)
        attn_out = flash_attn_func(q_g, k_g, v_g, causal=True)

        # Stage 4: Scatter back to original positions
        out = self._scatter_back(attn_out, indices, N)
        return self.base_attn.out_proj(out)

    def _build_pyramid(self, q, k, v):
        levels = [(q, k, v)]
        qc, kc, vc = q, k, v
        for _ in range(self.L - 1):
            qc = self._pool(qc)
            kc = self._pool(kc)
            vc = self._pool(vc)
            levels.append((qc, kc, vc))
        return levels

    def _pool(self, x):
        B, N, H, d = x.shape
        return x.reshape(B, N // self.p, self.p, H, d).mean(dim=2)

    @torch.no_grad()
    def _top_k_select(self, q, pyramid):
        # Conceptual scoring only. Production code must map selected indices
        # back to pyramid level and span, then enforce causal validity.
        scores_all = []
        for ql, kl, _ in pyramid:
            # Reduce over heads for scoring; shape [B, N_q, N_k_level]
            s = torch.einsum('bnhd,bmhd->bnm', ql, kl)
            scores_all.append(s.flatten(-2))
        scores = torch.cat(scores_all, dim=-1)  # [B, N, total_pyramid_entries]
        _, indices = torch.topk(scores, self.K, dim=-1)
        return indices

    def _gather(self, q, k, v, indices):
        # Simplified placeholder. Real gather operates over selected pyramid
        # entries, not just full-resolution tensors.
        B, N, H, d = q.shape
        idx = indices.unsqueeze(-1).unsqueeze(-1).expand(-1, -1, -1, H, d)
        k_exp = k.unsqueeze(2).expand(-1, -1, self.K, -1, -1)
        k_g = k_exp.gather(1, idx).view(B * N, self.K, H, d)
        v_g = v.unsqueeze(2).expand_as(k_exp).gather(1, idx).view(B * N, self.K, H, d)
        q_g = q.view(B * N, 1, H, d).expand(-1, self.K, -1, -1)
        return q_g, k_g, v_g

    def _scatter_back(self, attn_out, indices, N):
        B_N, K, H, d = attn_out.shape
        B = B_N // N
        out = torch.zeros(B, N, H, d, device=attn_out.device, dtype=attn_out.dtype)
        attn_out = attn_out.view(B, N, K, H, d).mean(dim=2)  # aggregate selected
        return attn_out


def enable_lighthouse(model, **kwargs):
    """Wrap all attention layers for Stage 1 training."""
    for layer in model.transformer_layers:
        layer.attention = LighthouseAttention(layer.attention, **kwargs)

def disable_lighthouse(model):
    """Remove Lighthouse wrapper — revert to stock attention for Stage 2 + deployment."""
    for layer in model.transformer_layers:
        if isinstance(layer.attention, LighthouseAttention):
            layer.attention = layer.attention.base_attn
```

### 4.7 Two-Stage Training Loop

This loop is also pseudocode. A production training run needs deterministic data versioning, checkpoint validation, distributed failure recovery, memory profiling, optimizer-state planning, and eval gates before switching from Lighthouse pretraining to dense recovery.

```python
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

def train_elm_lighthouse(
    model,
    dataloader,
    total_steps=100_000,
    lighthouse_fraction=0.90,
    context_length=131_072,   # 128K for ELM
    lr=3e-4,
):
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=0.1)
    scheduler = CosineAnnealingLR(optimizer, T_max=total_steps)

    s1_steps = int(total_steps * lighthouse_fraction)
    s2_steps = total_steps - s1_steps

    # ── STAGE 1: Lighthouse training ──────────────────────
    print(f"Stage 1: {s1_steps} steps with Lighthouse Attention")
    enable_lighthouse(model, pyramid_levels=4, pooling_factor=2, top_k=1024)

    for step, batch in enumerate(dataloader):
        if step >= s1_steps:
            break
        loss = model(**batch).loss
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        scheduler.step()
        optimizer.zero_grad()
        if step % 500 == 0:
            print(f"  [{step}/{s1_steps}] loss={loss.item():.4f}")

    # ── STAGE 2: Dense recovery ────────────────────────────
    print(f"\nStage 2: {s2_steps} steps with dense SDPA recovery")
    disable_lighthouse(model)

    for step, batch in enumerate(dataloader):
        if step >= s2_steps:
            break
        loss = model(**batch).loss
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        scheduler.step()
        optimizer.zero_grad()
        if step % 100 == 0:
            print(f"  [{step}/{s2_steps}] loss={loss.item():.4f}")

    print("\nDone. Model deploys as standard dense-attention ELM.")
    return model
```

-----

## Part 5 — Building ELMs with Lighthouse (Expert) {#part-5}

### 5.1 ELM Architecture Blueprint

```
┌─────────────────────────────────────────────────────────┐
│                    ELM ARCHITECTURE                      │
│                                                          │
│  Input Layer                                             │
│  ├── Domain tokenizer (regulatory + financial vocab)     │
│  └── RoPE position encoding (extended for 512K)          │
│                                                          │
│  Transformer Blocks × N_layers                           │
│  ├── [STAGE 1] LighthouseAttention (4-level pyramid)     │
│  │   ├── Symmetric Q/K/V pyramid construction            │
│  │   ├── Parameter-free bidirectional scorer             │
│  │   ├── Chunked-bitonic top-K selection                 │
│  │   ├── Gathered FlashAttention                         │
│  │   └── Deterministic scatter reconstruction            │
│  ├── [STAGE 2 + DEPLOY] Standard SDPA / FlashAttention   │
│  ├── RMSNorm (pre-norm)                                  │
│  ├── SwiGLU FFN                                          │
│  └── Residual connections                                │
│                                                          │
│  Output Layer                                            │
│  ├── LM head (next-token prediction)                     │
│  └── Task heads: extraction, classification (PEFT)       │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Domain Corpus Design for Fiserv ELM

```python
FISERV_ELM_CORPUS = {
    "regulatory": {
        "sources": [
            "PCI-DSS v4.0 requirements",
            "Basel III/IV framework",
            "SWIFT messaging standards (MT, MX)",
            "GDPR / CCPA compliance texts",
            "SOX audit requirements",
            "EU AI Act",
            "DORA (Digital Operational Resilience Act)",
        ],
        "weight": 0.35,  # Overweight — highest enterprise value
    },
    "financial_domain": {
        "sources": [
            "SEC 10-K, 10-Q filings (EDGAR)",
            "Payment network rule books (Visa, Mastercard)",
            "ISO 20022 message specifications",
            "Banking product documentation",
            "SWIFT FIN message catalogues",
        ],
        "weight": 0.30,
    },
    "general_language": {
        "sources": [
            "Filtered Common Crawl (quality filtered)",
            "Wikipedia + Wikidata",
            "Books corpus",
            "ArXiv CS/Finance papers",
        ],
        "weight": 0.35,  # Base language capability
    },
}
```

### 5.3 Evaluation Framework

```python
ELM_EVAL_SUITE = {

    # Lighthouse-specific: validates training correctness
    "sdpa_recoverability": {
        "description": "Loss parity with dense-from-scratch baseline",
        "metric": "Perplexity delta < 0.5%",
        "gate": True,  # Block training progression if fails
    },

    # Long-context capability
    "needle_in_haystack": {
        "description": "Retrieve specific facts from 128K-token regulatory documents",
        "metric": "Retrieval accuracy at depth [0.25, 0.5, 0.75, 1.0]",
        "targets": [0.25, 0.5, 0.75, 1.0],
    },

    # Domain accuracy
    "compliance_qa": {
        "description": "Multi-hop compliance reasoning over regulatory docs",
        "metric": "Exact match, F1",
        "min_f1": 0.87,
    },
    "obligation_extraction": {
        "description": "Extract obligations from 200-page contracts",
        "metric": "Precision, Recall, F1",
    },

    # General capability (prevent forgetting)
    "general": ["MMLU", "ARC-Challenge", "HellaSwag"],
}
```

### 5.4 Cost Analysis: Lighthouse vs Dense at Scale

Scenario: 7B parameter ELM, 50B training tokens, 128K context. These numbers are illustrative planning math, not a purchasing estimate.

```
DENSE TRAINING:
  Attention share of compute at 128K: ~70%
  Estimated GPU-hours (A100): ~50,000
  Cost at $2/GPU-hr: ~$100,000

LIGHTHOUSE TRAINING (1.5× speedup):
  Stage 1 (45B tokens, 1.5× faster): ~23,000 GPU-hours
  Stage 2 (5B tokens, dense):         ~3,300 GPU-hours
  Total: ~26,300 GPU-hours
  Cost: ~$52,600

  Illustrative savings: ~47% at 128K context
  At 512K context: paper-reported attention speedups may improve the total cost profile,
  but full-system savings depend on data pipeline, checkpointing, distributed overhead,
  optimizer state, recovery length, and failed-run rates.
```

-----

## Part 6 — The 13 Enterprise Gaps Lighthouse Does NOT Solve {#part-6}

This section is as important as Part 3. Knowing these gaps is what separates a practitioner from an SME. An enterprise architect who presents Lighthouse without these caveats will lose credibility. An architect who presents Lighthouse *and* these caveats — with solutions — will win the room.

-----

### Gap 1: Training-Time Efficiency ≠ Inference-Time Scalability

**This is the most critical gap.**

Lighthouse is a training acceleration mechanism, not an inference acceleration mechanism.

The deployed model still uses:

- Dense SDPA / FlashAttention
- Quadratic inference scaling
- Standard KV cache growth

**What this means for a 7B ELM at 512K context inference:**

|Issue                     |Impact                                    |
|--------------------------|------------------------------------------|
|KV cache per request      |~400 GB (at 512K, bf16)                   |
|Time to first token (TTFT)|Minutes per query                         |
|Concurrent users          |Near zero at full context                 |
|GPU memory                |Requires multi-GPU even for single request|

**Solutions needed (none provided by Lighthouse):**

- KV cache compression (StreamingLLM, SnapKV, PyramidKV)
- Paged attention (vLLM)
- Speculative decoding
- Retrieval compression (don’t send the whole document — send relevant chunks)
- Hierarchical RAG (coarse retrieval → fine retrieval → focused generation)

**Enterprise implication**: A Fiserv ELM with 512K context trained with Lighthouse may still be economically unserveable at scale without a parallel inference optimization strategy.

-----

### Gap 2: Context Window ≠ Memory Architecture

The tutorial-level temptation is: “just increase context.” This is incorrect enterprise thinking.

Enterprise intelligence systems need multiple memory types:

|Memory Type              |Description                         |Lighthouse Solves?|
|-------------------------|------------------------------------|------------------|
|Long context window      |Current document in prompt          |✓ Yes             |
|Episodic memory          |Past interactions, session history  |✗ No              |
|Semantic memory          |Entity knowledge, concept graph     |✗ No              |
|Procedural memory        |Task workflows, tool usage patterns |✗ No              |
|Organizational memory    |Company-specific rules, policy state|✗ No              |
|Temporal memory          |Time-aware fact versioning          |✗ No              |
|Cross-session persistence|Memory across days/weeks            |✗ No              |

**Enterprise reality**: Most enterprise workflows are retrieval-centric, not pure long-context. Policies change daily. Customer data updates hourly. Regulations are amended continuously. You do not want a 500K-token prompt every time. You want:

- Memory retrieval
- Vector routing over a dynamic knowledge base
- Symbolic indexing
- Graph traversal for entity relationships

**Solutions needed**: MemGPT-style layered memory, external memory graphs, retrieval-augmented persistence, knowledge base update pipelines.

-----

### Gap 3: Long Context Does Not Produce Multi-Document Reasoning

Enterprise documents are:

- Contradictory (different regulatory versions conflict)
- Versioned (superseded clauses must not override current ones)
- Hierarchical (parent regulations govern child policies)
- Partially duplicated (copy-paste with modifications)
- Temporally inconsistent (different effective dates)

Lighthouse enables the model to **attend broadly**. It does not enable the model to:

- Track document lineage
- Resolve contradictions with priority rules
- Propagate confidence through citation chains
- Maintain provenance from claim back to source
- Flag when sources disagree

**Solutions needed:**

- Graph RAG (document-level knowledge graphs with provenance edges)
- Symbolic planners for multi-hop reasoning
- Semantic provenance DAGs
- Source reliability scoring
- Contradiction arbitration layers

-----

### Gap 4: Flat RAG Is Insufficient for Enterprise

The pattern “retrieve chunks + concatenate into prompt” fails at enterprise scale.

**Advanced retrieval patterns required:**

**A. Hierarchical Retrieval**

```
Not: "Find relevant text about penalty clauses"
But:
  1. Identify which regulation governs this case
  2. Retrieve the relevant section header
  3. Retrieve the specific clause
  4. Retrieve exceptions and carve-outs
  5. Retrieve related amendments with effective dates
```

**B. Adaptive Context Assembly**

- The prompt must be dynamically composed
- Budget-aware: total tokens = ELM context limit
- Redundancy-aware: deduplicate overlapping retrieved chunks
- Relevance-ranked with marginal utility scoring

**C. Agentic Retrieval**

- Multi-hop: answer to question A determines what to retrieve for question B
- Iterative: refine retrieval based on partial answers
- Tool-augmented: query APIs, databases, structured sources mid-reasoning
- Query reformulation: rewrite queries based on retrieval failure signals

Lighthouse enables the model to process the assembled context. It does not help you assemble it intelligently.

-----

### Gap 5: Evaluation is Narrow (Important Weakness in the Paper Itself)

The Lighthouse paper’s evaluations cover:

- Training loss curves
- SDPA recoverability
- Needle-in-a-haystack long-context retrieval

This is too narrow for enterprise readiness. Even critics have noted this publicly.

**Missing enterprise evaluations:**

|Enterprise Capability                     |Lighthouse Paper Covers?|
|------------------------------------------|------------------------|
|Regulatory hallucination rate             |✗                       |
|Citation faithfulness                     |✗                       |
|Temporal consistency                      |✗                       |
|Legal defensibility of outputs            |✗                       |
|Multi-document contradiction handling     |✗                       |
|Adversarial compliance prompts            |✗                       |
|Audit reproducibility                     |✗                       |
|Extraction precision under schema mismatch|✗                       |

**Standard benchmarks (MMLU, HellaSwag, ARC) are nearly irrelevant** for enterprise deployment readiness. You need:

- Policy drift tests
- Financial reconciliation accuracy
- Legal reasoning consistency across paraphrases
- Audit replayability (same inputs → same outputs deterministically)
- Domain-specific extraction metrics with human-labeled test sets

-----

### Gap 6: No Explainability Tooling

This is huge for banking and compliance.

Sparse selection *creates potential* for interpretability — you can inspect which pyramid levels and positions were selected. But the paper does not operationalize this.

**What auditors will ask:**

- “Why did the model conclude this obligation exists?”
- “Which source document supports this risk classification?”
- “Can you trace the reasoning from input to output?”
- “Is this output reproducible if I run it again?”

**What you need to build:**

- Token lineage: which input tokens contributed to which output tokens
- Attention trace logging: selection indices for each layer at inference
- Retrieval trace: which chunks were retrieved and why
- Source attribution: citation back to original document + page + clause
- Reasoning chain reconstruction: step-by-step derivation of conclusions

Lighthouse gives you selection indices. You need to build the tooling layer on top.

-----

### Gap 7: Fine-Tuning Strategy Unverified

The tutorial covers pretraining and recovery. Enterprise value primarily comes from post-pretraining stages:

- **Instruction tuning** — teaching the model to follow compliance-specific formats
- **Domain adaptation** — continued pretraining on proprietary corpora
- **RLHF / RLAIF** — aligning outputs to auditor and compliance officer preferences
- **Supervised extraction** — structured output tasks (JSON obligation extraction)
- **Tool-augmented tuning** — teaching tool use, API calls, database queries

**Open question**: Do Lighthouse-trained representations transfer cleanly through instruction tuning and alignment?

The hierarchical, selection-aware embeddings from Stage 1 are structurally different from dense-SDPA-trained embeddings. After Stage 2 recovery they converge, but whether fine-tuning on top performs equivalently is unverified by the paper. This is not a reason to avoid Lighthouse — it is a reason to run your own ablations before committing.

-----

### Gap 8: Hybrid Attention Architectures Are Emerging

Frontier models increasingly combine multiple attention mechanisms rather than a single uniform approach:

- Sliding window attention (local context)
- Sparse global tokens (cross-document anchors)
- Recurrent memory layers (compressed long-horizon state)
- MoE routing (different experts for different content types)
- State-space layers (SSM for very long-range dependencies)
- Retrieval memory (token-level retrieval injection)

Lighthouse currently assumes hierarchical sparse pretraining as the sole mechanism. At context lengths of 1M+, a hybrid architecture may be necessary. The Lighthouse authors acknowledge this in their future directions. An enterprise ELM architect should monitor this space and be prepared to integrate Lighthouse with complementary mechanisms.

-----

### Gap 9: Data Governance Architecture

Your corpus design must address:

|Requirement                      |Technical Solution                         |
|---------------------------------|-------------------------------------------|
|PII isolation                    |Separate training pipelines per data tier  |
|Jurisdiction-aware training      |Geo-tagged document routing                |
|Right to erasure (GDPR Art. 17)  |Machine unlearning or retraining pipeline  |
|Training data deletion compliance|Immutable data versioning + audit logs     |
|Retraining traceability          |Lineage tracking from raw doc to checkpoint|
|Regulated-data segmentation      |Encrypted tenant-separated data lakes      |
|Provenance metadata              |Document fingerprinting at ingestion       |

These are not ML problems. They are data engineering and legal compliance problems that must be solved before the first training token is processed. Lighthouse does not touch them.

-----

### Gap 10: Long Context Can Reduce Accuracy (Retrieval Noise Problem)

Counter-intuitive but empirically well-documented: more context can degrade model accuracy.

**Why:**

- Irrelevant tokens dilute the attention signal
- Retrieved noise accumulates with context length
- The model’s ability to locate a needle degrades when the haystack is larger
- “Lost in the middle” phenomenon: models attend poorly to central context

**For enterprise ELMs specifically:**
A 300-page regulatory document may contain obsolete sections, superseded clauses, and jurisdiction-specific variants that do not apply. Naively feeding the full document degrades extraction accuracy compared to filtered, relevant sections.

The model needs to know *what not to attend to* — which requires:

- Semantic governance (filter before retrieval)
- Policy filtering (version and jurisdiction routing)
- Temporal filtering (effective date awareness)
- Structured retrieval over indexed, cleaned content

-----

### Gap 11: Real Infrastructure Constraints

The tutorial implicitly assumes clean GPU availability. Enterprise reality:

|Assumption            |Enterprise Reality                                   |
|----------------------|-----------------------------------------------------|
|Uniform GPU generation|Mixed A100/H100/B200 clusters                        |
|Stable networking     |Congestion, NCCL errors, topology variability        |
|Clean checkpointing   |Optimizer states dominate storage at 512K            |
|Linear scaling        |Communication overhead grows with sequence length    |
|Stable data pipeline  |Tokenizer throughput becomes bottleneck at 1M context|

**Hidden cost at 512K–1M context:**

- Optimizer states (AdamW): 3× model parameters
- Gradient checkpointing: tradeoff between memory and recomputation cost
- Data pipeline: tokenizing long documents at training throughput requires dedicated infra
- Checkpoint storage: a 7B model checkpoint at full precision ~28 GB; with optimizer states ~112 GB

Lighthouse reduces attention cost. It does not simplify total systems complexity.

-----

### Gap 12: Synthetic Data Strategy

Enterprise corpora are:

- Small (years of documents, not internet-scale)
- Legally constrained (cannot share across tenants)
- Fragmented (inconsistent formats, OCR noise, legacy encodings)

Many enterprise ELM programs use synthetic or augmented data to cover sparse labels, edge cases, and structured-output formats:

```python
SYNTHETIC_DATA_STRATEGY = {
    "regulatory_dialogs": [
        "Q&A pairs over PCI-DSS clauses",
        "Simulated compliance officer conversations",
        "Obligation extraction from synthetic contracts",
    ],
    "audit_scenarios": [
        "Generated audit finding reports",
        "Synthetic SOX testing narratives",
        "Simulated regulatory examination dialogues",
    ],
    "edge_cases": [
        "Contradictory clause scenarios",
        "Jurisdiction conflict examples",
        "Regulatory update simulation",
        "Adversarial compliance prompts",
    ],
    "structured_outputs": [
        "JSON obligation schemas from contract text",
        "Risk classification with confidence scores",
        "Citation extraction with page references",
    ],
}
```

Many enterprise ELM programs will need synthetic or augmented examples because approved corpora are often small, unevenly labeled, or legally constrained. Treat synthetic data as a likely requirement for sparse labels, edge cases, and structured-output coverage, but validate whether it is necessary for the specific task and governance context.

-----

### Gap 13: Agentic Architecture Is the Real Destination

The enterprise AI trajectory is not “one giant model with a huge context window.”

It is:

- Orchestrated multi-agent systems
- Retrieval planners with dynamic tool use
- Workflow engines with human-in-loop escalation
- Policy-checking subagents
- Audit trail generators
- Compliance verification pipelines

Lighthouse optimizes the foundational model’s training substrate. It does not address agent coordination, tool use, memory sharing between agents, or the orchestration protocols (OpenAI Agents SDK, Claude’s tool use, MCP, AG-UI) that enterprise agentic systems require.

**The strategic insight:**

> Lighthouse optimizes the transformer compute substrate.  
> Enterprise intelligence problems are mostly systems orchestration problems.  
> Both must be solved. Solving only one produces an academic artifact.

-----

## Part 7 — Complete Enterprise ELM System Architecture (Master) {#part-7}

### 7.1 The Full Stack

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    ENTERPRISE ELM SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────┐
│              AGENTIC ORCHESTRATION LAYER                     │
│  planners · workflow engines · policy subagents             │
│  human-in-loop escalation · tool use · audit trail          │
│  OpenAI Agents SDK / Claude tool use / MCP / AG-UI          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              RETRIEVAL + MEMORY FABRIC                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Vector Store │  │  Graph RAG   │  │  Episodic Memory  │  │
│  │ (pgvector)   │  │ (entity/doc  │  │  (session state)  │  │
│  │              │  │  provenance) │  │                   │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Hierarchical │  │  Temporal    │  │  Semantic Routing  │ │
│  │ RAG Router   │  │  Filter      │  │  (chunk budget)   │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              LONG-CONTEXT ELM CORE                           │
│  Trained with Lighthouse Attention (128K–512K context)       │
│  Deployed as standard dense-attention model                  │
│  Served via vLLM with paged attention + KV compression       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Inference Optimization (separate from Lighthouse)    │   │
│  │  • Paged attention (vLLM)                            │   │
│  │  • KV cache compression (SnapKV, PyramidKV)          │   │
│  │  • Speculative decoding                              │   │
│  │  • Request batching + prefix caching                 │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│           GOVERNANCE + EXPLAINABILITY LAYER                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Token        │  │ Source       │  │ Audit             │  │
│  │ Lineage      │  │ Attribution  │  │ Replayability     │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ PII          │  │ Jurisdictional│ │ Training          │  │
│  │ Isolation    │  │ Routing      │  │ Provenance        │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Lighthouse’s Role in This Stack

```
Layer                    Lighthouse Impact
──────────────────────   ─────────────────────────────────────────
Agentic orchestration    None — separate problem entirely
Retrieval fabric         None — prompt assembly is not its concern
ELM Core (training)      ✓ HIGH — enables 128K–512K pretraining
ELM Core (inference)     None — deploys as standard SDPA
Governance               None — data and audit architecture separate

Lighthouse contribution to enterprise ELM: an important training-efficiency component.
Enterprise readiness still requires separate architectural, governance, retrieval, serving, and operational decisions.
```

### 7.3 Inference Economics at 512K Context

Even after Lighthouse training succeeds, production serving requires a dedicated inference optimization strategy:

```python
INFERENCE_STACK = {

    "serving_framework": "vLLM",         # Paged attention, prefix caching
    "kv_compression": "SnapKV",           # Compress KV cache during generation
    "quantization": "AWQ 4-bit",         # Reduce memory footprint
    "batching": "continuous batching",   # Maximize GPU utilization

    # Context management strategy
    "context_strategy": {
        "max_prompt_tokens": 65_536,      # Use RAG to stay within budget
        "kv_cache_budget": 32_768,        # Compress beyond this
        "retrieval_compression": True,    # Semantic chunk deduplication
        "hierarchical_rag": True,         # Multi-level retrieval
    },

    # Cost at 512K context, 7B model, A100
    "estimated_cost_per_query": {
        "naive_512k": "$2.50–5.00",       # Economically unviable at scale
        "with_rag_64k": "$0.08–0.15",    # Target operating range
    },
}
```

**Key insight**: A well-designed RAG pipeline with 64K effective context often outperforms naive 512K full-document feeding — at 20× lower cost — because of the retrieval noise problem (Gap 10).

-----

## Part 8 — Fiserv Deployment Playbook (Master) {#part-8}

### 8.1 Use Cases Mapped to Context Requirements

|Fiserv Use Case                      |Context Needed  |Lighthouse Benefit|Priority|
|-------------------------------------|----------------|------------------|--------|
|Full regulatory PDF analysis         |50K–200K tokens |Critical          |HIGH    |
|Multi-document compliance audit      |100K–500K tokens|Essential         |HIGH    |
|Legacy COBOL + documentation analysis|30K–100K tokens |High              |MEDIUM  |
|Payment transaction audit trails     |20K–80K tokens  |Moderate          |MEDIUM  |
|Contracts portfolio review           |200K–1M tokens  |Essential         |HIGH    |
|SWIFT message chain analysis         |10K–50K tokens  |Moderate          |LOW     |
|Risk classification at scale         |8K–32K tokens   |Low               |LOW     |

### 8.2 The Leadership Business Case

**Frame for Fiserv stakeholders:**

**Problem statement** (one sentence): Processing a 300-page regulatory PDF requires 200K+ tokens; today’s LLMs either truncate (missing critical clauses) or are cost-prohibitive to train.

**Solution**: An ELM pre-trained with Lighthouse Attention at 128K–512K context enables full-document compliance analysis — making it economically viable at enterprise scale.

**Risk mitigation** (critical for conservative financial services): Lighthouse is a training-only technique. The deployed model is completely standard — no novel inference infrastructure, no custom kernels at runtime, no vendor lock-in.

**Cost model**:

- Training: use the 47% reduction at 128K only as an illustrative scenario until reproduced locally.
- Compliance analyst productivity: measure in a pilot; do not promise 10x throughput before controlled review.
- Regulatory risk: can be reduced only if citation faithfulness, human review, audit replay, and governance controls pass.

**Open source and verifiable**: Full code is published at `github.com/ighoshsubho/lighthouse-attention`. Enterprise training should include a reproduction exercise, not rely on the claim alone.

**What this is not**: A complete enterprise AI system. Lighthouse is the training foundation for the ELM core. The full enterprise system requires retrieval fabric, memory architecture, governance, and agentic orchestration — all separately designed.

### 8.3 Eval CI/CD Gate

```yaml
# .github/workflows/elm-eval-gate.yml
name: ELM Eval Gate

on: [push, pull_request]

jobs:
  elm_eval:
    runs-on: self-hosted-gpu
    steps:
      - name: SDPA recoverability check
        run: |
          python eval/recoverability.py \
            --model $MODEL_PATH \
            --perplexity-delta-max 0.005

      - name: Compliance obligation extraction
        run: |
          python eval/compliance_f1.py \
            --model $MODEL_PATH \
            --dataset data/compliance_labeled_50.jsonl \
            --min-f1 0.87

      - name: Needle-in-haystack at 32K, 64K, 128K
        run: |
          python eval/niah.py \
            --model $MODEL_PATH \
            --context-lengths 32768 65536 131072 \
            --min-accuracy 0.90

      - name: Hallucination rate on regulatory QA
        run: |
          python eval/hallucination_rate.py \
            --model $MODEL_PATH \
            --dataset data/regulatory_qa_adversarial.jsonl \
            --max-hallucination-rate 0.05

      - name: Block merge on any failure
        if: failure()
        run: exit 1
```

### 8.4 MCP Server Integration

```python
# mcp_server/elm_compliance_tools.py
import mcp
from elm_client import elm_inference, load_and_tokenize

@mcp.tool()
async def analyze_regulatory_document(
    document_path: str,
    analysis_type: str = "obligation_extraction",
    jurisdiction: str = "EU",
    effective_date: str = "2026-01-01",
) -> dict:
    """
    Analyze a full regulatory document using the Fiserv ELM.
    Applies jurisdiction and temporal filtering before inference.
    Supports documents up to 128K tokens after filtering.
    """
    # Governance: filter before sending to model
    filtered_text = apply_policy_filter(
        document_path,
        jurisdiction=jurisdiction,
        effective_date=effective_date,
        remove_superseded=True,
        remove_irrelevant_sections=True,
    )

    tokens = tokenize(filtered_text)

    if len(tokens) > 131_072:
        # Hierarchical RAG fallback — don't truncate, retrieve relevantly
        tokens = hierarchical_rag_compress(tokens, target=65_536)

    response = await elm_inference(tokens=tokens, task=analysis_type)

    return {
        "obligations": response.obligations,
        "risks": response.risk_items,
        "confidence_scores": response.confidence,
        "source_citations": response.citations,     # Clause-level attribution
        "audit_trace_id": response.trace_id,        # For explainability replay
        "filtering_applied": {
            "jurisdiction": jurisdiction,
            "effective_date": effective_date,
            "tokens_filtered_out": response.filtered_count,
        },
    }
```

-----

## Quick Reference Card {#quick-ref}

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  LIGHTHOUSE ATTENTION — ENTERPRISE ELM CHEAT SHEET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT LIGHTHOUSE IS
  Training-only hierarchical sparse attention wrapper.
  Deployed model = standard full attention. No inference changes.
  Source: Nous Research, arXiv:2605.06554, May 2026.

WHAT LIGHTHOUSE IS NOT
  Not an inference optimizer.
  Not a memory architecture.
  Not a retrieval strategy.
  Not a governance solution.
  Not a complete ELM system.

THE 4 FORWARD-PASS STAGES
  1. PYRAMID      Pool Q, K, V symmetrically — L levels, with causal span checks
  2. SCORE+SELECT Param-free dot-product scoring, top-K bitonic selection
  3. FA ATTENTION Stock FlashAttention on dense gathered sub-sequence
  4. SCATTER      Deterministic scatter-back to original positions

THE 2-STAGE TRAINING RECIPE
  Stage 1 (85–95% tokens): Lighthouse active → speedup + efficiency
  Stage 2 (5–15% tokens):  Dense SDPA → quality recovery
  Deployment:              Remove Lighthouse, serve as standard model

KEY NUMBERS
  Speedup at 98K context:  1.4–1.7× wall-clock
  Speedup at 512K context: ~17× attention fwd+bwd (single B200)
  Complexity:              O(N log N) vs O(N²) dense
  Enterprise role: important training-efficiency component, not a measured share of total readiness

KEY HYPERPARAMETERS
  p (pooling factor):  2 (quality) or 4 (speed)
  L (pyramid levels):  log_p(N/K)
  K (top-K budget):    512–2048; K ≈ N/500 heuristic
  Recovery ratio:      5–15% of total tokens

THE 13 GAPS (WHAT LIGHTHOUSE DOESN'T SOLVE)
  1. Inference-time scalability (KV cache, latency, concurrency)
  2. Memory architecture (episodic, semantic, organizational)
  3. Multi-document reasoning (provenance, contradiction, versioning)
  4. Advanced retrieval (hierarchical, adaptive, agentic)
  5. Enterprise evaluation (hallucination, citation faithfulness, audit)
  6. Explainability tooling (token lineage, audit trace)
  7. Fine-tuning strategy (instruction tuning, RLHF, alignment)
  8. Hybrid attention (MoE, SSM, recurrent memory)
  9. Data governance (PII, jurisdiction, deletion compliance)
  10. Long-context accuracy degradation (retrieval noise)
  11. Infrastructure complexity (heterogeneous clusters, storage)
  12. Synthetic data strategy (augmenting small enterprise corpora)
  13. Agentic orchestration (multi-agent, tool use, workflow)

CODE + PAPER
  github.com/ighoshsubho/lighthouse-attention
  arxiv.org/abs/2605.06554
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

-----

## Enterprise Training Readiness Pack {#training-readiness}

Use this pack to turn the tutorial into enterprise classroom material. Without these artifacts, the document is a technical briefing, not a complete training course.

### Learning Objectives

By the end of training, learners should be able to:

- Explain what Lighthouse Attention changes during training and what it does not change at inference.
- Identify when long context, RAG, fine-tuning, or tool use is the right mechanism for an enterprise use case.
- Build a use-case readiness packet with data eligibility, model choice, eval gates, human oversight, and launch controls.
- Challenge hardware and cost claims by asking for context length, precision, batch size, optimizer, LoRA rank, KV cache, concurrency, and latency assumptions.
- Define enterprise evaluation gates for citation faithfulness, hallucination rate, temporal consistency, contradiction handling, and audit replayability.

### Prerequisites

- Transformer attention basics, including Q/K/V and causal masking.
- Practical RAG concepts: chunking, retrieval, reranking, citations, and source freshness.
- Basic model adaptation concepts: continued pretraining, SFT, LoRA/QLoRA, preference tuning, and eval sets.
- Financial-services governance basics: PII, customer data, SAR confidentiality, PCI DSS, model risk management, and human approval.

### Labs

| Lab | Input | Expected Output | Pass Criteria |
| --- | --- | --- | --- |
| Lighthouse mechanism walkthrough | Toy sequence and pyramid levels | Diagram of valid causal spans and invalid leakage cases | Learner correctly blocks future-leaking pooled spans. |
| Fine-tune vs RAG decision | Three enterprise scenarios | Architecture choice with rationale | Mutable facts go to RAG/tooling; stable behavior goes to fine-tuning. |
| Eval gate design | Regulatory extraction task | Metrics, datasets, thresholds, and failure policy | Includes precision/recall/F1, citation faithfulness, temporal consistency, and human review. |
| Hardware challenge | Claimed "one H100 is enough" estimate | Assumption checklist and benchmark plan | Learner identifies missing precision, context, batch, optimizer, activation, and serving assumptions. |
| Governance review | AML/SAR narrative proposal | Risk register and control map | SAR confidentiality, PII minimization, access control, audit logging, and human approval are covered. |

### Rubric

| Dimension | Meets Enterprise Standard |
| --- | --- |
| Technical accuracy | Distinguishes paper results, pseudocode, production code, and unverified assumptions. |
| Architecture judgment | Selects fine-tuning, RAG, tools, and human review based on data volatility and risk. |
| Compliance coverage | Maps use cases to data restrictions, audit needs, model risk controls, and approval workflows. |
| Evaluation quality | Uses domain-specific, adversarial, and regression tests with explicit pass/fail gates. |
| Operational realism | Includes hardware assumptions, monitoring, rollback, incident response, and owner accountability. |

### Instructor Notes and Answer Keys

Before classroom delivery, attach an instructor packet containing:

- Expected answers for every knowledge check and lab.
- Example "meets standard" and "does not meet standard" capstone submissions.
- Source snapshots or dated excerpts for model cards, licenses, and regulatory references because public pages can change.
- Common learner mistakes, especially overclaiming hardware fit, treating citations as proof of faithfulness, using SAR material without approval, and confusing Lighthouse training gains with inference scalability.
- Escalation guidance for questions that require legal, compliance, security, or model-risk review.

### Knowledge Checks

1. Why does Lighthouse not reduce KV-cache cost at inference?
2. What can go wrong if an averaged pyramid span is visible to a query token inside that span?
3. Why is SAR training data different from generic regulatory text?
4. Which facts must be supplied before accepting a claim that a model fits on one H100?
5. What is the difference between citation presence and citation faithfulness?

### Capstone Assignment

Learners produce a two-page enterprise readiness packet for one Fiserv use case:

- Use-case objective and non-goals.
- Data inventory, classification, redaction, and retention plan.
- Model-selection rationale with source links and license caveats.
- Fine-tune/RAG/tool architecture.
- Evaluation suite with thresholds and blocked-launch conditions.
- Human oversight and escalation workflow.
- Hardware estimate with explicit assumptions.
- Monitoring, rollback, and model-risk owner.

-----

## 4-Week SME Learning Path {#learning-path}

**Week 1 — Foundations + Lighthouse Mechanics**

- Read Part 1 and Part 2 of this tutorial
- Read arXiv:2605.06554 Abstract + Section 1 (Introduction)
- Run the toy pyramid pooling lab and identify causal leakage cases
- Deliverable: Explain Lighthouse in 5 minutes and state three things it does not solve

**Week 2 — Deep Implementation**

- Read Part 3 and Part 4 of this tutorial in full
- Read the paper Sections 3 (Method) and 5 (Complexity)
- Clone `github.com/ighoshsubho/lighthouse-attention`
- Run or inspect the smallest available training configs; record any reproduction gaps
- Read paper Appendix C (Design Choices) for ablation intuition
- Deliverable: Reproduction note with environment, model size, context length, metric, and result

**Week 3 — Enterprise System Thinking**

- Read Part 6 (all 13 gaps) and Part 7 (full system architecture)
- Research one solution per gap (e.g., SnapKV for Gap 1, GraphRAG for Gap 3)
- Map each gap to a concrete Fiserv risk or use case
- Complete the fine-tune vs RAG decision lab and governance review lab
- Deliverable: A 2-page "Lighthouse for Fiserv" readiness packet

**Week 4 — Build and Teach**

- Implement or adapt the eval CI/CD gate from Part 8 for a synthetic or approved sanitized dataset
- Run the eval suite: NIAH, compliance F1, citation faithfulness, hallucination rate, temporal consistency
- Prepare a 30-minute internal technical session using this tutorial
- Deliverable: Tech talk plus capstone readiness packet reviewed against the rubric

-----

*Tutorial compiled from: arXiv:2605.06554 (Nous Research), github.com/ighoshsubho/lighthouse-attention, peer critique of enterprise ELM architecture gaps. May 2026.*
