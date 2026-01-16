# User Stories - AI Learning Playground

## Document Control
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.2 | 2026-01 | Product Team | Updated with Advanced Mode & Cockpits (Phase 6) |

---

## Story Organization

Stories are organized into **Phases** (high-level features) and broken down into **atomic stories** (implementable in 1-3 days).

**Priority Levels**:
- **P0**: Must Have (MVP blocker)
- **P1**: Should Have (important but not blocker)
- **P2**: Nice to Have (future enhancement)

**Story Points** (Fibonacci): 1, 2, 3, 5, 8, 13

---

## Phase 1: Enhanced RAG Foundation

### Story 1.1: Project Structure & Organization
**Phase**: Foundation  
**Priority**: P0  
**Story Points**: 2  
**Status**: 🟢 DONE

**User Story**:
> As a developer, I want a well-organized project structure, so I can easily navigate and maintain the codebase.

**Acceptance Criteria**:
- [x] Proper `src/` directory structure
- [x] Components organized by module (rag, agents, multi-agent)
- [x] Barrel exports (index.ts) for clean imports
- [x] Path aliases configured (@/components, @/lib, etc.)
- [x] Documentation structure created
- [x] .gitignore configured

**Technical Tasks**:
1. Create src/ directory structure
2. Organize components by module
3. Create barrel exports
4. Configure path aliases
5. Create documentation structure
6. Set up .gitignore

**Dependencies**: None

**Testing**:
```typescript
// Verify imports work
import { Card, Button } from '@/components/shared';
import { RAGPipelineViz } from '@/components/rag';
import { AgentStepViz } from '@/components/agents';
```

---

### Story 1.2: Advanced Chunking Visualizations
**Phase**: RAG Enhancement  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to visualize different chunking strategies, so I can understand how chunking affects retrieval quality.

**Acceptance Criteria**:
- [ ] Semantic chunking algorithm implemented
- [ ] Parent-child chunking visualization
- [ ] Interactive chunk size/overlap controls
- [ ] Side-by-side comparison of strategies
- [ ] Chunk metadata display (token count, overlap)
- [ ] Visual highlighting of chunk boundaries

**Technical Tasks**:
1. Implement semantic chunking (sentence embeddings)
2. Implement parent-child chunking
3. Create ChunkingVisualizer component
4. Add interactive controls (sliders, dropdowns)
5. Add comparison view
6. Write unit tests for chunking algorithms

**Dependencies**: Story 1.1

**Testing**:
```typescript
// Test semantic chunking
test('semantic chunking splits at semantic boundaries', () => {
  const chunks = semanticChunk(text, { threshold: 0.7 });
  expect(chunks).toHaveLength(expectedCount);
  expect(chunks[0].semanticScore).toBeDefined();
});

// Test parent-child chunking
test('parent-child creates hierarchy', () => {
  const { parents, children } = parentChildChunk(text);
  expect(children.every(c => c.parentId)).toBe(true);
});
```

---

### Story 1.3: Hybrid Search Visualization
**Phase**: RAG Enhancement  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to compare sparse vs dense vs hybrid search, so I can understand when to use each approach.

**Acceptance Criteria**:
- [ ] BM25 (sparse) retrieval implemented
- [ ] Vector (dense) retrieval implemented
- [ ] Hybrid score combination (alpha parameter)
- [ ] Interactive weight slider
- [ ] Side-by-side results comparison
- [ ] Score visualization (bar charts)
- [ ] Performance metrics (latency, recall)

**Technical Tasks**:
1. Implement BM25 sparse retrieval
2. Implement vector similarity search
3. Create hybrid search combiner
4. Build HybridSearchDemo component
5. Add interactive controls
6. Add performance metrics
7. Write integration tests

**Dependencies**: Story 1.1

**Testing**:
```typescript
// Test hybrid search
test('hybrid search combines sparse and dense', () => {
  const results = hybridSearch(query, docs, { alpha: 0.5 });
  expect(results).toHaveLength(5);
  expect(results[0].hybridScore).toBeDefined();
  expect(results[0].sparseScore).toBeDefined();
  expect(results[0].denseScore).toBeDefined();
});
```

---

### Story 1.4: Reranking Comparison
**Phase**: RAG Enhancement  
**Priority**: P1  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how reranking improves results, so I can understand its impact on retrieval quality.

**Acceptance Criteria**:
- [ ] Cross-encoder reranking implemented
- [ ] Before/after visualization
- [ ] Score change indicators
- [ ] Rank change visualization
- [ ] Performance comparison (latency impact)

**Technical Tasks**:
1. Implement cross-encoder reranking
2. Create RerankingComparison component
3. Add before/after slider view
4. Add score change indicators
5. Write reranking tests

**Dependencies**: Story 1.3

**Testing**:
```typescript
// Test reranking improves relevance
test('reranking improves top-k relevance', () => {
  const initial = hybridSearch(query, docs);
  const reranked = rerank(query, initial);
  expect(reranked[0].relevanceScore).toBeGreaterThan(initial[0].relevanceScore);
});
```

---

### Story 1.5: Embedding Space Explorer
**Phase**: RAG Enhancement  
**Priority**: P1  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to explore embeddings in 3D space, so I can visualize semantic relationships.

**Acceptance Criteria**:
- [ ] 3D embedding visualization (Three.js or similar)
- [ ] UMAP/t-SNE dimensionality reduction
- [ ] Interactive point selection
- [ ] Cluster highlighting
- [ ] Query point visualization
- [ ] Similarity distance visualization

**Technical Tasks**:
1. Implement dimensionality reduction (UMAP)
2. Create EmbeddingExplorer component (Three.js)
3. Add interactive controls
4. Add query point visualization
5. Write visualization tests

**Dependencies**: Story 1.1

**Testing**:
```typescript
// Test embedding generation
test('embeddings are generated correctly', async () => {
  const embeddings = await generateEmbeddings(texts);
  expect(embeddings).toHaveLength(texts.length);
  expect(embeddings[0]).toHaveLength(384); // embedding dimension
});
```

---

## Phase 2: Agent Lab Foundation

### Story 2.1: ReAct Pattern Visualization
**Phase**: Agent Lab  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see ReAct agent reasoning step-by-step, so I can understand the thought-action-observation loop.

**Acceptance Criteria**:
- [ ] ReAct state machine implementation
- [ ] Step-by-step timeline visualization
- [ ] Thought/Action/Observation indicators
- [ ] Interactive step selection
- [ ] State inspector panel
- [ ] Tool call visualization

**Technical Tasks**:
1. Implement ReAct state machine
2. Create ReActTimeline component
3. Add step-by-step visualization
4. Add state inspector
5. Add tool call visualization
6. Write ReAct tests

**Dependencies**: Story 1.1

**Testing**:
```typescript
// Test ReAct state machine
test('ReAct follows correct state transitions', () => {
  const agent = new ReActAgent();
  agent.think("I need to search for information");
  agent.act("search", { query: "test" });
  agent.observe("Found results");
  expect(agent.currentStep).toBe('observation');
});
```

---

### Story 2.2: Reflection Pattern Visualization
**Phase**: Agent Lab  
**Priority**: P0  
**Story Points**: 4  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how agents critique and improve their output, so I can understand self-reflection.

**Acceptance Criteria**:
- [ ] Reflection loop visualization
- [ ] Critique/Revision tracking
- [ ] Quality score over iterations
- [ ] Before/after comparison
- [ ] Iteration limit controls

**Technical Tasks**:
1. Implement reflection pattern
2. Create ReflectionVisualizer component
3. Add iteration tracking
4. Add quality metrics
5. Write reflection tests

**Dependencies**: Story 2.1

**Testing**:
```typescript
// Test reflection loop
test('reflection improves output quality', async () => {
  const agent = new ReflectionAgent();
  const initial = await agent.generate(prompt);
  const refined = await agent.reflect(initial);
  expect(refined.qualityScore).toBeGreaterThan(initial.qualityScore);
});
```

---

### Story 2.3: Tool Use Inspector
**Phase**: Agent Lab  
**Priority**: P0  
**Story Points**: 4  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how agents select and use tools, so I can understand tool calling decisions.

**Acceptance Criteria**:
- [ ] Tool selection visualization
- [ ] Tool call reasoning display
- [ ] Tool execution results
- [ ] Tool performance metrics
- [ ] Available tools list
- [ ] Tool allowlist/denylist controls

**Technical Tasks**:
1. Implement tool selection logic
2. Create ToolUseInspector component
3. Add tool reasoning display
4. Add execution visualization
5. Write tool use tests

**Dependencies**: Story 2.1

**Testing**:
```typescript
// Test tool selection
test('agent selects appropriate tool', () => {
  const agent = new ToolUseAgent({ tools: [searchTool, calcTool] });
  const selection = agent.selectTool("What is 2+2?");
  expect(selection.tool).toBe('calculator');
});
```

---

### Story 2.4: Planning Board Visualization
**Phase**: Agent Lab  
**Priority**: P1  
**Story Points**: 4  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how agents create and execute plans, so I can understand planning patterns.

**Acceptance Criteria**:
- [ ] Plan creation visualization
- [ ] Step-by-step execution tracking
- [ ] Plan modification visualization
- [ ] Dependency graph
- [ ] Execution timeline

**Technical Tasks**:
1. Implement planning pattern
2. Create PlanningBoard component
3. Add plan visualization
4. Add execution tracking
5. Write planning tests

**Dependencies**: Story 2.1

**Testing**:
```typescript
// Test planning
test('agent creates valid plan', () => {
  const agent = new PlanningAgent();
  const plan = agent.createPlan(goal);
  expect(plan.steps).toHaveLength(greaterThan(0));
  expect(plan.steps[0].dependencies).toBeDefined();
});
```

---

## Phase 3: Multi-Agent Arena

### Story 3.1: Supervisor Pattern Implementation
**Phase**: Multi-Agent  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how a supervisor agent delegates tasks, so I can understand supervisor patterns.

**Acceptance Criteria**:
- [ ] Supervisor agent implementation
- [ ] Task delegation visualization
- [ ] Worker agent status tracking
- [ ] Message flow visualization
- [ ] Task queue visualization

**Technical Tasks**:
1. Implement supervisor pattern
2. Create SupervisorVisualizer component
3. Add delegation visualization
4. Add message flow
5. Write supervisor tests

**Dependencies**: Story 2.1

**Testing**:
```typescript
// Test supervisor delegation
test('supervisor delegates tasks correctly', () => {
  const supervisor = new SupervisorAgent({ workers: [writer, researcher] });
  const delegation = supervisor.delegate(task);
  expect(delegation.worker).toBeDefined();
  expect(delegation.task).toBe(task);
});
```

---

### Story 3.2: Agent Network Graph
**Phase**: Multi-Agent  
**Priority**: P0  
**Story Points**: 4  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see agent communication in a network graph, so I can understand agent relationships.

**Acceptance Criteria**:
- [ ] Interactive network graph (D3.js)
- [ ] Agent node visualization
- [ ] Message edge visualization
- [ ] Real-time updates
- [ ] Node selection and details
- [ ] Filter controls (by agent type, message type)

**Technical Tasks**:
1. Create AgentNetworkGraph component (D3.js)
2. Add node visualization
3. Add edge visualization
4. Add real-time updates
5. Add interaction handlers
6. Write visualization tests

**Dependencies**: Story 3.1

**Testing**:
```typescript
// Test network graph rendering
test('network graph renders agents correctly', () => {
  const graph = renderNetworkGraph(agents, messages);
  expect(graph.nodes).toHaveLength(agents.length);
  expect(graph.edges).toHaveLength(messages.length);
});
```

---

### Story 3.3: Message Flow Visualization
**Phase**: Multi-Agent  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see messages flowing between agents, so I can understand communication patterns.

**Acceptance Criteria**:
- [ ] Message timeline visualization
- [ ] Message type indicators
- [ ] Sender/receiver highlighting
- [ ] Message content preview
- [ ] Filter by message type
- [ ] Search messages

**Technical Tasks**:
1. Create MessageFlowViz component
2. Add timeline visualization
3. Add message details
4. Add filtering
5. Write message flow tests

**Dependencies**: Story 3.1

**Testing**:
```typescript
// Test message flow
test('messages are displayed in chronological order', () => {
  const messages = [msg1, msg2, msg3];
  const display = renderMessageFlow(messages);
  expect(display[0].timestamp).toBeLessThan(display[1].timestamp);
});
```

---

### Story 3.4: Performance Dashboard
**Phase**: Multi-Agent  
**Priority**: P1  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see performance metrics for different orchestration patterns, so I can compare approaches.

**Acceptance Criteria**:
- [ ] Execution time comparison
- [ ] Token usage metrics
- [ ] Cost comparison
- [ ] Success rate metrics
- [ ] Agent utilization charts

**Technical Tasks**:
1. Create PerformanceDashboard component
2. Add metrics collection
3. Add comparison charts
4. Add cost calculations
5. Write performance tests

**Dependencies**: Story 3.1

**Testing**:
```typescript
// Test performance metrics
test('performance metrics are calculated correctly', () => {
  const metrics = calculateMetrics(execution);
  expect(metrics.executionTime).toBeGreaterThan(0);
  expect(metrics.tokenUsage).toBeGreaterThan(0);
  expect(metrics.cost).toBeGreaterThan(0);
});
```

---

## Phase 4: Prompt Reasoning Techniques

### Story 4.1: Prompt Reasoning Techniques Module
**Phase**: Prompt Reasoning  
**Priority**: P0  
**Story Points**: 8  
**Status**: 🟢 DONE

**User Story**:
> As a learner, I want to explore modern AI reasoning patterns interactively, so I can understand how different prompt architectures work and when to use each technique.

**Acceptance Criteria**:
- [x] 11 reasoning patterns implemented (CoT, CoD, System2, AoT, SoT, ToT, ReAct, Reflection, CoVe, GoT, BoT)
- [x] Pattern categorization (Linear, Modular, Iterative, Advanced)
- [x] Interactive pattern selector with tooltips
- [x] Real-time reasoning process visualization
- [x] Different visualization types (linear, tree, graph, atoms, iterative)
- [x] Pattern information display (mental model, best for, vibe, example prompts)
- [x] Metrics tracking (steps, branches, atoms, verifications, corrections)
- [x] Sample problems for testing
- [x] Sidebar navigation integration

**Technical Tasks**:
1. Create reasoning pattern types and interfaces
2. Implement reasoning store with Zustand
3. Create ReasoningPatternViz component with multiple visualization types
4. Create ReasoningPatternSelector component with tooltips
5. Build PromptReasoningPage with interactive demo
6. Add routing and navigation
7. Integrate with sidebar menu
8. Add reasoning color scheme to design system

**Dependencies**: Story 1.1

**Testing**:
```typescript
// Test reasoning pattern execution
test('CoT pattern generates step-by-step reasoning', async () => {
  const result = await runDemoReasoning(problem, 'cot');
  expect(result.steps).toHaveLength(greaterThan(0));
  expect(result.steps[0].type).toBe('thought');
});

// Test pattern visualization
test('ToT pattern shows branching visualization', () => {
  const viz = renderReasoningViz('tot', steps);
  expect(viz.type).toBe('tree');
});
```

---

## Phase 5: Advanced AI Concepts

### Story 5.1: LLM Next Token Prediction Demo
**Phase**: Advanced AI Concepts  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how LLMs predict the next token step-by-step, so I can understand the autoregressive generation process.

**Acceptance Criteria**:
- [ ] Token-by-token generation visualization
- [ ] Probability distribution display for each step
- [ ] Top-k and top-p sampling visualization
- [ ] Attention weights visualization (if applicable)
- [ ] Interactive controls (temperature, sampling strategy)
- [ ] Token probability bar charts
- [ ] Generation speed controls (step, pause, resume)
- [ ] Token embeddings visualization

**Technical Tasks**:
1. Implement token prediction simulation
2. Create TokenPredictionViz component
3. Add probability distribution charts
4. Add sampling strategy controls
5. Add attention visualization (optional)
6. Create LLMNextTokenPage
7. Write token prediction tests

**Dependencies**: Story 1.1

**Testing**:
```typescript
// Test token prediction
test('LLM generates tokens sequentially', () => {
  const tokens = generateTokens(prompt, { maxTokens: 10 });
  expect(tokens).toHaveLength(10);
  expect(tokens[0].probabilities).toBeDefined();
});

// Test sampling strategies
test('top-k sampling filters candidates', () => {
  const sampled = topKSampling(probabilities, { k: 5 });
  expect(sampled.length).toBeLessThanOrEqual(5);
});
```

---

### Story 5.2: Diffusion Model Image Generation Demo
**Phase**: Advanced AI Concepts  
**Priority**: P0  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how diffusion models generate images step-by-step, so I can understand the denoising process from noise to final image.

**Acceptance Criteria**:
- [ ] Step-by-step denoising visualization
- [ ] Noise schedule visualization
- [ ] Timestep progression slider
- [ ] Before/after comparison at each step
- [ ] Latent space visualization
- [ ] Prompt conditioning visualization
- [ ] Different diffusion schedules (DDPM, DDIM)
- [ ] Image quality metrics over timesteps

**Technical Tasks**:
1. Implement diffusion model simulation
2. Create DiffusionViz component
3. Add timestep progression controls
4. Add noise schedule visualization
5. Add latent space visualization
6. Create DiffusionImagePage
7. Add image comparison views
8. Write diffusion model tests

**Dependencies**: Story 1.1

**Testing**:
```typescript
// Test diffusion process
test('diffusion model denoises step by step', () => {
  const steps = diffuseImage(noise, { steps: 50 });
  expect(steps).toHaveLength(50);
  expect(steps[0].noiseLevel).toBeGreaterThan(steps[49].noiseLevel);
});

// Test prompt conditioning
test('prompt affects generation', () => {
  const img1 = generateImage("cat");
  const img2 = generateImage("dog");
  expect(img1.embedding).not.toEqual(img2.embedding);
});
```

---

### Story 5.3: Agent-to-Agent (A2A) Protocol Communication
**Phase**: Advanced AI Concepts  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how agents communicate using the A2A protocol, so I can understand structured agent-to-agent messaging in multi-agentic AI systems.

**Acceptance Criteria**:
- [ ] A2A protocol message format visualization
- [ ] Message flow animation between agents
- [ ] Protocol handshake visualization
- [ ] Message routing visualization
- [ ] Protocol state machine visualization
- [ ] Message queue visualization
- [ ] Error handling and retry visualization
- [ ] Protocol version compatibility display

**Technical Tasks**:
1. Implement A2A protocol simulation
2. Create A2AProtocolViz component
3. Add message flow animation
4. Add protocol state machine
5. Add message routing visualization
6. Create A2ACommunicationPage
7. Write A2A protocol tests

**Dependencies**: Story 3.1

**Testing**:
```typescript
// Test A2A protocol handshake
test('A2A protocol establishes connection', () => {
  const connection = establishA2AConnection(agent1, agent2);
  expect(connection.status).toBe('established');
  expect(connection.protocolVersion).toBeDefined();
});

// Test message routing
test('A2A messages are routed correctly', () => {
  const message = createA2AMessage(from, to, payload);
  const routed = routeA2AMessage(message, network);
  expect(routed.destination).toBe(to);
});
```

---

### Story 5.4: Model Context Protocol (MCP) Demo
**Phase**: Advanced AI Concepts  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how MCP clients communicate with MCP servers, so I can understand data propagation and context sharing in the Model Context Protocol.

**Acceptance Criteria**:
- [ ] MCP client-server architecture visualization
- [ ] Request/response flow animation
- [ ] Context propagation visualization
- [ ] Resource sharing visualization
- [ ] Protocol message types (initialize, tools/list, resources/read)
- [ ] Connection lifecycle visualization
- [ ] Error handling visualization
- [ ] Performance metrics (latency, throughput)

**Technical Tasks**:
1. Implement MCP protocol simulation
2. Create MCPProtocolViz component
3. Add client-server communication flow
4. Add context propagation visualization
5. Add resource sharing visualization
6. Create MCPDemoPage
7. Write MCP protocol tests

**Dependencies**: Story 1.1

**Testing**:
```typescript
// Test MCP client-server connection
test('MCP client connects to server', async () => {
  const connection = await connectMCPClient(serverUrl);
  expect(connection.status).toBe('connected');
  expect(connection.capabilities).toBeDefined();
});

// Test context propagation
test('MCP context propagates correctly', () => {
  const context = createMCPContext(data);
  const propagated = propagateContext(context, clients);
  expect(propagated.clients).toHaveLength(greaterThan(0));
});
```

---

### Story 5.5: Agentic Commerce Platform
**Phase**: Advanced AI Concepts  
**Priority**: P1  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how AI agents facilitate commerce transactions, so I can understand agentic commerce patterns and workflows.

**Acceptance Criteria**:
- [ ] Commerce agent roles visualization (buyer, seller, negotiator, payment)
- [ ] Transaction flow visualization
- [ ] Price negotiation visualization
- [ ] Payment processing flow
- [ ] Inventory management visualization
- [ ] Order fulfillment workflow
- [ ] Multi-agent commerce orchestration
- [ ] Transaction metrics and analytics

**Technical Tasks**:
1. Implement agentic commerce simulation
2. Create CommerceAgentViz component
3. Add transaction flow visualization
4. Add negotiation visualization
5. Add payment processing flow
6. Create AgenticCommercePage
7. Add commerce metrics dashboard
8. Write commerce agent tests

**Dependencies**: Story 3.1

**Testing**:
```typescript
// Test commerce transaction
test('commerce agents complete transaction', async () => {
  const transaction = await processCommerceTransaction(buyer, seller, product);
  expect(transaction.status).toBe('completed');
  expect(transaction.payment).toBeDefined();
});

// Test price negotiation
test('agents negotiate price', () => {
  const negotiation = negotiatePrice(buyerAgent, sellerAgent, product);
  expect(negotiation.finalPrice).toBeLessThanOrEqual(negotiation.initialPrice);
});
```

---

### Story 5.6: Agentic E-commerce System
**Phase**: Advanced AI Concepts  
**Priority**: P1  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to see how AI agents power e-commerce systems, so I can understand automated shopping, recommendation, and fulfillment workflows.

**Acceptance Criteria**:
- [ ] E-commerce agent ecosystem (shopping assistant, recommender, cart manager, checkout)
- [ ] Shopping journey visualization
- [ ] Product recommendation flow
- [ ] Cart management visualization
- [ ] Checkout process flow
- [ ] Order tracking visualization
- [ ] Customer service agent interactions
- [ ] E-commerce analytics dashboard

**Technical Tasks**:
1. Implement agentic e-commerce simulation
2. Create EcommerceAgentViz component
3. Add shopping journey visualization
4. Add recommendation engine visualization
5. Add checkout flow visualization
6. Create AgenticEcommercePage
7. Add e-commerce analytics
8. Write e-commerce agent tests

**Dependencies**: Story 3.1

**Testing**:
```typescript
// Test e-commerce shopping flow
test('e-commerce agents complete purchase', async () => {
  const purchase = await processEcommercePurchase(user, products);
  expect(purchase.orderId).toBeDefined();
  expect(purchase.status).toBe('completed');
});

// Test recommendation system
test('recommender agent suggests products', () => {
  const recommendations = recommendProducts(userProfile, catalog);
  expect(recommendations).toHaveLength(greaterThan(0));
  expect(recommendations[0].relevanceScore).toBeDefined();
});
```

---

## Phase 6: Advanced Mode & Cockpits

### Story 6.1: Basic Mode Refactoring
**Phase**: Advanced Mode Infrastructure  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story**:
> As a developer, I want the existing Playground refactored into Basic Mode architecture, so that Advanced Mode can be built without affecting existing functionality.

**Acceptance Criteria**:
- [ ] Existing Playground modules (RAG Studio, Agent Lab, Multi-Agent Arena, Prompt Reasoning) preserved as Basic Mode
- [ ] No cockpit logic leaks into Basic Mode components
- [ ] Basic Mode maintains exploratory, open-ended, educational characteristics
- [ ] Basic Mode remains free forever
- [ ] All existing functionality works identically after refactoring
- [ ] Clear architectural separation between Basic and Advanced Mode

**Technical Tasks**:
1. Create mode routing infrastructure
2. Wrap existing modules in Basic Mode container
3. Add mode state management (Basic/Advanced)
4. Ensure no Advanced Mode imports in Basic Mode components
5. Add mode boundary checks
6. Write integration tests to verify separation
7. Update navigation to support mode switching

**Dependencies**: None

**Testing**:
```typescript
// Test Basic Mode isolation
test('Basic Mode has no Advanced Mode dependencies', () => {
  const basicModeModules = getBasicModeModules();
  expect(basicModeModules.every(m => !hasAdvancedModeImports(m))).toBe(true);
});

// Test existing functionality preserved
test('all existing features work in Basic Mode', () => {
  const playground = renderBasicMode();
  expect(playground.hasRAGStudio).toBe(true);
  expect(playground.hasAgentLab).toBe(true);
  expect(playground.hasMultiAgentArena).toBe(true);
});
```

---

### Story 6.2: Advanced Mode Landing Page
**Phase**: Advanced Mode Infrastructure  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story**:
> As a professional user, I want to see a clear landing page for Advanced Mode, so I can understand what it offers and consciously opt into constraint-driven thinking.

**Acceptance Criteria**:
- [ ] Landing page with calm, confident, non-marketing tone
- [ ] Title: "Advanced Mode", Subtitle: "System-level insight under real constraints"
- [ ] Framing copy explaining Advanced Mode purpose (no optimization, reveals limits)
- [ ] Explicit contrast section: "How this differs from Basic Mode"
- [ ] "What you will gain" section with bullet points
- [ ] "What this mode intentionally avoids" section with bullet points
- [ ] Entry CTA button: "Enter Prompt Reality Cockpit"
- [ ] Microcopy: "You can return to Basic Mode at any time"
- [ ] Monetization signaling (future-safe, hidden/secondary)
- [ ] UX behavior: appears once per session, no modal popups, no feature comparison tables, no pricing language

**Technical Tasks**:
1. Create AdvancedModeLandingPage component
2. Implement framing copy sections
3. Add contrast section with Basic Mode comparison
4. Add "What you will gain" and "What this mode intentionally avoids" sections
5. Add entry CTA button
6. Implement session-based display logic (once per session)
7. Add monetization signaling (hidden/secondary)
8. Ensure no marketing language or dark patterns
9. Write component tests

**Dependencies**: Story 6.1

**Testing**:
```typescript
// Test landing page content
test('landing page has all required sections', () => {
  const landing = render(<AdvancedModeLandingPage />);
  expect(landing.getByText('Advanced Mode')).toBeInTheDocument();
  expect(landing.getByText('What you will gain')).toBeInTheDocument();
  expect(landing.getByText('What this mode intentionally avoids')).toBeInTheDocument();
});

// Test session behavior
test('landing page appears once per session', () => {
  const { rerender } = render(<App />);
  expect(screen.getByText('Advanced Mode')).toBeInTheDocument();
  rerender(<App />);
  expect(screen.queryByText('Advanced Mode')).not.toBeInTheDocument();
});
```

---

### Story 6.3: Mode Switching Mechanism
**Phase**: Advanced Mode Infrastructure  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story**:
> As a user, I want to switch between Basic and Advanced Mode, so I can access different learning experiences based on my needs.

**Acceptance Criteria**:
- [ ] Mode toggle/switcher component
- [ ] First-time users default to Basic Mode
- [ ] Advanced Mode is discoverable but never forced
- [ ] Mode state persisted in localStorage
- [ ] Navigation rules enforced: no tabs inside cockpits
- [ ] One cockpit active at a time in Advanced Mode
- [ ] Explicit mode switch (clear visual indication)
- [ ] Smooth transition between modes

**Technical Tasks**:
1. Create ModeSwitcher component
2. Implement mode state management (Zustand store)
3. Add localStorage persistence for mode preference
4. Implement default behavior (first-time users → Basic Mode)
5. Add navigation guard to enforce cockpit rules
6. Create mode transition animations
7. Add visual indicators for current mode
8. Write mode switching tests

**Dependencies**: Story 6.1

**Testing**:
```typescript
// Test mode switching
test('user can switch between Basic and Advanced Mode', () => {
  const { getByRole } = render(<App />);
  const switcher = getByRole('button', { name: /switch to advanced mode/i });
  fireEvent.click(switcher);
  expect(getMode()).toBe('advanced');
});

// Test default mode
test('first-time users default to Basic Mode', () => {
  localStorage.clear();
  render(<App />);
  expect(getMode()).toBe('basic');
});

// Test navigation rules
test('Advanced Mode enforces one cockpit at a time', () => {
  setMode('advanced');
  const cockpit1 = selectCockpit('prompt-reality');
  const cockpit2 = selectCockpit('retrieval-reality');
  expect(cockpit1.isActive).toBe(false);
  expect(cockpit2.isActive).toBe(true);
});
```

---

### Story 6.4: Paste Real Prompt
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 2  
**Status**: 🟡 READY

**User Story**:
> As a professional user, I want to paste a real production prompt, so I can understand how it behaves under system constraints.

**Acceptance Criteria**:
- [ ] Single large textarea component
- [ ] Accepts long prompts (>10k tokens)
- [ ] No formatting loss on paste
- [ ] Immediate feedback on change
- [ ] Real-time token counting
- [ ] Support for multi-line prompts

**Technical Tasks**:
1. Create PromptTextarea component
2. Implement large textarea with proper sizing
3. Add paste event handling (preserve formatting)
4. Add real-time token counting
5. Add change detection and immediate feedback
6. Handle very long prompts (>10k tokens)
7. Write component tests

**Dependencies**: Story 6.3

**Testing**:
```typescript
// Test textarea accepts long prompts
test('textarea accepts prompts >10k tokens', () => {
  const longPrompt = generatePrompt(15000);
  const { getByRole } = render(<PromptTextarea />);
  const textarea = getByRole('textbox');
  fireEvent.change(textarea, { target: { value: longPrompt } });
  expect(textarea.value.length).toBeGreaterThan(10000);
});

// Test formatting preservation
test('textarea preserves formatting on paste', () => {
  const formattedText = 'Line 1\nLine 2\nLine 3';
  const { getByRole } = render(<PromptTextarea />);
  const textarea = getByRole('textbox');
  fireEvent.paste(textarea, { clipboardData: { getData: () => formattedText } });
  expect(textarea.value).toBe(formattedText);
});
```

---

### Story 6.5: Context Budget Visualization
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story**:
> As a user, I want to see how my prompt consumes the context window, so I can understand limits and token pressure.

**Acceptance Criteria**:
- [ ] Finite context bar visualization
- [ ] Segmented bar showing: system, instructions, user, overflow
- [ ] Overflow clearly marked (visual distinction)
- [ ] Token pressure indicators
- [ ] Real-time visual updates as prompt changes
- [ ] Percentage and absolute token counts displayed
- [ ] Color coding for different segments

**Technical Tasks**:
1. Create ContextBudgetViz component
2. Implement segmented progress bar
3. Add token counting for each segment (system, instructions, user)
4. Add overflow detection and visualization
5. Implement token pressure indicators
6. Add real-time updates on prompt change
7. Add color coding and visual styling
8. Write visualization tests

**Dependencies**: Story 6.4

**Testing**:
```typescript
// Test context budget visualization
test('context budget shows all segments', () => {
  const prompt = createPrompt({ system: 100, instructions: 500, user: 200 });
  const { getByTestId } = render(<ContextBudgetViz prompt={prompt} />);
  expect(getByTestId('system-segment')).toBeInTheDocument();
  expect(getByTestId('instructions-segment')).toBeInTheDocument();
  expect(getByTestId('user-segment')).toBeInTheDocument();
});

// Test overflow detection
test('overflow is clearly marked', () => {
  const prompt = createPrompt({ total: 9000 }); // Exceeds 8k context
  const { getByTestId } = render(<ContextBudgetViz prompt={prompt} />);
  const overflow = getByTestId('overflow-segment');
  expect(overflow).toHaveClass('overflow');
  expect(overflow).toBeVisible();
});
```

---

### Story 6.6: Heuristics Engine Foundation
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story**:
> As a user, I want to see system-level insights about my prompt, so I can understand structural risks and constraints without being told how to fix them.

**Acceptance Criteria**:
- [ ] Heuristics engine with 5 categories: Context Capacity, Truncation Risk, Instruction Dilution, Structural Ambiguity, Cost Pressure
- [ ] All 9 specific rules implemented:
  - CC-1: Context Overflow (High severity)
  - CC-2: Near Capacity (Medium severity)
  - TR-1: Critical Content After Cutoff (High severity)
  - ID-1: Multiple Role Definitions (Medium severity)
  - ID-2: Excessive Instruction Density (Medium severity)
  - SA-1: Multiple Primary Tasks (Medium severity)
  - SA-2: Late Task Definition (Low severity)
  - CP-1: High Fixed Cost Prompt (Medium severity)
  - CP-2: Cost Disproportionate to Task (Low severity)
- [ ] Severity-based prioritization (max 3 visible insights)
- [ ] High severity always shown, Medium if no High, Low only if space allows
- [ ] Deterministic behavior (same input = same output)
- [ ] Explainable (every insight maps to a clear rule)
- [ ] Alerts, not scores
- [ ] Non-prescriptive (never suggests fixes)

**Technical Tasks**:
1. Create HeuristicsEngine class
2. Implement 5 heuristic category analyzers
3. Implement all 9 specific rules with conditions
4. Add severity-based prioritization logic
5. Create insight display component (max 3 visible)
6. Add deterministic rule evaluation
7. Ensure explainable insights (rule mapping)
8. Add alert formatting (not scores)
9. Write comprehensive heuristics tests

**Dependencies**: Story 6.5

**Testing**:
```typescript
// Test heuristics engine determinism
test('heuristics engine is deterministic', () => {
  const prompt = createPrompt();
  const insights1 = heuristicsEngine.analyze(prompt);
  const insights2 = heuristicsEngine.analyze(prompt);
  expect(insights1).toEqual(insights2);
});

// Test rule CC-1: Context Overflow
test('CC-1 triggers on context overflow', () => {
  const prompt = createPrompt({ tokens: 9000 }); // Exceeds 8k
  const insights = heuristicsEngine.analyze(prompt);
  expect(insights.some(i => i.rule === 'CC-1' && i.severity === 'high')).toBe(true);
});

// Test prioritization (max 3 insights)
test('max 3 insights shown, prioritized by severity', () => {
  const prompt = createPromptWithMultipleIssues();
  const insights = heuristicsEngine.analyze(prompt);
  const visible = insights.filter(i => i.visible);
  expect(visible.length).toBeLessThanOrEqual(3);
  expect(visible.every(i => i.severity === 'high' || visible.length < 3)).toBe(true);
});
```

---

### Story 6.7: Instruction Dilution Detection
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story**:
> As a user, I want to know when multiple instructions conflict or dilute clarity, so I can understand instruction ambiguity.

**Acceptance Criteria**:
- [ ] Detect multiple role/task instructions
- [ ] Trigger "Instruction dilution detected" alert
- [ ] Alert explains impact, not solution
- [ ] Integrates with heuristics engine (ID-1, ID-2 rules)
- [ ] Visual indication of conflicting instructions

**Technical Tasks**:
1. Implement instruction parsing
2. Detect multiple role definitions (ID-1 rule)
3. Detect excessive instruction density (ID-2 rule)
4. Create instruction dilution alert component
5. Add visual highlighting of conflicting instructions
6. Ensure alerts explain impact, not solutions
7. Write instruction detection tests

**Dependencies**: Story 6.6

**Testing**:
```typescript
// Test ID-1: Multiple Role Definitions
test('detects multiple role definitions', () => {
  const prompt = 'You are a writer. Act as a developer.';
  const insights = heuristicsEngine.analyze(prompt);
  expect(insights.some(i => i.rule === 'ID-1')).toBe(true);
});

// Test ID-2: Excessive Instruction Density
test('detects excessive instruction density', () => {
  const prompt = createPrompt({ instructionTokens: 4000, totalTokens: 8000 });
  const insights = heuristicsEngine.analyze(prompt);
  expect(insights.some(i => i.rule === 'ID-2')).toBe(true);
});
```

---

### Story 6.8: Truncation Simulation
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story**:
> As a user, I want to simulate truncation, so I can see what the model may ignore due to context limits.

**Acceptance Criteria**:
- [ ] "Simulate truncation" button
- [ ] Visually fade ignored content
- [ ] Show what gets truncated based on context window
- [ ] No auto-correction or suggestions
- [ ] Clear visual distinction between visible and truncated content

**Technical Tasks**:
1. Create TruncationSimulator component
2. Implement truncation logic based on context window
3. Add visual fade effect for truncated content
4. Add "Simulate truncation" button
5. Ensure no auto-correction or suggestions
6. Add clear visual indicators
7. Write truncation simulation tests

**Dependencies**: Story 6.5

**Testing**:
```typescript
// Test truncation simulation
test('truncation simulator fades ignored content', () => {
  const prompt = createPrompt({ tokens: 9000 }); // Exceeds context
  const { getByRole, getByTestId } = render(<TruncationSimulator prompt={prompt} />);
  const button = getByRole('button', { name: /simulate truncation/i });
  fireEvent.click(button);
  const truncated = getByTestId('truncated-content');
  expect(truncated).toHaveClass('faded');
  expect(truncated).toHaveStyle({ opacity: '0.5' });
});
```

---

### Story 6.9: Cost Impact Awareness
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story**:
> As a user, I want to understand cost implications before production use, so I can make informed decisions about prompt design.

**Acceptance Criteria**:
- [ ] Per-call cost estimate
- [ ] Clear "at scale" wording
- [ ] No optimization suggestions
- [ ] Cost breakdown by segment (system, instructions, user)
- [ ] Model pricing configuration support

**Technical Tasks**:
1. Create CostCalculator component
2. Implement per-call cost calculation
3. Add "at scale" cost projection
4. Add cost breakdown visualization
5. Add model pricing configuration
6. Ensure no optimization suggestions
7. Write cost calculation tests

**Dependencies**: Story 6.5

**Testing**:
```typescript
// Test cost calculation
test('calculates per-call cost correctly', () => {
  const prompt = createPrompt({ tokens: 1000 });
  const cost = calculateCost(prompt, { model: 'gpt-4', pricePer1kTokens: 0.03 });
  expect(cost.perCall).toBeCloseTo(0.03, 2);
});

// Test at scale projection
test('shows at scale cost projection', () => {
  const prompt = createPrompt({ tokens: 1000 });
  const cost = calculateCost(prompt, { model: 'gpt-4', pricePer1kTokens: 0.03 });
  expect(cost.atScale1M).toBeDefined();
  expect(cost.atScale1M).toBeGreaterThan(cost.perCall);
});
```

---

### Story 6.10: Retrieval Reality Cockpit
**Phase**: Future Cockpits  
**Priority**: P2  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to understand what actually gets retrieved and why, so I can understand retrieval system behavior.

**Acceptance Criteria**:
- [ ] Chunk ordering visualization
- [ ] Recall vs precision indicators
- [ ] Retrieval noise exposure
- [ ] Context pollution simulation
- [ ] Deterministic retrieval simulation

**Technical Tasks**:
1. Design Retrieval Reality Cockpit architecture
2. Implement chunk ordering visualization
3. Add recall vs precision metrics
4. Add retrieval noise detection
5. Add context pollution simulation
6. Write cockpit tests

**Dependencies**: Story 6.3

**Testing**:
```typescript
// Test retrieval cockpit
test('retrieval cockpit visualizes chunk ordering', () => {
  const cockpit = render(<RetrievalRealityCockpit />);
  expect(cockpit.getByTestId('chunk-ordering')).toBeInTheDocument();
});
```

---

### Story 6.11: Cost Reality Cockpit
**Phase**: Future Cockpits  
**Priority**: P2  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to understand where the money really goes in AI systems, so I can make cost-aware decisions.

**Acceptance Criteria**:
- [ ] Fixed vs variable cost modeling
- [ ] Scale-based cost simulation
- [ ] Retry amplification visualization
- [ ] Model pricing impact analysis
- [ ] Cost breakdown by component

**Technical Tasks**:
1. Design Cost Reality Cockpit architecture
2. Implement fixed vs variable cost modeling
3. Add scale-based cost simulation
4. Add retry amplification visualization
5. Add model pricing impact analysis
6. Write cockpit tests

**Dependencies**: Story 6.3

**Testing**:
```typescript
// Test cost cockpit
test('cost cockpit models fixed vs variable costs', () => {
  const cockpit = render(<CostRealityCockpit />);
  expect(cockpit.getByTestId('fixed-costs')).toBeInTheDocument();
  expect(cockpit.getByTestId('variable-costs')).toBeInTheDocument();
});
```

---

### Story 6.12: Agent Reality Cockpit
**Phase**: Future Cockpits  
**Priority**: P2  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story**:
> As a learner, I want to understand where autonomy breaks down in agent systems, so I can design more reliable agent architectures.

**Acceptance Criteria**:
- [ ] Planning drift visualization
- [ ] Tool misuse scenarios
- [ ] Loop detection
- [ ] Decision boundary exposure
- [ ] Failure mode analysis

**Technical Tasks**:
1. Design Agent Reality Cockpit architecture
2. Implement planning drift visualization
3. Add tool misuse detection
4. Add loop detection
5. Add decision boundary visualization
6. Write cockpit tests

**Dependencies**: Story 6.3

**Testing**:
```typescript
// Test agent cockpit
test('agent cockpit detects planning drift', () => {
  const cockpit = render(<AgentRealityCockpit />);
  expect(cockpit.getByTestId('planning-drift')).toBeInTheDocument();
});
```

---

## Sprint Planning Summary

### Phase 1 (Weeks 1-3): Enhanced RAG Foundation
**Goal**: Advanced RAG visualizations  
**Stories**: 1.1, 1.2, 1.3, 1.4, 1.5  
**Total Points**: 20  
**Deliverable**: Complete RAG Studio with advanced features

### Phase 2 (Weeks 4-7): Agent Lab Foundation
**Goal**: Agent pattern visualizations  
**Stories**: 2.1, 2.2, 2.3, 2.4  
**Total Points**: 17  
**Deliverable**: Complete Agent Lab with all patterns

### Phase 3 (Weeks 8-12): Multi-Agent Arena
**Goal**: Multi-agent orchestration  
**Stories**: 3.1, 3.2, 3.3, 3.4  
**Total Points**: 15  
**Deliverable**: Complete Multi-Agent Arena

### Phase 4 (Weeks 13-14): Prompt Reasoning Techniques
**Goal**: Interactive reasoning pattern exploration  
**Stories**: 4.1  
**Total Points**: 8  
**Deliverable**: Complete Prompt Reasoning module  
**Status**: ✅ COMPLETED

### Phase 5 (Weeks 15-22): Advanced AI Concepts
**Goal**: Advanced AI system visualizations  
**Stories**: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6  
**Total Points**: 39  
**Deliverable**: LLM, Diffusion, A2A, MCP, Agentic Commerce & E-commerce modules

### Phase 6 (Weeks 23-30): Advanced Mode & Cockpits
**Goal**: System-level insight under real constraints  
**Stories**: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12  
**Total Points**: 50  
**Deliverable**: Advanced Mode infrastructure, Prompt Reality Cockpit v1, future cockpit placeholders

---

**Document Status**: ACTIVE - Updated Continuously  
**Total Stories Defined**: 32  
**Total Story Points**: 149  
**Completed Stories**: 2 (1.1, 4.1)  
**Estimated Timeline**: 30 weeks

