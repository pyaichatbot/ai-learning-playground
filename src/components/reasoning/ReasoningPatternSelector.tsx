/**
 * AI Learning Playground - Reasoning Pattern Selector
 * 
 * Component for selecting and displaying reasoning pattern information
 */

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Card } from '@/components/shared';
import type { ReasoningPattern, ReasoningPatternInfo } from '@/types';
import { cn } from '@/lib/utils';

interface ReasoningPatternSelectorProps {
  selectedPattern: ReasoningPattern;
  onPatternChange: (pattern: ReasoningPattern) => void;
  patterns: ReasoningPatternInfo[];
}

const CATEGORY_LABELS: Record<ReasoningPatternInfo['category'], string> = {
  'linear-sequential': 'Linear & Sequential',
  'modular-parallel': 'Modular & Parallel',
  'iterative-self-correcting': 'Iterative & Self-Correcting',
  'advanced-graph-memory': 'Advanced Graph & Memory',
};

export const ReasoningPatternSelector: React.FC<ReasoningPatternSelectorProps> = ({
  selectedPattern,
  onPatternChange,
  patterns,
}) => {
  const selectedInfo = patterns.find(p => p.id === selectedPattern);

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-content mb-4">Select Reasoning Pattern</h3>
          
          <div className="space-y-3">
            {Object.entries(
              patterns.reduce((acc, pattern) => {
                if (!acc[pattern.category]) {
                  acc[pattern.category] = [];
                }
                acc[pattern.category].push(pattern);
                return acc;
              }, {} as Record<ReasoningPatternInfo['category'], ReasoningPatternInfo[]>)
            ).map(([category, categoryPatterns]) => {
              const categoryKey = category as ReasoningPatternInfo['category'];
              return (
                <div key={category} className="space-y-2">
                  <div className="text-xs font-medium text-content-muted uppercase tracking-wide">
                    {CATEGORY_LABELS[categoryKey]}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {categoryPatterns.map((pattern) => (
                      <Tooltip.Root key={pattern.id}>
                        <Tooltip.Trigger asChild>
                          <button
                            onClick={() => onPatternChange(pattern.id)}
                            className={cn(
                              'text-left p-3 rounded-lg border-2 transition-all w-full',
                              selectedPattern === pattern.id
                                ? 'border-reasoning-primary bg-reasoning-primary/10'
                                : 'border-surface-muted hover:border-surface-bright'
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-content truncate flex-1 mr-2">
                                {pattern.name}
                              </span>
                              {selectedPattern === pattern.id && (
                                <span className="text-reasoning-primary flex-shrink-0">✓</span>
                              )}
                            </div>
                            <p className="text-xs text-content-muted line-clamp-2">{pattern.description}</p>
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="right"
                            sideOffset={8}
                            className={cn(
                              'z-50 max-w-xs rounded-lg px-3 py-2 text-sm',
                              'bg-surface-elevated border border-surface-muted',
                              'shadow-lg backdrop-blur-sm',
                              'opacity-0 data-[state=delayed-open]:opacity-100',
                              'transition-opacity duration-200'
                            )}
                          >
                            <div className="space-y-1">
                              <div className="font-medium text-content">{pattern.name}</div>
                              <div className="text-xs text-content-muted leading-relaxed">
                                {pattern.description}
                              </div>
                            </div>
                            <Tooltip.Arrow className="fill-surface-elevated" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      {selectedInfo && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-content mb-3">Pattern Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-content-muted mb-1">Mental Model</div>
              <div className="text-content">{selectedInfo.mentalModel}</div>
            </div>
            <div>
              <div className="text-xs text-content-muted mb-1">Best For</div>
              <div className="text-content">{selectedInfo.bestFor}</div>
            </div>
            <div>
              <div className="text-xs text-content-muted mb-1">Vibe</div>
              <div className="text-content font-medium">{selectedInfo.vibe}</div>
            </div>
            <div>
              <div className="text-xs text-content-muted mb-1">Example Prompt</div>
              <div className="p-2 rounded bg-surface-muted text-xs font-mono text-content-muted">
                {selectedInfo.examplePrompt}
              </div>
            </div>
          </div>
        </Card>
      )}
      </div>
    </Tooltip.Provider>
  );
};
