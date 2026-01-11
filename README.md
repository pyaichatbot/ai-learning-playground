# 🎮 AI Learning Playground

> **"Understanding isn't memorizing patterns—it's seeing them in action, breaking them, rebuilding them better."**

An interactive learning platform for mastering **RAG**, **AI Agents**, and **Multi-Agent Systems** through visualization. Built for developers and architects who want to understand and build cutting-edge AI systems.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)

![AI Learning Playground](https://via.placeholder.com/800x400?text=AI+Learning+Playground)

## 🌟 Features

### 📚 RAG Studio
- **Interactive Chunking**: Visualize different chunking strategies (fixed-size, semantic, recursive, parent-child)
- **Embedding Space**: See how documents are represented as vectors
- **Retrieval Comparison**: Compare vector search vs. hybrid search
- **Query Expansion**: Understand how queries are enhanced for better retrieval

### 🤖 Agent Lab
- **Pattern Visualization**: ReAct, Reflection, Tool Use, and Planning patterns
- **Step-by-Step Tracing**: Watch agent reasoning unfold in real-time
- **Tool Calling**: See how agents decide which tools to use
- **Self-Reflection**: Visualize critique and improvement loops

### 🌐 Multi-Agent Arena
- **Orchestration Patterns**: Supervisor, Sequential, Parallel, Hierarchical
- **Message Flow**: Watch inter-agent communication in real-time
- **Task Delegation**: See how work is distributed across agents
- **Network Visualization**: Interactive agent relationship graphs

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/pyaichatbot/ai-learning-playground.git
cd ai-learning-playground

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Framer Motion |
| **State** | Zustand |
| **Routing** | React Router v6 |
| **Visualization** | D3.js, Recharts |
| **Testing** | Vitest, Testing Library |
| **UI Components** | Radix UI primitives |
| **Icons** | Lucide React |

> **Note**: This project uses Vite (SPA) instead of Next.js for simplicity and faster development iteration. The architecture principles align with the vision in `rag_to_agentic_playground.md`, but implementation uses client-side rendering.

## 📁 Project Structure

```
ai-learning-playground/
├── src/
│   ├── components/
│   │   ├── layout/          # Header, Sidebar, Layout
│   │   ├── shared/          # Reusable UI components
│   │   ├── rag/             # RAG-specific visualizations
│   │   ├── agents/          # Agent pattern components
│   │   ├── multi-agent/     # Multi-agent visualizations
│   │   └── pages/           # Page components
│   ├── lib/
│   │   ├── utils.ts         # Utility functions
│   │   └── store.ts         # Zustand state management
│   ├── types/               # TypeScript definitions
│   ├── styles/              # Global styles
│   ├── data/                # Sample data and examples
│   ├── test/                # Test setup files
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── docs/                    # Documentation
└── package.json
```

## 🎯 Learning Outcomes

After using this playground, you'll understand:

**Technical Skills:**
- ✅ When to use RAG vs. Agents vs. Multi-Agent systems
- ✅ Debug RAG pipelines by visualizing retrieval quality
- ✅ Design agentic workflows with appropriate patterns
- ✅ Optimize agent performance through state inspection
- ✅ Build production-ready multi-agent orchestrations

**Conceptual Understanding:**
- ✅ Trade-offs between different chunking strategies
- ✅ Why hybrid search outperforms pure vector search
- ✅ When agents need reflection vs. when they don't
- ✅ How multi-agent coordination reduces single points of failure

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

### Contribution Areas

- **Phase 1**: Enhanced RAG visualizations
- **Phase 2**: Additional agent patterns
- **Phase 3**: Real LLM integration
- **Phase 4**: Collaborative features

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📖 Resources

- **Blog Post**: [From RAG to Agentic AI](https://yellamaraju.com/blog)
- **Documentation**: Coming soon
- **Video Tutorial**: Coming soon

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**PraveenY**

- Website: [yellamaraju.com](https://yellamaraju.com)
- Blog: [yellamaraju.com/blog](https://yellamaraju.com/blog)
- GitHub: [@pyaichatbot](https://github.com/pyaichatbot)

## 🙏 Acknowledgments

Inspired by:
- [RAG-Play](https://github.com/Kain-90/RAG-Play)
- [LangChain](https://langchain.com)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [CrewAI](https://www.crewai.com/)

---

**Built with ❤️ for the AI learning community**
