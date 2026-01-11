/**
 * AI Learning Playground - Text Splitting Visualization
 * Inspired by RAG-Play's Text Splitting interface
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn, stringToColor } from '@/lib/utils';
import type { Chunk } from '@/types';

interface TextSplittingVizProps {
  sourceDocument: string;
  chunks: Chunk[];
  selectedChunkId?: string | null;
  onChunkHover?: (chunkId: string | null) => void;
  onChunkSelect?: (chunkId: string) => void;
}

export const TextSplittingViz: React.FC<TextSplittingVizProps> = ({
  sourceDocument,
  chunks,
  selectedChunkId,
  onChunkHover,
  onChunkSelect,
}) => {
  const [hoveredChunkId, setHoveredChunkId] = useState<string | null>(null);
  const activeChunkId = hoveredChunkId || selectedChunkId;

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        avgSize: 0,
        withOverlap: 0,
        avgOverlap: 0,
      };
    }

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0);
    const avgSize = Math.round(totalSize / chunks.length);
    
    // Count chunks with overlap (chunks that start before previous chunk ends)
    const withOverlap = chunks.filter((chunk, idx) => {
      if (idx === 0) return false;
      const prevChunk = chunks[idx - 1];
      return chunk.startOffset < prevChunk.endOffset;
    }).length;

    // Calculate average overlap
    const overlaps = chunks
      .map((chunk, idx) => {
        if (idx === 0) return 0;
        const prevChunk = chunks[idx - 1];
        const overlap = Math.max(0, prevChunk.endOffset - chunk.startOffset);
        return overlap;
      })
      .filter((o) => o > 0);
    
    const avgOverlap = overlaps.length > 0 
      ? Math.round(overlaps.reduce((sum, o) => sum + o, 0) / overlaps.length)
      : 0;

    return {
      totalChunks: chunks.length,
      avgSize,
      withOverlap,
      avgOverlap,
    };
  }, [chunks]);

  // Highlight chunks in source document
  const renderSourceWithHighlights = () => {
    if (!activeChunkId) {
      return <div className="text-sm text-content-muted whitespace-pre-wrap font-mono">{sourceDocument}</div>;
    }

    const activeChunk = chunks.find((c) => c.id === activeChunkId);
    if (!activeChunk) {
      return <div className="text-sm text-content-muted whitespace-pre-wrap font-mono">{sourceDocument}</div>;
    }

    const before = sourceDocument.slice(0, activeChunk.startOffset);
    const highlighted = sourceDocument.slice(activeChunk.startOffset, activeChunk.endOffset);
    const after = sourceDocument.slice(activeChunk.endOffset);

    return (
      <div className="text-sm text-content-muted whitespace-pre-wrap font-mono">
        <span>{before}</span>
        <span className="bg-rag-primary/30 text-content px-1 rounded border border-rag-primary/50">
          {highlighted}
        </span>
        <span>{after}</span>
      </div>
    );
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-full">
      {/* Left: Source Document */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-content mb-2">Source Document</h3>
          <p className="text-xs text-content-muted mb-4">
            {activeChunkId 
              ? 'Highlighted chunk position in source document' 
              : 'Hover over chunks to highlight their position'}
          </p>
        </div>
        <div className="bg-surface-elevated rounded-lg border border-surface-muted p-4 max-h-[600px] overflow-y-auto">
          {renderSourceWithHighlights()}
        </div>
      </div>

      {/* Right: Generated Chunks */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-content mb-2">Generated Chunks</h3>
          <p className="text-xs text-content-muted mb-4">
            Hover over chunks to highlight their position in the source document
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-elevated rounded-lg border border-surface-muted p-3">
            <div className="text-2xs text-content-muted mb-1">Chunks</div>
            <div className="text-lg font-semibold text-content">{stats.totalChunks}</div>
          </div>
          <div className="bg-surface-elevated rounded-lg border border-surface-muted p-3">
            <div className="text-2xs text-content-muted mb-1">Avg. Size</div>
            <div className="text-lg font-semibold text-content">{stats.avgSize} chars</div>
          </div>
          <div className="bg-surface-elevated rounded-lg border border-surface-muted p-3">
            <div className="text-2xs text-content-muted mb-1">With Overlap</div>
            <div className="text-lg font-semibold text-content">{stats.withOverlap}</div>
          </div>
          <div className="bg-surface-elevated rounded-lg border border-surface-muted p-3">
            <div className="text-2xs text-content-muted mb-1">Avg. Overlap</div>
            <div className="text-lg font-semibold text-content">{stats.avgOverlap} chars</div>
          </div>
        </div>

        {/* Chunks List */}
        <div className="bg-surface-elevated rounded-lg border border-surface-muted p-4 max-h-[500px] overflow-y-auto space-y-2">
          {chunks.length === 0 ? (
            <div className="text-center py-8 text-content-muted">
              <p className="text-sm">No chunks generated yet</p>
              <p className="text-xs mt-1">Configure and run to see chunks</p>
            </div>
          ) : (
            chunks.map((chunk, idx) => {
              const isActive = chunk.id === activeChunkId;
              const chunkColor = stringToColor(chunk.id);
              const hasOverlap = idx > 0 && chunk.startOffset < chunks[idx - 1].endOffset;

              return (
                <motion.div
                  key={chunk.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onMouseEnter={() => {
                    setHoveredChunkId(chunk.id);
                    onChunkHover?.(chunk.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredChunkId(null);
                    onChunkHover?.(null);
                  }}
                  onClick={() => onChunkSelect?.(chunk.id)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all duration-200',
                    isActive
                      ? 'bg-rag-primary/20 border-rag-primary shadow-glow-sm'
                      : 'bg-surface/50 border-surface-muted hover:border-rag-primary/50 hover:bg-surface-bright'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: chunkColor }}
                      />
                      <span className="text-2xs font-medium text-content-muted">
                        Chunk {chunk.index + 1}
                      </span>
                      {hasOverlap && (
                        <span className="text-2xs px-1.5 py-0.5 rounded bg-rag-primary/20 text-rag-primary">
                          Overlap
                        </span>
                      )}
                    </div>
                    <span className="text-2xs text-content-subtle font-mono">
                      {chunk.content.length} chars
                    </span>
                  </div>
                  <p className="text-xs text-content-muted leading-relaxed line-clamp-3">
                    {chunk.content}
                  </p>
                  <div className="mt-2 text-2xs text-content-subtle">
                    Position: {chunk.startOffset} - {chunk.endOffset}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

