import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  BookOpen, 
  Target, 
  Trophy, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Database,
  Zap,
  BarChart3
} from 'lucide-react';
import { Card, Button } from '@/components/shared';
import { cn } from '@/lib/utils';

// Types
interface Stage {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  keyPoints: string[];
  example: {
    input: string;
    output: string;
    explanation: string;
  };
  metrics?: {
    label: string;
    value: string;
  }[];
}

// Training Stages Data
const trainingStages: Stage[] = [
  {
    id: 0,
    title: 'Stage 0: Randomly Initialized Model',
    subtitle: 'The Beginning - Pure Randomness',
    icon: <Brain className="w-8 h-8" />,
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-surface-muted',
    description: 'At Stage 0, the model has random weights and no knowledge. It produces meaningless, random outputs for any query.',
    keyPoints: [
      'Random weight initialization',
      'No understanding of language patterns',
      'Outputs are completely random and nonsensical',
      'This is the "blank slate" before training'
    ],
    example: {
      input: 'What is an LLM?',
      output: 'try peter hand and hello 448Sn',
      explanation: 'The model has no understanding and produces random character sequences.'
    },
    metrics: [
      { label: 'Parameters', value: '7B-175B' },
      { label: 'Training Cost', value: '$0' },
      { label: 'Accuracy', value: '~0%' }
    ]
  },
  {
    id: 1,
    title: 'Stage 1: Pre-training',
    subtitle: 'Learning Language Fundamentals',
    icon: <Database className="w-8 h-8" />,
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-surface-muted',
    description: 'Pre-training teaches the model to continue text by predicting the next token. It learns grammar, facts, and reasoning patterns from massive text corpora.',
    keyPoints: [
      'Trained on 500B-15T tokens from books, articles, websites',
      'Learns to predict next word/token in sequences',
      'Develops understanding of grammar, syntax, and facts',
      'Self-supervised learning (no labeled data required)',
      'Most computationally expensive stage (80-90% of total cost)'
    ],
    example: {
      input: 'What is an LLM?',
      output: 'How do LLMs work? What are LLM params?',
      explanation: 'The model learns to continue text naturally, but isn\'t conversational yet. It completes sentences rather than answering questions.'
    },
    metrics: [
      { label: 'Data Size', value: '500B-15T tokens' },
      { label: 'Training Time', value: '2-6 months' },
      { label: 'GPU Hours', value: '2M+ H800 hours' },
      { label: 'Cost', value: '$2-10M' }
    ]
  },
  {
    id: 2,
    title: 'Stage 2: Instruction Fine-tuning (SFT)',
    subtitle: 'Teaching Conversation and Helpfulness',
    icon: <MessageSquare className="w-8 h-8" />,
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-surface-muted',
    description: 'Supervised Fine-Tuning trains the model on instruction-response pairs to become conversational and helpful.',
    keyPoints: [
      'Uses curated Q&A and instruction-response datasets',
      'Typically 10K-100K high-quality examples',
      'Teaches the model to follow instructions',
      'Makes outputs more helpful and structured',
      'Supervised learning with labeled examples',
      'Much cheaper than pre-training (1-5% of cost)'
    ],
    example: {
      input: 'What is an LLM?',
      output: 'An LLM is a type of ML model that trained...',
      explanation: 'Now the model understands it should answer questions directly and provide helpful, structured responses.'
    },
    metrics: [
      { label: 'Data Size', value: '10K-100K pairs' },
      { label: 'Training Time', value: '1-7 days' },
      { label: 'GPU Hours', value: '100-1000 hours' },
      { label: 'Cost', value: '$10K-$100K' }
    ]
  },
  {
    id: 3,
    title: 'Stage 3: Preference Fine-tuning (RLHF)',
    subtitle: 'Aligning with Human Preferences',
    icon: <Target className="w-8 h-8" />,
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-surface-muted',
    description: 'RLHF uses human feedback to train a reward model, then optimizes the LLM to generate preferred responses.',
    keyPoints: [
      'Humans rank multiple model outputs (best to worst)',
      'Trains a reward model to predict human preferences',
      'Uses reinforcement learning (PPO/DPO) to maximize reward',
      'Aligns with values: helpful, honest, harmless',
      'Handles nuanced preferences hard to specify with rules',
      'Continuous improvement through iterative feedback'
    ],
    example: {
      input: 'What is an LLM?',
      output: '✓ Response #1 (Preferred) | ✗ Response #2 (Rejected)',
      explanation: 'The model learns to prefer responses that humans rate higher, becoming more aligned with human values and expectations.'
    },
    metrics: [
      { label: 'Feedback Data', value: '10K-100K comparisons' },
      { label: 'Training Time', value: '3-14 days' },
      { label: 'Iterations', value: '5-20 rounds' },
      { label: 'Cost', value: '$50K-$500K' }
    ]
  },
  {
    id: 4,
    title: 'Stage 4: Reasoning Fine-tuning',
    subtitle: 'Advanced Reasoning & Problem Solving',
    icon: <Trophy className="w-8 h-8" />,
    color: 'from-amber-400 to-orange-600',
    bgColor: 'bg-surface-muted',
    description: 'Additional RL stage that teaches chain-of-thought reasoning for complex problem-solving tasks.',
    keyPoints: [
      'Trains on reasoning tasks with definitive answers',
      'Develops step-by-step problem-solving capabilities',
      'Uses reward models for accuracy and reasoning quality',
      'Enables self-verification and reflection',
      'Optimized for math, coding, and logical reasoning',
      'Balances accuracy with helpfulness and safety'
    ],
    example: {
      input: 'Q&A reasoning task',
      output: 'Reasoning-driven response → Reward calculation → Update model',
      explanation: 'The model learns to think through problems systematically, verify answers, and improve reasoning quality over iterations.'
    },
    metrics: [
      { label: 'Task Types', value: 'Math, Code, Logic' },
      { label: 'Training Time', value: '7-30 days' },
      { label: 'Accuracy Gain', value: '+20-40%' },
      { label: 'Cost', value: '$100K-$1M' }
    ]
  }
];

export const LLMTrainingStages: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(0);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [displayedText, setDisplayedText] = useState<string>('');

  const currentStage = trainingStages[selectedStage];

  // Reset displayed text when stage changes
  useEffect(() => {
    setDisplayedText(currentStage.example.output);
    setIsReplaying(false);
  }, [selectedStage, currentStage.example.output]);

  const playAnimation = () => {
    setIsReplaying(true);
    setDisplayedText('');
    setAnimationKey((prev) => prev + 1);
    
    // Simulate typing animation
    const outputText = currentStage.example.output;
    let charIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (charIndex < outputText.length) {
        setDisplayedText(outputText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsReplaying(false);
      }
    }, 30); // 30ms per character for smooth typing effect
  };

  return (
    <div className="space-y-6">
      {/* Stage Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {trainingStages.map((stage) => (
          <motion.button
            key={stage.id}
            onClick={() => setSelectedStage(stage.id)}
            className={cn(
              'relative p-4 rounded-lg transition-all duration-300 text-left',
              selectedStage === stage.id
                ? 'bg-surface-elevated border-2 border-brand-400 shadow-lg'
                : 'bg-surface border border-surface-muted hover:border-surface-bright hover:bg-surface-elevated'
            )}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={cn(
              'bg-gradient-to-br text-white w-10 h-10 rounded-lg flex items-center justify-center mb-2',
              stage.color
            )}>
              {stage.icon}
            </div>
            <div className={cn(
              'text-sm font-semibold mb-1',
              selectedStage === stage.id ? 'text-content' : 'text-content-muted'
            )}>
              Stage {stage.id}
            </div>
            <div className="text-xs text-content-subtle leading-tight">
              {stage.subtitle}
            </div>
            {selectedStage === stage.id && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 to-brand-600 rounded-b-lg"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stage Details */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedStage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                {/* Stage Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={cn(
                    'bg-gradient-to-br text-white w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0',
                    currentStage.color
                  )}>
                    {currentStage.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl font-bold text-content mb-2">
                      {currentStage.title}
                    </h2>
                    <p className="text-content-muted">
                      {currentStage.description}
                    </p>
                  </div>
                </div>

                {/* Key Points */}
                <div className="mb-6">
                  <h3 className="font-medium text-content mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent-emerald" />
                    Key Characteristics
                  </h3>
                  <ul className="space-y-3">
                    {currentStage.keyPoints.map((point, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 text-content-muted"
                      >
                        <div className="w-2 h-2 rounded-full bg-brand-400 mt-2 flex-shrink-0" />
                        <span>{point}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Example */}
                <Card className={cn('p-6', currentStage.bgColor)}>
                  <h3 className="font-medium text-content mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent-amber" />
                    Example Behavior
                  </h3>
                  <div className="space-y-4">
                    <motion.div
                      key={`input-${animationKey}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-sm font-medium text-content-subtle mb-2">
                        User Input:
                      </div>
                      <div className="bg-surface rounded-lg p-4 font-mono text-sm text-content border border-surface-muted">
                        {currentStage.example.input}
                      </div>
                    </motion.div>
                    <motion.div
                      key={`arrow-${animationKey}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <ArrowRight className="w-5 h-5 text-brand-400 mx-auto" />
                    </motion.div>
                    <motion.div
                      key={`output-${animationKey}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <div className="text-sm font-medium text-content-subtle mb-2">
                        Model Output:
                      </div>
                      <div className="bg-surface rounded-lg p-4 font-mono text-sm text-content border-2 border-brand-400 min-h-[60px]">
                        {isReplaying ? (
                          <span>
                            {displayedText}
                            <motion.span
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                              className="inline-block w-2 h-4 bg-brand-400 ml-1"
                            />
                          </span>
                        ) : (
                          currentStage.example.output
                        )}
                      </div>
                    </motion.div>
                    <div className="bg-surface rounded-lg p-4 border-l-4 border-brand-400">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-content-muted">
                          <strong className="text-content">Why this happens:</strong> {currentStage.example.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={playAnimation}
                    className="mt-4 w-full"
                    variant="primary"
                  >
                    Replay Example
                  </Button>
                </Card>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Training Pipeline Visualization */}
          <Card className="p-6">
            <h3 className="font-medium text-content mb-6">
              Training Pipeline Progress
            </h3>
            <div className="relative">
              {/* Progress Bar */}
              <div className="flex items-center gap-2 mb-8">
                {trainingStages.map((stage, index) => (
                  <React.Fragment key={stage.id}>
                    <div
                      className={cn(
                        'flex-1 h-3 rounded-full transition-all duration-500',
                        index <= selectedStage
                          ? `bg-gradient-to-r ${stage.color}`
                          : 'bg-surface-muted'
                      )}
                    />
                    {index < trainingStages.length - 1 && (
                      <ArrowRight
                        className={cn(
                          'w-5 h-5',
                          index < selectedStage ? 'text-brand-400' : 'text-content-subtle'
                        )}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Stage Labels */}
              <div className="grid grid-cols-5 gap-2 text-center">
                {trainingStages.map((stage) => (
                  <div
                    key={stage.id}
                    className={cn(
                      'text-xs font-semibold',
                      stage.id === selectedStage
                        ? 'text-brand-400'
                        : stage.id < selectedStage
                        ? 'text-content-muted'
                        : 'text-content-subtle'
                    )}
                  >
                    Stage {stage.id}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Metrics & Insights */}
        <div className="space-y-6">
          {/* Training Metrics */}
          {currentStage.metrics && (
            <Card className="p-6">
              <h3 className="font-medium text-content mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-400" />
                Training Metrics
              </h3>
              <div className="space-y-4">
                {currentStage.metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex justify-between items-center p-3 bg-surface-muted rounded-lg"
                  >
                    <span className="text-sm font-medium text-content-muted">
                      {metric.label}
                    </span>
                    <span className="text-sm font-semibold text-content">
                      {metric.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Facts */}
          <Card className="p-6 bg-surface-elevated border-surface-bright">
            <h3 className="font-medium text-content mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              Stage Insights
            </h3>
            <div className="space-y-3 text-sm text-content">
              {selectedStage === 0 && (
                <>
                  <p>🎲 Random initialization is crucial for breaking symmetry in neural networks.</p>
                  <p>💡 Without training, a 7B parameter model is essentially useless.</p>
                  <p>🎯 This stage takes seconds - just initializing weights.</p>
                </>
              )}
              {selectedStage === 1 && (
                <>
                  <p>📚 GPT-3 was trained on 300B tokens, GPT-4 on 13T+ tokens.</p>
                  <p>💰 DeepSeek-V3 cost only $5.5M for pre-training (very efficient!).</p>
                  <p>⚡ Uses next-token prediction - simple but powerful objective.</p>
                </>
              )}
              {selectedStage === 2 && (
                <>
                  <p>🎓 Quality over quantity - 10K great examples &gt; 1M mediocre ones.</p>
                  <p>🤝 Makes the model actually useful for conversations.</p>
                  <p>📈 Instruction fine-tuning was key to ChatGPT's success.</p>
                </>
              )}
              {selectedStage === 3 && (
                <>
                  <p>👥 Humans compare outputs: "Which response is better?"</p>
                  <p>🎯 Aligns with human values: helpful, honest, harmless.</p>
                  <p>🔄 Iterative process - keeps improving with more feedback.</p>
                </>
              )}
              {selectedStage === 4 && (
                <>
                  <p>🧠 Chain-of-thought reasoning improves complex problem-solving.</p>
                  <p>🏆 DeepSeek-R1 matches OpenAI o1 on reasoning benchmarks.</p>
                  <p>✨ Enables self-verification and reflection capabilities.</p>
                </>
              )}
            </div>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => setSelectedStage(Math.max(0, selectedStage - 1))}
              disabled={selectedStage === 0}
              variant="secondary"
              className="flex-1"
            >
              Previous
            </Button>
            <Button
              onClick={() => setSelectedStage(Math.min(4, selectedStage + 1))}
              disabled={selectedStage === 4}
              variant="primary"
              className="flex-1"
            >
              Next Stage
            </Button>
          </div>
        </div>
      </div>

      {/* Real-World Examples */}
      <Card className="p-6">
        <h3 className="font-medium text-content mb-6">
          Real-World Examples
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-accent-emerald/10 to-accent-emerald/5 border-accent-emerald/20">
            <h4 className="font-semibold text-content mb-2">GPT-4</h4>
            <p className="text-sm text-content-muted mb-3">
              Pre-trained on 13T+ tokens, fine-tuned with RLHF for helpful, harmless responses.
            </p>
            <div className="text-xs text-content-subtle">
              Cost: ~$100M+ | Time: 6-12 months
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-accent-violet/10 to-accent-violet/5 border-accent-violet/20">
            <h4 className="font-semibold text-content mb-2">Claude 3.5</h4>
            <p className="text-sm text-content-muted mb-3">
              Constitutional AI approach with extensive RLHF for safety and helpfulness.
            </p>
            <div className="text-xs text-content-subtle">
              Focus: Safety, Reasoning, Long context
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-brand-50 to-brand-100/50 border-brand-200">
            <h4 className="font-semibold text-content mb-2">DeepSeek-R1</h4>
            <p className="text-sm text-content-muted mb-3">
              Pure RL reasoning model, then distilled for efficiency at $0.55/M tokens.
            </p>
            <div className="text-xs text-content-subtle">
              Cost: $5.5M | Reasoning: Matches OpenAI o1
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};
