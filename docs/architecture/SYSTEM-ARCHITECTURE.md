# System Architecture - AI Learning Playground

## Document Control
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.1 | 2026-01 | Engineering Team | Updated with Advanced Mode Architecture |

---

## Architecture Overview

The AI Learning Playground is a **client-side single-page application (SPA)** built with React and Vite, designed for interactive learning through visualization.

The application operates in two distinct modes:
- **Basic Mode**: Exploratory, open-ended, educational (free forever)
- **Advanced Mode**: Opinionated, constraint-driven, system behavior focused (monetizable)

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                       │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   React App  │  │  Zustand    │  │  Visualizations│ │
│  │  (Components)│  │  (State)    │  │  (D3/Recharts) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ Transformers │  │  IndexedDB   │                     │
│  │     .js      │  │  (Storage)   │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                           │
│  ┌──────────────┐                                        │
│  │  Web Workers │                                        │
│  │  (Heavy CPU) │                                        │
│  └──────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Framework
- **React 18.3** - Component-based UI
- **TypeScript 5.5** - Type safety
- **Vite** - Build tool and dev server

### State Management
- **Zustand** - Lightweight state management
- Separate stores per module (RAG, Agent, Multi-Agent)

### Visualization
- **D3.js** - Custom visualizations (network graphs, trees)
- **Recharts** - Standard charts (bar, line, pie)
- **Three.js** - 3D visualizations (embedding space)
- **Framer Motion** - Animations

### Processing
- **Transformers.js** - Browser-based embeddings
- **Web Workers** - Offload heavy computations

### Storage
- **IndexedDB** - Local data persistence
- **localStorage** - User preferences

---

## Mode Architecture

### Basic Mode vs Advanced Mode Separation

The application architecture enforces strict separation between Basic and Advanced Mode:

```
┌─────────────────────────────────────────────────────────┐
│                    Application Root                        │
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │   Basic Mode      │      │  Advanced Mode   │        │
│  │   (Default)       │      │  (Optional)      │        │
│  │                   │      │                  │        │
│  │  ┌──────────────┐ │      │  ┌──────────────┐ │        │
│  │  │ RAG Studio   │ │      │  │   Cockpits   │ │        │
│  │  │ Agent Lab    │ │      │  │   (Single)   │ │        │
│  │  │ Multi-Agent  │ │      │  │              │ │        │
│  │  │ Prompt Reason│ │      │  │  Prompt      │ │        │
│  │  │ Advanced AI  │ │      │  │  Reality    │ │        │
│  │  └──────────────┘ │      │  └──────────────┘ │        │
│  └──────────────────┘      └──────────────────┘        │
│                                                           │
│  ┌──────────────────────────────────────────────┐        │
│  │        Mode Switching Mechanism              │        │
│  │  (State: 'basic' | 'advanced')                │        │
│  └──────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

**Key Architectural Rules**:
- No cockpit logic leaks into Basic Mode
- Advanced Mode is never required (opt-in)
- Mode state managed centrally
- First-time users default to Basic Mode
- Clear boundary between modes

---

## Module Architecture

### Module 1: RAG Studio
```
RAG Studio
├── Document Processing
│   ├── Text parsing
│   ├── Chunking strategies
│   └── Metadata extraction
├── Embedding Generation
│   ├── Transformers.js
│   ├── Embedding cache
│   └── Similarity calculation
├── Retrieval
│   ├── Sparse (BM25)
│   ├── Dense (vector)
│   └── Hybrid (combined)
└── Visualization
    ├── Chunk visualization
    ├── Embedding space (3D)
    └── Results comparison
```

### Module 2: Agent Lab
```
Agent Lab
├── Pattern Execution
│   ├── ReAct state machine
│   ├── Reflection loop
│   ├── Tool selection
│   └── Planning engine
├── State Management
│   ├── Agent state
│   ├── Step history
│   └── Tool registry
└── Visualization
    ├── Execution timeline
    ├── State inspector
    └── Tool call flow
```

### Module 3: Multi-Agent Arena
```
Multi-Agent Arena
├── Orchestration
│   ├── Supervisor pattern
│   ├── Sequential flow
│   ├── Parallel execution
│   └── Hierarchical structure
├── Communication
│   ├── Message passing
│   ├── Task delegation
│   └── State synchronization
└── Visualization
    ├── Network graph
    ├── Message flow
    └── Performance dashboard
```

### Module 4: Advanced Mode Cockpits

#### Prompt Reality Cockpit
```
Prompt Reality Cockpit
├── Input Layer
│   ├── Large textarea (>10k tokens)
│   ├── Real-time token counting
│   └── Format preservation
├── Analysis Layer
│   ├── Context Budget Analyzer
│   │   ├── Token segmentation (system, instructions, user)
│   │   ├── Overflow detection
│   │   └── Token pressure indicators
│   ├── Heuristics Engine
│   │   ├── Context Capacity Analyzer (CC-1, CC-2)
│   │   ├── Truncation Risk Analyzer (TR-1)
│   │   ├── Instruction Dilution Analyzer (ID-1, ID-2)
│   │   ├── Structural Ambiguity Analyzer (SA-1, SA-2)
│   │   └── Cost Pressure Analyzer (CP-1, CP-2)
│   └── Cost Calculator
│       ├── Per-call cost estimation
│       └── Scale-based projections
├── Visualization Layer
│   ├── Context Budget Visualization
│   ├── Heuristics Insights (max 3, prioritized)
│   ├── Truncation Simulator
│   └── Cost Impact Display
└── State Management
    ├── Prompt state
    ├── Analysis results
    └── UI state
```

#### Heuristics Engine Architecture
```
Heuristics Engine
├── Rule Engine
│   ├── Rule Registry (9 rules)
│   ├── Rule Evaluators
│   └── Severity Classifier
├── Prioritization Engine
│   ├── High severity → always shown
│   ├── Medium severity → shown if no High
│   └── Low severity → shown only if space allows
├── Insight Generator
│   ├── Deterministic evaluation
│   ├── Explainable insights (rule mapping)
│   └── Alert formatting (not scores)
└── Output Formatter
    ├── Max 3 visible insights
    ├── Non-prescriptive messages
    └── Impact explanation (not solutions)
```

**Design Principles**:
- **Deterministic**: Same input always produces same output
- **Explainable**: Every insight maps to a clear rule
- **Conservative**: Prefer under-warning to false authority
- **Non-prescriptive**: Never suggests how to fix

#### Future Cockpits Architecture
```
Future Cockpits
├── Retrieval Reality Cockpit
│   ├── Chunk ordering visualization
│   ├── Recall vs precision metrics
│   ├── Retrieval noise detection
│   └── Context pollution simulation
├── Cost Reality Cockpit
│   ├── Fixed vs variable cost modeling
│   ├── Scale-based cost simulation
│   ├── Retry amplification visualization
│   └── Model pricing impact analysis
└── Agent Reality Cockpit
    ├── Planning drift visualization
    ├── Tool misuse detection
    ├── Loop detection
    └── Decision boundary exposure
```

---

## Component Organization

### Directory Structure
```
src/
├── components/
│   ├── layout/          # Header, Sidebar, Layout
│   ├── shared/          # Reusable UI components
│   ├── rag/             # RAG-specific components (Basic Mode)
│   ├── agents/          # Agent pattern components (Basic Mode)
│   ├── multi-agent/     # Multi-agent components (Basic Mode)
│   ├── cockpits/        # Advanced Mode cockpits
│   │   ├── prompt-reality/  # Prompt Reality Cockpit
│   │   │   ├── PromptTextarea.tsx
│   │   │   ├── ContextBudgetViz.tsx
│   │   │   ├── HeuristicsInsights.tsx
│   │   │   ├── TruncationSimulator.tsx
│   │   │   └── CostCalculator.tsx
│   │   ├── landing/          # Advanced Mode landing page
│   │   └── shared/          # Cockpit shared components
│   └── pages/           # Page components
│       ├── basic/        # Basic Mode pages
│       └── advanced/     # Advanced Mode pages
├── lib/
│   ├── utils.ts         # Utility functions
│   ├── store.ts         # Zustand stores
│   ├── heuristics/      # Heuristics engine
│   │   ├── engine.ts    # Main engine
│   │   ├── rules.ts     # Rule definitions
│   │   └── analyzers.ts # Category analyzers
│   └── mode/            # Mode management
│       ├── modeStore.ts  # Mode state
│       └── modeSwitch.ts # Mode switching logic
├── types/               # TypeScript definitions
├── styles/              # Global styles
├── data/                # Sample data
└── test/                # Test setup
```

### Component Patterns

**Barrel Exports**:
```typescript
// src/components/shared/index.ts
export { Card, Button } from './Card';
export { Input, Textarea, Select } from './Input';
```

**Path Aliases**:
```typescript
// vite.config.ts
alias: {
  '@': './src',
  '@/components': './src/components',
  '@/lib': './src/lib',
}
```

---

## State Management

### Store Organization
```typescript
// Separate stores per domain
useAppStore()           // Global app state
useModeStore()           // Mode state (Basic/Advanced)
useRAGStore()            // RAG pipeline state (Basic Mode)
useAgentStore()          // Agent execution state (Basic Mode)
useMultiAgentStore()     // Multi-agent state (Basic Mode)
useCockpitStore()        // Current cockpit state (Advanced Mode)
usePromptRealityStore()  // Prompt Reality Cockpit state
useHeuristicsStore()     // Heuristics engine state
```

### State Structure
```typescript
interface ModeState {
  currentMode: 'basic' | 'advanced';
  hasSeenAdvancedLanding: boolean;
  preferredMode: 'basic' | 'advanced' | null;
}

interface CockpitState {
  activeCockpit: 'prompt-reality' | 'retrieval-reality' | 'cost-reality' | 'agent-reality' | null;
  previousCockpit: string | null;
}

interface PromptRealityState {
  prompt: string;
  tokens: {
    system: number;
    instructions: number;
    user: number;
    total: number;
    overflow: number;
  };
  contextWindow: number;
  heuristics: HeuristicInsight[];
  truncationSimulated: boolean;
  costEstimate: CostEstimate;
}

interface HeuristicInsight {
  rule: string;
  category: 'context-capacity' | 'truncation-risk' | 'instruction-dilution' | 'structural-ambiguity' | 'cost-pressure';
  severity: 'high' | 'medium' | 'low';
  message: string;
  visible: boolean;
}

interface RAGState {
  documents: Document[];
  chunks: Chunk[];
  embeddings: Embedding[];
  query: string;
  results: SearchResult[];
}
```

---

## Data Flow

### RAG Pipeline Flow
```
Document → Chunking → Embedding → Storage
                              ↓
Query → Embedding → Search → Results → Visualization
```

### Agent Execution Flow
```
Task → Pattern Selection → State Machine → Steps → Visualization
                                    ↓
                              Tool Calls → Results
```

### Multi-Agent Flow
```
Task → Supervisor → Delegation → Workers → Aggregation → Results
                                      ↓
                                Communication → Messages
```

### Advanced Mode Flow
```
User → Mode Switch → Advanced Mode Landing → Cockpit Selection
                                                    ↓
                                    Prompt Reality Cockpit
                                                    ↓
                                    Prompt Input → Analysis
                                                    ↓
                                    ┌───────────────┴───────────────┐
                                    ↓                               ↓
                        Context Budget Viz              Heuristics Engine
                                    ↓                               ↓
                        Token Segmentation                Rule Evaluation
                                    ↓                               ↓
                        Overflow Detection            Insight Prioritization
                                    ↓                               ↓
                                    └───────────────┬───────────────┘
                                                    ↓
                                    Visualization (Max 3 Insights)
                                                    ↓
                                    Truncation Simulator (Optional)
                                                    ↓
                                    Cost Impact Display
```

### Mode Switching Flow
```
App Load → Check localStorage → Default to Basic Mode
                                    ↓
                            First-time User?
                                    ↓
                            Yes → Basic Mode
                            No → Load Preferred Mode
                                    ↓
                            User Clicks Mode Switch
                                    ↓
                            Advanced Mode?
                                    ↓
                            Yes → Show Landing (once per session)
                                    ↓
                            Enter Cockpit
                                    ↓
                            One Cockpit Active at a Time
```

---

## Navigation Architecture

### Basic Mode Navigation
- Multiple modules visible simultaneously
- Sidebar navigation with all modules
- Flexible routing between modules
- No restrictions on module access

### Advanced Mode Navigation
- **Single cockpit active at a time**: Only one cockpit can be active
- **No tabs inside cockpits**: Cockpits are full-screen experiences
- **Explicit mode switch**: Clear visual indication of mode
- **Cockpit selection**: User selects which cockpit to enter
- **Mode boundary**: Cannot mix Basic and Advanced Mode components

### Navigation Rules Enforcement
```typescript
// Mode switching guard
function canSwitchMode(currentMode: Mode, targetMode: Mode): boolean {
  // Advanced Mode is never forced
  if (targetMode === 'advanced' && !userHasOptedIn) {
    return false;
  }
  return true;
}

// Cockpit selection guard
function canSelectCockpit(currentCockpit: string | null, targetCockpit: string): boolean {
  // One cockpit at a time
  if (currentCockpit && currentCockpit !== targetCockpit) {
    // Deactivate current cockpit first
    deactivateCockpit(currentCockpit);
  }
  return true;
}
```

---

## Performance Considerations

### Optimization Strategies
1. **Code Splitting**: Lazy load modules and cockpits
2. **Virtualization**: Virtual scrolling for large lists
3. **Memoization**: React.memo for expensive components
4. **Web Workers**: Offload heavy computations (heuristics, token counting)
5. **Caching**: IndexedDB for embeddings and analysis results
6. **Deterministic Caching**: Cache heuristics results (same input = same output)

### Advanced Mode Performance
- **100% Deterministic**: Heuristics engine results are cacheable
- **Low-latency**: Client-side first, no server round-trips
- **Efficient Token Counting**: Use Web Workers for large prompts
- **Lazy Loading**: Cockpits loaded on demand

### Bundle Size
- Target: <500KB initial bundle
- Code splitting by route
- Dynamic imports for visualizations

---

## Security Considerations

### Client-Side Security
- Input validation
- XSS prevention (React auto-escaping)
- No sensitive data storage
- Secure API calls (if implemented)

### Privacy
- All processing client-side
- No data sent to servers (initially)
- User data in localStorage/IndexedDB only

---

## Future Architecture Considerations

### Phase 2: Advanced Mode Expansion
- Additional cockpits (Retrieval, Cost, Agent Reality)
- Enhanced heuristics engine
- Cockpit-specific state management
- Advanced Mode analytics

### Phase 3: Backend Integration
- API routes for LLM calls
- Real-time agent execution
- User progress tracking
- Cloud storage
- Advanced Mode monetization infrastructure

### Phase 4: Advanced Features
- Real-time collaboration
- User authentication
- Advanced analytics
- Mobile apps

---

## Decision Log

### Why Vite over Next.js?
- **Simplicity**: Faster setup and development
- **Client-Side Focus**: All processing in browser
- **No Backend**: Reduces complexity for learning
- **Fast HMR**: Better developer experience

### Why Zustand over Redux?
- **Lightweight**: Less boilerplate
- **Simple API**: Easy to learn
- **TypeScript**: Great type inference
- **Performance**: Sufficient for our needs

### Why D3.js + Recharts?
- **D3.js**: Custom visualizations (network graphs)
- **Recharts**: Standard charts (easier API)
- **Flexibility**: Use right tool for the job

---

**Document Status**: ACTIVE  
**Last Updated**: 2026-01  
**Owner**: Engineering Team

