import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  ArrowRight,
  Brain,
  MessageSquare,
  Target,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { Card, Button } from '@/components/shared';
import { cn } from '@/lib/utils';

interface FlowNode {
  id: string;
  stage: number;
  type: 'input' | 'process' | 'output';
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const flowNodes: FlowNode[] = [
  // Stage 0
  {
    id: 'random-init',
    stage: 0,
    type: 'process',
    label: 'Random Initialization',
    icon: <Brain className="w-5 h-5" />,
    color: 'from-gray-400 to-gray-600',
    description: 'Initialize weights randomly'
  },
  // Stage 1
  {
    id: 'text-corpus',
    stage: 1,
    type: 'input',
    label: 'Huge Text Corpus',
    icon: <Database className="w-5 h-5" />,
    color: 'from-green-400 to-green-600',
    description: '500B-15T tokens'
  },
  {
    id: 'pretrain',
    stage: 1,
    type: 'process',
    label: 'Pre-training',
    icon: <Brain className="w-5 h-5" />,
    color: 'from-green-400 to-green-600',
    description: 'Next token prediction'
  },
  // Stage 2
  {
    id: 'instruction-data',
    stage: 2,
    type: 'input',
    label: 'Instruction-Response Pairs',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'from-blue-400 to-blue-600',
    description: '10K-100K examples'
  },
  {
    id: 'sft',
    stage: 2,
    type: 'process',
    label: 'Supervised Fine-Tuning',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'from-blue-400 to-blue-600',
    description: 'Learn to follow instructions'
  },
  // Stage 3
  {
    id: 'preference-data',
    stage: 3,
    type: 'input',
    label: 'Human Preferences',
    icon: <Target className="w-5 h-5" />,
    color: 'from-purple-400 to-purple-600',
    description: 'Response rankings'
  },
  {
    id: 'reward-model',
    stage: 3,
    type: 'process',
    label: 'Train Reward Model',
    icon: <Target className="w-5 h-5" />,
    color: 'from-purple-400 to-purple-600',
    description: 'Learn preferences'
  },
  {
    id: 'rlhf',
    stage: 3,
    type: 'process',
    label: 'RLHF Optimization',
    icon: <Target className="w-5 h-5" />,
    color: 'from-purple-400 to-purple-600',
    description: 'Maximize reward'
  },
  // Stage 4
  {
    id: 'reasoning-tasks',
    stage: 4,
    type: 'input',
    label: 'Reasoning Tasks',
    icon: <Trophy className="w-5 h-5" />,
    color: 'from-amber-400 to-orange-600',
    description: 'Math, code, logic'
  },
  {
    id: 'reasoning-rl',
    stage: 4,
    type: 'process',
    label: 'Reasoning Fine-tuning',
    icon: <Trophy className="w-5 h-5" />,
    color: 'from-amber-400 to-orange-600',
    description: 'Chain-of-thought'
  },
  {
    id: 'final-model',
    stage: 4,
    type: 'output',
    label: 'Production Model',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'from-green-400 to-green-600',
    description: 'Ready for deployment'
  }
];

export const TrainingPipelineFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const maxSteps = flowNodes.length;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < maxSteps - 1) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps - 1) {
            setIsPlaying(false);
            setCompletedSteps((completed) => new Set([...completed, prev]));
            return prev;
          }
          const next = prev + 1;
          setCompletedSteps((completed) => new Set([...completed, prev]));
          if (next >= maxSteps - 1) {
            setIsPlaying(false);
          }
          return next;
        });
      }, 1500);
    } else if (isPlaying && currentStep === maxSteps - 1) {
      // Mark the last step as completed and stop
      setCompletedSteps((completed) => new Set([...completed, currentStep]));
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, maxSteps]);

  const handlePlayPause = () => {
    if (currentStep >= maxSteps) {
      handleReset();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsPlaying(false);
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setIsPlaying(false);
    const newCompleted = new Set<number>();
    for (let i = 0; i < index; i++) {
      newCompleted.add(i);
    }
    setCompletedSteps(newCompleted);
  };

  const currentNode = flowNodes[currentStep] || flowNodes[maxSteps - 1];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold text-content mb-2">
            Training Pipeline Animation
          </h2>
          <p className="text-content-muted">
            Watch how raw data transforms into an intelligent model
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={handlePlayPause}
            variant="primary"
            className="flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : currentStep >= maxSteps ? (
              <>
                <RotateCcw className="w-5 h-5" />
                Restart
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Play Animation
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </Button>
          <div className="ml-auto text-sm text-content-muted font-semibold">
            Step {Math.min(currentStep + 1, maxSteps)} / {maxSteps}
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="relative mb-8">
          <div className="flex flex-wrap items-center gap-6 justify-center">
            {flowNodes.map((node, index) => (
              <React.Fragment key={node.id}>
                {/* Node */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: index <= currentStep ? 1 : 0.8,
                    opacity: index <= currentStep ? 1 : 0.3
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleStepClick(index)}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      'relative w-32 h-32 rounded-xl flex flex-col items-center justify-center p-4 transition-all',
                      index <= currentStep
                        ? `bg-gradient-to-br ${node.color}`
                        : 'bg-surface-muted',
                      completedSteps.has(index)
                        ? 'shadow-lg'
                        : index === currentStep
                        ? 'shadow-2xl ring-4 ring-brand-400'
                        : 'shadow-md'
                    )}
                  >
                    {/* Icon */}
                    <div className={cn('mb-2', index <= currentStep ? 'text-white' : 'text-content-subtle')}>
                      {node.icon}
                    </div>
                    
                    {/* Label */}
                    <div className={cn(
                      'text-xs font-bold text-center leading-tight',
                      index <= currentStep ? 'text-white' : 'text-content-subtle'
                    )}>
                      {node.label}
                    </div>

                    {/* Stage Badge */}
                    <div className={cn(
                      'absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index <= currentStep
                        ? 'bg-accent-emerald text-white'
                        : 'bg-surface-muted text-content-subtle'
                    )}>
                      {node.stage}
                    </div>

                    {/* Completion Check */}
                    {completedSteps.has(index) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                      >
                        <CheckCircle2 className="w-6 h-6 text-accent-emerald bg-surface rounded-full" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Arrow */}
                {index < flowNodes.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: index < currentStep ? 1 : 0.3,
                      x: 0
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowRight
                      className={cn(
                        'w-8 h-8',
                        index < currentStep ? 'text-brand-400' : 'text-content-subtle'
                      )}
                    />
                  </motion.div>
                )}

                {/* Line break for better layout */}
                {(index === 2 || index === 4 || index === 7) && (
                  <div className="w-full" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Current Step Details */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 bg-surface-elevated border-surface-bright">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br text-white flex-shrink-0',
                    currentNode.color
                  )}
                >
                  {currentNode.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-display text-xl font-bold text-content">
                      {currentNode.label}
                    </h3>
                    <span className="px-3 py-1 bg-brand-400 text-white text-xs font-bold rounded-full">
                      Stage {currentNode.stage}
                    </span>
                  </div>
                  <p className="text-content-muted mb-4">
                    {currentNode.description}
                  </p>
                  
                  {/* Stage-specific details */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {currentNode.stage === 1 && (
                      <>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Data</div>
                          <div className="font-bold text-content">15T tokens</div>
                        </Card>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Time</div>
                          <div className="font-bold text-content">2-6 months</div>
                        </Card>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Cost</div>
                          <div className="font-bold text-content">$2-10M</div>
                        </Card>
                      </>
                    )}
                    {currentNode.stage === 2 && (
                      <>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Examples</div>
                          <div className="font-bold text-content">10K-100K</div>
                        </Card>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Time</div>
                          <div className="font-bold text-content">1-7 days</div>
                        </Card>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Quality</div>
                          <div className="font-bold text-content">+30%</div>
                        </Card>
                      </>
                    )}
                    {currentNode.stage === 3 && (
                      <>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Feedback</div>
                          <div className="font-bold text-content">10K+ pairs</div>
                        </Card>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Iterations</div>
                          <div className="font-bold text-content">5-20</div>
                        </Card>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Alignment</div>
                          <div className="font-bold text-content">+10%</div>
                        </Card>
                      </>
                    )}
                    {currentNode.stage === 4 && (
                      <>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Tasks</div>
                          <div className="font-bold text-content">Math/Code</div>
                        </Card>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Reasoning</div>
                          <div className="font-bold text-content">CoT</div>
                        </Card>
                        <Card className="p-3 bg-surface">
                          <div className="text-xs text-content-subtle mb-1">Boost</div>
                          <div className="font-bold text-content">+20-40%</div>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-content-subtle mb-2">
            <span>Start</span>
            <span>Production Ready</span>
          </div>
          <div className="h-3 bg-surface-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-400 to-brand-600"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / maxSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
