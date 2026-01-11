/**
 * AI Learning Playground - Agent Step Visualization
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  Eye,
  RefreshCw,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentStep, StepType } from '@/types';

const stepConfig: Record<StepType, { icon: React.ElementType; color: string; label: string }> = {
  thought: { icon: Brain, color: 'text-agent-primary', label: 'Thinking' },
  action: { icon: Zap, color: 'text-accent-amber', label: 'Action' },
  observation: { icon: Eye, color: 'text-accent-cyan', label: 'Observation' },
  reflection: { icon: RefreshCw, color: 'text-accent-violet', label: 'Reflection' },
  plan: { icon: MessageCircle, color: 'text-content-muted', label: 'Plan' },
  critique: { icon: AlertCircle, color: 'text-accent-rose', label: 'Critique' },
  revision: { icon: RefreshCw, color: 'text-accent-emerald', label: 'Revision' },
  'final-answer': { icon: CheckCircle2, color: 'text-accent-emerald', label: 'Final Answer' },
};

interface AgentStepVizProps {
  steps: AgentStep[];
  currentStepIndex?: number;
  className?: string;
}

export const AgentStepViz: React.FC<AgentStepVizProps> = ({
  steps,
  currentStepIndex = -1,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      <AnimatePresence mode="popLayout">
        {steps.map((step, index) => {
          const config = stepConfig[step.type];
          const Icon = config.icon;
          const isCurrent = index === currentStepIndex;
          const isPast = index < currentStepIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'flex gap-3 p-4 rounded-lg border transition-all duration-300',
                isCurrent && 'bg-agent-primary/10 border-agent-primary shadow-glow-violet',
                isPast && 'bg-surface-elevated/30 border-surface-muted',
                !isCurrent && !isPast && 'bg-surface-elevated/50 border-surface-muted'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  isCurrent ? 'bg-agent-primary/20' : 'bg-surface-muted/50'
                )}
              >
                <Icon size={20} className={cn(config.color, isCurrent && 'animate-pulse')} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-xs font-medium', config.color)}>
                    {config.label}
                  </span>
                  <span className="text-2xs text-content-subtle">
                    Step {index + 1}
                  </span>
                  {step.duration && (
                    <span className="text-2xs text-content-subtle ml-auto">
                      {step.duration}ms
                    </span>
                  )}
                </div>

                <p className="text-sm text-content-muted leading-relaxed">
                  {step.content}
                </p>

                {step.metadata?.toolUsed && (
                  <div className="mt-2 p-2 rounded bg-surface/50 border border-surface-muted">
                    <p className="text-2xs text-content-subtle mb-1">Tool: {step.metadata.toolUsed}</p>
                    {step.metadata.toolInput && (
                      <pre className="text-2xs text-content-muted font-mono overflow-x-auto">
                        {JSON.stringify(step.metadata.toolInput, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {steps.length === 0 && (
        <div className="text-center py-8 text-content-subtle">
          <Brain size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No steps yet. Start a task to see agent reasoning.</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Agent Pattern Selector
// ============================================

import type { AgentPattern } from '@/types';

interface PatternOption {
  id: AgentPattern;
  name: string;
  description: string;
  steps: string[];
}

const patterns: PatternOption[] = [
  {
    id: 'react',
    name: 'ReAct',
    description: 'Reasoning + Acting in an interleaved manner',
    steps: ['Thought', 'Action', 'Observation', 'Repeat'],
  },
  {
    id: 'reflection',
    name: 'Reflection',
    description: 'Self-critique and improvement loop',
    steps: ['Generate', 'Reflect', 'Critique', 'Revise'],
  },
  {
    id: 'tool-use',
    name: 'Tool Use',
    description: 'Direct tool invocation based on need',
    steps: ['Analyze', 'Select Tool', 'Execute', 'Synthesize'],
  },
  {
    id: 'planning',
    name: 'Planning',
    description: 'Plan-then-execute approach',
    steps: ['Decompose', 'Plan', 'Execute Steps', 'Verify'],
  },
];

interface AgentPatternSelectorProps {
  selectedPattern: AgentPattern;
  onSelect: (pattern: AgentPattern) => void;
}

export const AgentPatternSelector: React.FC<AgentPatternSelectorProps> = ({
  selectedPattern,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {patterns.map((pattern) => {
        const isSelected = pattern.id === selectedPattern;

        return (
          <button
            key={pattern.id}
            onClick={() => onSelect(pattern.id)}
            className={cn(
              'p-4 rounded-lg border text-left transition-all duration-200',
              isSelected
                ? 'bg-agent-primary/10 border-agent-primary shadow-glow-violet'
                : 'bg-surface-elevated/50 border-surface-muted hover:border-surface-bright'
            )}
          >
            <h4 className={cn('font-medium text-sm mb-1', isSelected ? 'text-agent-primary' : 'text-content')}>
              {pattern.name}
            </h4>
            <p className="text-2xs text-content-muted mb-2">{pattern.description}</p>
            <div className="flex flex-wrap gap-1">
              {pattern.steps.map((step, i) => (
                <span
                  key={i}
                  className="text-2xs px-1.5 py-0.5 rounded bg-surface-muted/50 text-content-subtle"
                >
                  {step}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};
