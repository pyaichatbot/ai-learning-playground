# EU AI Act Assessment Notebook

Use this notebook to classify an AI system, decide which EU AI Act obligations apply, and maintain a living evidence record for risk management, data governance, transparency, human oversight, and post-deployment monitoring.

This notebook is decision-driven. Do not mark a control complete unless the evidence exists, is linked, has an owner, and has been reviewed. Use `Insufficient evidence` when a claim cannot be proven.

This is an engineering and governance worksheet, not legal advice. Have counsel or your compliance function confirm the final classification, operator role, and obligations before launch.

## 1. Source and Version Control

| Field | Answer |
|---|---|
| Legal source reviewed | Regulation (EU) 2024/1689, Artificial Intelligence Act |
| Official source URL | https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng |
| Official Journal reference | OJ L, 2024/1689, 12.7.2024 |
| CELEX | 32024R1689 |
| Assessment version |  |
| Assessment owner |  |
| Legal reviewer |  |
| Engineering reviewer |  |
| Last reviewed |  |
| Next review trigger | Launch / model change / data change / use-case change / incident / regulatory update |

## 2. Decision Rules

Use these rules consistently across projects.

### Allowed Decisions

| Decision | Meaning |
|---|---|
| Yes | Applies and is supported by evidence |
| No | Does not apply, with negative rationale and evidence |
| Unsure | More analysis is needed |
| Insufficient evidence | The assessor cannot prove the claim from available evidence |
| Not applicable | The control does not apply to this system or role |

### Evidence Quality

| Level | Evidence quality | Examples |
|---|---|---|
| E0 | No evidence | Verbal claim, blank field, unsupported assertion |
| E1 | Weak evidence | Unreviewed note, draft design, incomplete ticket |
| E2 | Moderate evidence | Linked documentation, config, code reference, policy, test plan |
| E3 | Strong evidence | Passing test result, audit log sample, signed review, approved DPIA/security review, production dashboard |
| E4 | Independent evidence | External audit, conformity assessment, legal sign-off, third-party certification |

### Hard Fail Conditions

If any condition is true, the final decision must be `No-go` or `Conditional go` with an explicit blocker.

| Fail condition | Applies? | Evidence | Owner | Resolution date |
|---|---|---|---|---|
| Classification is `Unsure` or `Insufficient evidence` | Yes / No |  |  |  |
| A prohibited AI practice may apply | Yes / No |  |  |  |
| High-risk classification may apply but Articles 8-15 are not mapped | Yes / No |  |  |  |
| No named accountable owner exists | Yes / No |  |  |  |
| Risk register has unmitigated high-priority risks | Yes / No |  |  |  |
| Required datasets lack owner, source, validation, or approval | Yes / No |  |  |  |
| Human oversight is required but not implemented or tested | Yes / No |  |  |  |
| Article 50 transparency likely applies but user disclosure is missing | Yes / No |  |  |  |
| Monitoring, incident response, or rollback path is missing | Yes / No |  |  |  |
| Legal/compliance review is required but not completed | Yes / No |  |  |  |

## 3. System Overview

| Question | Answer |
|---|---|
| System name |  |
| Business owner |  |
| Technical owner |  |
| Intended purpose |  |
| Users or deployers |  |
| Affected persons |  |
| Jurisdictions where used |  |
| Model provider and model version |  |
| Is this a general-purpose AI model, an AI system, or an AI-enabled product? |  |
| Does the system make, recommend, rank, score, classify, or generate content? |  |
| Can outputs influence access to money, employment, education, public services, health, safety, legal rights, or essential services? |  |
| What is explicitly out of scope? |  |
| Which system components generate, transform, retrieve, score, rank, or act on AI output? |  |

## 4. Operator Role

Identify your role first. Obligations differ by role.

| Role | Decision | Execution responsibility | Evidence | Evidence level | Reviewer |
|---|---|---|---|---|---|
| Provider: you develop or place the system on the market or put it into service under your name | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Deployer: you use an AI system under your authority | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Product manufacturer | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Importer | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Distributor | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Authorised representative | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |

## 5. Risk Classification Decision

Do not start with Article 8. Start here.

| Classification | Decision | Positive or negative justification | Evidence | Evidence level | Reviewer |
|---|---|---|---|---|---|
| Prohibited AI practice | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |
| High-risk AI system under Article 6 and Annex III | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |
| High-risk because the AI system is a safety component of a regulated product | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Transparency-obligation system under Article 50 | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |
| General-purpose AI model obligation applies | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Limited or minimal-risk system | Yes / No / Unsure / Insufficient evidence |  |  | E0 / E1 / E2 / E3 / E4 |  |

### Annex III High-Risk Screen

| Annex III area | Decision | Positive or negative justification | System component or workflow checked | Evidence | Evidence level | Reviewer |
|---|---|---|---|---|---|---|
| Biometrics | Yes / No / Unsure / Insufficient evidence |  |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Critical infrastructure safety component | Yes / No / Unsure / Insufficient evidence |  |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Education and vocational training | Yes / No / Unsure / Insufficient evidence |  |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Employment, worker management, or access to self-employment | Yes / No / Unsure / Insufficient evidence |  |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Essential private services or public services and benefits | Yes / No / Unsure / Insufficient evidence |  |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Law enforcement | Yes / No / Unsure / Insufficient evidence |  |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Migration, asylum, or border control management | Yes / No / Unsure / Insufficient evidence |  |  |  | E0 / E1 / E2 / E3 / E4 |  |
| Administration of justice or democratic processes | Yes / No / Unsure / Insufficient evidence |  |  |  | E0 / E1 / E2 / E3 / E4 |  |

### Classification Rationale

| Question | Answer |
|---|---|
| Why is the system high-risk, limited-risk, or out of scope? |  |
| Does the system materially influence a decision about a natural person? |  |
| Is the system only performing a narrow procedural, preparatory, or assistive task? |  |
| Could profiling occur? |  |
| What human decision or business process receives the output? |  |
| What would make the classification change later? |  |
| Which evidence would change this decision from `Unsure` to `Yes` or `No`? |  |

## 6. Applicability Matrix

For high-risk systems, Articles 8-15 become the core engineering control set. For non-high-risk systems, use this matrix as a voluntary governance baseline and document which legal obligations still apply.

| Article | Control area | Mandatory? | Provider responsibility | Deployer responsibility | Owner | Evidence | Evidence level | Status |
|---|---|---|---|---|---|---|---|---|
| 8 | Compliance with high-risk requirements | Yes / No / Voluntary / Not applicable |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Not started / Partial / Complete / Blocked |
| 9 | Risk management system | Yes / No / Voluntary / Not applicable |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Not started / Partial / Complete / Blocked |
| 10 | Data and data governance | Yes / No / Voluntary / Not applicable |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Not started / Partial / Complete / Blocked |
| 11 | Technical documentation | Yes / No / Voluntary / Not applicable |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Not started / Partial / Complete / Blocked |
| 12 | Record-keeping and logs | Yes / No / Voluntary / Not applicable |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Not started / Partial / Complete / Blocked |
| 13 | Transparency and instructions for use | Yes / No / Voluntary / Not applicable |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Not started / Partial / Complete / Blocked |
| 14 | Human oversight | Yes / No / Voluntary / Not applicable |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Not started / Partial / Complete / Blocked |
| 15 | Accuracy, robustness, and cybersecurity | Yes / No / Voluntary / Not applicable |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Not started / Partial / Complete / Blocked |
| 50 | AI interaction, generated content, or deepfake transparency | Yes / No / Voluntary / Not applicable |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Not started / Partial / Complete / Blocked |

## 7. Article 8: Compliance Summary

Article 8 is not a standalone architecture diagram. It is the control that says a high-risk AI system must comply with the Section 2 requirements, taking into account intended purpose, state of the art, and the Article 9 risk management system.

| Compliance question | Answer |
|---|---|
| Which Articles 8-15 requirements apply? |  |
| Which requirements are handled by product safety, sectoral, or existing compliance processes? |  |
| Which requirements need AI-specific controls? |  |
| How is duplicate documentation avoided? |  |
| Who approves readiness before launch? |  |
| What evidence proves compliance? |  |

### System Component Control Map

Map controls to concrete architecture. A control that is not attached to a component is not implemented.

| Component | AI function | Related obligation | Risk IDs | Data IDs | Control IDs | Test IDs | Evidence | Owner |
|---|---|---|---|---|---|---|---|---|
|  | Model call / retrieval / ranking / scoring / generation / tool use / logging / UI |  |  |  |  |  |  |  |
|  | Model call / retrieval / ranking / scoring / generation / tool use / logging / UI |  |  |  |  |  |  |  |

### Compliance Control Checklist

| Control ID | Control | Required evidence | Evidence level | Status | Blocker if incomplete? |
|---|---|---|---|---|---|
| C-001 | Classification decision documented | Classification memo, legal sign-off | E3 / E4 |  | Yes |
| C-002 | Requirements mapped to system components | Control matrix | E2 / E3 |  | Yes |
| C-003 | Risk management system established | Risk register, review cadence, mitigation evidence | E2 / E3 |  | Yes |
| C-004 | Data governance established | Data inventory, lineage, quality checks, bias review | E2 / E3 |  | Yes |
| C-005 | Technical documentation maintained | Architecture, model, data, eval, monitoring docs | E2 / E3 |  | Yes for high-risk |
| C-006 | Logs and records available | Logging design, retention policy, audit samples | E2 / E3 |  | Yes for high-risk |
| C-007 | Deployers receive instructions | User docs, limitations, misuse warnings | E2 / E3 |  | Yes where deployers exist |
| C-008 | Human oversight implemented | Oversight procedure, authority, escalation path, tested override | E3 |  | Yes where required |
| C-009 | Accuracy, robustness, and cybersecurity tested | Eval reports, red-team results, security review | E3 |  | Yes |
| C-010 | Post-deployment monitoring live | Dashboards, alert thresholds, incident process | E3 |  | Yes |

## 8. Article 9: Risk Management System

The risk management system should be continuous and iterative across the full lifecycle. It must identify known and reasonably foreseeable risks, evaluate risk under intended use and foreseeable misuse, adopt mitigations, test against defined metrics, and update from post-deployment evidence.

### Risk Scoring

| Score | Severity | Likelihood | Detectability |
|---|---|---|---|
| 1 | Negligible | Rare | Easy to detect before impact |
| 2 | Minor | Unlikely | Usually detected |
| 3 | Moderate | Possible | Sometimes detected |
| 4 | Major | Likely | Hard to detect |
| 5 | Severe | Frequent | Usually detected after impact |

Risk priority = Severity x Likelihood x Detectability.

### Risk Thresholds

| Priority range | Required decision |
|---|---|
| 1-20 | Acceptable with owner review |
| 21-50 | Mitigation required before launch or documented conditional acceptance |
| 51-90 | Launch blocker unless executive/legal acceptance is documented |
| 91-125 | No-go until risk is reduced |

### Risk Register

Each risk must name the system component and data/control links. Generic risks without component evidence should remain `Draft`.

| Risk ID | System-specific risk | Component | Affected persons | Intended use or misuse? | Severity | Likelihood | Detectability | Priority | Linked data IDs | Linked control IDs | Test IDs | Residual risk | Owner | Evidence | Status |
|---|---|---|---|---|---:|---:|---:|---:|---|---|---|---|---|---|---|
| R-001 |  |  |  | Intended / Misuse |  |  |  |  |  |  |  |  |  |  | Draft / Mitigating / Accepted / Blocked |
| R-002 |  |  |  | Intended / Misuse |  |  |  |  |  |  |  |  |  |  | Draft / Mitigating / Accepted / Blocked |
| R-003 |  |  |  | Intended / Misuse |  |  |  |  |  |  |  |  |  |  | Draft / Mitigating / Accepted / Blocked |

### Lifecycle Controls

| Lifecycle stage | Required activity | Evidence |
|---|---|---|
| Design | Identify hazards, affected groups, misuse paths, and legal constraints |  |
| Development | Build mitigations into architecture, prompts, tools, data pipeline, and UX |  |
| Pre-launch | Test against defined metrics and probabilistic thresholds |  |
| Launch | Confirm residual risk acceptance and owner approval |  |
| Operation | Monitor incidents, complaints, drift, and misuse |  |
| Change management | Reassess after model, data, prompt, tool, policy, or workflow change |  |
| Retirement | Disable access, retain required records, archive evidence |  |

### Risk Acceptance

| Question | Answer |
|---|---|
| Which residual risks remain? |  |
| Why are they acceptable? |  |
| Who has authority to accept them? |  |
| What risk threshold would block launch? |  |
| What signal would trigger rollback or suspension? |  |
| Which residual risks require legal, executive, or business acceptance? |  |
| Who signed off on residual risk acceptance? |  |

## 9. Article 10: Data Governance

Article 10 is broader than "good data." It requires governance over design choices, data origin, preparation, assumptions, suitability, bias examination, bias mitigation, data gaps, representativeness, statistical properties, and contextual fit for the intended purpose.

### Dataset Inventory

| Data ID | Dataset | Purpose | Owner | Source | Original collection purpose | Processing/preparation | Personal data? | Special category data? | Version | Refresh cadence | Review cadence | Approved? | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D-001 |  | Training / Validation / Testing / Retrieval / Prompt examples / Monitoring |  |  |  | Cleaning / labelling / chunking / embedding / filtering | Yes / No | Yes / No |  |  |  | Yes / No / Conditional |  |
| D-002 |  | Training / Validation / Testing / Retrieval / Prompt examples / Monitoring |  |  |  | Cleaning / labelling / chunking / embedding / filtering | Yes / No | Yes / No |  |  |  | Yes / No / Conditional |  |

### Data Governance Controls

| Control | Required question | Evidence |
|---|---|---|
| Design choices | Why were these data sources and features selected? |  |
| Collection origin | Where did the data come from, and what was the original collection purpose? |  |
| Preparation | How were data cleaned, labelled, enriched, aggregated, embedded, or filtered? |  |
| Assumptions | What is the data assumed to measure or represent? |  |
| Suitability | Is the data sufficient for the intended purpose and user population? |  |
| Bias examination | What bias tests were run and what groups could be affected? |  |
| Bias mitigation | What measures detect, prevent, or mitigate identified bias? |  |
| Data gaps | What gaps remain and how are they handled? |  |
| Representativeness | Does the data reflect the geographical, contextual, behavioural, or functional setting of use? |  |
| Feedback loops | Could system outputs influence future inputs or decisions? |  |

### Data Quality Review

| Data ID | Completeness | Error rate | Freshness | Representativeness | Bias findings | Validation process | Reviewer | Approved for use? |
|---|---:|---:|---|---|---|---|---|---|
| D-001 |  |  |  |  |  |  |  | Yes / No / Conditional |
| D-002 |  |  |  |  |  |  |  | Yes / No / Conditional |

### Special Category Data Check

Use this section if bias detection or correction requires special categories of personal data.

| Requirement | Answer | Evidence |
|---|---|---|
| Can bias detection be fulfilled without special category data? |  |  |
| Are synthetic or anonymised alternatives insufficient? |  |  |
| Are technical limitations on reuse in place? |  |  |
| Are security and privacy-preserving measures in place? |  |  |
| Is access restricted and documented? |  |  |
| Is transfer to other parties prevented? |  |  |
| Is deletion tied to bias correction or retention expiry? |  |  |
| Are records of processing activities updated? |  |  |

## 10. Traceability Matrix

This is the audit backbone. Every high or material risk must trace to data, components, controls, tests, monitoring, and evidence.

| Risk ID | Data IDs | Component | Control IDs | Test IDs | Monitoring signal | Evidence | Evidence level | Residual risk decision | Owner |
|---|---|---|---|---|---|---|---|---|---|
| R-001 |  |  |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Accepted / Blocked / Conditional |  |
| R-002 |  |  |  |  |  |  | E0 / E1 / E2 / E3 / E4 | Accepted / Blocked / Conditional |  |

## 11. Technical Documentation

Maintain this as an evidence index rather than a narrative.

| Evidence item | Location | Owner | Last updated | Status |
|---|---|---|---|---|
| Intended purpose and system description |  |  |  |  |
| Architecture diagram |  |  |  |  |
| Model and provider documentation |  |  |  |  |
| Data inventory and lineage |  |  |  |  |
| Prompt, retrieval, and tool design |  |  |  |  |
| Risk register |  |  |  |  |
| Evaluation report |  |  |  |  |
| Security review |  |  |  |  |
| Human oversight procedure |  |  |  |  |
| Monitoring and incident response plan |  |  |  |  |
| Deployer instructions or user documentation |  |  |  |  |

## 12. Transparency and User Instructions

| Question | Answer |
|---|---|
| Do users know when they are interacting with an AI system? |  |
| Are generated outputs clearly labelled where required? |  |
| Are limitations, failure modes, and intended uses documented? |  |
| Are users told what not to use the system for? |  |
| Are escalation and human review paths visible? |  |
| Is the information accessible to users with disabilities? |  |

## 13. Human Oversight

| Oversight control | Required answer |
|---|---|
| Which decisions require human review before action? |  |
| Which UI/API point presents the AI output to the reviewer? |  |
| Who performs oversight? |  |
| What training, competence, authority, and support do reviewers have? |  |
| Can reviewers override, ignore, stop, or escalate the system output? |  |
| What is the override workflow and where is it logged? |  |
| What evidence shows oversight actually happens? |  |
| What is the escalation SLA? |  |
| What sampled audit evidence proves reviewer behavior? |  |

## 14. Accuracy, Robustness, and Cybersecurity

| Test ID | Control area | Metric or test | Threshold | Latest result | Evidence | Pass/fail | Owner |
|---|---|---|---|---|---|---|---|
| T-001 | Accuracy for intended purpose |  |  |  |  | Pass / Fail / Not run |  |
| T-002 | Groundedness or citation support |  |  |  |  | Pass / Fail / Not run |  |
| T-003 | Robustness to ambiguous inputs |  |  |  |  | Pass / Fail / Not run |  |
| T-004 | Robustness to foreseeable misuse |  |  |  |  | Pass / Fail / Not run |  |
| T-005 | Prompt injection resistance |  |  |  |  | Pass / Fail / Not run |  |
| T-006 | Access control enforcement |  |  |  |  | Pass / Fail / Not run |  |
| T-007 | PII or secret leakage prevention |  |  |  |  | Pass / Fail / Not run |  |
| T-008 | Logging and auditability |  |  |  |  | Pass / Fail / Not run |  |
| T-009 | Availability and fallback |  |  |  |  | Pass / Fail / Not run |  |

## 15. Pre-Deployment Gate

| Gate | Required evidence | Decision | Blocker? | Approver |
|---|---|---|---|---|
| Classification complete | Classification matrix with reviewer | Pass / Fail | Yes |  |
| Role obligations mapped | Provider/deployer obligation matrix | Pass / Fail | Yes |  |
| Risk register complete | All material risks scored and assigned | Pass / Fail | Yes |  |
| Traceability complete | Risk-data-control-test-evidence links | Pass / Fail | Yes |  |
| Data governance approved | Dataset inventory and validation evidence | Pass / Fail | Yes |  |
| Human oversight tested | Override/escalation test evidence | Pass / Fail / Not applicable | Yes where required |  |
| Transparency implemented | User/deployer notice evidence | Pass / Fail / Not applicable | Yes where required |  |
| Monitoring and incident process ready | Dashboard, alert, and rollback evidence | Pass / Fail | Yes |  |
| Residual risks accepted | Named acceptance authority | Pass / Fail | Yes |  |

## 16. Post-Deployment Monitoring

| Signal | Source/dashboard | Owner | Threshold | Review cadence | Response | Feedback-loop action | Evidence |
|---|---|---|---|---|---|---|---|
| User complaint rate |  |  |  |  |  |  |  |
| Unsupported answer rate |  |  |  |  |  |  |  |
| Human override rate |  |  |  |  |  |  |  |
| Escalation rate |  |  |  |  |  |  |  |
| Policy violation rate |  |  |  |  |  |  |  |
| Retrieval miss rate |  |  |  |  |  |  |  |
| Security event rate |  |  |  |  |  |  |  |
| Model or provider incident |  |  |  |  |  |  |  |

## 17. Example Assessment: Enterprise HR RAG Chatbot

| Field | Example answer |
|---|---|
| Intended purpose | Answer employee questions about approved HR policies using retrieval from controlled company documents |
| Likely classification | Usually not high-risk if it only provides informational support and does not make or materially influence employment decisions |
| Classification caveat | May become high-risk if used to rank employees, evaluate performance, allocate work based on traits, recommend promotion or termination, screen candidates, or otherwise affect employment relationship decisions |
| Article 50 transparency | Likely relevant because users interact with an AI system |
| Core risks | Hallucinated HR advice, outdated policy retrieval, unequal answers, confidential data leakage, overreliance, prompt injection |
| Core controls | Approved document corpus, access control by employee role, grounded answers with citations, refusal for policy gaps, escalation to HR, monitoring, periodic evals |

### HR Chatbot Risk Mapping

| Risk | Impact | Mitigation | Evidence |
|---|---|---|---|
| Hallucination | Wrong HR advice | Retrieval grounding, citation requirement, answer refusal when source confidence is low |  |
| Outdated policy | Employee acts on superseded rule | Document approval workflow, versioning, stale-content alerts |  |
| Unequal or biased answer | Inconsistent treatment of employees | Regression tests across employee personas and protected-class-adjacent scenarios |  |
| Confidential data leakage | Exposure of salary, medical, disciplinary, or personal data | Role-based retrieval, PII redaction, access logs, least-privilege indexes |  |
| Overreliance | AI answer treated as final HR decision | Clear limitation text, escalation to HR, no automated decision authority |  |
| Prompt injection | User or document manipulates system behavior | Instruction hierarchy, document sanitisation, tool restrictions, adversarial evals |  |

### HR Chatbot Data Governance

| Data source | Control |
|---|---|
| HR policy documents | Only approved policy versions enter the retrieval index |
| Employee handbook | Versioned and reviewed by HR/legal |
| Benefits documentation | Source owner validates freshness and jurisdiction |
| User questions and feedback | Minimise retention, redact personal data, use only for approved monitoring and evals |
| Eval examples | Include normal, ambiguous, sensitive, and adversarial HR scenarios |

## 18. Final Assessment

| Decision | Answer |
|---|---|
| Final classification |  |
| Applicable obligations |  |
| Launch decision | Go / Conditional go / No-go / Insufficient evidence |
| Open blockers |  |
| Accepted residual risks |  |
| Acceptance criteria used |  |
| Required monitoring after launch |  |
| Approval owner |  |
| Approval date |  |
| Legal/compliance review completed? | Yes / No / Required before launch |

## 19. Change Log

| Date | Change | Risk impact | Reassessment needed? | Sections updated | Owner |
|---|---|---|---|---|---|
|  |  |  | Yes / No |  |  |

---

**Template Version:** 1.0  
**Last Updated:** 2026-05-05  
**Primary Legal Source:** Regulation (EU) 2024/1689, Artificial Intelligence Act, EUR-Lex: https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng
