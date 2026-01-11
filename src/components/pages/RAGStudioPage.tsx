/**
 * AI Learning Playground - RAG Studio Page
 */

import React, { useState } from 'react';
import { Play, RotateCcw, FileText, Info, Scissors, Database } from 'lucide-react';
import { Card, Button, Textarea, Badge } from '@/components/shared';
import { RAGPipelineViz, ChunkViz, RAGConfigPanel, RAGResultsPanel, TextSplittingViz, VectorEmbeddingViz } from '@/components/rag';
import { useRAGStore } from '@/lib/store';

const SAMPLE_DOCUMENT = `Retrieval-Augmented Generation (RAG) is a technique that enhances large language models by providing them with relevant external knowledge. Instead of relying solely on the model's training data, RAG retrieves relevant documents from a knowledge base and uses them to generate more accurate and up-to-date responses.

The RAG pipeline consists of several key stages. First, documents are split into smaller chunks that can be efficiently processed and retrieved. This chunking process is crucial - chunks that are too large may contain irrelevant information, while chunks that are too small may lack necessary context.

After chunking, each text segment is converted into a numerical representation called an embedding. These embeddings capture the semantic meaning of the text, allowing for similarity comparisons. Modern embedding models like OpenAI's text-embedding-3 or open-source alternatives like sentence-transformers can generate high-quality embeddings.

When a user submits a query, it's also converted into an embedding. The system then searches the vector database to find chunks with embeddings most similar to the query embedding. This retrieval step is where the "retrieval" in RAG comes from.

Advanced RAG systems employ additional techniques like reranking, where a separate model scores the retrieved chunks for relevance, and hybrid search, which combines vector similarity with keyword matching for better results.

Finally, the retrieved chunks are passed to the language model along with the user's query. The model uses this context to generate a response that's grounded in the provided information, reducing hallucinations and improving accuracy.`;

const SAMPLE_QUERIES = [
  'What is RAG and how does it work?',
  'Explain the chunking process',
  'What are embeddings used for?',
  'How does retrieval work in RAG?',
];

export const RAGStudioPage: React.FC = () => {
  const {
    pipelineState,
    isProcessing,
    selectedChunkId,
    selectChunk,
    runDemoQuery,
    resetRAGState,
  } = useRAGStore();

  const [document, setDocument] = useState(SAMPLE_DOCUMENT);
  const [query, setQuery] = useState(SAMPLE_QUERIES[0]);
  const [activeTab, setActiveTab] = useState<'splitting' | 'embedding'>('splitting');

  const handleRunPipeline = () => {
    runDemoQuery(query, document);
  };

  const handleReset = () => {
    resetRAGState();
    setQuery(SAMPLE_QUERIES[0]);
  };

  const getPipelineStages = () => {
    if (!pipelineState) {
      return [
        { id: 'document', label: 'Document', icon: FileText, status: 'pending' as const },
        { id: 'chunking', label: 'Chunking', icon: FileText, status: 'pending' as const },
        { id: 'embedding', label: 'Embedding', icon: FileText, status: 'pending' as const },
        { id: 'retrieval', label: 'Retrieval', icon: FileText, status: 'pending' as const },
        { id: 'generation', label: 'Generation', icon: FileText, status: 'pending' as const },
      ];
    }

    return [
      { id: 'document', label: 'Document', icon: FileText, status: 'completed' as const, duration: 50 },
      { id: 'chunking', label: 'Chunking', icon: FileText, status: 'completed' as const, duration: pipelineState.timing.chunking },
      { id: 'embedding', label: 'Embedding', icon: FileText, status: 'completed' as const, duration: pipelineState.timing.embedding },
      { id: 'retrieval', label: 'Retrieval', icon: FileText, status: 'completed' as const, duration: pipelineState.timing.retrieval },
      { id: 'generation', label: 'Generation', icon: FileText, status: 'completed' as const, duration: pipelineState.timing.generation },
    ];
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-content mb-2">RAG Studio</h1>
          <p className="text-content-muted">
            Explore Retrieval-Augmented Generation pipelines interactively
          </p>
        </div>
        <Badge variant="cyan">Interactive Demo</Badge>
      </div>

      {/* Pipeline Visualization */}
      <Card className="p-6">
        <h2 className="font-medium text-content mb-4">Pipeline Flow</h2>
        <RAGPipelineViz
          stages={getPipelineStages()}
          activeStage={isProcessing ? 'retrieval' : undefined}
        />
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-muted">
        <button
          onClick={() => setActiveTab('splitting')}
          className={`
            px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
            ${activeTab === 'splitting'
              ? 'text-rag-primary border-rag-primary'
              : 'text-content-muted border-transparent hover:text-content'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Scissors size={16} />
            Text Splitting
          </div>
        </button>
        <button
          onClick={() => setActiveTab('embedding')}
          className={`
            px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
            ${activeTab === 'embedding'
              ? 'text-rag-primary border-rag-primary'
              : 'text-content-muted border-transparent hover:text-content'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Database size={16} />
            Vector Embedding & Similarity
          </div>
        </button>
      </div>

      {/* Text Splitting Section */}
      {activeTab === 'splitting' && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="font-medium text-content mb-2">Text Splitting</h2>
            <p className="text-sm text-content-muted">
              Visualize how documents are split into meaningful chunks while preserving semantic coherence
            </p>
          </div>

        {/* Document Input */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-content">Source Document</label>
            <span className="text-xs text-content-muted">
              {document.length} characters
            </span>
          </div>
          <Textarea
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
            placeholder="Paste your document here..."
          />
        </div>

        {/* Text Splitting Visualization */}
        {pipelineState && pipelineState.chunks.length > 0 ? (
          <TextSplittingViz
            sourceDocument={document}
            chunks={pipelineState.chunks}
            selectedChunkId={selectedChunkId}
            onChunkHover={selectChunk}
            onChunkSelect={selectChunk}
          />
        ) : (
          <div className="bg-surface-elevated rounded-lg border border-surface-muted p-12 text-center">
            <p className="text-sm text-content-muted mb-2">No chunks generated yet</p>
            <p className="text-xs text-content-subtle">
              Configure your chunking strategy and click Run to visualize text splitting
            </p>
          </div>
        )}
        </Card>
      )}

      {/* Vector Embedding Section */}
      {activeTab === 'embedding' && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="font-medium text-content mb-2">Vector Embedding & Similarity</h2>
            <p className="text-sm text-content-muted mb-4">
              View chunks and their vector embeddings side by side. Ask questions to find similar content through semantic search.
            </p>
            <div className="p-4 rounded-lg bg-surface/50 border border-surface-muted mb-6">
              <p className="text-sm text-content-muted leading-relaxed">
                Vector embeddings are a numerical representation of text that captures semantic meaning. 
                Words that are semantically similar are often represented by vectors that are close to each other in this vector space. 
                For example, the vector representation of "king" minus "man" plus "woman" should be close to the vector representation of "queen."
              </p>
            </div>
          </div>

          {/* Query Input for Embedding View */}
          <div className="mb-6">
            <label className="text-sm font-medium text-content mb-2 block">
              Ask a question to find similar content:
            </label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[80px] font-mono text-sm mb-3"
              placeholder="Enter your question..."
            />
            {pipelineState?.queryEmbedding && (
              <div className="p-3 rounded-lg bg-surface-elevated border border-surface-muted">
                <div className="text-xs text-content-muted mb-2">
                  Question embedding • {pipelineState.queryEmbedding.length} dimensions
                </div>
                <div className="text-xs font-mono text-content-muted max-h-[100px] overflow-y-auto">
                  [{pipelineState.queryEmbedding.slice(0, 20).map(v => v.toFixed(4)).join(', ')}, ...]
                </div>
              </div>
            )}
          </div>

          {/* Vector Embedding Visualization */}
          {pipelineState && pipelineState.chunks.length > 0 ? (
            <VectorEmbeddingViz
              chunks={pipelineState.chunks}
              query={query}
              queryEmbedding={pipelineState.queryEmbedding}
              selectedChunkId={selectedChunkId}
              onChunkSelect={selectChunk}
            />
          ) : (
            <div className="bg-surface-elevated rounded-lg border border-surface-muted p-12 text-center">
              <p className="text-sm text-content-muted mb-2">No chunks generated yet</p>
              <p className="text-xs text-content-subtle">
                Go to Text Splitting tab, configure your chunking strategy and click Run to visualize embeddings
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Query & Retrieval Section */}
      <Card className="p-6">
        <h2 className="font-medium text-content mb-4">Query & Retrieval</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-content mb-2 block">Query</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input flex-1"
                placeholder="Enter your question..."
              />
              <Button onClick={handleRunPipeline} isLoading={isProcessing}>
                <Play size={16} />
                Run
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>

          {/* Quick Queries */}
          <div>
            <p className="text-xs text-content-muted mb-2">Try these queries:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-surface-muted hover:bg-surface-bright text-content-muted hover:text-content transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Chunks Grid View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chunks Grid Visualization */}
          {pipelineState && pipelineState.chunks.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-content">Chunk Overview</h2>
                <span className="text-sm text-content-muted">
                  {pipelineState.chunks.length} chunks created
                </span>
              </div>
              <ChunkViz
                chunks={pipelineState.chunks.map((c) => ({
                  ...c,
                  score: pipelineState.searchResults.find((r) => r.chunk.id === c.id)?.score,
                }))}
                selectedChunkId={selectedChunkId}
                onChunkSelect={selectChunk}
              />
            </Card>
          )}
        </div>

        {/* Right Column - Config & Results */}
        <div className="space-y-6">
          {/* Configuration Panel */}
          <RAGConfigPanel />

          {/* Info Card */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-rag-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-content mb-1">How it works</h3>
                <p className="text-xs text-content-muted leading-relaxed">
                  The document is split into chunks based on your configuration. 
                  Each chunk is embedded and compared against your query to find 
                  the most relevant pieces of information.
                </p>
              </div>
            </div>
          </Card>

          {/* Results */}
          {pipelineState && pipelineState.searchResults.length > 0 && (
            <RAGResultsPanel
              results={pipelineState.searchResults.slice(0, 5)}
              query={query}
            />
          )}

          {/* Timing Stats */}
          {pipelineState && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-content mb-3">Pipeline Timing</h3>
              <div className="space-y-2">
                {Object.entries(pipelineState.timing).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-content-muted capitalize">{key}</span>
                    <span className="font-mono text-rag-primary">{value}ms</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
