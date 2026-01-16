/**
 * Prompt Reality Cockpit - Conflict Simulator
 *
 * Implements Story 6.7: Before/After simulator
 * Shows hypothetical AI responses with and without conflicts to demonstrate impact.
 */

import React, { useState } from 'react';
import { Card } from '@/components/shared';
import { cn } from '@/lib/utils';
import { type Conflict } from '@/lib/conflictDetector';
import { AlertTriangle, ArrowRight, Info } from 'lucide-react';

export interface ConflictSimulatorProps {
  conflicts: Conflict[];
  prompt: string;
  className?: string;
}

/**
 * Generate hypothetical response with conflicts
 */
function generateResponseWithConflicts(
  _prompt: string,
  conflict: Conflict
): string {
  const category = conflict.category;
  
  switch (category) {
    case 'tone':
      return `[With conflicting tone instructions]\n\nThe response may alternate between formal and casual language, creating an inconsistent tone. The AI struggles to determine which style to use, resulting in mixed formality levels throughout the output.`;
    
    case 'length':
      return `[With conflicting length instructions]\n\nThe response may be brief in some sections and overly detailed in others, as the AI tries to balance being concise while also being comprehensive. This creates an uneven output that doesn't fully satisfy either requirement.`;
    
    case 'role':
      return `[With conflicting role definitions]\n\nThe AI may switch between different personas or roles throughout the response, creating confusion about its identity. The output may mix perspectives, expertise levels, or communication styles from different roles.`;
    
    case 'task':
      return `[With conflicting task instructions]\n\nThe response may attempt to both summarize and expand simultaneously, leading to a disjointed output. Some parts may be too brief while others are overly detailed, failing to achieve either goal effectively.`;
    
    default:
      return `[With conflicting instructions]\n\nThe AI receives contradictory guidance, leading to inconsistent output that tries to satisfy both conflicting requirements but succeeds at neither.`;
  }
}

/**
 * Generate hypothetical response without conflicts
 */
function generateResponseWithoutConflicts(
  _prompt: string,
  conflict: Conflict
): string {
  const category = conflict.category;
  
  switch (category) {
    case 'tone':
      return `[With consistent tone instructions]\n\nThe response maintains a consistent tone throughout, allowing the AI to focus on content quality rather than style confusion. The output is coherent and professional.`;
    
    case 'length':
      return `[With consistent length instructions]\n\nThe response follows a clear length guideline, allowing the AI to structure the content appropriately. The output is well-balanced and meets the specified length requirement.`;
    
    case 'role':
      return `[With single, clear role definition]\n\nThe AI maintains a consistent persona throughout the response, providing coherent and focused output. The role is clear, allowing for appropriate expertise and communication style.`;
    
    case 'task':
      return `[With consistent task instructions]\n\nThe response follows a single, clear task directive, allowing the AI to focus on execution. The output is well-structured and achieves the intended goal effectively.`;
    
    default:
      return `[With consistent instructions]\n\nThe AI receives clear, non-contradictory guidance, allowing it to produce focused and coherent output that meets the intended requirements.`;
  }
}

export const ConflictSimulator: React.FC<ConflictSimulatorProps> = ({
  conflicts,
  prompt,
  className,
}) => {
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(
    conflicts.length > 0 ? conflicts[0] : null
  );

  if (conflicts.length === 0) {
    return null;
  }

  const currentConflict = selectedConflict || conflicts[0];
  const responseWith = generateResponseWithConflicts(prompt, currentConflict);
  const responseWithout = generateResponseWithoutConflicts(prompt, currentConflict);

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-content">Before/After Simulator</h4>
          <Info className="w-4 h-4 text-content-muted" />
        </div>
        {conflicts.length > 1 && (
          <select
            value={currentConflict.id}
            onChange={(e) => {
              const conflict = conflicts.find((c) => c.id === e.target.value);
              if (conflict) setSelectedConflict(conflict);
            }}
            className="text-xs px-2 py-1 rounded border border-content-subtle/20 bg-surface-muted text-content"
          >
            {conflicts.map((conflict) => (
              <option key={conflict.id} value={conflict.id}>
                {conflict.category} conflict ({conflict.severity})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="text-xs text-content-muted mb-4">
        <div className="mb-2">
          <strong className="text-content">Educational Demonstration:</strong> This shows hypothetical AI responses
          to illustrate how conflicting instructions affect output quality. These are simulated examples, not actual
          LLM responses, designed to help you understand the impact of instruction conflicts.
        </div>
        {currentConflict.example && (
          <div className="mt-2 italic text-content-subtle border-l-2 border-content-subtle/30 pl-3">
            💡 {currentConflict.example}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* With Conflicts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h5 className="text-xs font-semibold text-content">With Conflicts</h5>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-sm text-content whitespace-pre-wrap leading-relaxed">
              {responseWith}
            </div>
          </div>
          <div className="text-xs text-content-muted">
            <div className="font-medium mb-1">Conflicting Instructions:</div>
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>{currentConflict.instruction1.text}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>{currentConflict.instruction2.text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Without Conflicts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-emerald-500" />
            <h5 className="text-xs font-semibold text-content">Without Conflicts</h5>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="text-sm text-content whitespace-pre-wrap leading-relaxed">
              {responseWithout}
            </div>
          </div>
          <div className="text-xs text-content-muted">
            <div className="font-medium mb-1">Impact:</div>
            <div className="text-content-subtle">
              {currentConflict.explanation}
            </div>
          </div>
        </div>
      </div>

      {/* Educational Note */}
      <div className="pt-4 border-t border-content-subtle/20">
        <div className="text-xs text-content-muted leading-relaxed">
          <strong>About This Simulator:</strong> This is an <strong>educational demonstration</strong> showing
          hypothetical AI responses, not actual production LLM outputs. The purpose is to help you understand how
          conflicting instructions create ambiguity for AI models. In production, conflicting instructions typically
          lead to inconsistent outputs as the model tries to satisfy contradictory requirements.
        </div>
      </div>
    </Card>
  );
};
