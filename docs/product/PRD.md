# Product Requirements Document (PRD)
## AI Learning Playground

### Document Control
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.1 | 2026-01 | Product Team | Updated with Advanced Mode & Cockpits |

---

## 1. Executive Summary

### 1.1 Product Vision
Build an **interactive learning platform** that helps developers and architects understand **RAG**, **AI Agents**, and **Multi-Agent Systems** through **visualization and hands-on experimentation**.

> Where AI concepts become interactive system-level experiences.

### 1.2 Business Goals
- Enable **visual learning** of complex AI concepts
- Support **10,000+ monthly active learners**
- Achieve **90%+ concept retention** vs. reading docs alone
- Provide **production-ready patterns** for real projects
- Maintain **open-source** community engagement

### 1.3 Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| User engagement (sessions/week) | >5,000 | Analytics |
| Concept comprehension improvement | +75% | Pre/post assessments |
| Time to understand RAG | <30 minutes | User surveys |
| Code examples usage | >50% of users | Analytics |
| Community contributions | >10/month | GitHub metrics |

---

## 2. User Personas

### 2.1 Developer Learner (Primary - Basic Mode)
**Description**: Software developer learning AI/ML concepts  
**Goals**:
- Understand RAG pipelines visually
- Learn agent patterns through examples
- See code implementations
- Build production-ready systems

**Pain Points**:
- Documentation is abstract
- Hard to visualize embeddings
- Agent reasoning is opaque
- Multi-agent coordination is complex

**Needs**:
- Interactive visualizations
- Step-by-step explanations
- Real code examples
- Performance comparisons

---

### 2.2 Technical Architect (Secondary - Basic & Advanced Mode)
**Description**: Architect evaluating AI patterns for projects  
**Goals**:
- Compare different approaches
- Understand trade-offs
- See performance metrics
- Evaluate production readiness

**Pain Points**:
- Hard to compare patterns
- Performance data is scattered
- Cost implications unclear
- Security considerations missing

**Needs**:
- Pattern comparison tools
- Performance benchmarks
- Cost calculators
- Security guidelines

---

### 2.3 Educator (Tertiary - Basic Mode)
**Description**: Instructor teaching AI/ML courses  
**Goals**:
- Use in classroom demonstrations
- Assign interactive exercises
- Show real-world examples
- Track student progress

**Pain Points**:
- Static slides don't engage
- Students need hands-on practice
- Hard to explain complex concepts
- No progress tracking

**Needs**:
- Presentation mode
- Exercise templates
- Progress tracking
- Export capabilities

---

### 2.4 Senior Engineer (Advanced Mode)
**Description**: Senior engineer understanding system behavior under constraints  
**Goals**:
- Understand how AI systems behave in production
- See system-level constraints and limits
- Make informed decisions about prompt design
- Understand cost implications at scale

**Pain Points**:
- System behavior is opaque
- Constraints not visible until production
- Cost implications unclear
- Failure modes unknown

**Needs**:
- System-level insights
- Constraint visualization
- Cost awareness
- Failure mode exposure

---

### 2.5 Engineering Manager (Advanced Mode)
**Description**: Manager making strategic decisions about AI systems  
**Goals**:
- Understand cost implications
- Evaluate system reliability
- Make informed architecture decisions
- Understand scale implications

**Pain Points**:
- Cost data is scattered
- Reliability metrics unclear
- Scale implications unknown
- Decision-making lacks data

**Needs**:
- Cost reality visualization
- System reliability metrics
- Scale-based simulations
- Decision support data

---

### 2.6 Advanced AI Practitioner (Advanced Mode)
**Description**: Experienced practitioner seeking deep system understanding  
**Goals**:
- Understand system behavior under constraints
- See where systems break down
- Understand trade-offs and limits
- Make judgment-level decisions

**Pain Points**:
- System behavior is abstract
- Failure modes are hidden
- Trade-offs are unclear
- Need for professional judgment

**Needs**:
- System-level insights
- Constraint-driven experiences
- Failure mode visualization
- Professional-grade tools

---

## 3. Product Modes

The Playground consists of two distinct modes, each serving different learning needs:

### 3.1 Basic Mode (Current)
**Purpose**: Exploration, learning, zero pressure

**Characteristics**:
- Exploratory and open-ended
- Educational and free forever
- Multiple tools visible simultaneously
- Flexible inputs and experimentation
- No alerts or strong opinions
- Encourages experimentation

**Target Users**: Developer Learners, Educators, Casual Visitors

**Modules**:
- RAG Studio
- Agent Lab
- Multi-Agent Arena
- Prompt Reasoning Techniques
- Advanced AI Concepts (LLM, Diffusion, A2A, MCP, Commerce)

---

### 3.2 Advanced Mode (Future, Monetizable)
**Purpose**: System understanding, professional judgment, constraint awareness

**Characteristics**:
- Opinionated and constraint-driven
- System behavior focused
- Single cockpit visible at a time
- Alerts instead of tips
- Explicit constraints
- Reveals limits, trade-offs, and failure modes

**Target Users**: Senior Engineers, Architects, Tech Leads, Engineering Managers, Advanced AI Practitioners

**Core Principles**:
- Insight over output
- Constraints over flexibility
- Explanation over optimization
- Confidence and curiosity as primary outcomes

**Cockpits**:
- Prompt Reality Cockpit (v1)
- Retrieval Reality Cockpit (future)
- Cost Reality Cockpit (future)
- Agent Reality Cockpit (future)

**Boundary Rules**:
- No cockpit logic leaks into Basic Mode
- Advanced Mode is never required
- Advanced Mode explains, never fixes
- Basic Mode remains intact

---

## 4. Product Modules

### 4.1 RAG Studio (Basic Mode)
**Purpose**: Visualize and understand RAG pipelines

**Features**:
- Document chunking strategies (fixed, semantic, recursive, parent-child)
- Embedding space exploration (3D visualization)
- Hybrid search comparison (sparse vs dense vs hybrid)
- Reranking visualization (before/after)
- Query expansion demonstration
- Performance metrics

**User Flow**:
1. Upload or select sample document
2. Choose chunking strategy
3. Visualize chunks and embeddings
4. Enter query
5. See retrieval results
6. Compare different strategies

---

### 4.2 Agent Lab (Basic Mode)
**Purpose**: Understand AI agent patterns through visualization

**Features**:
- ReAct pattern (Reasoning + Acting)
- Reflection pattern (Self-critique)
- Tool Use pattern (Tool selection)
- Planning pattern (Multi-step planning)
- Step-by-step execution tracing
- State inspection
- Performance metrics

**User Flow**:
1. Select agent pattern
2. Enter task/query
3. Watch step-by-step execution
4. Inspect agent state
5. See tool calls and reasoning
6. Compare patterns

---

### 4.3 Multi-Agent Arena (Basic Mode)
**Purpose**: Understand multi-agent orchestration patterns

**Features**:
- Supervisor pattern (Task delegation)
- Sequential pattern (Pipeline)
- Parallel pattern (Concurrent execution)
- Hierarchical pattern (Tree structure)
- Agent network visualization
- Message flow visualization
- Performance comparison

**User Flow**:
1. Select orchestration pattern
2. Configure agents
3. Enter task
4. Watch orchestration unfold
5. See agent communication
6. Compare patterns

---

### 4.4 Prompt Reality Cockpit (Advanced Mode)
**Purpose**: Understand what actually happens to prompts before the model responds

**Question**: What actually happens to my prompt before the model responds?

**Key Features**:
- Context window visualization with token pressure indicators
- Context budget visualization (system, instructions, user, overflow segments)
- Instruction dilution detection (multiple role/task instructions)
- Truncation simulation (visualize what gets ignored)
- Per-call cost estimation with scale implications
- Heuristics engine with 9 specific rules across 5 categories:
  - Context Capacity (CC-1, CC-2)
  - Truncation Risk (TR-1)
  - Instruction Dilution (ID-1, ID-2)
  - Structural Ambiguity (SA-1, SA-2)
  - Cost Pressure (CP-1, CP-2)

**User Flow**:
1. Enter Advanced Mode
2. View landing page with framing copy
3. Enter Prompt Reality Cockpit
4. Paste real production prompt
5. See context budget visualization
6. View heuristics insights (max 3, prioritized by severity)
7. Simulate truncation if needed
8. See cost implications

**Design Principles**:
- Deterministic and explainable
- Alerts, not scores
- Non-prescriptive (never suggests fixes)
- Conservative (prefer under-warning to false authority)

---

### 4.5 Future Cockpits (Advanced Mode)

**Retrieval Reality Cockpit**:
- Question: What actually gets retrieved and why?
- Features: Chunk ordering visualization, recall vs precision indicators, retrieval noise exposure, context pollution simulation

**Cost Reality Cockpit**:
- Question: Where does the money really go?
- Features: Fixed vs variable cost modeling, scale-based cost simulation, retry amplification visualization, model pricing impact

**Agent Reality Cockpit**:
- Question: Where does autonomy break down?
- Features: Planning drift visualization, tool misuse scenarios, loop detection, decision boundary exposure

---

## 5. Core Principles

### 5.1 Product Philosophy
- **Insight over output**: Focus on understanding, not optimization
- **Constraints over flexibility**: Show limits and trade-offs
- **Explanation over optimization**: Explain behavior, don't fix prompts
- **Confidence and curiosity**: Primary outcomes for users

### 5.2 Design Principles
- **Constraint-first design**: Show constraints explicitly
- **Minimal surface area**: One cockpit = one question
- **No optimization shortcuts**: Never auto-fix or suggest fixes
- **Alerts over suggestions**: Show problems, not solutions
- **Explanations over metrics**: Explain why, not just what

### 5.3 Tone Guidelines
- Calm, confident, non-marketing
- Senior, direct, low verbosity
- High clarity
- Professional and respectful

---

## 6. Functional Requirements

### 6.1 Core Features (P0 - Must Have)

**FR-1: Document Upload & Processing**
- Users can upload text documents
- Support for common formats (txt, md, pdf)
- Document parsing and preprocessing
- File size limits (10MB)

**FR-2: Chunking Visualization**
- Visualize chunks with boundaries
- Compare multiple strategies side-by-side
- Interactive controls (chunk size, overlap)
- Chunk metadata display

**FR-3: Embedding Visualization**
- Generate embeddings for documents
- 3D embedding space visualization
- Query point highlighting
- Similarity distance visualization

**FR-4: Search Comparison**
- Sparse search (BM25)
- Dense search (vector similarity)
- Hybrid search (weighted combination)
- Side-by-side results comparison

**FR-5: Agent Pattern Execution**
- Execute agent patterns with sample tasks
- Step-by-step visualization
- State inspection
- Tool call visualization

**FR-6: Multi-Agent Orchestration**
- Configure multiple agents
- Visualize agent communication
- Track task delegation
- Performance metrics

---

### 6.2 Enhanced Features (P1 - Should Have)

**FR-7: Reranking Visualization**
- Cross-encoder reranking
- Before/after comparison
- Score change visualization

**FR-8: Query Expansion**
- Query rewriting visualization
- Expansion strategies comparison

**FR-9: Performance Benchmarks**
- Execution time comparison
- Token usage metrics
- Cost calculations

**FR-10: Export & Sharing**
- Export visualizations as images
- Share configurations
- Generate reports

---

### 6.3 Future Features (P2 - Nice to Have)

**FR-11: Real LLM Integration**
- Connect to OpenAI/Anthropic APIs
- Real-time agent execution
- Streaming responses

**FR-12: Custom Tools**
- User-defined tools
- Tool execution sandbox
- Tool performance tracking

**FR-13: Collaborative Features**
- Shared sessions
- Team workspaces
- Commenting system

### 6.4 Advanced Mode Features (P0 - Must Have)

**FR-14: Mode Switching**
- Basic ↔ Advanced mode toggle
- First-time users default to Basic Mode
- Advanced Mode discoverable but never forced
- Mode state persistence

**FR-15: Advanced Mode Landing Page**
- Framing copy with explicit contrast
- "What you will gain" section
- "What this mode intentionally avoids" section
- Entry CTA: "Enter Prompt Reality Cockpit"
- Appears once per session

**FR-16: Prompt Reality Cockpit**
- Large textarea for production prompts (>10k tokens)
- Context budget visualization with segments
- Token pressure indicators
- Heuristics engine with 9 rules
- Instruction dilution detection
- Truncation simulation
- Per-call cost estimation

**FR-17: Heuristics Engine**
- 5 heuristic categories
- 9 specific rules with severity levels
- Max 3 visible insights (prioritized)
- Deterministic and explainable
- Alerts, not scores
- Non-prescriptive

---

## 7. Anti-Features (Explicitly Excluded)

The following features are **explicitly excluded** from the product:

- **Auto prompt fixing**: Never automatically rewrite or fix prompts
- **AI-generated suggestions**: No AI-generated recommendations or tips
- **Best-practice checklists**: No generic best-practice guidance
- **Model tuning controls**: No fine-tuning or model configuration
- **Optimization shortcuts**: No automatic optimization
- **Step-by-step guidance**: No hand-holding or tutorials
- **Feature overload**: Minimal surface area, one cockpit = one question

**Rationale**: Advanced Mode is designed for professionals who want to understand system behavior, not for optimization or automation. Understanding comes before optimization.

---

## 8. Non-Functional Requirements

### 8.1 Performance
- Initial page load: <2 seconds
- Visualization render: <500ms
- Interaction response: <100ms
- Support 100+ concurrent users
- **Advanced Mode**: Low-latency, client-side first

### 8.2 Usability
- Intuitive navigation
- Clear visual feedback
- Helpful tooltips (Basic Mode)
- Alerts instead of tips (Advanced Mode)
- Responsive design (mobile-friendly)

### 8.3 Reliability
- 99% uptime
- Graceful error handling
- Data persistence (localStorage/IndexedDB)
- Offline capability (basic features)
- **Advanced Mode**: 100% deterministic behavior

### 8.4 Security
- No sensitive data collection
- Client-side processing (privacy)
- Secure API calls (if implemented)
- Input validation

### 8.5 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Accessible and readable UI

### 8.6 Advanced Mode Specific
- **100% deterministic**: Same input always produces same output
- **Low-latency**: Client-side first architecture
- **Client-side first**: All processing in browser
- **Accessible and readable**: Clear, professional UI
- **No dark patterns**: Transparent, honest UX

---

## 9. Technical Constraints

### 9.1 Technology Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Visualization**: D3.js, Recharts, Three.js
- **State**: Zustand
- **Routing**: React Router v6

### 9.2 Browser Support
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

### 9.3 Performance Constraints
- Client-side only (no backend required initially)
- Embeddings via Transformers.js (browser)
- Large datasets handled with virtualization

---

## 10. User Experience Requirements

### 10.1 Onboarding
- Welcome tour for first-time users
- Sample examples available
- Quick start guide
- Interactive tutorials

### 10.2 Navigation
- Clear module navigation
- Breadcrumbs
- Search functionality
- Recent activity

### 10.3 Feedback
- Loading states
- Error messages
- Success confirmations
- Progress indicators

---

## 11. Success Criteria

### 11.1 User Engagement (Basic Mode)
- 70% of users complete at least one module
- Average session duration >15 minutes
- 50% return rate (weekly)

### 11.2 Learning Outcomes (Basic Mode)
- 75% improvement in concept comprehension
- 80% can explain RAG after using RAG Studio
- 70% can implement basic agent after Agent Lab

### 11.3 Community
- 100+ GitHub stars
- 10+ contributors
- 5+ community examples
- Active discussions

### 11.4 Advanced Mode Success Metrics
- Repeat visits to cockpits
- Time spent per cockpit (>10 minutes)
- Prompt re-submission rate (users refining prompts)
- Newsletter conversions
- Professional user engagement

---

## 12. Out of Scope (v1.0)

- Real-time collaboration
- User authentication
- Cloud storage
- Advanced analytics
- Mobile apps
- Backend API
- Database integration

---

## 13. Future Considerations

- Real LLM integration (Phase 2)
- Backend API for advanced features
- User accounts and progress tracking
- Community features (sharing, comments)
- Advanced visualizations (more patterns)
- Integration with LangChain/LangGraph

---

**Related Documents**:
- [VISION.md](../vision/VISION.md) - Complete vision and architectural details
- [PACKAGE-DESCRIPTION.md](./PACKAGE-DESCRIPTION.md) - Package contents and audience
- [STARTER-KIT.md](../implementation/STARTER-KIT.md) - Implementation guide

---

**Document Status**: ACTIVE  
**Next Review**: After Phase 6 completion  
**Owner**: Product Team

