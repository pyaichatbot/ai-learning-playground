/**
 * AI Learning Playground - Reasoning Pattern Visualization
 * 
 * Visualizes different reasoning patterns (CoT, ToT, AoT, etc.)
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { ReasoningPattern, ReasoningStep, ReasoningNode } from '@/types';
import { cn } from '@/lib/utils';

interface ReasoningPatternVizProps {
  pattern: ReasoningPattern;
  steps: ReasoningStep[];
  nodes?: ReasoningNode[];
  currentStep: number;
  onStepHover?: (stepId: string | null) => void;
  selectedStepId?: string | null;
}

const PATTERN_COLORS: Record<ReasoningPattern, { primary: string; secondary: string; accent: string }> = {
  cot: { primary: 'text-cyan-400', secondary: 'bg-cyan-500/20', accent: 'border-cyan-500' },
  cod: { primary: 'text-cyan-300', secondary: 'bg-cyan-400/20', accent: 'border-cyan-400' },
  system2: { primary: 'text-cyan-200', secondary: 'bg-cyan-300/20', accent: 'border-cyan-300' },
  aot: { primary: 'text-purple-400', secondary: 'bg-purple-500/20', accent: 'border-purple-500' },
  sot: { primary: 'text-purple-300', secondary: 'bg-purple-400/20', accent: 'border-purple-400' },
  tot: { primary: 'text-emerald-400', secondary: 'bg-emerald-500/20', accent: 'border-emerald-500' },
  react: { primary: 'text-blue-400', secondary: 'bg-blue-500/20', accent: 'border-blue-500' },
  reflection: { primary: 'text-amber-400', secondary: 'bg-amber-500/20', accent: 'border-amber-500' },
  cove: { primary: 'text-orange-400', secondary: 'bg-orange-500/20', accent: 'border-orange-500' },
  got: { primary: 'text-pink-400', secondary: 'bg-pink-500/20', accent: 'border-pink-500' },
  bot: { primary: 'text-indigo-400', secondary: 'bg-indigo-500/20', accent: 'border-indigo-500' },
};

const STEP_TYPE_ICONS: Record<ReasoningStep['type'], string> = {
  thought: '💭',
  draft: '📝',
  atom: '⚛️',
  branch: '🌿',
  evaluation: '⭐',
  pruning: '✂️',
  action: '⚡',
  observation: '👁️',
  critique: '🔍',
  verification: '✓',
  correction: '✏️',
  merge: '🔀',
  retrieval: '📚',
  'final-answer': '✅',
};

export const ReasoningPatternViz: React.FC<ReasoningPatternVizProps> = ({
  pattern,
  steps,
  nodes = [],
  currentStep,
  onStepHover,
  selectedStepId,
}) => {
  const colors = PATTERN_COLORS[pattern];
  const visualizationType = getVisualizationType(pattern);

  if (visualizationType === 'linear') {
    return <LinearViz steps={steps} currentStep={currentStep} colors={colors} onStepHover={onStepHover} selectedStepId={selectedStepId} />;
  } else if (visualizationType === 'tree') {
    return <TreeViz nodes={nodes} steps={steps} currentStep={currentStep} colors={colors} onStepHover={onStepHover} selectedStepId={selectedStepId} />;
  } else if (visualizationType === 'graph') {
    return <GraphViz nodes={nodes} steps={steps} currentStep={currentStep} colors={colors} onStepHover={onStepHover} selectedStepId={selectedStepId} />;
  } else if (visualizationType === 'atoms') {
    return <AtomsViz nodes={nodes} steps={steps} currentStep={currentStep} colors={colors} onStepHover={onStepHover} selectedStepId={selectedStepId} />;
  } else {
    return <IterativeViz steps={steps} currentStep={currentStep} colors={colors} onStepHover={onStepHover} selectedStepId={selectedStepId} />;
  }
};

function getVisualizationType(pattern: ReasoningPattern): 'linear' | 'tree' | 'graph' | 'atoms' | 'iterative' {
  switch (pattern) {
    case 'cot':
    case 'cod':
    case 'system2':
    case 'sot':
      return 'linear';
    case 'tot':
      return 'tree';
    case 'got':
      return 'graph';
    case 'aot':
      return 'atoms';
    case 'react':
    case 'reflection':
    case 'cove':
    case 'bot':
      return 'iterative';
    default:
      return 'linear';
  }
}

// Linear visualization for CoT, CoD, System2, SoT
interface LinearVizProps {
  steps: ReasoningStep[];
  currentStep: number;
  colors: { primary: string; secondary: string; accent: string };
  onStepHover?: (stepId: string | null) => void;
  selectedStepId?: string | null;
}

const LinearViz: React.FC<LinearVizProps> = ({ steps, currentStep, colors, onStepHover, selectedStepId }) => {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isPast = index < currentStep;
        const isSelected = selectedStepId === step.id;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isPast || isActive ? 1 : 0.3, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => onStepHover?.(step.id)}
            onMouseLeave={() => onStepHover?.(null)}
            className={cn(
              'relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all',
              isSelected ? colors.accent : 'border-surface-muted',
              isActive && colors.secondary,
              !isActive && !isPast && 'opacity-30'
            )}
          >
            <div className={cn('text-2xl flex-shrink-0', isActive && 'animate-pulse')}>
              {STEP_TYPE_ICONS[step.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn('text-xs font-medium mb-1', colors.primary)}>
                {step.type.replace('-', ' ').toUpperCase()}
              </div>
              <div className="text-sm text-content-muted">{step.content}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={cn('absolute left-6 top-12 w-0.5 h-8', isPast ? colors.accent : 'bg-surface-muted')} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// Tree visualization for ToT
interface TreeVizProps {
  nodes?: ReasoningNode[];
  steps: ReasoningStep[];
  currentStep: number;
  colors: { primary: string; secondary: string; accent: string };
  onStepHover?: (stepId: string | null) => void;
  selectedStepId?: string | null;
}

const TreeViz: React.FC<TreeVizProps> = ({ steps, currentStep, colors, onStepHover, selectedStepId }) => {
  // Group steps by level (simplified tree structure)
  const rootSteps = steps.filter(s => s.type === 'thought' && !s.metadata?.parentId);
  const branchSteps = steps.filter(s => s.type === 'branch');
  const evalSteps = steps.filter(s => s.type === 'evaluation' || s.type === 'pruning');
  const finalSteps = steps.filter(s => s.type === 'final-answer');

  return (
    <div className="space-y-6">
      {/* Root */}
      {rootSteps.map((step) => (
        <StepNode
          key={step.id}
          step={step}
          isActive={steps.findIndex(s => s.id === step.id) === currentStep}
          isPast={steps.findIndex(s => s.id === step.id) < currentStep}
          isSelected={selectedStepId === step.id}
          colors={colors}
          onHover={onStepHover}
        />
      ))}

      {/* Branches */}
      {branchSteps.length > 0 && (
        <div className="grid grid-cols-3 gap-4 ml-8">
          {branchSteps.map((step) => {
            const stepIndex = steps.findIndex(s => s.id === step.id);
            return (
              <StepNode
                key={step.id}
                step={step}
                isActive={stepIndex === currentStep}
                isPast={stepIndex < currentStep}
                isSelected={selectedStepId === step.id}
                colors={colors}
                onHover={onStepHover}
                size="sm"
              />
            );
          })}
        </div>
      )}

      {/* Evaluation/Pruning */}
      {evalSteps.map((step) => {
        const stepIndex = steps.findIndex(s => s.id === step.id);
        return (
          <StepNode
            key={step.id}
            step={step}
            isActive={stepIndex === currentStep}
            isPast={stepIndex < currentStep}
            isSelected={selectedStepId === step.id}
            colors={colors}
            onHover={onStepHover}
          />
        );
      })}

      {/* Final Answer */}
      {finalSteps.map((step) => {
        const stepIndex = steps.findIndex(s => s.id === step.id);
        return (
          <StepNode
            key={step.id}
            step={step}
            isActive={stepIndex === currentStep}
            isPast={stepIndex < currentStep}
            isSelected={selectedStepId === step.id}
            colors={colors}
            onHover={onStepHover}
          />
        );
      })}
    </div>
  );
};

// Graph visualization for GoT
const GraphViz: React.FC<TreeVizProps> = ({ steps, currentStep, colors, onStepHover, selectedStepId }) => {
  // Similar to tree but with merge nodes
  return <TreeViz steps={steps} currentStep={currentStep} colors={colors} onStepHover={onStepHover} selectedStepId={selectedStepId} />;
};

// Atoms visualization for AoT
const AtomsViz: React.FC<TreeVizProps> = ({ steps, currentStep, colors, onStepHover, selectedStepId }) => {
  const atomSteps = steps.filter(s => s.type === 'atom');
  const otherSteps = steps.filter(s => s.type !== 'atom');

  return (
    <div className="space-y-6">
      {/* Atoms in parallel */}
      {atomSteps.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {atomSteps.map((step) => {
            const stepIndex = steps.findIndex(s => s.id === step.id);
            return (
              <StepNode
                key={step.id}
                step={step}
                isActive={stepIndex === currentStep}
                isPast={stepIndex < currentStep}
                isSelected={selectedStepId === step.id}
                colors={colors}
                onHover={onStepHover}
                size="sm"
              />
            );
          })}
        </div>
      )}

      {/* Other steps */}
      {otherSteps.map((step) => {
        const stepIndex = steps.findIndex(s => s.id === step.id);
        return (
          <StepNode
            key={step.id}
            step={step}
            isActive={stepIndex === currentStep}
            isPast={stepIndex < currentStep}
            isSelected={selectedStepId === step.id}
            colors={colors}
            onHover={onStepHover}
          />
        );
      })}
    </div>
  );
};

// Iterative visualization for ReAct, Reflection, CoVe, BoT
const IterativeViz: React.FC<LinearVizProps> = ({ steps, currentStep, colors, onStepHover, selectedStepId }) => {
  // Group steps into iterations
  const iterations: ReasoningStep[][] = [];
  let currentIteration: ReasoningStep[] = [];

  steps.forEach((step) => {
    if (step.type === 'thought' && currentIteration.length > 0) {
      iterations.push([...currentIteration]);
      currentIteration = [step];
    } else {
      currentIteration.push(step);
    }
  });
  if (currentIteration.length > 0) {
    iterations.push(currentIteration);
  }

  return (
    <div className="space-y-6">
      {iterations.map((iteration, iterIdx) => (
        <div key={iterIdx} className="space-y-3 border-l-2 border-surface-muted pl-4">
          <div className="text-xs font-medium text-content-muted">Iteration {iterIdx + 1}</div>
          {iteration.map((step) => {
            const globalIndex = steps.findIndex(s => s.id === step.id);
            const isActive = globalIndex === currentStep;
            const isPast = globalIndex < currentStep;
            const isSelected = selectedStepId === step.id;

            return (
              <StepNode
                key={step.id}
                step={step}
                isActive={isActive}
                isPast={isPast}
                isSelected={isSelected}
                colors={colors}
                onHover={onStepHover}
                size="sm"
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Reusable step node component
interface StepNodeProps {
  step: ReasoningStep;
  isActive: boolean;
  isPast: boolean;
  isSelected: boolean;
  colors: { primary: string; secondary: string; accent: string };
  onHover?: (stepId: string | null) => void;
  size?: 'sm' | 'md';
}

const StepNode: React.FC<StepNodeProps> = ({ step, isActive, isPast, isSelected, colors, onHover, size = 'md' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isPast || isActive ? 1 : 0.3, scale: 1 }}
      onMouseEnter={() => onHover?.(step.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'p-3 rounded-lg border-2 transition-all cursor-pointer',
        size === 'sm' ? 'text-xs' : 'text-sm',
        isSelected ? colors.accent : 'border-surface-muted',
        isActive && colors.secondary,
        !isActive && !isPast && 'opacity-30'
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn('text-lg flex-shrink-0', isActive && 'animate-pulse')}>
          {STEP_TYPE_ICONS[step.type]}
        </span>
        <div className="flex-1 min-w-0">
          <div className={cn('font-medium mb-1', colors.primary)}>
            {step.type.replace('-', ' ').toUpperCase()}
          </div>
          <div className="text-content-muted line-clamp-2">{step.content}</div>
        </div>
      </div>
    </motion.div>
  );
};
