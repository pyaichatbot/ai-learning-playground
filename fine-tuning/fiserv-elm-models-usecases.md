# Fiserv Enterprise Language Models (ELMs)

## Model Selection, Use Cases, Readiness Gates, and H100 Planning Guide

**Status**: Enterprise training draft. Use this as planning material, not as production approval.

This guide translates long-context and fine-tuning concepts into financial-services use cases. It intentionally separates model selection from compliance approval, model risk management, data eligibility, and production launch gates.

-----

## 1. Source-Backed Model Selection

Model facts below should be rechecked before procurement or training because model cards, licenses, and serving support change.

| Model | Size | Context | License / Terms | Enterprise Fit | Caveats |
| --- | --- | --- | --- | --- | --- |
| **Llama 4 Scout** | 17B active / 109B total MoE | 10M tokens | Custom Llama 4 Community License | Long-document and multi-document workflows | Not Apache/MIT; use requires legal review. Meta notes single-H100 fit only with on-the-fly int4 quantization, not full-precision training or high-concurrency serving. |
| **Microsoft Phi-4** | 14B dense | 16K tokens | MIT | Low-latency classification, routing, extraction over short context | Do not use as a 128K model. Best for constrained prompts and structured triage, not full-document compliance review. |
| **Gemma 4 31B Dense** | 30.7B dense | 256K tokens | Apache 2.0 | Compliance docs, reasoning, coding, multimodal extraction, structured output | "Apache 2.0" reduces licensing friction but does not remove privacy, procurement, export, data-use, or model-risk obligations. |
| **Gemma 4 26B A4B MoE** | 25.2B total / 3.8B active | 256K tokens | Apache 2.0 | Higher-concurrency structured output where Gemma 4 is approved | Validate serving stack support, output quality, and MoE memory behavior before selection. |
| **Dolphin / Mistral / Llama derivatives** | 7B-70B | Varies | Varies by base and derivative | Internal experiments only | Derivative licenses, training data provenance, and safety tuning must be reviewed before enterprise use. |

**Primary sources to keep attached to training materials**

Attach dated snapshots or reviewed excerpts of model cards, licenses, and regulatory sources to the course packet because public pages can change.

- Lighthouse Attention paper: <https://arxiv.org/abs/2605.06554>
- Lighthouse Attention code: <https://github.com/ighoshsubho/lighthouse-attention>
- Llama 4 Scout model card: <https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E>
- Microsoft Phi-4 model card: <https://huggingface.co/microsoft/phi-4>
- Gemma 4 model card: <https://ai.google.dev/gemma/docs/core/model_card_4>
- Gemma 4 announcement: <https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/>
- NIST AI Risk Management Framework: <https://www.nist.gov/itl/ai-risk-management-framework>
- Federal Reserve SR 11-7 model risk guidance: <https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm>
- FFIEC BSA/AML suspicious activity reporting: <https://bsaaml.ffiec.gov/manual/AssessingComplianceWithBSARegulatoryRequirements/04>
- FinCEN SAR confidentiality guidance: <https://www.fincen.gov/resources/advisories/fincen-advisory-fin-2010-a014>
- FinCEN SAR narrative guidance: <https://www.fincen.gov/resources/statutes-regulations/guidance/sar-narrative-guidance-package>
- FinCEN SAR supporting documentation guidance: <https://www.fincen.gov/resources/statutes-regulations/guidance/suspicious-activity-report-supporting-documentation>
- FFIEC customer identification program: <https://bsaaml.ffiec.gov/manual/AssessingComplianceWithBSARegulatoryRequirements/01>
- FFIEC customer due diligence: <https://bsaaml.ffiec.gov/manual/AssessingComplianceWithBSARegulatoryRequirements/02_ep>
- PCI DSS v4.0 publication: <https://www.pcisecuritystandards.org/about_us/press_releases/securing-the-future-of-payments-pci-ssc-publishes-pci-data-security-standard-v4-0/>
- PCI SSC document library: <https://www.pcisecuritystandards.org/document_library/>
- NIST SP 800-61 Rev. 3 incident response: <https://csrc.nist.gov/pubs/sp/800/61/r3/final>
- FTC Safeguards Rule: <https://www.ftc.gov/legal-library/browse/rules/safeguards-rule>
- EU DORA overview: <https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act>
- EU AI Act overview: <https://www.consilium.europa.eu/en/policies/artificial-intelligence-act/>
- CDC learning objectives guidance: <https://www.cdc.gov/training-development/php/about/design-training-learning-objectives.html>
- CDC quality training standards: <https://www.cdc.gov/training-development/php/qts/index.html>
- NIST NICE Workforce Framework: <https://csrc.nist.gov/pubs/sp/800/181/r1/final>

-----

## 2. Fine-Tune vs Fine-Tune + RAG

| Approach | Use When | Enterprise Control |
| --- | --- | --- |
| **Fine-tune only** | The target behavior is stable: classification taxonomy, extraction schema, writing style, routing policy. | Keep a fixed evaluation set, approval workflow, rollback plan, and model version record. |
| **Fine-tune + RAG** | The facts change: regulations, customer records, sanctions lists, incidents, policies, code repositories. | Validate retrieval freshness, citation faithfulness, access control, source provenance, and temporal filtering. |
| **RAG only** | The task is mostly knowledge lookup and the base model already follows the output schema reliably. | Prefer this when regulated data should not be embedded into weights. |

Rule of thumb: fine-tune behavior; retrieve mutable facts.

-----

## 3. Enterprise Readiness Gates

No use case below should move beyond pilot until these gates are passed.

| Gate | Required Evidence |
| --- | --- |
| Data eligibility | Written approval for each data source; SAR, PII, PCI, customer, and confidential data classified before ingestion. |
| Redaction and minimization | Demonstrated removal or masking of unnecessary PII, PAN, secrets, credentials, and privileged material. |
| Model risk management | Model inventory entry, intended-use statement, limitations, validation plan, monitoring plan, and owner sign-off aligned to SR 11-7 style controls. |
| Evaluation | Frozen test set, adversarial set, regression suite, human review rubric, and launch thresholds. |
| Explainability | Source citations, retrieval trace, model version, prompt/version trace, and audit replay procedure. |
| Human oversight | Clear decisions that require human approval, escalation paths, and override logging. |
| Security and resilience | Access controls, encryption, logging, incident response, third-party dependency review, and DORA/PCI considerations where applicable. |
| Legal and compliance | Review of model license, data rights, jurisdictional constraints, retention, deletion, and disclosure restrictions. |

-----

## 4. Fiserv ELM Use Cases

### Use Case 1: AML Transaction Narrative ELM

**What it does**
Drafts SAR-style narratives from transaction facts and classifies typologies such as structuring, layering, and smurfing.

**Recommended approach**
Fine-tune for narrative structure and typology language; RAG for current transactions, customer profiles, and watchlist data.

**Data eligibility**

- Do not train directly on SAR filings or SAR existence indicators unless legal/compliance explicitly approves the pipeline. SAR confidentiality rules prohibit unauthorized disclosure of SARs or information that would reveal a SAR.
- Prefer sanitized typology examples, approved narrative templates, and synthetic SAR-like training examples generated from non-SAR underlying facts.
- Customer and transaction data require strict access control, minimization, retention, and audit logging.
- Preserve supporting documentation references because SAR narratives should identify the records that support the suspicious-activity conclusion.
- Model outputs must never decide filing status autonomously; they can draft or triage for analyst review.

**Evaluation gates**

- Typology F1 by class.
- Narrative completeness against a human rubric.
- False-positive and false-negative review on high-risk patterns.
- Citation or evidence trace to underlying transactions.
- Narrative sufficiency: who, what, when, where, why, and how are present when available.
- Continuing-activity and referral workflow checks.
- Human AML analyst approval before filing or external use.

**Initial model candidates**
Gemma 4 31B or Llama 4 Scout for long transaction histories. Validate against Phi-4 for short, low-latency triage prompts.

### Use Case 2: Regulatory Obligation Extraction ELM

**What it does**
Extracts obligations from regulatory PDFs and policies: actor, action, deadline, evidence, jurisdiction, effective date, exceptions, and source citation.

**Recommended approach**
Fine-tune for schema and regulatory language; RAG for current regulations, amendments, interpretations, and policy overlays.

**Data eligibility**

- Use licensed or public regulatory text and approved internal policy documents.
- Preserve document version, effective date, jurisdiction, source URL, and clause identifiers.
- Maintain a supersession index so obsolete clauses do not override current rules.

**Evaluation gates**

- Precision, recall, and F1 per schema field.
- Citation faithfulness at clause/page level.
- Temporal consistency for amended and superseded provisions.
- Contradiction detection across overlapping regulations.
- Human compliance review for launch set and high-risk outputs.

**Initial model candidates**
Gemma 4 31B for most cases; Llama 4 Scout only where 200K+ token context is proven necessary and license/serving constraints are accepted.

### Use Case 3: Payment Incident Triage ELM

**What it does**
Classifies payment failures, outages, fraud alerts, severity, likely root cause, SLA impact, and routing destination.

**Recommended approach**
Fine-tune for taxonomy and routing. Add lightweight RAG/tool calls for live system status, error-code lookup, and current incident context.

**Data eligibility**

- Use incident tickets after redacting customer data, PAN, credentials, secrets, and privileged internal notes.
- Preserve service, region, timestamp, SLA, and resolution labels.
- Keep separation between training data and live production incident streams.
- Mark whether each incident is suspected or confirmed to affect the cardholder data environment.
- Align response labels with the incident response process: preparation, detection/analysis, containment, eradication, recovery, and lessons learned.

**Evaluation gates**

- Severity accuracy with high recall on critical incidents.
- Team routing accuracy.
- SLA-impact calibration.
- Regression tests for rare but severe outages.
- Incident-response plan activation accuracy for CDE-impacting events.
- Post-incident lesson and recovery recommendation quality.
- Human approval for customer-impacting communications.

**Initial model candidates**
Phi-4 for short-context triage and Gemma 4 26B/31B where longer incident history or structured output quality matters.

### Use Case 4: Legacy COBOL Modernization ELM

**What it does**
Explains COBOL source and related documentation, maps business rules, suggests modernization candidates, and flags high-risk code paths.

**Recommended approach**
Fine-tune on approved code-to-explanation and code-to-test examples; RAG over source repositories, data dictionaries, runbooks, and dependency maps.

**Data eligibility**

- Exclude secrets, credentials, customer data, and restricted third-party code.
- Track repository, commit hash, data classification, and owning system.
- Preserve provenance from generated explanation to source files.

**Evaluation gates**

- Business-rule extraction accuracy.
- Compilation or static-analysis checks for generated code.
- Test suggestion quality reviewed by maintainers.
- Security review for generated modernization code.
- Human engineering approval before code migration.

**Initial model candidates**
Llama 4 Scout for very large files and associated docs if legal/infra approve; Gemma 4 31B for shorter repository slices.

### Use Case 5: Compliance Knowledge ELM

**What it does**
Answers compliance officer questions over internal policy documents with citations, caveats, and escalation guidance.

**Recommended approach**
RAG-first. Fine-tune only for tone, answer structure, refusal behavior, and escalation policy.

**Data eligibility**

- Use approved policy repositories with versioning and access control.
- Restrict answers by user entitlement and jurisdiction.
- Avoid embedding fast-changing policies into weights unless a retraining and deprecation process exists.

**Evaluation gates**

- Citation faithfulness.
- Refusal accuracy for unsupported or out-of-scope questions.
- Policy hierarchy handling.
- Temporal correctness against effective dates.
- Escalation to compliance SMEs for ambiguous cases.

**Initial model candidates**
Gemma 4 31B or another approved structured-output model. Phi-4 only for constrained short-context Q&A or routing.

### Use Case 6: Audit Report Generation ELM

**What it does**
Drafts audit report sections from findings, control tests, prior reports, and remediation evidence.

**Recommended approach**
Fine-tune for audit voice and structure; RAG for current-year evidence, control test results, issue tracker state, and policy references.

**Data eligibility**

- Use historical audit reports only after confidentiality classification and redaction.
- Preserve audit period, control ID, finding severity, management response, and remediation status.
- Restrict generated outputs to draft status until auditor approval.

**Evaluation gates**

- Finding severity consistency.
- Evidence completeness.
- Citation to control evidence and test results.
- Hallucination rate on missing evidence.
- Auditor sign-off before distribution.

**Initial model candidates**
Gemma 4 31B for structured drafting; Phi-4 for severity or routing classifiers.

### Use Case 7: KYC / Customer Risk Classification ELM

**What it does**
Synthesizes customer profile data, transaction patterns, sanctions/PEP/adverse media signals, and produces a risk tier with narrative rationale.

**Recommended approach**
Fine-tune stable risk taxonomy and narrative format; RAG/tool calls for live sanctions, PEP, adverse media, and transaction data.

**Data eligibility**

- Customer data requires strict minimization, access controls, and audit logs.
- Include customer identification program fields only when approved: identity collection, document or non-documentary verification, and record retention.
- Include customer due diligence and beneficial-ownership fields only when the source system and permitted use are clear.
- Sanctions and adverse media sources must preserve source, timestamp, and match confidence.
- Avoid using protected characteristics or proxies unless legal/compliance explicitly approves and tests for disparate impact.
- Maintain linkage between risk profiles, ongoing monitoring, OFAC/sanctions checks, and SAR escalation triggers.

**Evaluation gates**

- Risk-tier accuracy and calibration.
- False-negative review on high-risk customers.
- Bias and fairness analysis where customer-impacting decisions are possible.
- Evidence trace for each risk factor.
- Human KYC analyst approval for final disposition.

**Initial model candidates**
Phi-4 for short-context classification; Gemma 4 31B where richer context and structured rationale are required.

-----

## 5. H100 Planning With Explicit Assumptions

Hardware estimates are scenario planning inputs, not commitments. Actual needs depend on sequence length, precision, LoRA rank, batch size, optimizer, activation checkpointing, sequence packing, parallelism, and target latency.

| Scenario | Likely Hardware Shape | Assumptions |
| --- | --- | --- |
| Phi-4 14B LoRA/QLoRA short-context triage | 1 H100 80GB is plausible | 16K context or less, small batch, PEFT, no full fine-tune, careful activation checkpointing. |
| Gemma 4 31B PEFT at moderate context | 1-2 H100 80GB for experiments; more for throughput | PEFT/QLoRA, limited batch size, 32K-128K context pilot, explicit memory profiling required. |
| Gemma 4 31B long-context serving | 1+ H100 per low-concurrency endpoint | KV cache dominates at high context; benchmark TTFT, throughput, and concurrency before launch. |
| Llama 4 Scout exploratory inference | 1 H100 may be possible only with int4 quantization per Meta model-card language | This is not the same as full-precision training or high-concurrency serving. Legal and infrastructure review required. |
| Llama 4 Scout long-context production | Multi-GPU planning required | 200K+ prompts require KV-cache, latency, and batch-concurrency benchmarks. |

Never present "one H100 is enough" without the workload profile and memory trace.

-----

## 6. Recommended Rollout Sequence

| Phase | Use Case | Why First / Later | Minimum Exit Criteria |
| --- | --- | --- | --- |
| **1** | Payment Incident Triage | Lowest regulatory exposure and clearest labels. | Severity/routing metrics pass, redaction works, human approval workflow exists. |
| **2** | Compliance Knowledge Q&A | High internal value; RAG-first limits weight-level data risk. | Citation faithfulness and refusal tests pass. |
| **3** | Regulatory Obligation Extraction | Strong structured-output value with auditable metrics. | Clause-level F1, temporal consistency, and human review pass. |
| **4** | Audit Report Drafting | Useful but sensitive; requires report/evidence governance. | Evidence-citation and hallucination gates pass. |
| **5** | KYC Risk Classification | Customer-impacting; needs stronger fairness and governance review. | Bias, calibration, and analyst-review gates pass. |
| **6** | AML / SAR Narrative Drafting | High value but highest confidentiality risk. | SAR confidentiality controls, legal approval, and human filing workflow pass. |
| **7** | COBOL Modernization | Long data prep and engineering review path. | Code provenance, security review, and maintainer validation pass. |

-----

## 7. Architecture Pattern Summary

```
For every ELM:

  APPROVED DATA SOURCES
      |
      v
  INGESTION + GOVERNANCE
    - classification, redaction, lineage
    - jurisdiction and effective-date metadata
    - access control and audit logs
      |
      v
  FINE-TUNED MODEL BEHAVIOR
    - task schema
    - writing style
    - routing and refusal policy
      |
      v
  RAG / TOOL LAYER FOR MUTABLE FACTS
    - current regulations, policies, tickets, sanctions, customer data
    - source citations and retrieval trace
      |
      v
  OUTPUT
    - structured JSON or draft narrative
    - confidence/calibration signal
    - source citations
    - audit trace ID
    - human review status
```

-----

## 8. Training Artifacts Required Before Delivery

| Artifact | Purpose |
| --- | --- |
| Learning objectives | State what learners must be able to do, such as select fine-tune vs RAG, identify data restrictions, and design eval gates. |
| Prerequisites | Define expected knowledge: transformers, RAG, data governance, financial-services risk basics. |
| Lab datasets | Use synthetic or approved sanitized examples with answer keys. Do not use uncontrolled SAR, customer, PCI, or confidential material. |
| Rubrics | Score architecture proposals, model cards, eval plans, and governance plans. |
| Knowledge checks | Include short quizzes on model facts, compliance risks, and use-case design decisions. |
| Capstone | Require learners to produce a use-case readiness packet: data inventory, model choice, RAG/fine-tune plan, eval suite, launch gates, and risk register. |
| Instructor notes | Include expected answers, common mistakes, escalation points, and source links. |

Learning objectives should use action verbs, conditions, and measurable pass criteria. Labs should be interactive and directly assessed against the stated objectives.

-----

## 9. Minimum Enterprise-Ready Deliverable

A use case is enterprise-training-ready only when the learner can produce:

1. A source-backed model selection rationale.
2. A data eligibility and redaction plan.
3. A fine-tune/RAG/tooling architecture.
4. A model risk and compliance control map.
5. An evaluation suite with pass/fail thresholds.
6. A human oversight and escalation workflow.
7. A hardware estimate with explicit assumptions.
8. A rollback and monitoring plan.

-----

*Based on Lighthouse Attention research (arXiv:2605.06554, Nous Research, May 2026), official model cards and announcements checked on May 24, 2026, and financial-services governance sources listed above.*
