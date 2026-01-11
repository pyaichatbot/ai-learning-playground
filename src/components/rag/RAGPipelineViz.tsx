/**
 * AI Learning Playground - RAG Pipeline Visualization
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Scissors, Database, Search, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'pending' | 'active' | 'completed';
  duration?: number;
}

interface RAGPipelineVizProps {
  stages?: PipelineStage[];
  activeStage?: string;
  className?: string;
}

const defaultStages: PipelineStage[] = [
  { id: 'document', label: 'Document', icon: FileText, status: 'pending' },
  { id: 'chunking', label: 'Chunking', icon: Scissors, status: 'pending' },
  { id: 'embedding', label: 'Embedding', icon: Database, status: 'pending' },
  { id: 'retrieval', label: 'Retrieval', icon: Search, status: 'pending' },
  { id: 'generation', label: 'Generation', icon: Sparkles, status: 'pending' },
];

export const RAGPipelineViz: React.FC<RAGPipelineVizProps> = ({
  stages = defaultStages,
  activeStage,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.id === activeStage || stage.status === 'active';
          const isCompleted = stage.status === 'completed';
          const isLast = index === stages.length - 1;

          return (
            <React.Fragment key={stage.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center gap-2 min-w-[80px]"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all duration-300',
                    isActive && 'bg-rag-primary/20 border-rag-primary shadow-glow-sm animate-pulse-glow',
                    isCompleted && 'bg-accent-emerald/20 border-accent-emerald',
                    !isActive && !isCompleted && 'bg-surface-elevated border-surface-muted'
                  )}
                >
                  <Icon
                    size={24}
                    className={cn(
                      'transition-colors',
                      isActive && 'text-rag-primary',
                      isCompleted && 'text-accent-emerald',
                      !isActive && !isCompleted && 'text-content-subtle'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium text-center',
                    isActive && 'text-rag-primary',
                    isCompleted && 'text-accent-emerald',
                    !isActive && !isCompleted && 'text-content-muted'
                  )}
                >
                  {stage.label}
                </span>
                {stage.duration && isCompleted && (
                  <span className="text-2xs text-content-subtle">{stage.duration}ms</span>
                )}
              </motion.div>

              {!isLast && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1 + 0.05 }}
                  className="flex-shrink-0"
                >
                  <ArrowRight
                    size={20}
                    className={cn(
                      'transition-colors',
                      isCompleted ? 'text-accent-emerald' : 'text-surface-muted'
                    )}
                  />
                </motion.div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// Chunk Visualization Component
// ============================================

interface ChunkVizProps {
  chunks: Array<{
    id: string;
    content: string;
    index: number;
    score?: number;
  }>;
  selectedChunkId?: string | null;
  onChunkSelect?: (id: string) => void;
  variant?: 'grid' | 'list';
}

export const ChunkViz: React.FC<ChunkVizProps> = ({
  chunks,
  selectedChunkId,
  onChunkSelect,
  variant = 'grid',
}) => {
  return (
    <div
      className={cn(
        variant === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-2'
      )}
    >
      {chunks.map((chunk, idx) => {
        const isSelected = chunk.id === selectedChunkId;
        const hasScore = chunk.score !== undefined;

        return (
          <motion.div
            key={chunk.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onChunkSelect?.(chunk.id)}
            className={cn(
              'p-3 rounded-lg border cursor-pointer transition-all duration-200',
              isSelected
                ? 'bg-rag-primary/20 border-rag-primary shadow-glow-sm'
                : 'bg-surface-elevated/50 border-surface-muted hover:border-surface-bright'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-medium text-content-muted">
                Chunk {chunk.index + 1}
              </span>
              {hasScore && (
                <span
                  className={cn(
                    'text-2xs px-1.5 py-0.5 rounded',
                    chunk.score! > 0.7
                      ? 'bg-accent-emerald/20 text-accent-emerald'
                      : chunk.score! > 0.4
                      ? 'bg-accent-amber/20 text-accent-amber'
                      : 'bg-surface-muted text-content-subtle'
                  )}
                >
                  {(chunk.score! * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-xs text-content-muted line-clamp-3">
              {chunk.content.slice(0, 150)}
              {chunk.content.length > 150 && '...'}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};
