---
name: eu-ai-act-codebase-assessor
description: Use when assessing a codebase, product repository, AI feature, chatbot, RAG system, agent, model integration, or data pipeline for EU AI Act risk classification and evidence-backed compliance gaps.
---

# EU AI Act Codebase Assessor

## Purpose

Generate a codebase-grounded EU AI Act risk assessment. Do not produce generic compliance advice. Tie every claim to files, routes, models, datasets, prompts, tools, logs, or missing evidence found in the repository. Use `Insufficient evidence` when a claim cannot be proven.

This skill supports engineering triage, not legal sign-off. Label final conclusions as assessment findings that need legal/compliance review.

## Required Workflow

1. Confirm scope: repository path, system or feature being assessed, intended users, geography, and whether the output is for internal triage or formal review.
2. Inspect the codebase before classifying risk. Prefer `rg`, package manifests, config files, API routes, model wrappers, prompt files, data ingestion, auth, logging, and docs.
3. Run the bundled scanner if available:

```bash
python3 skills/eu-ai-act-codebase-assessor/scripts/scan_ai_surfaces.py .
```

If the skill is installed outside the repo, resolve the script relative to this `SKILL.md`.

4. Identify AI surfaces:
   - Model providers, model names, model versions, embeddings, fine-tuning, or local models
   - RAG indexes, vector stores, document ingestion, retrieval, prompt assembly
   - Agents, tools, function calls, workflows, schedulers, or state-changing actions
   - User-facing AI interactions, generated content, chatbots, recommendations, scoring, ranking, classification, or decision support
   - Personal data, special category data, employee data, customer data, minors, vulnerable groups
5. Decide operator role: provider, deployer, importer, distributor, product manufacturer, authorised representative, or unclear. Map each applicable role to execution responsibilities.
6. Classify risk in this order:
   - Potential prohibited practice
   - High-risk under Article 6 and Annex III
   - High-risk as safety component of regulated product
   - Article 50 transparency obligation
   - GPAI model obligations
   - Limited or minimal risk
7. For high-risk or unclear systems, map evidence and gaps against Articles 8-15. For non-high-risk systems, still report voluntary controls and Article 50 transparency obligations where relevant.
8. Produce system-specific risks only. Each risk must link to a component, data source, control, test, monitoring signal, owner, and evidence. Mark generic risks as `Draft` or remove them.
9. Produce data governance findings using Article 10 concepts: data origin, collection purpose, preparation, assumptions, suitability, representativeness, bias examination, bias mitigation, data gaps, feedback loops, and special category safeguards.
10. Apply hard fail conditions before final decision.
11. End with a launch/readiness decision: `Go`, `Conditional go`, `No-go`, or `Insufficient evidence`.

## Decision and Evidence Rules

Allowed decisions: `Yes`, `No`, `Unsure`, `Insufficient evidence`, `Not applicable`.

Evidence levels:

| Level | Meaning |
|---|---|
| E0 | No evidence |
| E1 | Weak evidence: draft note, ticket, unreviewed claim |
| E2 | Moderate evidence: code reference, config, linked docs, policy, test plan |
| E3 | Strong evidence: passing test, audit log sample, approved review, dashboard, signed owner approval |
| E4 | Independent evidence: external audit, legal sign-off, conformity assessment, certification |

Hard fail conditions:

- Classification is `Unsure` or `Insufficient evidence`.
- A prohibited AI practice may apply.
- High-risk classification may apply but Articles 8-15 are not mapped.
- No named accountable owner exists.
- Risk register has unmitigated high-priority risks.
- Required datasets lack owner, source, validation, or approval.
- Human oversight is required but not implemented or tested.
- Article 50 transparency likely applies but disclosure is missing.
- Monitoring, incident response, or rollback path is missing.
- Legal/compliance review is required but not completed.

## Classification Anchors

Use Regulation (EU) 2024/1689 as the legal source. Cite the official source URL:

`https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng`

Core correction: Articles 8-15 are requirements for high-risk AI systems. Do not imply Articles 8-10 automatically apply to every AI feature. For lower-risk systems, use them only as voluntary governance controls unless another obligation applies.

Annex III high-risk areas to screen:

| Area | Examples to look for in code/docs |
|---|---|
| Biometrics | face ID, emotion recognition, biometric categorisation |
| Critical infrastructure | safety components for critical digital infrastructure, road traffic, water, gas, heating, electricity |
| Education | admissions, learning outcome evaluation, proctoring, educational level assessment |
| Employment | recruitment, candidate filtering, promotion, termination, task allocation, worker monitoring, performance evaluation |
| Essential services | public benefits, credit scoring, insurance risk/pricing, emergency call triage or dispatch |
| Law enforcement | victim/offender risk, evidence reliability, profiling, polygraphs |
| Migration/asylum/border | visa/asylum eligibility, border risk, identity detection |
| Justice/democracy | legal fact/law application for courts, election influence |

## Codebase Evidence Checklist

| Evidence | Search targets |
|---|---|
| Intended purpose | README, PRD, docs, route names, UI copy, prompts |
| Model use | `openai`, `anthropic`, `gemini`, `bedrock`, `vertex`, `ollama`, `langchain`, `llamaindex`, `model` |
| RAG/data sources | `embedding`, `vector`, `retrieval`, `chunk`, `index`, `pgvector`, `pinecone`, `weaviate`, `qdrant`, `chroma` |
| Prompts | `prompt`, `system message`, `instructions`, `.prompt`, `.md` |
| User impact | HR, hiring, candidate, employee, education, credit, insurance, health, legal, eligibility, score, rank |
| Human oversight | approval, review, escalation, manual, override, fallback |
| Transparency | disclosure, AI notice, generated, label, chatbot UI |
| Logging/records | audit, trace, log, telemetry, retention, session |
| Security | auth, access control, PII, redaction, secrets, prompt injection, moderation |
| Monitoring | eval, benchmark, regression, drift, incident, alert |

## Traceability Requirement

Every material risk must trace across this chain:

`Risk -> affected person -> system component -> data source -> control -> test/eval -> monitoring signal -> evidence -> owner -> residual risk decision`

If any link is missing, report it as a gap. Do not mark the risk accepted.

## Output Format

Use this exact structure unless the user asks otherwise:

```markdown
# EU AI Act Codebase Risk Assessment

## Executive Summary
- Classification:
- Confidence:
- Launch decision:
- Top blockers:

## Source and Scope
- Repository:
- Assessed feature/system:
- Legal source:
- Assessment date:
- Assumptions:

## Codebase AI Surface Inventory
| Surface | Files | What it does | User/affected person | Evidence strength |
|---|---|---|---|---|

## Operator Role
| Role | Decision | Execution responsibility | Evidence | Evidence level | Open question |
|---|---|---|---|---|---|

## Risk Classification
| Classification question | Decision | Positive or negative justification | Evidence | Evidence level | Reviewer needed |
|---|---|---|---|---|---|

## Annex III High-Risk Screen
| Area | Decision | Positive or negative justification | Component/workflow checked | Evidence | Evidence level |
|---|---|---|---|---|---|

## Applicable Obligations
| Obligation | Applies? | Provider responsibility | Deployer responsibility | Evidence | Evidence level | Gap |
|---|---|---|---|---|---|---|

## System Component Control Map
| Component | AI function | Related obligation | Risk IDs | Data IDs | Control IDs | Test IDs | Evidence | Owner |
|---|---|---|---|---|---|---|---|---|

## Risk Register
| ID | System-specific risk | Component | Impact | Severity | Likelihood | Detectability | Priority | Linked data | Linked controls | Linked tests | Residual risk | Evidence | Status |
|---|---|---|---|---:|---:|---:|---:|---|---|---|---|---|---|

## Data Governance Assessment
| Data ID | Data/control area | Owner | Source | Validation/review cycle | Evidence found | Gap | Recommended control |
|---|---|---|---|---|---|---|---|

## Traceability Matrix
| Risk ID | Data IDs | Component | Control IDs | Test IDs | Monitoring signal | Evidence | Evidence level | Residual risk decision | Owner |
|---|---|---|---|---|---|---|---|---|---|

## Transparency and Human Oversight
| Control | Evidence found | Gap | Recommendation |
|---|---|---|---|

## Monitoring, Logging, and Incident Response
| Control | Evidence found | Gap | Recommendation |
|---|---|---|---|

## Required Evidence Before Formal Sign-Off
- 

## Hard Fail Conditions
| Condition | Applies? | Evidence | Required resolution |
|---|---|---|---|

## Final Assessment
- Decision:
- Residual risks:
- Legal/compliance review needed:
```

## Common Mistakes

- Starting with Article 8 before classification. Classify first.
- Treating an internal chatbot as high-risk solely because it uses AI. Look at intended purpose and material influence.
- Missing employment risk. HR assistants can become high-risk if they evaluate workers, candidates, promotion, termination, task allocation, or performance.
- Treating RAG data as outside Article 10 thinking. Retrieval corpora, prompt examples, eval datasets, and monitoring data still need governance evidence.
- Making legal conclusions without evidence. Use `Insufficient evidence` when intent, users, or decision impact are unclear.
- Calling a control complete without evidence level E2 or better.
- Accepting residual risk without a named owner and acceptance rationale.
