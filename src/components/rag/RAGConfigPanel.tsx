/**
 * AI Learning Playground - RAG Configuration Panel
 */

import React from 'react';
import { Settings2, Info } from 'lucide-react';
import { Card, Select } from '@/components/shared';
import { useRAGStore } from '@/lib/store';
import type { ChunkingStrategy } from '@/types';

const chunkingStrategies: Array<{ value: ChunkingStrategy; label: string; description: string; detailed?: string }> = [
  { 
    value: 'fixed-size', 
    label: 'Fixed Character', 
    description: 'Simple uniform segmentation based on predetermined character length',
    detailed: 'Best for prototyping and resource-constrained environments with minimal computational overhead.'
  },
  { 
    value: 'sentence', 
    label: 'Sentence', 
    description: 'Split by sentence boundaries',
    detailed: 'Preserves sentence-level semantic coherence. Good for question-answering tasks.'
  },
  { 
    value: 'paragraph', 
    label: 'Paragraph', 
    description: 'Split by paragraphs',
    detailed: 'Maintains paragraph-level context. Suitable for longer documents with clear structure.'
  },
  { 
    value: 'semantic', 
    label: 'Semantic', 
    description: 'Split by meaning (AI-based)',
    detailed: 'Uses embeddings to identify semantic boundaries. Most accurate but computationally expensive.'
  },
  { 
    value: 'recursive', 
    label: 'Recursive Character', 
    description: 'Multi-tier algorithm that preserves natural language boundaries',
    detailed: 'Recommended for applications requiring semantic integrity. Tries multiple separators hierarchically.'
  },
  { 
    value: 'parent-child', 
    label: 'Parent-Child', 
    description: 'Dual-tier architecture using fine-grained chunks with parent context',
    detailed: 'Optimal for complex applications requiring balanced accuracy and completeness.'
  },
];

export const RAGConfigPanel: React.FC = () => {
  const { chunkingConfig, setChunkingConfig } = useRAGStore();

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-content">
        <Settings2 size={18} className="text-rag-primary" />
        <h3 className="font-medium">Configuration</h3>
      </div>

      <div className="space-y-4">
        <Select
          label="Chunking Strategy"
          value={chunkingConfig.strategy}
          onChange={(e) => setChunkingConfig({ strategy: e.target.value as ChunkingStrategy })}
          options={chunkingStrategies.map((s) => ({ value: s.value, label: s.label }))}
        />

        <div className="p-3 rounded-lg bg-surface/50 border border-surface-muted">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-content-subtle mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-content">
                {chunkingStrategies.find((s) => s.value === chunkingConfig.strategy)?.description}
              </p>
              {chunkingStrategies.find((s) => s.value === chunkingConfig.strategy)?.detailed && (
                <p className="text-xs text-content-muted">
                  {chunkingStrategies.find((s) => s.value === chunkingConfig.strategy)?.detailed}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="input-label">Chunk Size (tokens)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={chunkingConfig.chunkSize}
                onChange={(e) => setChunkingConfig({ chunkSize: Number(e.target.value) })}
                className="flex-1 h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-rag-primary"
              />
              <span className="text-sm font-mono text-content-muted w-16 text-right">
                {chunkingConfig.chunkSize}
              </span>
            </div>
          </div>

          <div>
            <label className="input-label">Overlap (tokens)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={Math.floor(chunkingConfig.chunkSize / 2)}
                step={10}
                value={chunkingConfig.chunkOverlap}
                onChange={(e) => setChunkingConfig({ chunkOverlap: Number(e.target.value) })}
                className="flex-1 h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-rag-primary"
              />
              <span className="text-sm font-mono text-content-muted w-16 text-right">
                {chunkingConfig.chunkOverlap}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// RAG Results Panel Component
// ============================================

interface RAGResultsPanelProps {
  results: Array<{
    chunk: { id: string; content: string };
    score: number;
    rank: number;
  }>;
  query: string;
}

export const RAGResultsPanel: React.FC<RAGResultsPanelProps> = ({ results, query }) => {
  const queryTerms = query.toLowerCase().split(/\s+/);

  const highlightText = (text: string) => {
    let highlighted = text;
    queryTerms.forEach((term) => {
      if (term.length > 2) {
        const regex = new RegExp(`(${term})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark class="bg-rag-primary/30 text-content px-0.5 rounded">$1</mark>');
      }
    });
    return highlighted;
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-content">Retrieved Results</h3>
        <span className="text-sm text-content-muted">{results.length} chunks</span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {results.map((result) => (
          <div
            key={result.chunk.id}
            className="p-3 rounded-lg bg-surface/50 border border-surface-muted hover:border-rag-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-medium text-content-subtle">
                Rank #{result.rank}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rag-primary to-rag-accent rounded-full"
                    style={{ width: `${result.score * 100}%` }}
                  />
                </div>
                <span className="text-2xs font-mono text-rag-primary">
                  {(result.score * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <p
              className="text-sm text-content-muted leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightText(result.chunk.content.slice(0, 300)) }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};
