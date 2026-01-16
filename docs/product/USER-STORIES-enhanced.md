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

## Phase 4.5: Prompt Efficiency Module (Basic Mode)

### Story 4.2: Prompt Efficiency & Cost-Reduction Patterns
**Phase**: Basic Mode Enhancement  
**Priority**: P1  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a learner, I want to explore cost-reduction patterns and token optimization techniques, so I can write more efficient prompts that reduce costs while maintaining quality.

**Value Proposition for Traffic**:
- **Cost Awareness**: "Learn to write prompts that cost 50% less"
- **SEO Keywords**: "prompt optimization", "token reduction", "AI cost efficiency", "prompt efficiency patterns"
- **Cross-Mode Integration**: Links from Advanced Mode cost insights to Basic Mode learning
- **Practical Value**: Bookmark-worthy resource for prompt engineers

**Acceptance Criteria**:
- [ ] **Prompt Efficiency Module** in Basic Mode:
  - Interactive token reduction techniques
  - Before/after prompt comparisons
  - Cost impact visualization
  - Pattern library (Chain-of-Draft, instruction compression, etc.)
- [ ] **Techniques Covered**:
  - Instruction compression (removing redundancy)
  - Role definition optimization
  - Task clarity improvements
  - Context window management
  - Token-efficient reasoning patterns
- [ ] **Interactive Examples**:
  - Side-by-side comparison: "Before (847 tokens) → After (523 tokens)"
  - Real-time token counting as you edit
  - Cost savings calculator
- [ ] **Pattern Library**:
  - Common inefficiency patterns
  - Optimization strategies
  - Best practices (non-prescriptive, educational)
- [ ] **Integration with Advanced Mode**:
  - Link from Context Budget Viz "Optimize Challenge"
  - Link from Cost Reality Cockpit
  - Seamless mode switching

**Technical Tasks**:
1. Create PromptEfficiencyPage component
2. Implement token reduction techniques analyzer
3. Add before/after comparison tool
4. Create pattern library with examples
5. Add cost savings calculator
6. Integrate with mode switching
7. Add routing (`/basic/prompt-efficiency`)
8. Write component tests

**Dependencies**: Story 4.1 (Prompt Reasoning), Story 6.3 (Mode Switching)

**Testing**:
```typescript
// Test prompt efficiency module
test('prompt efficiency module shows token reduction', () => {
  const { getByText } = render(<PromptEfficiencyPage />);
  expect(getByText(/token reduction/i)).toBeInTheDocument();
});

// Test before/after comparison
test('user can compare prompt versions', () => {
  const { getByTestId } = render(<PromptEfficiencyPage />);
  const beforeInput = getByTestId('before-prompt');
  const afterInput = getByTestId('after-prompt');
  
  fireEvent.change(beforeInput, { target: { value: longPrompt } });
  fireEvent.change(afterInput, { target: { value: optimizedPrompt } });
  
  expect(getByTestId('token-savings')).toHaveTextContent('324 tokens saved');
  expect(getByTestId('cost-savings')).toHaveTextContent('$0.01 per call');
});

// Test mode switching integration
test('clicking link from Advanced Mode switches to Basic Mode', () => {
  useModeStore.setState({ mode: 'advanced' });
  const { getByText } = render(<ContextBudgetViz prompt={testPrompt} />);
  const link = getByText(/learn more about prompt engineering/i);
  
  fireEvent.click(link);
  
  expect(useModeStore.getState().mode).toBe('basic');
  expect(window.location.pathname).toBe('/basic/prompt-efficiency');
});
```

**Gamification Elements**:
- [ ] **Efficiency Badge**: "You reduced this prompt by 38% - Great job!"
- [ ] **Challenge Mode**: "Can you reduce this prompt to under 500 tokens?"
- [ ] **Progress Tracking**: "You've optimized 5 prompts this session"

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

## Phase 6: Advanced Mode & Reality Cockpits (VISITOR-OPTIMIZED)

### Story 6.1: Seamless Mode Architecture ✅ IMPLEMENTED
**Phase**: Advanced Mode Infrastructure  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟢 DONE

**User Story** (Visitor-Focused):
> As a visitor, I want to explore both beginner-friendly tutorials and professional-grade tools seamlessly, so I can grow from learning to building without switching platforms.

**Value Proposition for Traffic**:
- **Retention Hook**: One platform for entire learning journey (beginner → professional)
- **SEO Keywords**: "AI learning platform", "beginner to professional AI", "progressive AI education"
- **Social Proof Angle**: "From sandbox to production mindset in one place"

**Acceptance Criteria**:
- [x] Existing Playground modules (RAG Studio, Agent Lab, Multi-Agent Arena, Prompt Reasoning) preserved as Basic Mode
- [x] No cockpit logic leaks into Basic Mode components
- [x] Basic Mode maintains exploratory, open-ended, educational characteristics
- [x] Basic Mode remains free forever
- [x] All existing functionality works identically after refactoring
- [x] Clear architectural separation between Basic and Advanced Mode

**Enhancements to Existing Implementation** (if not already present):
- [ ] Add subtle "upgrade path" visual hints in Basic Mode (e.g., "🚀 Ready for production constraints? Try Advanced Mode")
- [ ] Add progress tracking: "You've mastered 3/5 Basic Mode modules - unlock Advanced Mode insights"
- [ ] Add success stories/testimonials toggle: "How others used both modes to ship real products"

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

### Story 6.2: Advanced Mode Discovery Experience ✅ IMPLEMENTED
**Phase**: Advanced Mode Infrastructure  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟢 DONE

**User Story** (Visitor-Focused):
> As a visitor, I want to discover Advanced Mode through an inspiring landing experience, so I feel excited (not intimidated) to explore production-level constraints.

**Value Proposition for Traffic**:
- **Curiosity Hook**: "See what your prompts really cost in production"
- **SEO Keywords**: "production AI constraints", "real-world AI limitations", "AI system debugging"
- **Shareability**: "Before/After" comparison style content (great for social media)

**Acceptance Criteria**:
- [x] Landing page with calm, confident, non-marketing tone
- [x] Title: "Advanced Mode", Subtitle: "System-level insight under real constraints"
- [x] Framing copy explaining Advanced Mode purpose (no optimization, reveals limits)
- [x] Explicit contrast section: "How this differs from Basic Mode"
- [x] "What you will gain" section with bullet points
- [x] "What this mode intentionally avoids" section with bullet points
- [x] Entry CTA button: "Enter Prompt Reality Cockpit"
- [x] Microcopy: "You can return to Basic Mode at any time"
- [x] Monetization signaling (future-safe, hidden/secondary)
- [x] UX behavior: appears once per session, no modal popups, no feature comparison tables, no pricing language

**Enhancements to Existing Implementation** (if not already present):
- [ ] Add interactive preview: "Paste any prompt and see instant insights" (before entering full cockpit)
- [ ] Add "3 surprising things you'll discover" section with animated demos
- [ ] Add social sharing: "I just discovered my prompt costs $X at scale 🤯" (Twitter/LinkedIn cards)
- [ ] Add video embed option: 30-second explainer "What is Advanced Mode?"
- [ ] Add visitor counter: "Join 1,234 developers exploring production AI realities"

**Revised Landing Page Copy**:
```
HEADLINE: "Advanced Mode"
SUBHEADLINE: "See what production AI actually looks like — before you ship"

HOOK SECTION:
"Your prompt looks perfect in testing. Then you scale it.
Suddenly: costs spike, context overflows, instructions get ignored.
Advanced Mode shows you these realities before they become production fires."

WHAT YOU'LL DISCOVER:
✓ Where your tokens actually go (system vs user vs waste)
✓ What happens when prompts exceed context limits
✓ How much your "perfect" prompt costs at 10,000 calls/day
✓ Which instructions models actually see vs ignore

WHAT THIS ISN'T:
✗ Another prompt optimizer (no "fix this" suggestions)
✗ A benchmarking tool (no leaderboards or scores)
✗ A replacement for Basic Mode (use both together)

ENTRY CTA: "Open Prompt Reality Cockpit →"
MICROCOPY: "Free forever. Return to Basic Mode anytime."
```

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

### Story 6.3: Intelligent Mode Switching ✅ IMPLEMENTED
**Phase**: Advanced Mode Infrastructure  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟢 DONE

**User Story** (Visitor-Focused):
> As a visitor, I want to switch between exploration and reality-checking seamlessly, so I can learn concepts in Basic Mode and validate them in Advanced Mode.

**Value Proposition for Traffic**:
- **Workflow Hook**: "Learn → Validate → Ship" in one platform
- **SEO Keywords**: "AI prompt validation", "production prompt testing", "AI workflow optimization"
- **Retention**: Encourages cross-mode exploration (more time on site)

**Acceptance Criteria**:
- [x] Mode toggle/switcher component
- [x] First-time users default to Basic Mode
- [x] Advanced Mode is discoverable but never forced
- [x] Mode state persisted in localStorage
- [x] Navigation rules enforced: no tabs inside cockpits
- [x] One cockpit active at a time in Advanced Mode
- [x] Explicit mode switch (clear visual indication)
- [x] Smooth transition between modes

**Enhancements to Existing Implementation** (if not already present):
- [ ] Add contextual mode suggestions: When user creates complex prompt in Basic Mode → "Want to see how this performs in production? Switch to Advanced Mode"
- [ ] Add breadcrumb navigation: "Basic Mode > RAG Studio" with quick switch to "Advanced Mode > Retrieval Reality"
- [ ] Add comparison snapshots: "Save this Basic Mode exploration, then validate in Advanced Mode"
- [ ] Add usage analytics display: "You've spent 12 min in Basic Mode, 8 min in Advanced Mode this session"

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

### Story 6.4: Production Prompt Analyzer ✅ IMPLEMENTED
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 2  
**Status**: 🟢 DONE

**User Story** (Visitor-Focused):
> As a visitor, I want to paste my actual production prompts and see instant reality checks, so I can debug problems before my users encounter them.

**Value Proposition for Traffic**:
- **Instant Gratification**: Results in <1 second
- **SEO Keywords**: "prompt debugger", "AI prompt analyzer", "production prompt testing"
- **Viral Potential**: "Paste your ChatGPT prompt and see the hidden problems"

**Acceptance Criteria**:
- [x] Single large textarea component
- [x] Accepts long prompts (>10k tokens)
- [x] No formatting loss on paste
- [x] Immediate feedback on change
- [x] Real-time token counting
- [x] Support for multi-line prompts

**Enhancements to Existing Implementation** (if not already present):
- [ ] Add "Load Example Prompts" dropdown (GitHub Copilot-style, GPT-4-style, Claude-style templates)
- [ ] Add "Import from ChatGPT/Claude" button (parse conversation history)
- [ ] Add prompt library: "Browse 50+ real-world prompts from production systems"
- [ ] Add instant share: "Share this analysis" → generates shareable link with anonymized prompt

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

### Story 6.5: Visual Context Budget Explorer
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want to see my context window as a real, finite resource with visual pressure indicators, so I understand why my prompt sometimes "forgets" important details.

**Value Proposition for Traffic**:
- **"Aha!" Moment**: "So THAT'S why my chatbot ignores my instructions!"
- **SEO Keywords**: "context window visualization", "token budget explained", "why AI forgets context"
- **Shareability**: Visual "before overflow/after overflow" comparisons

**Acceptance Criteria**:
- [ ] **Interactive stacked bar** with drag-to-adjust segments (System, Instructions, User Input, Assistant Response)
- [ ] **Real-time overflow animation**: Watch context "push out" earlier content
- [ ] **Pressure gradient**: Visual heat map (green → yellow → red) as context fills
- [ ] **Comparison mode**: "GPT-3.5 (4k) vs GPT-4 (8k) vs GPT-4 Turbo (128k)" side-by-side
- [ ] **Popular prompts benchmark**: "Your prompt uses more tokens than 78% of production prompts"
- [ ] **Export visualization**: Download PNG for documentation/Slack

**Technical Tasks**:
1. Create ContextBudgetViz component
2. Implement segmented progress bar with drag-to-adjust
3. Add token counting for each segment (system, instructions, user)
4. Add overflow detection and animation
5. Implement pressure gradient visualization
6. Add model comparison mode
7. Add benchmark comparison
8. Add export functionality
9. Write visualization tests

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

// Test drag-to-adjust feature
test('user can drag segments to simulate changes', () => {
  const { getByTestId } = render(<ContextBudgetViz />);
  const systemSegment = getByTestId('system-segment');
  
  // Drag to expand system prompt
  fireEvent.drag(systemSegment, { deltaX: 100 });
  
  // See real-time impact on user segment
  const userSegment = getByTestId('user-segment');
  expect(userSegment.style.width).toBe('reduced');
  expect(getByTestId('overflow-warning')).toBeVisible();
});
```

**Gamification Element**:
- [ ] Add "Context Efficiency Score": "Your prompt is 23% more efficient than similar use cases"
- [ ] Add "Optimize Challenge": "Can you express this prompt in 30% fewer tokens?" (links back to Basic Mode for learning)

---

### Story 6.6: Smart Heuristics Insight Engine
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want to see exactly what's wrong with my prompt (not generic advice), so I can understand production failure modes specific to my use case.

**Value Proposition for Traffic**:
- **Specificity Hook**: "Not 'use fewer tokens' but '847 tokens in your system prompt dilute instruction clarity'"
- **SEO Keywords**: "AI prompt debugging", "production AI problems", "prompt engineering mistakes"
- **Trust Builder**: No generic advice = visitors feel it's tailored to them

**5 Categories Reframed for Visitor Appeal**:

1. **🔴 Context Capacity** → "The Hard Limit Problem"
   - Visitor-friendly explanation: "You're trying to fit a book into a tweet"
   
2. **⚠️ Truncation Risk** → "The Silent Cutoff Problem"  
   - Visitor-friendly explanation: "Your important stuff is getting pushed off a cliff"

3. **🟡 Instruction Dilution** → "The 'Too Many Cooks' Problem"
   - Visitor-friendly explanation: "When you ask for everything, models hear nothing"

4. **🟠 Structural Ambiguity** → "The 'Wait, What?' Problem"
   - Visitor-friendly explanation: "Even you're confused re-reading this prompt"

5. **💰 Cost Pressure** → "The Bill Shock Problem"
   - Visitor-friendly explanation: "This prompt costs $X per call. At scale, that's $Y/month"

**Acceptance Criteria**:
- [ ] Heuristics engine with 5 categories: Context Capacity, Truncation Risk, Instruction Dilution, Structural Ambiguity, Cost Pressure
- [ ] All 9 specific rules implemented:
  - **CC-1**: Context Overflow (High severity)
  - **CC-2**: Near Capacity (Medium severity)
  - **TR-1**: Critical Content After Cutoff (High severity)
  - **ID-1**: Multiple Role Definitions (Medium severity)
  - **ID-2**: Excessive Instruction Density (Medium severity)
  - **SA-1**: Multiple Primary Tasks (Medium severity)
  - **SA-2**: Late Task Definition (Low severity)
  - **CP-1**: High Fixed Cost Prompt (Medium severity)
  - **CP-2**: Cost Disproportionate to Task (Low severity)
- [ ] Severity-based prioritization (max 3 visible insights)
- [ ] High severity always shown, Medium if no High, Low only if space allows
- [ ] Deterministic behavior (same input = same output)
- [ ] Explainable (every insight maps to a clear rule)
- [ ] Alerts, not scores
- [ ] Non-prescriptive (never suggests fixes)

**Interactive Heuristics Features**:
- [ ] **Severity filtering**: Toggle "Show only critical" / "Show all warnings"
- [ ] **"Explain like I'm 5"** mode: Simplified explanations for each heuristic
- [ ] **Evidence highlighting**: Click insight → see exact problematic text highlighted in prompt
- [ ] **Comparison mode**: "Run heuristics on example prompt" → see same rules applied to different prompt
- [ ] **Export report**: "Download Insight Report (PDF)" for team sharing

**Technical Tasks**:
1. Create HeuristicsEngine class
2. Implement 5 heuristic category analyzers
3. Implement all 9 specific rules with conditions
4. Add severity-based prioritization logic
5. Create insight display component (max 3 visible)
6. Add deterministic rule evaluation
7. Ensure explainable insights (rule mapping)
8. Add alert formatting (not scores)
9. Add interactive features (filtering, ELI5, highlighting)
10. Write comprehensive heuristics tests

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

**Gamification Element**:
- [ ] **Prompt Health Score**: "Your prompt has 2 critical issues, 1 warning" (visual badge)
- [ ] **Challenge Mode**: "Can you rewrite this prompt to eliminate all critical issues?" (links to Basic Mode)

---

### Story 6.7: Instruction Conflict Detector
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want to see when my instructions contradict each other, so I understand why my AI gives inconsistent outputs.

**Value Proposition for Traffic**:
- **"Gotcha!" Moment**: "You told the AI to be 'concise' AND 'comprehensive' - it's confused!"
- **SEO Keywords**: "AI instruction conflicts", "prompt contradiction detection", "why AI gives inconsistent results"
- **Viral Potential**: Screenshots of wild instruction conflicts make great LinkedIn content

**Acceptance Criteria**:
- [ ] **Visual conflict map**: Network graph showing conflicting instruction pairs
- [ ] **Conflict severity scoring**: "Critical" (direct contradiction) vs "Warning" (tension)
- [ ] **Real-world examples**: "This is like asking for a 'short detailed essay' - see the problem?"
- [ ] **Before/After simulator**: Show two AI responses when given conflicting instructions
- [ ] **Conflict categories**:
  - Tone conflicts: "Be formal" vs "Use casual language"
  - Length conflicts: "Be concise" vs "Provide detailed explanations"
  - Role conflicts: "You are a teacher" vs "You are a peer"
  - Task conflicts: "Summarize" vs "Expand on these points"
- [ ] Integrates with heuristics engine (ID-1, ID-2 rules)
- [ ] Visual indication of conflicting instructions

**Technical Tasks**:
1. Implement instruction parsing
2. Detect multiple role definitions (ID-1 rule)
3. Detect excessive instruction density (ID-2 rule)
4. Create instruction conflict map visualization
5. Create instruction dilution alert component
6. Add visual highlighting of conflicting instructions
7. Add before/after simulator
8. Ensure alerts explain impact, not solutions
9. Write instruction detection tests

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

// Test interactive conflict resolver
test('user can explore conflict resolution paths', () => {
  const prompt = "Be brief but comprehensive. Use formal language but be friendly.";
  const { getByTestId } = render(<InstructionConflictDetector prompt={prompt} />);
  
  // See detected conflicts
  const conflicts = getByTestId('conflict-list');
  expect(conflicts.children).toHaveLength(2);
  
  // Click on conflict to see impact
  fireEvent.click(conflicts.children[0]);
  expect(getByTestId('conflict-impact-viz')).toBeVisible();
  
  // See "what would happen if you removed this instruction"
  const simulator = getByTestId('removal-simulator');
  expect(simulator).toShowDifferentOutputs();
});
```

**Gamification Element**:
- [ ] **"Spot the Conflict" Quiz**: Show 5 prompts, visitor identifies conflicts → share score
- [ ] **Conflict Library**: Browse 100+ real-world instruction conflicts from production systems

---

### Story 6.8: Live Truncation Simulator
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want to see exactly which parts of my prompt get "eaten" by context limits, so I stop wondering why my instructions are ignored.

**Value Proposition for Traffic**:
- **Visual Impact**: Watching text fade/disappear is viscerally memorable
- **SEO Keywords**: "context window truncation", "why AI ignores instructions", "prompt cutoff visualization"
- **Shareability**: Before/after GIFs of truncation make great Twitter content

**Acceptance Criteria**:
- [ ] **Real-time fade simulation**: As prompt exceeds context, watch text fade from start
- [ ] **"Point of no return" marker**: Clear line showing where truncation begins
- [ ] **Truncation styles**:
  - First-in-first-out (FIFO): Oldest content disappears
  - Middle truncation: Beginning + end preserved, middle removed
  - Sliding window: Recent context preserved
- [ ] **Interactive slider**: "Simulate with 4k / 8k / 16k / 32k / 128k context windows"
- [ ] **"What survives?" summary**: Show exactly what text makes it through
- [ ] **Export comparison**: Download before/after screenshots
- [ ] No auto-correction or suggestions
- [ ] Clear visual distinction between visible and truncated content

**New Feature: "Truncation Horror Stories"**:
- [ ] Real-world examples: "This production prompt lost critical safety instructions due to truncation"
- [ ] Interactive case studies: Load famous AI failures caused by truncation
- [ ] Community submissions: "Share your truncation disasters"

**Technical Tasks**:
1. Create TruncationSimulator component
2. Implement truncation logic based on context window
3. Add visual fade effect for truncated content
4. Add multi-model comparison view
5. Add "Simulate truncation" button
6. Add truncation style selector
7. Ensure no auto-correction or suggestions
8. Add clear visual indicators
9. Write truncation simulation tests

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

// Test multi-model truncation comparison
test('user can compare truncation across models', () => {
  const longPrompt = createPrompt({ tokens: 10000 });
  const { getByTestId } = render(<TruncationSimulator prompt={longPrompt} />);
  
  // Enable multi-model view
  fireEvent.click(getByTestId('compare-models-btn'));
  
  // See side-by-side truncation
  const gpt35View = getByTestId('truncation-gpt3.5');
  const gpt4View = getByTestId('truncation-gpt4');
  const gpt4TurboView = getByTestId('truncation-gpt4-turbo');
  
  expect(gpt35View.truncatedAt).toBe(4000);
  expect(gpt4View.truncatedAt).toBe(8000);
  expect(gpt4TurboView.truncatedAt).toBe(128000);
});
```

**Gamification Element**:
- [ ] **Truncation Survival Score**: "83% of your prompt survives in GPT-4 context"
- [ ] **Challenge**: "Rewrite this prompt to survive truncation in all models"

---

### Story 6.9: Production Cost Reality Dashboard
**Phase**: Prompt Reality Cockpit  
**Priority**: P0  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want to see "if I run this prompt 1,000 times today, I'll spend $X," so I make informed decisions before going to production.

**Value Proposition for Traffic**:
- **Shock Value**: "Wait, this 'simple' chatbot costs $2,400/month at scale?!"
- **SEO Keywords**: "AI cost calculator", "ChatGPT API cost estimator", "production AI pricing"
- **Tool Value**: Bookmark-worthy calculator visitors return to use

**Acceptance Criteria**:
- [ ] **Interactive cost calculator**:
  - Sliders: Calls/day, Average response length
  - Dropdowns: Model selection (GPT-3.5, GPT-4, Claude, etc.)
  - Real-time cost update: "At 1,000 calls/day: $45.60/month"
- [ ] **Cost breakdown visualization**:
  - Pie chart: Input tokens vs Output tokens vs Fixed costs
  - Stacked bar: Daily → Weekly → Monthly → Annual projections
- [ ] **"Hidden costs" revealer**:
  - Retry costs: "If 10% of calls fail and retry: +$4.56/month"
  - Error handling: "Error responses still cost you tokens"
  - Streaming costs: "Streaming responses may cost more due to overhead"
- [ ] **Model comparison table**:
  - Side-by-side: GPT-3.5 vs GPT-4 vs Claude Opus vs Gemini Pro
  - Quality vs Cost trade-off visualization
- [ ] **Break-even analysis**: "You'd need 2,500 paid users at $10/month to break even"
- [ ] Per-call cost estimate
- [ ] Clear "at scale" wording
- [ ] No optimization suggestions
- [ ] Cost breakdown by segment (system, instructions, user)
- [ ] Model pricing configuration support

**New Feature: "Cost Optimization Leaderboard"** (without prescriptive advice):
- [ ] "Visitors who analyzed similar prompts found ways to reduce costs by 40% on average"
- [ ] "Most efficient prompt in this category: 234 tokens (yours: 847 tokens)"
- [ ] "Explore Basic Mode to learn cost-reduction patterns" (drives cross-mode traffic)

**Technical Tasks**:
1. Create CostCalculator component
2. Implement per-call cost calculation
3. Add "at scale" cost projection
4. Add cost breakdown visualization
5. Add model pricing configuration
6. Add interactive calculator with sliders
7. Add model comparison table
8. Add hidden costs revealer
9. Ensure no optimization suggestions
10. Write cost calculation tests

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

// Test what-if scenario builder
test('user can model different scaling scenarios', () => {
  const { getByTestId } = render(<CostRealityDashboard />);
  
  // Scenario 1: Launch day
  fireEvent.change(getByTestId('calls-per-day'), { target: { value: 100 } });
  expect(getByTestId('monthly-cost')).toHaveTextContent('$4.56');
  
  // Scenario 2: After viral growth
  fireEvent.change(getByTestId('calls-per-day'), { target: { value: 10000 } });
  expect(getByTestId('monthly-cost')).toHaveTextContent('$456.00');
  
  // Save scenario for comparison
  fireEvent.click(getByTestId('save-scenario'));
  expect(getByTestId('scenario-comparison')).toShowBothScenarios();
});
```

**Gamification Element**:
- [ ] **Cost Efficiency Badge**: "Your prompt is more efficient than 65% of similar use cases"
- [ ] **Challenge**: "Can you express this in 50% fewer tokens?" → Links to Basic Mode

---

### Story 6.10: Retrieval Reality Cockpit
**Phase**: Future Cockpits  
**Priority**: P1  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want to see which chunks my RAG system actually retrieves (and which it misses), so I understand why my AI "doesn't know" information that's definitely in my documents.

**Value Proposition for Traffic**:
- **Pain Point Solution**: "Why does my chatbot say 'I don't know' when the answer is RIGHT THERE?"
- **SEO Keywords**: "RAG debugging", "vector search visualization", "why retrieval fails"
- **Differentiation**: No other tool visualizes retrieval failures this clearly

**Acceptance Criteria**:
- [ ] **Retrieval Timeline Visualization**:
  - Show query → embedding → search → ranking → final context
  - Animate the "journey" from question to retrieved chunks
- [ ] **Chunk Ranking Explorer**:
  - Display top 20 candidates (not just top 5)
  - Show why #6-20 didn't make the cut
  - Highlight "close calls" (chunks just below threshold)
- [ ] **Recall Gap Detector**:
  - "Your system retrieved 3 relevant chunks but missed 2 others"
  - Show missed chunks with explanation: "Why this didn't rank higher"
- [ ] **Precision Pollution Visualizer**:
  - Highlight irrelevant chunks that snuck into top-k
  - "Chunk #4 is 37% irrelevant - it's polluting your context"
- [ ] **Embedding Space Mismatch**:
  - Show query embedding vs chunk embeddings in 3D
  - Highlight "semantic drift" (chunks that look close but aren't)
- [ ] Chunk ordering visualization
- [ ] Recall vs precision indicators
- [ ] Retrieval noise exposure
- [ ] Context pollution simulation
- [ ] Deterministic retrieval simulation

**New Feature: "Retrieval Horror Stories"**:
- [ ] Real-world case studies: "This customer service bot missed critical policy updates"
- [ ] Interactive failures: Load famous RAG failures, let visitors debug them
- [ ] Community submissions: "Share your worst retrieval failures"

**Technical Tasks**:
1. Design Retrieval Reality Cockpit architecture
2. Implement retrieval timeline visualization
3. Implement chunk ranking explorer
4. Add recall gap detector
5. Add precision pollution visualizer
6. Add embedding space visualization
7. Add retrieval noise detection
8. Add context pollution simulation
9. Write cockpit tests

**Dependencies**: Story 6.3

**Testing**:
```typescript
// Test retrieval cockpit
test('retrieval cockpit visualizes chunk ordering', () => {
  const cockpit = render(<RetrievalRealityCockpit />);
  expect(cockpit.getByTestId('chunk-ordering')).toBeInTheDocument();
});

// Test "why did this fail?" debugger
test('user can debug retrieval failures', () => {
  const query = "What are our refund policies?";
  const { getByTestId } = render(<RetrievalRealityCockpit query={query} />);
  
  // See what WAS retrieved
  const retrieved = getByTestId('retrieved-chunks');
  expect(retrieved.children).toHaveLength(5);
  
  // See what SHOULD have been retrieved (ground truth)
  fireEvent.click(getByTestId('show-missed-chunks'));
  const missed = getByTestId('missed-chunks');
  expect(missed.children).toHaveLength(2);
  
  // Click missed chunk to see "why it failed"
  fireEvent.click(missed.children[0]);
  expect(getByTestId('failure-reason')).toHaveTextContent(
    'Similarity score: 0.68 (threshold: 0.70) - missed by 0.02'
  );
});
```

**Gamification Element**:
- [ ] **Retrieval Accuracy Score**: "Your RAG system has 78% recall, 85% precision"
- [ ] **Challenge**: "Can you tune this system to 90% recall?" → Links to RAG Studio in Basic Mode

---

### Story 6.11: Cost Reality Cockpit
**Phase**: Future Cockpits  
**Priority**: P1  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want to see where every dollar goes in my AI system (not just API calls), so I can understand total cost of ownership before committing to a vendor.

**Value Proposition for Traffic**:
- **Hidden Costs Exposed**: "API cost is only 40% of your total AI spend"
- **SEO Keywords**: "total cost of AI ownership", "hidden AI costs", "production AI budget"
- **Decision Support**: CFOs bookmark this for budgeting

**Acceptance Criteria**:
- [ ] **Total Cost Breakdown**:
  - API calls (obvious)
  - Vector database hosting
  - Embedding generation
  - Retry/error handling
  - Data preprocessing
  - Monitoring/observability
  - Human review loops
- [ ] **Fixed vs Variable Cost Modeling**:
  - "Your fixed costs: $500/month (regardless of usage)"
  - "Your variable costs: $0.12 per conversation"
  - Break-even point calculator
- [ ] **Scale-Based Cost Simulation**:
  - "At 100 users: $X/month"
  - "At 1,000 users: $Y/month"
  - "At 10,000 users: $Z/month"
  - Show where economies of scale kick in (or don't)
- [ ] **Retry Amplification Visualizer**:
  - "If 5% of calls fail and retry 3 times: +18% cost increase"
  - Animation showing retry cascades
- [ ] **Model Pricing Impact Analysis**:
  - "Switching from GPT-4 to GPT-3.5: -73% cost, ~15% quality drop"
  - Interactive slider to balance quality vs cost

**New Feature: "Cost Surprise Simulator"**:
- [ ] "What if your app goes viral overnight?" → Model unexpected scale
- [ ] "What if a bot attacks your endpoint?" → Model abuse scenarios
- [ ] "What if your retry logic is broken?" → Model cascading failures

**Technical Tasks**:
1. Design Cost Reality Cockpit architecture
2. Implement total cost breakdown
3. Implement fixed vs variable cost modeling
4. Add scale-based cost simulation
5. Add retry amplification visualization
6. Add model pricing impact analysis
7. Add cost surprise simulator
8. Write cockpit tests

**Dependencies**: Story 6.3

**Testing**:
```typescript
// Test cost cockpit
test('cost cockpit models fixed vs variable costs', () => {
  const cockpit = render(<CostRealityCockpit />);
  expect(cockpit.getByTestId('fixed-costs')).toBeInTheDocument();
  expect(cockpit.getByTestId('variable-costs')).toBeInTheDocument();
});

// Test build-your-own AI stack cost estimator
test('user can estimate costs for their specific architecture', () => {
  const { getByTestId } = render(<CostRealityCockpit />);
  
  // Select components
  fireEvent.click(getByTestId('add-llm-api'));
  fireEvent.click(getByTestId('add-vector-db'));
  fireEvent.click(getByTestId('add-embedding-service'));
  
  // Configure scale
  fireEvent.change(getByTestId('monthly-conversations'), { target: { value: 5000 } });
  
  // See total cost breakdown
  const breakdown = getByTestId('cost-breakdown');
  expect(breakdown).toShowPieChart([
    { label: 'LLM API', cost: 450 },
    { label: 'Vector DB', cost: 200 },
    { label: 'Embeddings', cost: 50 }
  ]);
});
```

**Gamification Element**:
- [ ] **Cost Efficiency Leaderboard**: "Your stack is 32% more cost-efficient than median"
- [ ] **Challenge**: "Design a system under $1,000/month for 10k users"

---

### Story 6.12: Agent Reality Cockpit
**Phase**: Future Cockpits  
**Priority**: P1  
**Story Points**: 8  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want to see where my autonomous agent goes off the rails, so I understand why "full autonomy" isn't production-ready yet.

**Value Proposition for Traffic**:
- **Realism Check**: "Agents aren't magic - here's where they break"
- **SEO Keywords**: "AI agent limitations", "autonomous AI failures", "agent debugging"
- **Thought Leadership**: Position as "honest take on agent limitations"

**Acceptance Criteria**:
- [ ] **Planning Drift Visualizer**:
  - Show initial plan vs actual execution path
  - Highlight where agent deviated and why
  - "Step 3: Agent planned X, but did Y instead"
- [ ] **Tool Misuse Detector**:
  - "Agent called 'delete_all' when it should have called 'delete_one'"
  - Show reasoning that led to wrong tool selection
  - Frequency of misuse: "3 out of 10 runs use wrong tool"
- [ ] **Loop Detection & Visualization**:
  - "Agent is stuck in a loop: Search → No results → Search again → No results..."
  - Show cycle graphs with iteration counts
  - "Loop detected after 7 iterations"
- [ ] **Decision Boundary Exposure**:
  - "Agent chose Option A (confidence: 51%) over Option B (confidence: 49%)"
  - Show how close decisions were
  - "This decision was essentially a coin flip"
- [ ] **Failure Mode Taxonomy**:
  - Hallucinated tool calls
  - Premature task completion
  - Goal drift (forgot original objective)
  - Infinite loops
  - Resource exhaustion

**New Feature: "Agent Failure Museum"**:
- [ ] Curated collection of hilarious/instructive agent failures
- [ ] Interactive: Load failure, debug it yourself
- [ ] Community submissions: "Share your agent disasters"

**Technical Tasks**:
1. Design Agent Reality Cockpit architecture
2. Implement planning drift visualization
3. Add tool misuse detection
4. Add loop detection and visualization
5. Add decision boundary visualization
6. Add failure mode taxonomy
7. Add agent failure museum
8. Write cockpit tests

**Dependencies**: Story 6.3

**Testing**:
```typescript
// Test agent cockpit
test('agent cockpit detects planning drift', () => {
  const cockpit = render(<AgentRealityCockpit />);
  expect(cockpit.getByTestId('planning-drift')).toBeInTheDocument();
});

// Test agent replay with intervention points
test('user can replay agent execution and intervene', () => {
  const { getByTestId } = render(<AgentRealityCockpit agentRun={runData} />);
  
  // Replay execution step-by-step
  fireEvent.click(getByTestId('replay-btn'));
  
  // Pause at failure point
  expect(getByTestId('current-step')).toHaveTextContent('Step 7: Tool misuse detected');
  
  // See "what if agent had chosen differently?"
  fireEvent.click(getByTestId('try-alternative-action'));
  expect(getByTestId('alternative-outcome')).toShowDifferentResult();
});
```

**Gamification Element**:
- [ ] **Agent Reliability Score**: "Your agent completes tasks correctly 73% of the time"
- [ ] **Challenge**: "Can you design guardrails to prevent this failure?" → Links to Agent Lab in Basic Mode

---

## NEW STORIES: Traffic & Engagement Features

### Story 6.13: Viral Sharing Features
**Phase**: Traffic & Engagement  
**Priority**: P0  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want to share my discoveries easily, so my colleagues/followers can see the same insights.

**Value Proposition for Traffic**:
- **Viral Growth**: Every share brings new visitors
- **SEO Benefit**: Social signals improve search rankings
- **Network Effects**: Shared links create backlinks

**Acceptance Criteria**:
- [ ] **One-click share buttons** on every cockpit (Twitter, LinkedIn, Copy Link)
- [ ] **Auto-generated social cards**:
  - Twitter: "I just discovered my AI prompt costs $2,400/month 🤯 [image]"
  - LinkedIn: Professional insight sharing with statistics
  - Open Graph meta tags for rich previews
- [ ] **Shareable links** with state preservation (visitor can load your exact analysis)
- [ ] **Screenshot generator**: Beautiful, branded images for social media
- [ ] **Embed codes**: "Add this cockpit to your blog/documentation"
- [ ] **Share analytics**: Track which insights get shared most

**Technical Tasks**:
1. Create ShareButton component
2. Implement social card generator (Open Graph, Twitter Cards)
3. Add state serialization for shareable links
4. Create screenshot generator using html2canvas
5. Add embed code generator
6. Implement share analytics tracking
7. Write sharing tests

**Dependencies**: All cockpit stories (6.4-6.12)

**Testing**:
```typescript
// Test social card generation
test('generates Twitter card with correct metadata', () => {
  const analysis = { cost: 2400, insights: 3 };
  const card = generateSocialCard(analysis, 'twitter');
  expect(card.title).toContain('$2,400/month');
  expect(card.image).toBeDefined();
});

// Test state preservation in shareable links
test('shareable link preserves analysis state', () => {
  const analysis = analyzePrompt(myPrompt);
  const link = generateShareableLink(analysis);
  const restored = restoreFromLink(link);
  expect(restored).toEqual(analysis);
});
```

---

### Story 6.14: Community Prompt Library
**Phase**: Traffic & Engagement  
**Priority**: P1  
**Story Points**: 5  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want to explore how others use Advanced Mode, so I can learn from real-world examples.

**Value Proposition for Traffic**:
- **Content Library**: SEO-rich pages for each prompt
- **User-Generated Content**: Community creates content for you
- **Return Visits**: "Check what's trending this week"

**Acceptance Criteria**:
- [ ] **Browse prompt gallery**: 100+ real-world prompts analyzed
- [ ] **Categories**: Customer service, Code generation, Content writing, Data analysis, etc.
- [ ] **Upvote/comment** on interesting prompts
- [ ] **Submit your own** prompt for community analysis
- [ ] **Trending prompts**: "Most analyzed this week"
- [ ] **Challenge prompts**: "Can you fix this broken prompt?"
- [ ] **Search and filter**: By category, severity, cost range

**Technical Tasks**:
1. Design prompt library schema
2. Create PromptGallery component
3. Add submission form with moderation
4. Implement upvoting and commenting
5. Add trending algorithm
6. Create search and filter functionality
7. Write library tests

**Dependencies**: Story 6.4, 6.6

**Testing**:
```typescript
// Test prompt submission
test('user can submit prompt to library', async () => {
  const { getByRole } = render(<PromptLibrary />);
  fireEvent.click(getByRole('button', { name: /submit prompt/i }));
  
  const form = getByRole('form');
  fireEvent.change(form.querySelector('[name="prompt"]'), { target: { value: myPrompt } });
  fireEvent.submit(form);
  
  expect(await screen.findByText('Prompt submitted for review')).toBeInTheDocument();
});

// Test trending algorithm
test('trending prompts are sorted by recent engagement', () => {
  const prompts = getTrendingPrompts();
  expect(prompts[0].recentViews).toBeGreaterThan(prompts[1].recentViews);
});
```

---

### Story 6.15: Progressive Learning Paths
**Phase**: Traffic & Engagement  
**Priority**: P1  
**Story Points**: 3  
**Status**: 🟡 READY

**User Story** (Visitor-Focused):
> As a visitor, I want a guided journey from Basic to Advanced, so I don't feel lost.

**Value Proposition for Traffic**:
- **Reduced Bounce Rate**: Guided paths keep visitors engaged longer
- **Completion Metrics**: "X% of visitors complete the beginner path"
- **Gamification**: Achievements encourage return visits

**Acceptance Criteria**:
- [ ] **Achievement system**: "✅ Mastered RAG basics → Unlock Retrieval Reality Cockpit"
- [ ] **Learning paths**:
  - "Beginner Path": All Basic Mode → Selected Advanced Mode tours
  - "Production Engineer Path": Straight to Advanced Mode cockpits
  - "AI Hobbyist Path": Mix of both modes
- [ ] **Suggested next steps**: "You explored Prompt Reality → Try Retrieval Reality next"
- [ ] **Progress tracking**: "You've completed 7/12 modules"
- [ ] **Badges and certificates**: Shareable achievements

**Technical Tasks**:
1. Design learning path system
2. Create ProgressTracker component
3. Implement achievement unlock logic
4. Add suggested next steps algorithm
5. Create badge/certificate generator
6. Write progress tracking tests

**Dependencies**: All Basic Mode and Advanced Mode stories

**Testing**:
```typescript
// Test achievement unlock
test('user unlocks achievement after completing module', () => {
  completeModule('rag-basics');
  const achievements = getUnlockedAchievements();
  expect(achievements).toContainEqual({
    id: 'rag-master',
    title: 'RAG Basics Master',
    unlockedAt: expect.any(Date)
  });
});

// Test suggested next steps
test('suggests relevant next module', () => {
  completeModule('prompt-reality');
  const suggestion = getSuggestedNextStep();
  expect(suggestion.id).toBe('retrieval-reality');
  expect(suggestion.reason).toContain('related to prompt analysis');
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

### Phase 4.5 (Future): Prompt Efficiency Module
**Goal**: Cost-reduction patterns and token optimization techniques  
**Stories**: 4.2  
**Total Points**: 5  
**Deliverable**: Prompt Efficiency module in Basic Mode  
**Status**: 🟡 READY

### Phase 5 (Weeks 15-22): Advanced AI Concepts
**Goal**: Advanced AI system visualizations  
**Stories**: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6  
**Total Points**: 39  
**Deliverable**: LLM, Diffusion, A2A, MCP, Agentic Commerce & E-commerce modules

### Phase 6 (Weeks 23-32): Advanced Mode & Reality Cockpits (VISITOR-OPTIMIZED)
**Goal**: System-level insight under real constraints + Traffic & Engagement features  
**Stories**: 6.1 ✅, 6.2 ✅, 6.3 ✅, 6.4 ✅, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13, 6.14, 6.15  
**Total Points**: 63 (increased from 50 due to new engagement features)  
**Completed**: 4 stories (6.1, 6.2, 6.3, 6.4)  
**Remaining**: 11 stories  
**Deliverables**:
- ✅ Advanced Mode infrastructure (6.1, 6.2, 6.3)
- ✅ Production Prompt Analyzer (6.4)
- 🚧 Prompt Reality Cockpit v1 (6.5-6.9)
- 📋 Future Cockpits: Retrieval, Cost, Agent (6.10-6.12)
- 📋 Traffic & Engagement Features (6.13-6.15)

---

## Traffic & SEO Optimization Summary (Phase 6 Focus)

**High-Traffic Keywords to Target**:
1. "AI cost calculator" (Story 6.9)
2. "prompt debugger" (Story 6.4)
3. "context window visualization" (Story 6.5)
4. "RAG debugging tool" (Story 6.10)
5. "AI agent limitations" (Story 6.12)

**Viral Content Opportunities**:
1. Truncation simulator GIFs (Story 6.8)
2. "Your prompt costs $X at scale" social cards (Story 6.9, 6.13)
3. Instruction conflict screenshots (Story 6.7)
4. Agent failure replays (Story 6.12)

**Retention Hooks**:
1. Bookmark-worthy cost calculator (Story 6.9)
2. Return to test new prompts (Story 6.4)
3. Community prompt library (Story 6.14)
4. Achievement unlocks (Story 6.15)

**Cross-Mode Traffic Drivers**:
- Basic Mode learners → "Ready to test in production? Try Advanced Mode"
- Advanced Mode users → "Learn the concepts behind these constraints in Basic Mode"

---

**Document Status**: ACTIVE - Updated Continuously (Phase 6 Enhanced for Traffic & Engagement)  
**Total Stories Defined**: 36 (increased from 35)  
**Total Story Points**: 167 (increased from 162)  
**Completed Stories**: 6 (1.1, 4.1, 6.1, 6.2, 6.3, 6.4)  
**Estimated Timeline**: 33 weeks (increased from 32 weeks)

