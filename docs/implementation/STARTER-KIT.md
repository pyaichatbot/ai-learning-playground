# AI Learning Playground - Starter Kit

> **⚠️ Framework Note**: This document describes a Next.js-based architecture, but the **actual project uses Vite + React (SPA)**. The architectural principles and component organization remain the same, but implementation details differ. See [SYSTEM-ARCHITECTURE.md](../architecture/SYSTEM-ARCHITECTURE.md) for details on the Vite implementation.

> **📚 Related Documents**: 
> - [VISION.md](../vision/VISION.md) - Complete vision and architectural details
> - [USER-STORIES.md](../product/USER-STORIES.md) - Detailed user stories
> - [IMPLEMENTATION-TRACKER.md](../IMPLEMENTATION-TRACKER.md) - Story tracking

## Project Structure

```
ai-learning-playground/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── .env.example
├── 
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── 
│   │   ├── rag/                          # RAG Module
│   │   │   ├── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ChunkingVisualizer.tsx
│   │   │   │   ├── EmbeddingExplorer.tsx
│   │   │   │   ├── HybridSearchDemo.tsx
│   │   │   │   ├── RerankingComparison.tsx
│   │   │   │   └── ParentChildTree.tsx
│   │   │   ├── lib/
│   │   │   │   ├── chunkers.ts
│   │   │   │   ├── embeddings.ts
│   │   │   │   ├── search.ts
│   │   │   │   └── reranking.ts
│   │   │   └── workers/
│   │   │       ├── embedding.worker.ts
│   │   │       └── search.worker.ts
│   │   │
│   │   ├── agents/                       # Agent Lab Module
│   │   │   ├── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ReflectionVisualizer.tsx
│   │   │   │   ├── ToolUseInspector.tsx
│   │   │   │   ├── ReActTimeline.tsx
│   │   │   │   ├── PlanningBoard.tsx
│   │   │   │   ├── ExecutionTimeline.tsx
│   │   │   │   └── StateInspector.tsx
│   │   │   ├── patterns/
│   │   │   │   ├── reflection.ts
│   │   │   │   ├── tool-use.ts
│   │   │   │   ├── react.ts
│   │   │   │   └── planning.ts
│   │   │   └── lib/
│   │   │       ├── agent-executor.ts
│   │   │       ├── tool-builder.ts
│   │   │       └── state-manager.ts
│   │   │
│   │   └── multi-agent/                  # Multi-Agent Arena
│   │       ├── page.tsx
│   │       ├── components/
│   │       │   ├── SupervisorVisualizer.tsx
│   │       │   ├── AgentNetworkGraph.tsx
│   │       │   ├── MessageFlowViz.tsx
│   │       │   ├── TaskDelegationTree.tsx
│   │       │   └── PerformanceDashboard.tsx
│   │       ├── orchestrators/
│   │       │   ├── supervisor.ts
│   │       │   ├── sequential.ts
│   │       │   ├── parallel.ts
│   │       │   └── network.ts
│   │       └── lib/
│   │           ├── communication.ts
│   │           ├── coordination.ts
│   │           └── benchmarking.ts
│   │
│   ├── components/                       # Shared Components
│   │   ├── ui/                          # shadcn/ui components
│   │   ├── visualizations/
│   │   │   ├── Timeline.tsx
│   │   │   ├── ForceGraph.tsx
│   │   │   ├── DecisionTree.tsx
│   │   │   ├── MetricsDashboard.tsx
│   │   │   └── CodeEditor.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   │
│   ├── lib/                             # Shared Utilities
│   │   ├── llm/
│   │   │   ├── providers/
│   │   │   │   ├── openai.ts
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── local.ts
│   │   │   │   └── base.ts
│   │   │   └── types.ts
│   │   ├── embeddings/
│   │   │   ├── browser.ts
│   │   │   └── api.ts
│   │   ├── storage/
│   │   │   ├── indexeddb.ts
│   │   │   └── cache.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       ├── metrics.ts
│   │       └── telemetry.ts
│   │
│   └── store/                           # State Management
│       ├── rag-store.ts
│       ├── agent-store.ts
│       ├── multi-agent-store.ts
│       └── ui-store.ts
│
├── public/
│   ├── examples/
│   │   ├── rag/
│   │   │   ├── support-docs.pdf
│   │   │   └── legal-corpus.pdf
│   │   ├── agents/
│   │   │   └── sample-code.py
│   │   └── multi-agent/
│   │       └── project-spec.md
│   └── assets/
│       └── diagrams/
│
└── docs/
    ├── getting-started.md
    ├── rag-guide.md
    ├── agents-guide.md
    ├── multi-agent-guide.md
    └── api-reference.md
```

## Quick Start Guide

### Prerequisites

```bash
Node.js >= 18.0.0
pnpm >= 8.0.0 (recommended) or npm
```

### Installation

```bash
# Clone the repository
git clone https://github.com/pyaichatbot/ai-playground.git
cd ai-playground

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local with your API keys
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# (Optional) PINECONE_API_KEY=...

# Run development server
pnpm dev

# Open http://localhost:3000
```

### Development Workflow

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm type-check

# Linting
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

## Core Implementation Examples

### 1. RAG Module - Semantic Chunking

```typescript
// src/app/rag/lib/chunkers.ts

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";

export interface ChunkingConfig {
  strategy: 'fixed' | 'recursive' | 'semantic' | 'parent-child';
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

export interface Chunk {
  id: string;
  content: string;
  metadata: {
    start: number;
    end: number;
    parent?: string;
    semanticScore?: number;
  };
}

export class SemanticChunker {
  private embedder: EmbeddingService;

  constructor(embedder: EmbeddingService) {
    this.embedder = embedder;
  }

  async chunk(
    text: string, 
    config: ChunkingConfig
  ): Promise<Chunk[]> {
    switch (config.strategy) {
      case 'fixed':
        return this.fixedChunking(text, config);
      case 'recursive':
        return this.recursiveChunking(text, config);
      case 'semantic':
        return this.semanticChunking(text, config);
      case 'parent-child':
        return this.parentChildChunking(text, config);
      default:
        throw new Error(`Unknown strategy: ${config.strategy}`);
    }
  }

  private async semanticChunking(
    text: string,
    config: ChunkingConfig
  ): Promise<Chunk[]> {
    // 1. Split into sentences
    const sentences = this.sentenceSplit(text);
    
    // 2. Get embeddings for each sentence
    const embeddings = await this.embedder.embedBatch(sentences);
    
    // 3. Calculate semantic similarity between adjacent sentences
    const similarities = this.calculateSimilarities(embeddings);
    
    // 4. Find split points where similarity is low
    const splitPoints = this.findSplitPoints(similarities, 0.7);
    
    // 5. Create chunks at split points
    const chunks: Chunk[] = [];
    let start = 0;
    
    for (let i = 0; i < splitPoints.length; i++) {
      const end = splitPoints[i];
      const content = sentences.slice(start, end).join(' ');
      
      chunks.push({
        id: `chunk-${i}`,
        content,
        metadata: {
          start: start,
          end: end,
          semanticScore: similarities.slice(start, end).reduce((a, b) => a + b, 0) / (end - start)
        }
      });
      
      start = end;
    }
    
    return chunks;
  }

  private parentChildChunking(
    text: string,
    config: ChunkingConfig
  ): Promise<Chunk[]> {
    // Parent chunks (large context)
    const parents = this.fixedChunking(text, {
      ...config,
      chunkSize: config.chunkSize * 4,
      chunkOverlap: 200
    });

    // Child chunks (precise retrieval)
    const children = this.fixedChunking(text, config);

    // Map children to parents
    return children.map((child, idx) => ({
      ...child,
      metadata: {
        ...child.metadata,
        parent: this.findParent(child, parents)
      }
    }));
  }

  private calculateSimilarities(
    embeddings: number[][]
  ): number[] {
    const similarities: number[] = [];
    
    for (let i = 0; i < embeddings.length - 1; i++) {
      const sim = this.cosineSimilarity(embeddings[i], embeddings[i + 1]);
      similarities.push(sim);
    }
    
    return similarities;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

### 2. Agent Lab - ReAct Pattern

```typescript
// src/app/agents/patterns/react.ts

import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

export interface ReActState {
  messages: BaseMessage[];
  thoughts: string[];
  actions: Action[];
  observations: string[];
  currentStep: number;
  maxSteps: number;
}

export interface Action {
  tool: string;
  input: any;
  reasoning: string;
}

export class ReActAgent {
  private llm: ChatOpenAI;
  private tools: Tool[];
  private graph: CompiledGraph;

  constructor(llm: ChatOpenAI, tools: Tool[]) {
    this.llm = llm;
    this.tools = tools;
    this.graph = this.buildGraph();
  }

  private buildGraph() {
    const workflow = new StateGraph<ReActState>({
      channels: {
        messages: { value: (x, y) => x.concat(y) },
        thoughts: { value: (x, y) => x.concat(y) },
        actions: { value: (x, y) => x.concat(y) },
        observations: { value: (x, y) => x.concat(y) },
        currentStep: { value: (x, y) => y },
        maxSteps: { value: (x, y) => x }
      }
    });

    // Think node
    workflow.addNode("think", async (state) => {
      const thought = await this.llm.invoke([
        new HumanMessage(this.createThoughtPrompt(state))
      ]);

      return {
        thoughts: [thought.content],
        currentStep: state.currentStep + 1
      };
    });

    // Act node
    workflow.addNode("act", async (state) => {
      const action = await this.selectAction(state);
      
      return {
        actions: [action]
      };
    });

    // Observe node
    workflow.addNode("observe", async (state) => {
      const lastAction = state.actions[state.actions.length - 1];
      const observation = await this.executeAction(lastAction);
      
      return {
        observations: [observation],
        messages: [new ToolMessage({
          content: observation,
          tool_call_id: lastAction.tool
        })]
      };
    });

    // Conditional edges
    workflow.addConditionalEdges(
      "think",
      (state) => this.shouldContinue(state),
      {
        "act": "act",
        [END]: END
      }
    );

    workflow.addEdge("act", "observe");
    workflow.addEdge("observe", "think");

    workflow.setEntryPoint("think");

    return workflow.compile();
  }

  private createThoughtPrompt(state: ReActState): string {
    return `
You are solving a task step by step.

Task: ${state.messages[0].content}

Previous steps:
${this.formatHistory(state)}

Available tools:
${this.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Think about what you should do next. Consider:
1. What information do you have?
2. What information do you need?
3. Which tool would help?
4. Are you ready to give a final answer?

Thought:`;
  }

  private async selectAction(state: ReActState): Promise<Action> {
    const lastThought = state.thoughts[state.thoughts.length - 1];
    
    const actionPrompt = `
Based on your thought: "${lastThought}"

Choose the next action:
${this.tools.map((t, i) => `${i + 1}. ${t.name}`).join('\n')}
${this.tools.length + 1}. FINISH (provide final answer)

Action:`;

    const response = await this.llm.invoke([
      new HumanMessage(actionPrompt)
    ]);

    // Parse action from response
    return this.parseAction(response.content);
  }

  private async executeAction(action: Action): Promise<string> {
    if (action.tool === "FINISH") {
      return action.input;
    }

    const tool = this.tools.find(t => t.name === action.tool);
    if (!tool) {
      return `Error: Tool ${action.tool} not found`;
    }

    try {
      const result = await tool.func(action.input);
      return String(result);
    } catch (error) {
      return `Error executing ${action.tool}: ${error.message}`;
    }
  }

  private shouldContinue(state: ReActState): string {
    // Stop if max steps reached
    if (state.currentStep >= state.maxSteps) {
      return END;
    }

    // Stop if last action was FINISH
    const lastAction = state.actions[state.actions.length - 1];
    if (lastAction?.tool === "FINISH") {
      return END;
    }

    // Continue thinking and acting
    return "act";
  }

  async run(query: string, maxSteps: number = 10): AsyncIterator<ReActState> {
    return this.graph.stream({
      messages: [new HumanMessage(query)],
      thoughts: [],
      actions: [],
      observations: [],
      currentStep: 0,
      maxSteps
    });
  }
}
```

### 3. Multi-Agent - Supervisor Pattern

```typescript
// src/app/multi-agent/orchestrators/supervisor.ts

import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

export interface SupervisorState {
  task: string;
  plan: Step[];
  delegations: Delegation[];
  results: Result[];
  currentStep: number;
}

export interface Delegation {
  agent: string;
  task: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class SupervisorAgent {
  private supervisor: ChatOpenAI;
  private workers: Map<string, Agent>;
  private graph: CompiledGraph;

  constructor(supervisor: ChatOpenAI, workers: Agent[]) {
    this.supervisor = supervisor;
    this.workers = new Map(workers.map(w => [w.name, w]));
    this.graph = this.buildGraph();
  }

  private buildGraph() {
    const workflow = new StateGraph<SupervisorState>({
      channels: {
        task: { value: (x, y) => y || x },
        plan: { value: (x, y) => y || x },
        delegations: { value: (x, y) => x.concat(y) },
        results: { value: (x, y) => x.concat(y) },
        currentStep: { value: (x, y) => y }
      }
    });

    // Planning node
    workflow.addNode("plan", async (state) => {
      const plan = await this.createPlan(state.task);
      return { plan };
    });

    // Delegation node
    workflow.addNode("delegate", async (state) => {
      const currentTask = state.plan[state.currentStep];
      const delegation = await this.delegateTask(currentTask);
      return { delegations: [delegation] };
    });

    // Execution node (parallel worker execution)
    workflow.addNode("execute", async (state) => {
      const activeDelegations = state.delegations.filter(
        d => d.status === 'pending'
      );

      const results = await Promise.all(
        activeDelegations.map(d => this.executeWorker(d))
      );

      return { 
        results,
        currentStep: state.currentStep + 1
      };
    });

    // Review node
    workflow.addNode("review", async (state) => {
      const review = await this.reviewResults(state.results);
      
      if (review.needsRework) {
        // Re-delegate failed tasks
        return {
          delegations: review.reworkTasks
        };
      }

      return { currentStep: state.currentStep + 1 };
    });

    // Edges
    workflow.addEdge("plan", "delegate");
    workflow.addEdge("delegate", "execute");
    workflow.addEdge("execute", "review");
    
    workflow.addConditionalEdges(
      "review",
      (state) => this.shouldContinue(state),
      {
        "delegate": "delegate",
        [END]: END
      }
    );

    workflow.setEntryPoint("plan");

    return workflow.compile();
  }

  private async createPlan(task: string): Promise<Step[]> {
    const prompt = `
Break down this task into steps:
${task}

Create a plan with:
1. Clear sub-tasks
2. Required capabilities for each
3. Dependencies between tasks

Plan:`;

    const response = await this.supervisor.invoke([
      new HumanMessage(prompt)
    ]);

    return this.parsePlan(response.content);
  }

  private async delegateTask(step: Step): Promise<Delegation> {
    const prompt = `
Task: ${step.description}
Required capabilities: ${step.capabilities.join(', ')}

Available agents:
${Array.from(this.workers.entries()).map(([name, agent]) => 
  `- ${name}: ${agent.capabilities.join(', ')}`
).join('\n')}

Which agent should handle this task?`;

    const response = await this.supervisor.invoke([
      new HumanMessage(prompt)
    ]);

    const agentName = this.parseAgentSelection(response.content);

    return {
      agent: agentName,
      task: step.description,
      priority: step.priority,
      status: 'pending'
    };
  }

  private async executeWorker(delegation: Delegation): Promise<Result> {
    const worker = this.workers.get(delegation.agent);
    
    if (!worker) {
      return {
        delegation,
        success: false,
        error: `Worker ${delegation.agent} not found`
      };
    }

    try {
      delegation.status = 'running';
      const result = await worker.execute(delegation.task);
      delegation.status = 'completed';
      
      return {
        delegation,
        success: true,
        output: result
      };
    } catch (error) {
      delegation.status = 'failed';
      
      return {
        delegation,
        success: false,
        error: error.message
      };
    }
  }

  async orchestrate(task: string): AsyncIterator<SupervisorState> {
    return this.graph.stream({
      task,
      plan: [],
      delegations: [],
      results: [],
      currentStep: 0
    });
  }
}
```

## Environment Variables

```bash
# .env.example

# Required: LLM Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Vector Database
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX_NAME=ai-playground

# Optional: Analytics
POSTHOG_API_KEY=...
POSTHOG_HOST=https://app.posthog.com

# Optional: Error Tracking
SENTRY_DSN=...

# Optional: Rate Limiting
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Package.json Scripts

```json
{
  "name": "ai-learning-playground",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,md}\"",
    "analyze": "ANALYZE=true next build"
  },
  "dependencies": {
    "@langchain/core": "^0.1.0",
    "@langchain/langgraph": "^0.0.1",
    "@langchain/openai": "^0.0.1",
    "@langchain/anthropic": "^0.1.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@xenova/transformers": "^2.6.0",
    "d3": "^7.8.5",
    "langchain": "^0.1.0",
    "lucide-react": "^0.294.0",
    "markdown-it": "^13.0.2",
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-force-graph-3d": "^1.24.0",
    "recharts": "^2.10.3",
    "three": "^0.159.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.1",
    "@types/d3": "^7.4.3",
    "@types/markdown-it": "^13.0.7",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/three": "^0.159.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.0.4",
    "postcss": "^8",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.3.0",
    "typescript": "^5",
    "vite": "^5.0.8",
    "vitest": "^1.1.0"
  }
}
```

## Contributing Guidelines

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code style guide
- Pull request process
- Testing requirements
- Documentation standards

## License

MIT License - see [LICENSE](./LICENSE)

---

**Ready to build?** Start with Phase 1 and progressively enhance your playground. Each module is designed to be independently deployable while sharing core infrastructure.
