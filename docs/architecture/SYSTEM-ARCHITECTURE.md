# System Architecture - AI Learning Playground

## Document Control
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-01 | Engineering Team | Draft |

---

## Architecture Overview

The AI Learning Playground is a **client-side single-page application (SPA)** built with React and Vite, designed for interactive learning through visualization.

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

---

## Component Organization

### Directory Structure
```
src/
├── components/
│   ├── layout/          # Header, Sidebar, Layout
│   ├── shared/          # Reusable UI components
│   ├── rag/             # RAG-specific components
│   ├── agents/          # Agent pattern components
│   ├── multi-agent/     # Multi-agent components
│   └── pages/           # Page components
├── lib/
│   ├── utils.ts         # Utility functions
│   └── store.ts         # Zustand stores
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
useAppStore()      // Global app state
useRAGStore()      // RAG pipeline state
useAgentStore()    // Agent execution state
useMultiAgentStore() // Multi-agent state
```

### State Structure
```typescript
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

---

## Performance Considerations

### Optimization Strategies
1. **Code Splitting**: Lazy load modules
2. **Virtualization**: Virtual scrolling for large lists
3. **Memoization**: React.memo for expensive components
4. **Web Workers**: Offload heavy computations
5. **Caching**: IndexedDB for embeddings

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

### Phase 2: Backend Integration
- API routes for LLM calls
- Real-time agent execution
- User progress tracking
- Cloud storage

### Phase 3: Advanced Features
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
**Last Updated**: 2024-12  
**Owner**: Engineering Team

