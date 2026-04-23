# AI Learning Playground — 8 Cockpits Design Spec

**Date:** 2026-04-23  
**Author:** pyaichatbot  
**Status:** Approved — ready for implementation planning  
**Scope:** Full platform expansion — 8 new/upgraded cockpits covering the entire AI ecosystem

---

## 1. Vision

Extend the AI Learning Playground from its current single live cockpit (Prompt Reality) into a full visual AI education platform. Every concept — from how an LLM is trained, to how agents communicate over protocols, to how multi-agent teams orchestrate work — becomes an interactive, animated, simulation-based experience. Audience: beginners through experts, all in one playground.

**Core promise:** Every cockpit lets the user see, touch, and break the thing they are learning — not read about it.

---

## 2. Platform Experience

The product is not a set of disconnected demos. It is a guided playground with a visible learning journey, strong orientation, and continuity between cockpits.

**Platform shell**
- **Playground Home** is the entry point. It presents the 8 cockpits as a visual learning map grouped by theme: Foundations, Protocols, Orchestration, and End-to-End Workflows.
- **Recommended pathways** give users three ways to enter: Beginner Path, Builder Path, and Expert Explorer. The same cockpits are reused, but ordered differently.
- **Progress rails** show "Start here", "Continue", and "Next best cockpit" recommendations so users never hit a dead end after completing a scenario.
- **Capstone framing** makes Workflow & DAG Visualizer the explicit final synthesis experience, with links back into prior cockpits using the exact simulation context that produced each step.

**Learner journey contract**
- Every cockpit has a consistent entry sequence: Intro card → Quick win scenario → Guided walkthrough → Sandbox mode.
- Every cockpit exposes the same completion states: `not-started`, `explored`, `walkthrough-complete`, `sandbox-built`.
- Every cockpit ends with a clear next action: replay, modify, compare with another cockpit, or jump to the next recommended concept.
- Platform chrome includes a persistent breadcrumb, pathway progress, and context-sensitive glossary access.

**One-stop ecosystem promise**
- The user can start from zero, move through progressively harder concepts, save or share what they built, and revisit the same simulation later.
- Cross-cockpit transitions must preserve context so the system feels like one living model, not separate pages with similar styling.

---

## 3. Guiding Principles

- **Simulation-only, always client-side.** No backend, no real network calls, no API keys required. 100% deployable to GitHub Pages as-is.
- **Three interaction levels in every cockpit.** Level 1 = trigger & observe. Level 2 = edit params & explore. Level 3 = build custom entities & experiment.
- **Animation as a first-class teaching tool.** HyperFrames powers all multi-scene animated sequences. GSAP handles in-page graph and node animations. D3 handles data visualizations.
- **SimulatedProtocol pattern.** One architecture, eight instances. Every cockpit that represents a protocol (MCP, A2A, AG-UI, multi-agent) shares the same three-layer engine: Simulation Layer + Animation Layer + Interaction Layer.
- **Beginner to expert in one cockpit.** Progressive depth — not separate beginner/expert apps. Explorer tab → Walkthrough tab → Inspector tab.
- **Durable learning without servers.** Client-side only does not mean disposable; user-created scenarios must survive refreshes and support export/import/share links.

---

## 4. Tech Stack

### Unchanged
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand (global state)
- Existing routing, mode system (Basic/Advanced), cockpit navigation
- GitHub Pages deployment

### New Additions
| Library | Purpose |
|---------|---------|
| HyperFrames | Multi-scene animated sequences (packet motion, training pipeline, protocol walkthroughs). HTML/GSAP-based, fully scrubbable, renders in-browser. **Chosen over Remotion** because Remotion is a React video rendering framework designed for exporting MP4s — not for interactive, user-controlled in-page animations. HyperFrames timelines pause, rewind, and respond to user interaction, which is what the cockpits require. |
| GSAP | In-page animations (force graph nodes, tree expansions, highlight pulses, counters) |
| D3.js | Data visualizations (force graphs, DAGs, loss curves, embedding space, token timelines) |
| Three.js | 3D loss landscape in ML Training Lab |

### New Source Directories
```
src/lib/simulation/         ← SimulatedProtocol engine (shared by all cockpits)
  core/
    SimulatedProtocol.ts    ← base class all protocol engines extend
    MessageBus.ts           ← in-memory JSON-RPC / event transport
    ScenarioLoader.ts       ← loads pre-built + user-built configs
  mcp/
    MCPServer.ts            ← MCP spec state machine
    MCPClient.ts            ← JSON-RPC 2.0 client
    scenarios/              ← filesystem, weather, kb, code, github
  a2a/                      ← Phase 3
  agui/                     ← Phase 3
  multiagent/               ← Phase 4

src/components/cockpits/    ← new cockpit UI components (alongside existing prompt-reality/)
  mcp-inspector/
  multi-agent/
  subagent-dispatch/
  agui-stream/
  a2a-protocol/
  llm-finetuning/
  workflow-dag/
```

---

## 5. SimulatedProtocol Pattern

Every protocol cockpit is built on three layers:

**Simulation Layer**
- `SimulatedServer` — implements the target protocol spec as a TypeScript state machine. Validates messages, manages state, emits typed events.
- `SimulatedClient` — sends protocol messages (JSON-RPC, SSE events, A2A envelopes) to the server. Receives and records responses.
- `MessageBus` — in-memory transport. No network. All message passing is synchronous/async within the browser.

**Animation Layer**
- HyperFrames: packet motion between client and server nodes, multi-scene protocol walkthroughs, training pipeline animations.
- GSAP: node highlights on force graphs, tree expansion, progress indicators, data counters.

**Interaction Layer**
- Level 1: Pre-built scenarios. User presses a button and watches the exchange.
- Level 2: User edits input parameters before triggering a call. Server validates and responds to valid and invalid inputs correctly.
- Level 3: User creates custom entities (tools, resources, agents, workflow nodes) via a schema builder UI. The simulation engine registers and serves them.

**Persistence and share layer**
- `ScenarioLibrary` stores pre-built and user-built scenarios in a versioned client-side format.
- `SessionSnapshot` captures the exact state of a run: selected scenario, user edits, event log, animation step, and derived metrics.
- `ShareCodec` serializes a scenario or snapshot into a compressed URL-safe payload and supports export/import JSON files for larger creations.
- Default behavior: auto-save user-created Level 3 content locally; explicit "Share" and "Export" actions make creations portable without a backend.

---

## 6. Build Sequence (User-Confirmed)

| Build Order | Phase Label | Cockpits |
|-------------|-------------|----------|
| 1st | Phase 2 | MCP Protocol Inspector |
| 2nd | Phase 4 | Multi-Agent Orchestration + Subagent Dispatch Tree |
| 3rd | Phase 3 | AG-UI Event Stream + A2A Protocol Visualizer |
| 4th | Phase 1 | LLM Fine-Tuning Animator + ML Training Lab |
| 5th | Phase 5 | Workflow & DAG Visualizer |

Each phase gets its own spec → plan → implementation cycle. This document covers the design for all 8. Detailed implementation plans are created per phase.

---

## 7. Cockpit Designs

### 7.1 MCP Protocol Inspector (Build First)

**Question it answers:** What actually happens on the wire when an AI app connects to an MCP server?

**Three-tab layout:**

**Tab 1 — Explorer**
- Left panel: anatomy tree of the active server scenario — resources, tools, prompts as a collapsible tree
- Right panel: selected item's full JSON schema + editable input parameters + "Call" button + "Inject Error" button
- Response panel: animated JSON response below, annotated with field meanings
- Level 3: "+ Add custom tool / resource / prompt" at bottom of tree — opens schema builder, registers entity in the simulator

**Tab 2 — Guided Walkthrough**
- Left: numbered step list (6 steps: connection → initialize → capability negotiation → list → call → error handling)
- Right: HyperFrames animation — packet traveling from CLIENT node to SERVER node and back, with annotation panel below each step explaining what the message means and why it exists
- Controls: Back / Next / Auto-play

**Tab 3 — Raw Protocol Inspector**
- Scrollable message log: every JSON-RPC message in order (direction, method, timestamp)
- Click any row: full payload expands below with per-field "What this means" annotations
- Filter bar: all / requests / responses / errors
- Replay button: re-runs the full conversation from scratch

**Pre-built scenarios (5):**
1. Filesystem Server — `read_file`, `list_dir` · 3 resources · 1 prompt
2. Weather Tool — `get_weather`, `get_forecast` · 0 resources · 1 prompt
3. Knowledge Base — `search`, `retrieve` · 5 resources · 2 prompts
4. Code Assistant — `run_lint`, `format`, `test` · 2 resources · 3 prompts
5. GitHub Server — `list_prs`, `get_issue`, `comment` · 2 resources · 2 prompts

**Protocol coverage:** MCP spec 2025-11-25 — initialize handshake, capability negotiation, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, `prompts/get`, error responses, `notifications/cancelled`.

---

### 7.2 Multi-Agent Orchestration (Build Second — Part A)

**Question it answers:** How do agents divide work, communicate, and fail?

**Three-tab layout:**

**Tab 1 — Graph View**
- D3 force-graph: agents as nodes, messages as animated directed edges
- Active agent pulses green; idle agents are dim
- Click a node: inspect agent's role, current task, message history, token usage
- Click an edge: see the full message that passed between those two agents

**Tab 2 — Message Log**
- Chronological list of every inter-agent message
- Shows: sender → receiver, message type, payload preview, timestamp
- Each row expandable to full payload with field annotations

**Tab 3 — Pattern Selector**
- Four orchestration patterns: Supervisor · Sequential · Parallel · Network
- Select a pattern: graph rearranges with HyperFrames transition animation
- Each pattern explained with a one-paragraph rationale and trade-off callout

**Interaction levels:**
- Level 1: Watch pre-built team complete a scenario (e.g. Content Team writing a blog post)
- Level 2: Re-assign which agent handles which step; change the task description
- Level 3: Add/remove agents, define roles and capabilities, wire connections between agents

**Pre-built scenarios:** Content Team · Research Squad · Code Review Pipeline · Customer Support Triage

---

### 7.3 Subagent Dispatch Tree (Build Second — Part B)

**Question it answers:** How does a parent agent spawn, delegate to, and aggregate results from subagents?

**Layout:**
- Full-width collapsible tree: parent node at top, children branching down
- Each node shows: agent name, task summary, status (pending/running/done/failed), token cost, duration
- HyperFrames: animates the spawn moment (parent node "fires" a child) and result aggregation (child result flows back up)
- Click any node: right-side drawer shows full input payload, full output payload, protocol used (A2A / direct)

**Interaction levels:**
- Level 1: Watch a pre-built dispatch flow (e.g. Claude Code subagent pattern)
- Level 2: Edit the parent task prompt; observe how the tree reshapes
- Level 3: Design a custom dispatch tree — add nodes, define task descriptions, set dependencies

**Cost/token overlay:** toggle to show token cost heatmap across the tree (red = expensive, green = cheap).

---

### 7.4 AG-UI Event Stream Cockpit (Build Third — Part A)

**Question it answers:** What events flow between an agent backend and a user-facing application over AG-UI?

**Three-tab layout:**

**Tab 1 — Stream View**
- Live SSE event ticker: events scroll up as they fire during a simulated session
- Color-coded by event type: TEXT_MESSAGE (blue), TOOL_CALL (orange), STATE_DELTA (purple), RUN_STARTED/FINISHED (green), ERROR (red)
- Pause button freezes the stream for inspection; Resume continues

**Tab 2 — Event Type Explorer**
- One card per event type in the AG-UI spec
- Each card: event name, when it fires, full JSON schema, annotated example payload
- Interactive: click "Fire this event" — it appears in the Stream View

**Tab 3 — Guided Walkthrough**
- HyperFrames animated sequence: agent backend on left, user app on right, events travelling across the wire
- 5 steps: session start → text streaming → tool call → state update → session end

**Interaction levels:**
- Level 1: Watch a pre-built scenario (e.g. "Chat with tool use" — user asks a question, agent calls a tool, streams an answer)
- Level 2: Edit the user message; observe how the event sequence changes
- Level 3: Define a custom agent that emits specific event sequences; build event-by-event

**Pre-built scenarios:** Chat with tool use · Multi-turn session with state · Error recovery · Parallel tool calls

---

### 7.5 A2A Protocol Visualizer (Build Third — Part B)

**Question it answers:** How do agents from different frameworks discover each other and exchange tasks?

**Three-tab layout:**

**Tab 1 — Agent Cards**
- Animated broadcast: agents appear one by one on a grid, each card expanding to reveal capabilities, supported modalities, endpoint metadata
- Click a card: full JSON Agent Card spec with per-field annotations
- Level 3: Create a custom Agent Card — fill in capabilities, define supported task types, register it in the simulation

**Tab 2 — Task Lifecycle**
- State machine diagram (D3): `submitted → working → completed` with branches to `failed` and `cancelled`
- Each state node is clickable — shows what messages are valid in that state and what triggers each transition
- HyperFrames: animates the task token traveling through the lifecycle

**Tab 3 — Message Flow**
- Annotated A2A message exchange log (same pattern as MCP Inspector Tab 3)
- Every field explained inline
- Replay + Inject Error buttons

**Pre-built scenarios:** Two-agent delegation · Cross-framework exchange (LangGraph agent → CrewAI agent) · Task cancellation · Error recovery with retry

---

### 7.6 LLM Fine-Tuning Animator (Build Fourth — Part A)

**Question it answers:** What actually happens at each step of fine-tuning an LLM — internally and end-to-end?

**Four-tab layout:**

**Tab 1 — Pipeline**
- HyperFrames multi-scene animation: full fine-tuning pipeline as a cinematic walkthrough
- Scenes: Data Collection & Cleaning → Tokenization → Base Model → Supervised Fine-Tuning (SFT) → RLHF / DPO → Evaluation
- Each scene: animated data flowing through the stage, key parameters highlighted, "what's happening inside" annotation
- Controls: play/pause/rewind, step-by-step mode, auto-play

**Tab 2 — Stage Deep-Dive**
- Select any pipeline stage from a dropdown
- Zoom into that stage: animated token batches entering the model, loss curve updating in real time (D3 animated line chart), attention heads forming per layer (GSAP color transitions on a grid)
- For SFT: see training examples, model predictions vs labels, loss decreasing
- For RLHF: see reward model scoring responses, policy gradient update
- For DPO: see chosen vs rejected response pairs, preference optimization

**Tab 3 — Compare Techniques**
- Side-by-side animated comparison: Full Fine-Tuning vs LoRA vs QLoRA vs DPO
- Animated bars: trainable parameter count, GPU memory usage, training time, quality delta
- Each technique explained with a "When to use this" callout

**Tab 4 — Live Metrics Scrubber**
- Simulated training run timeline: scrub through epochs
- Animated charts updating as you scrub: training loss, validation loss, learning rate schedule, gradient norm
- Inject scenarios: overfitting (val loss rises), underfitting (both losses plateau), instability (spiky gradients)
- Level 3: Configure a custom run (dataset size, learning rate, technique, epochs) → see predicted outcome curves

---

### 7.7 ML Training Lab (Build Fourth — Part B)

**Lives as a tab within the LLM Fine-Tuning cockpit** — the beginner entry point before the LLM-specific stages.

**Content:**
- Backpropagation animation: GSAP gradient flow backward through a small neural network diagram
- Gradient descent on 3D loss landscape: Three.js surface, animated ball rolling toward minimum
- Optimizer comparison: SGD vs Adam vs AdaGrad — three animated paths on the same loss landscape
- Weight update heatmap: per-layer color-coded visualization of which weights changed most per step

Beginner completes ML Training Lab first, then proceeds to the Pipeline tab to see how these same mechanics scale to LLM fine-tuning.

---

### 7.8 Workflow & DAG Visualizer (Build Fifth — Capstone)

**Question it answers:** How does a full AI workflow execute — step by step, decision by decision?

**Three-tab layout:**

**Tab 1 — DAG Canvas**
- D3 force-DAG: workflow nodes connected by directed edges
- Execution playback: nodes light up in sequence as execution reaches them; edges animate to show data flowing
- Conditional branches: the path taken highlights green; untaken paths dim
- Parallel nodes: multiple nodes light up simultaneously with synchronized timing

**Tab 2 — Step Inspector**
- Click any DAG node: right-panel drawer shows:
  - Input state entering this step
  - Output state produced
  - Which agents, tools, or subagents were invoked (links to Subagent Tree from 7.3)
  - Protocol messages exchanged (links to MCP/A2A/AG-UI cockpits)
  - Duration, token cost
- Capstone connection: this cockpit references all prior protocol knowledge

**Tab 3 — Import Workflow**
- Paste a LangGraph, Temporal, or CrewAI workflow definition (JSON/Python dict)
- Parser extracts nodes, edges, conditions, entry/exit points
- DAG Canvas renders and runs the imported workflow

**Pre-built scenarios:**
1. Research → Analyze → Report (sequential pipeline)
2. Customer support with escalation branch (conditional DAG)
3. Code review with parallel linting + security + test checks (parallel DAG)
4. Multi-agent content creation (combines multi-agent + subagent patterns)

---

## 8. Shared Simulation Session Model

Cross-cockpit navigation must carry exact state, not just route the user to a thematically related page.

**Canonical entities**
- `sessionId` — unique ID for one learner run
- `scenarioId` — the pre-built or user-built scenario definition
- `snapshotId` — a point-in-time capture of the session
- `entityRef` — stable reference to a tool, resource, event, task, node, agent, or message
- `focusTarget` — the specific UI object to open and highlight when navigating into another cockpit

**Shared event model**
- Every simulator emits typed events into a common session log.
- Events are append-only, timestamped, and deterministic for a given scenario and user input.
- Cross-cockpit links are built from these events, not from hardcoded demo routes.

**Navigation contract**
- A link from Workflow DAG into MCP opens the exact tool call, selected message row, and relevant walkthrough step.
- A link from Multi-Agent into Subagent Dispatch opens the exact child tree and highlights the selected node.
- A link from AG-UI or A2A into another cockpit restores the related snapshot and focuses the matching event or task lifecycle state.
- If the originating session is unavailable, the destination cockpit opens a closest-match fallback scenario and clearly labels it as a reconstructed view.

**State boundaries**
- Scenario definitions are reusable templates.
- Session snapshots are learner-specific state.
- UI view state is separate from simulation state so deep links and replay remain stable across layouts and screen sizes.

---

## 9. Cross-Cockpit Connections

| From | To | Connection |
|------|----|------------|
| Subagent Dispatch Tree | Multi-Agent Orchestration | Subagents within an orchestration open the Dispatch Tree |
| Workflow DAG — Step Inspector | MCP Inspector | Steps that call tools link to MCP Inspector for that tool call |
| Workflow DAG — Step Inspector | Subagent Dispatch Tree | Steps that spawn subagents link to the Dispatch Tree |
| LLM Fine-Tuning | ML Training Lab | "Understand the basics first" entry point tab |
| A2A Visualizer | Multi-Agent Orchestration | Agents in the orchestration communicate via A2A — links to the message flow |
| AG-UI Stream | Multi-Agent Orchestration | The user-facing app receives AG-UI events from the orchestration |

---

## 10. Non-Functional Requirements

- **100% client-side.** No backend, no API keys, no network calls. GitHub Pages deployable.
- **No regression on existing cockpits.** Prompt Reality Cockpit, Basic Mode, routing, and mode switching all continue working.
- **Progressive disclosure.** Every cockpit is usable by a beginner without reading any documentation. Advanced features reveal themselves as the user explores.
- **Deterministic simulations.** Every pre-built scenario produces the same output every time. No random variation that confuses learners.
- **HyperFrames animations are scrubbable.** Users can pause, rewind, and step through any animation.
- **Durable client-side state.** User-created scenarios, custom entities, and saved snapshots persist locally across sessions and can be exported/imported without any server dependency.
- **Shareable runs.** Every pre-built or custom scenario can generate a stable deep link or export payload for replay and teaching.
- **Mobile-aware by design.** Every cockpit must define a small-screen mode intentionally, not as an afterthought.

### 10.1 Mobile and Small-Screen Rules

**Global rules**
- On narrow screens, only one primary pane is visible at a time. Secondary panes move into bottom sheets, drawers, or segmented sub-tabs.
- Scrubbable animations remain available, but nonessential decorative motion is reduced.
- Dense graphs switch from free-pan exploration to guided focus mode with one selected node, edge, or step at a time.
- Raw payloads collapse by default, with field-by-field drill-down instead of full expanded trees.

**Cockpit-specific expectations**
- **MCP Inspector:** tree, schema editor, and protocol log become segmented views; replay preserves the selected message and scroll position.
- **Multi-Agent Orchestration:** force graph simplifies to an active-agent spotlight view with a swipeable agent roster and edge inspector sheet.
- **Subagent Dispatch Tree:** tree becomes a vertical outline with expandable branches and a sticky summary bar for parent/selected child.
- **AG-UI Event Stream:** live ticker becomes pause-first on mobile, with event cards replacing dense streaming rows.
- **A2A Visualizer:** agent cards remain scrollable; task lifecycle becomes a stepper rather than a full-state graph.
- **LLM Fine-Tuning / ML Training Lab:** 3D and chart-heavy views provide stepped scenes and presets before free manipulation.
- **Workflow & DAG Visualizer:** DAG defaults to a linearized execution list with optional mini-map, not a full freeform canvas.

### 10.2 Performance and Accessibility

- Target 60fps for primary animations on desktop and a reduced-motion-compatible fallback on all supported devices.
- Respect `prefers-reduced-motion` with stepped playback and minimized ambient animation.
- All instructional interactions must remain keyboard reachable.
- Color is never the only carrier of meaning in charts, protocol logs, or status states.

---

## 11. Out of Scope

- Real network connections to live MCP servers, A2A endpoints, or AG-UI backends
- Authentication or user accounts
- Backend services, databases, or server-side rendering
- SEO tooling or marketing pages
- Monetization mechanics (designed for later, not now)
- Cloud-synced user profiles or multi-device sync in the first release

---

## 12. Success Criteria

- A beginner can open the MCP Inspector, complete the Walkthrough tab, and explain what `initialize` does — without reading any external docs.
- An expert can open the A2A Visualizer, define a custom Agent Card, and send a task to a custom agent they built in Level 3 — all within the browser.
- The LLM Fine-Tuning Pipeline tab plays end-to-end as a self-contained animated explainer that someone could share as a learning resource.
- Every cockpit's simulation engine is independently testable (unit tests for the state machine, separate from the UI).
- A first-time user can enter from Playground Home, complete a recommended first cockpit, and clearly identify the next best cockpit without external guidance.
- A user who builds a Level 3 custom scenario can return after a refresh and continue from their saved state, or share the scenario with another person via export/import or deep link.
- Cross-cockpit links restore concrete context: the destination opens the exact run, event, tool call, task, or node that triggered navigation.
- On mobile, every cockpit remains understandable and teachable, even when some advanced interactions move into drawers, steppers, or reduced-detail views.
- The experience feels visually premium and intentional: transitions reinforce mental models, animation never blocks comprehension, and the platform reads as one coherent ecosystem rather than isolated demos.
- Core flows meet defined quality bars for accessibility, reduced motion support, and performance on GitHub Pages deployment targets.
