/**
 * Prompt Reality Cockpit - Conflict Highlighter
 *
 * Implements Story 6.7: Visual highlighting of conflicting instructions
 * Overlays highlights on the prompt textarea to show conflicting instruction ranges.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { type Conflict } from '@/lib/conflictDetector';

export interface ConflictHighlighterProps {
  prompt: string;
  conflicts: Conflict[];
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onConflictClick?: (conflict: Conflict) => void;
  className?: string;
}

/**
 * Get color for conflict category
 */
function getCategoryColor(category: Conflict['category']): string {
  const colors = {
    tone: 'bg-purple-500/30 border-purple-500/50',
    length: 'bg-amber-500/30 border-amber-500/50',
    role: 'bg-red-500/30 border-red-500/50',
    task: 'bg-cyan-500/30 border-cyan-500/50',
  };
  return colors[category];
}

/**
 * Get severity border style
 */
function getSeverityBorder(severity: Conflict['severity']): string {
  return severity === 'critical' ? 'border-2' : 'border';
}


export const ConflictHighlighter: React.FC<ConflictHighlighterProps> = ({
  prompt,
  conflicts,
  textareaRef,
  onConflictClick,
  className,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [highlightedConflict, setHighlightedConflict] = useState<Conflict | null>(null);
  const [positions, setPositions] = useState<Map<string, DOMRect>>(new Map());

  // Sync scroll between textarea and overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [textareaRef]);

  // Update highlight positions when prompt or conflicts change
  useEffect(() => {
    if (!textareaRef.current || !overlayRef.current || conflicts.length === 0) {
      setPositions(new Map());
      return;
    }

    const textarea = textareaRef.current;
    const newPositions = new Map<string, DOMRect>();

    // Create temporary spans to measure text positions
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.whiteSpace = 'pre-wrap';
    tempContainer.style.font = window.getComputedStyle(textarea).font;
    tempContainer.style.width = `${textarea.offsetWidth}px`;
    tempContainer.style.padding = window.getComputedStyle(textarea).padding;
    tempContainer.style.border = window.getComputedStyle(textarea).border;
    tempContainer.style.boxSizing = window.getComputedStyle(textarea).boxSizing;
    tempContainer.textContent = prompt;
    document.body.appendChild(tempContainer);

    // Create range elements for each conflict
    for (const conflict of conflicts) {
      const range1 = document.createRange();
      const range2 = document.createRange();

      try {
        // Set ranges for instruction1 and instruction2
        const textNode = tempContainer.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          range1.setStart(textNode, conflict.instruction1.start);
          range1.setEnd(textNode, conflict.instruction1.end);
          range2.setStart(textNode, conflict.instruction2.start);
          range2.setEnd(textNode, conflict.instruction2.end);

          const rect1 = range1.getBoundingClientRect();
          const rect2 = range2.getBoundingClientRect();
          const containerRect = tempContainer.getBoundingClientRect();

          // Store relative positions
          newPositions.set(`${conflict.id}-1`, {
            ...rect1,
            top: rect1.top - containerRect.top,
            left: rect1.left - containerRect.left,
          } as DOMRect);
          newPositions.set(`${conflict.id}-2`, {
            ...rect2,
            top: rect2.top - containerRect.top,
            left: rect2.left - containerRect.left,
          } as DOMRect);
        }
      } catch (error) {
        // Fallback: use approximate positions
        console.warn('Failed to calculate exact positions for conflict', conflict.id, error);
      }
    }

    document.body.removeChild(tempContainer);
    setPositions(newPositions);
  }, [prompt, conflicts, textareaRef]);

  // Attach scroll listener
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.addEventListener('scroll', handleScroll);
    return () => {
      textarea.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, textareaRef]);

  if (conflicts.length === 0 || !textareaRef.current) {
    return null;
  }

  const textarea = textareaRef.current;

  return (
    <div
      ref={overlayRef}
      className={cn(
        'absolute inset-0 pointer-events-none overflow-auto',
        'font-mono text-sm leading-relaxed whitespace-pre-wrap break-words',
        className
      )}
      style={{
        padding: window.getComputedStyle(textarea).padding,
        color: 'transparent',
        zIndex: 10,
      }}
    >
      {conflicts.map((conflict) => {
        const pos1 = positions.get(`${conflict.id}-1`);
        const pos2 = positions.get(`${conflict.id}-2`);

        if (!pos1 || !pos2) return null;

        return (
          <React.Fragment key={conflict.id}>
            {/* Instruction 1 highlight */}
            <div
              className={cn(
                'absolute border rounded-sm cursor-pointer transition-all',
                getCategoryColor(conflict.category),
                getSeverityBorder(conflict.severity),
                highlightedConflict?.id === conflict.id && 'ring-2 ring-offset-1 ring-current opacity-100',
                'hover:opacity-100'
              )}
              style={{
                top: `${pos1.top}px`,
                left: `${pos1.left}px`,
                width: `${pos1.width}px`,
                height: `${pos1.height}px`,
                pointerEvents: 'auto',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setHighlightedConflict(conflict);
                onConflictClick?.(conflict);
                
                // Scroll textarea to show the conflict
                const textarea = textareaRef.current;
                if (textarea) {
                  const scrollTop = pos1.top - textarea.clientHeight / 2;
                  textarea.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
                }
              }}
              onMouseEnter={() => setHighlightedConflict(conflict)}
              onMouseLeave={() => setHighlightedConflict(null)}
              title={`${conflict.category} conflict: ${conflict.explanation}`}
              aria-label={`Conflict: ${conflict.explanation}`}
            />

            {/* Instruction 2 highlight */}
            <div
              className={cn(
                'absolute border rounded-sm cursor-pointer transition-all',
                getCategoryColor(conflict.category),
                getSeverityBorder(conflict.severity),
                highlightedConflict?.id === conflict.id && 'ring-2 ring-offset-1 ring-current opacity-100',
                'hover:opacity-100'
              )}
              style={{
                top: `${pos2.top}px`,
                left: `${pos2.left}px`,
                width: `${pos2.width}px`,
                height: `${pos2.height}px`,
                pointerEvents: 'auto',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setHighlightedConflict(conflict);
                onConflictClick?.(conflict);
                
                // Scroll textarea to show the conflict
                const textarea = textareaRef.current;
                if (textarea) {
                  const scrollTop = pos2.top - textarea.clientHeight / 2;
                  textarea.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
                }
              }}
              onMouseEnter={() => setHighlightedConflict(conflict)}
              onMouseLeave={() => setHighlightedConflict(null)}
              title={`${conflict.category} conflict: ${conflict.explanation}`}
              aria-label={`Conflict: ${conflict.explanation}`}
            />

            {/* Connection line (simplified - shows visual connection) */}
            {highlightedConflict?.id === conflict.id && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
              >
                <line
                  x1={pos1.left + pos1.width / 2}
                  y1={pos1.top + pos1.height / 2}
                  x2={pos2.left + pos2.width / 2}
                  y2={pos2.top + pos2.height / 2}
                  stroke={conflict.severity === 'critical' ? '#ef4444' : '#f59e0b'}
                  strokeWidth={conflict.severity === 'critical' ? 2 : 1}
                  strokeDasharray={conflict.severity === 'critical' ? '0' : '5,5'}
                  opacity={0.5}
                />
              </svg>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
