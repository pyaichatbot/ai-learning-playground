/**
 * Prompt Reality Cockpit - Heuristics Insights Component
 *
 * Implements story 6.6: Smart Heuristics Insight Engine
 * Displays up to 3 prioritized insights about prompt structure and constraints.
 */

import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Card } from '@/components/shared';
import { cn } from '@/lib/utils';
import { heuristicsEngine, type HeuristicInsight } from '@/lib/heuristics';
import type { TokenizerModel } from '@/types';

export interface HeuristicsInsightsProps {
  prompt: string;
  model: TokenizerModel;
  className?: string;
}

/**
 * Get icon for severity level
 */
function getSeverityIcon(severity: HeuristicInsight['severity']) {
  switch (severity) {
    case 'high':
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case 'medium':
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    case 'low':
      return <Info className="w-5 h-5 text-blue-500" />;
  }
}

/**
 * Get severity badge styling
 */
function getSeverityBadgeClass(severity: HeuristicInsight['severity']): string {
  switch (severity) {
    case 'high':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'medium':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'low':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  }
}

/**
 * Get category label
 */
function getCategoryLabel(category: HeuristicInsight['category']): string {
  const labels: Record<HeuristicInsight['category'], string> = {
    'context-capacity': 'Context Capacity',
    'truncation-risk': 'Truncation Risk',
    'instruction-dilution': 'Instruction Dilution',
    'structural-ambiguity': 'Structural Ambiguity',
    'cost-pressure': 'Cost Pressure',
  };
  return labels[category];
}

export const HeuristicsInsights: React.FC<HeuristicsInsightsProps> = ({
  prompt,
  model,
  className,
}) => {
  const insights = React.useMemo(() => {
    if (!prompt || prompt.trim().length === 0) {
      return [];
    }
    return heuristicsEngine.analyze(prompt, model);
  }, [prompt, model]);

  const visibleInsights = insights.filter(i => i.visible);

  if (visibleInsights.length === 0) {
    return null;
  }

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-content">Insights</h3>
        <span className="text-xs text-content-muted">
          ({visibleInsights.length} of {insights.length} shown)
        </span>
      </div>

      <div className="space-y-3">
        {visibleInsights.map((insight) => (
          <div
            key={insight.rule}
            className={cn(
              'p-4 rounded-lg border',
              'bg-surface-muted/50',
              'border-content-subtle/20',
              'transition-colors hover:border-content-subtle/40'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(insight.severity)}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded border',
                      getSeverityBadgeClass(insight.severity)
                    )}
                  >
                    {insight.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-content-muted font-mono">
                    {insight.rule}
                  </span>
                  <span className="text-xs text-content-subtle">
                    {getCategoryLabel(insight.category)}
                  </span>
                </div>
                <p className="text-sm text-content leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length > visibleInsights.length && (
        <div className="pt-2 border-t border-content-subtle/20">
          <p className="text-xs text-content-muted">
            {insights.length - visibleInsights.length} additional insight
            {insights.length - visibleInsights.length !== 1 ? 's' : ''} available
            (lower priority)
          </p>
        </div>
      )}
    </Card>
  );
};
