/**
 * Prompt Reality Cockpit - Instruction Conflict Detector
 *
 * Implements Story 6.7: Instruction Conflict Detector
 * Main component that orchestrates all conflict detection sub-components.
 */

import React, { useMemo, useState, useRef } from 'react';
import { Card } from '@/components/shared';
import { cn } from '@/lib/utils';
import { detectConflicts, getConflictSummary, type Conflict } from '@/lib/conflictDetector';
import { InstructionConflictMap } from './InstructionConflictMap';
import { ConflictHighlighter } from './ConflictHighlighter';
import { ConflictSimulator } from './ConflictSimulator';
import { ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react';

export interface InstructionConflictDetectorProps {
  prompt: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  className?: string;
}

export const InstructionConflictDetector: React.FC<InstructionConflictDetectorProps> = ({
  prompt,
  textareaRef,
  className,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['map', 'simulator']));
  const [, setSelectedConflict] = useState<Conflict | null>(null);
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const effectiveTextareaRef = textareaRef || internalTextareaRef;

  // Detect conflicts
  const conflicts = useMemo(() => {
    if (!prompt || prompt.trim().length === 0) {
      return [];
    }
    return detectConflicts(prompt);
  }, [prompt]);

  // Get conflict summary
  const summary = useMemo(() => getConflictSummary(conflicts), [conflicts]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Handle conflict click from map
  const handleConflictClick = (conflict: Conflict) => {
    setSelectedConflict(conflict);
    
    // Scroll to conflict in textarea if available
    if (effectiveTextareaRef.current) {
      const textarea = effectiveTextareaRef.current;
      const conflictStart = Math.min(conflict.instruction1.start, conflict.instruction2.start);
      const textBefore = prompt.slice(0, conflictStart);
      const lines = textBefore.split('\n');
      const lineHeight = 20; // Approximate line height
      const scrollTop = (lines.length - 1) * lineHeight;
      
      textarea.scrollTo({
        top: Math.max(0, scrollTop - textarea.clientHeight / 2),
        behavior: 'smooth',
      });
    }
  };

  // Don't render if no conflicts
  if (conflicts.length === 0) {
    return null;
  }

  return (
    <Card className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-content">Instruction Conflicts Detected</h3>
          </div>
          <p className="text-sm text-content-muted leading-relaxed">
            Your prompt contains conflicting instructions that may cause inconsistent AI outputs.
            {summary.critical > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                {summary.critical} critical conflict{summary.critical !== 1 ? 's' : ''} found.
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2 py-1 bg-amber-500/10 text-amber-600 rounded border border-amber-500/20">
            {summary.total} conflict{summary.total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-surface-muted/50 rounded-lg border border-content-subtle/20">
          <div className="text-xs text-content-muted mb-1">Total</div>
          <div className="text-lg font-bold text-content">{summary.total}</div>
        </div>
        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="text-xs text-content-muted mb-1">Critical</div>
          <div className="text-lg font-bold text-red-600">{summary.critical}</div>
        </div>
        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <div className="text-xs text-content-muted mb-1">Warnings</div>
          <div className="text-lg font-bold text-amber-600">{summary.warning}</div>
        </div>
        <div className="p-3 bg-surface-muted/50 rounded-lg border border-content-subtle/20">
          <div className="text-xs text-content-muted mb-1">Categories</div>
          <div className="text-lg font-bold text-content">
            {Object.values(summary.byCategory).filter((count) => count > 0).length}
          </div>
        </div>
      </div>

      {/* Conflict Categories Breakdown */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-content-muted uppercase tracking-wide">By Category</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(summary.byCategory).map(([category, count]) => {
            if (count === 0) return null;
            
            const colors = {
              tone: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
              length: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
              role: 'bg-red-500/10 text-red-600 border-red-500/20',
              task: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
            };
            
            return (
              <div
                key={category}
                className={cn(
                  'px-3 py-2 rounded-lg border text-xs font-medium',
                  colors[category as keyof typeof colors]
                )}
              >
                <div className="capitalize">{category}</div>
                <div className="text-lg font-bold">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflict Highlighter (if textarea ref provided) */}
      {effectiveTextareaRef.current && (
        <ConflictHighlighter
          prompt={prompt}
          conflicts={conflicts}
          textareaRef={effectiveTextareaRef}
          onConflictClick={handleConflictClick}
        />
      )}

      {/* Conflict Map Section */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('map')}
          className="flex items-center justify-between w-full text-left"
          aria-expanded={expandedSections.has('map')}
        >
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-content">Conflict Map</h4>
            <Info className="w-4 h-4 text-content-muted" />
          </div>
          {expandedSections.has('map') ? (
            <ChevronUp className="w-4 h-4 text-content-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-content-muted" />
          )}
        </button>
        
        {expandedSections.has('map') && (
          <InstructionConflictMap
            conflicts={conflicts}
            onConflictClick={handleConflictClick}
          />
        )}
      </div>

      {/* Before/After Simulator Section */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('simulator')}
          className="flex items-center justify-between w-full text-left"
          aria-expanded={expandedSections.has('simulator')}
        >
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-content">Before/After Simulator</h4>
            <Info className="w-4 h-4 text-content-muted" />
          </div>
          {expandedSections.has('simulator') ? (
            <ChevronUp className="w-4 h-4 text-content-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-content-muted" />
          )}
        </button>
        
        {expandedSections.has('simulator') && (
          <ConflictSimulator conflicts={conflicts} prompt={prompt} />
        )}
      </div>

      {/* Educational Note */}
      <div className="pt-4 border-t border-content-subtle/20">
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-content-muted leading-relaxed">
            <strong className="text-content">Understanding Conflicts:</strong> Conflicting instructions create
            ambiguity for AI models. When you ask for both "concise" and "detailed" responses, or define multiple
            roles, the AI must choose which instruction to prioritize, often leading to inconsistent outputs.
            This detector helps you identify these conflicts so you can make your instructions clearer.
          </div>
        </div>
      </div>

      {/* Integration with Heuristics */}
      <div className="pt-2 border-t border-content-subtle/20">
        <div className="text-xs text-content-muted">
          <strong>Related Heuristics:</strong> This conflicts with{' '}
          <span className="font-mono text-content">ID-1</span> (Multiple Role Definitions) and{' '}
          <span className="font-mono text-content">ID-2</span> (Excessive Instruction Density) rules from the
          heuristics engine.
        </div>
      </div>
    </Card>
  );
};
