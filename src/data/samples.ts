/**
 * AI Learning Playground - Sample Data
 * 
 * Example documents, queries, and configurations for demos
 */

// ============================================
// RAG Sample Documents
// ============================================

export const RAG_SAMPLE_DOCUMENTS = {
  aiBasics: {
    id: 'doc-ai-basics',
    title: 'Introduction to AI',
    content: `Artificial Intelligence (AI) is a branch of computer science focused on building machines capable of performing tasks that typically require human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding.

Machine Learning (ML) is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. ML algorithms build mathematical models based on sample data, known as training data, to make predictions or decisions.

Deep Learning is a subset of ML based on artificial neural networks with multiple layers. These networks can learn complex patterns in large amounts of data. Popular deep learning architectures include Convolutional Neural Networks (CNNs) for image processing and Transformers for natural language processing.

Large Language Models (LLMs) are deep learning models trained on vast amounts of text data. They can generate human-like text, answer questions, summarize documents, and perform various language tasks. Examples include GPT-4, Claude, and Llama.`,
    metadata: {
      source: 'AI Fundamentals Guide',
      category: 'education',
      difficulty: 'beginner',
    },
  },
  ragExplainer: {
    id: 'doc-rag-explainer',
    title: 'RAG Architecture Deep Dive',
    content: `Retrieval-Augmented Generation (RAG) combines the power of large language models with external knowledge retrieval to produce more accurate and up-to-date responses.

The RAG pipeline consists of several stages: Document Processing, where raw documents are loaded and prepared; Chunking, where documents are split into manageable pieces; Embedding, where text is converted to vector representations; Indexing, where vectors are stored in a database for efficient retrieval; and Generation, where the LLM produces responses using retrieved context.

Chunking strategies significantly impact retrieval quality. Fixed-size chunking is simple but may split semantic units. Sentence-based chunking preserves grammatical structure. Semantic chunking uses embeddings to find natural breakpoints. Parent-child chunking maintains hierarchy while enabling precise retrieval.

Advanced RAG techniques include query expansion, which reformulates queries for better matching; hybrid search, combining vector and keyword search; reranking, using a separate model to improve result ordering; and self-reflection, where the system evaluates and improves its own responses.`,
    metadata: {
      source: 'RAG Architecture Guide',
      category: 'technical',
      difficulty: 'intermediate',
    },
  },
};

// ============================================
// Agent Sample Tasks
// ============================================

export const AGENT_SAMPLE_TASKS = [
  {
    id: 'task-research',
    title: 'Research Task',
    description: 'Research the latest developments in quantum computing and summarize key findings',
    pattern: 'react',
    expectedSteps: 8,
    tools: ['web_search', 'summarizer'],
  },
  {
    id: 'task-analysis',
    title: 'Analysis Task',
    description: 'Analyze the pros and cons of microservices vs monolithic architecture',
    pattern: 'reflection',
    expectedSteps: 6,
    tools: ['web_search', 'note_taker'],
  },
  {
    id: 'task-code-review',
    title: 'Code Review Task',
    description: 'Review this code for security vulnerabilities and suggest improvements',
    pattern: 'planning',
    expectedSteps: 10,
    tools: ['code_analyzer', 'security_scanner'],
  },
];

// ============================================
// Multi-Agent Configurations
// ============================================

export const MULTI_AGENT_CONFIGS = {
  contentTeam: {
    id: 'config-content-team',
    name: 'Content Creation Team',
    pattern: 'supervisor',
    agents: [
      {
        id: 'researcher',
        name: 'Researcher',
        role: 'Research and gather information from various sources',
        color: '#06b6d4',
        tools: ['web_search', 'document_reader'],
      },
      {
        id: 'writer',
        name: 'Writer',
        role: 'Create compelling content based on research',
        color: '#8b5cf6',
        tools: ['text_generator', 'grammar_checker'],
      },
      {
        id: 'editor',
        name: 'Editor',
        role: 'Review and polish content for quality',
        color: '#10b981',
        tools: ['grammar_checker', 'style_analyzer'],
      },
    ],
  },
  analysisTeam: {
    id: 'config-analysis-team',
    name: 'Data Analysis Team',
    pattern: 'hierarchical',
    agents: [
      {
        id: 'data-collector',
        name: 'Data Collector',
        role: 'Gather and validate data from sources',
        color: '#f59e0b',
        tools: ['api_caller', 'data_validator'],
      },
      {
        id: 'analyst',
        name: 'Analyst',
        role: 'Analyze data and identify patterns',
        color: '#ec4899',
        tools: ['calculator', 'chart_generator'],
      },
      {
        id: 'reporter',
        name: 'Reporter',
        role: 'Create reports and visualizations',
        color: '#3b82f6',
        tools: ['report_generator', 'chart_generator'],
      },
    ],
  },
};

// ============================================
// Chunking Strategy Examples
// ============================================

export const CHUNKING_EXAMPLES = {
  fixedSize: {
    name: 'Fixed Size',
    description: 'Split text into chunks of fixed character/token count',
    pros: ['Simple to implement', 'Predictable chunk sizes', 'Good for uniform content'],
    cons: ['May split mid-sentence', 'No semantic awareness', 'Context may be lost'],
    bestFor: 'Uniform, technical documentation',
  },
  semantic: {
    name: 'Semantic',
    description: 'Split based on meaning and topic boundaries',
    pros: ['Preserves semantic units', 'Better retrieval quality', 'Context-aware'],
    cons: ['More complex', 'Variable chunk sizes', 'Requires embedding model'],
    bestFor: 'Mixed content, articles, reports',
  },
  parentChild: {
    name: 'Parent-Child',
    description: 'Hierarchical chunks with parent context',
    pros: ['Rich context', 'Precise retrieval', 'Maintains document structure'],
    cons: ['Complex to implement', 'Higher storage', 'More processing'],
    bestFor: 'Long documents, manuals, books',
  },
};
