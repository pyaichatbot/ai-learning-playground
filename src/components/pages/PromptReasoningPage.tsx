/**
 * AI Learning Playground - Prompt Reasoning Techniques Page
 */

import React, { useState } from 'react';
import { Play, RotateCcw, Info, Brain } from 'lucide-react';
import { Card, Button, Badge, Textarea } from '@/components/shared';
import { ReasoningPatternViz, ReasoningPatternSelector } from '@/components/reasoning';
import { useReasoningStore } from '@/lib/store';
import type { ReasoningPatternInfo } from '@/types';

const REASONING_PATTERNS: ReasoningPatternInfo[] = [
  {
    id: 'cot',
    name: 'Chain-of-Thought (CoT)',
    category: 'linear-sequential',
    description: 'The "Hello World" of reasoning. Prompts the AI to think step-by-step, generating intermediate logic before committing to a final answer.',
    mentalModel: 'Step-by-Step',
    bestFor: 'Math, Simple Logic',
    vibe: 'The Teacher',
    examplePrompt: 'Let\'s solve this step by step. First, I need to...',
    visualizationType: 'linear',
  },
  {
    id: 'cod',
    name: 'Chain-of-Draft (CoD)',
    category: 'linear-sequential',
    description: 'A specialized pattern for efficiency. The AI writes shorthand notes (symbols, brief phrases) instead of full sentences during reasoning, reducing token costs while keeping accuracy high.',
    mentalModel: 'Shorthand Reasoning',
    bestFor: 'Efficient Processing',
    vibe: 'The Note-Taker',
    examplePrompt: '[key concepts] → [relationships] → [conclusion]',
    visualizationType: 'linear',
  },
  {
    id: 'system2',
    name: 'System 2 / Hidden CoT',
    category: 'linear-sequential',
    description: 'Used by models like OpenAI o1/o3 or DeepSeek-R1. The model performs extensive reasoning in a hidden "thought" window, only showing the user the final refined answer.',
    mentalModel: 'Hidden Reasoning',
    bestFor: 'Complex Problems',
    vibe: 'The Thinker',
    examplePrompt: '[Hidden reasoning process] → Final answer',
    visualizationType: 'linear',
  },
  {
    id: 'aot',
    name: 'Atom of Thought (AoT)',
    category: 'modular-parallel',
    description: 'The newest "anti-linear" trend. Instead of a chain (A → B → C), it treats ideas as independent atoms. Isolates components so an error in one "atom" doesn\'t corrupt the entire logic.',
    mentalModel: 'Modular Atoms',
    bestFor: 'Complex Physics, Legal',
    vibe: 'The Scientist',
    examplePrompt: 'Atom 1: [concept], Atom 2: [context], Atom 3: [constraint] → Combine',
    visualizationType: 'atoms',
  },
  {
    id: 'sot',
    name: 'Skeleton-of-Thought (SoT)',
    category: 'modular-parallel',
    description: 'A speed-focused pattern. The AI first creates an outline (the skeleton) and then generates content for each section simultaneously. Significantly faster than traditional CoT.',
    mentalModel: 'Outline First',
    bestFor: 'Long-form Content',
    vibe: 'The Architect',
    examplePrompt: 'Skeleton: 1) Intro, 2) Main, 3) Conclusion → Fill all sections',
    visualizationType: 'linear',
  },
  {
    id: 'tot',
    name: 'Tree-of-Thought (ToT)',
    category: 'modular-parallel',
    description: 'The AI acts as a search algorithm. It generates multiple branches of thought, evaluates which ones are promising, and prunes (deletes) the bad ones to find the best path.',
    mentalModel: 'Branching Paths',
    bestFor: 'Strategy, Creative Writing',
    vibe: 'The Explorer',
    examplePrompt: 'Branch 1: [approach A], Branch 2: [approach B] → Evaluate → Prune → Best path',
    visualizationType: 'tree',
  },
  {
    id: 'react',
    name: 'ReAct (Reason + Act)',
    category: 'iterative-self-correcting',
    description: 'The industry standard for AI Agents. The model alternates between "Thinking" about what it needs and "Acting" by using a tool (like a web search or calculator), then observing the result.',
    mentalModel: 'Think → Use Tool',
    bestFor: 'Web Browsing, Coding',
    vibe: 'The Agent',
    examplePrompt: 'Thought: I need X → Action: Use tool Y → Observation: Result Z → Continue',
    visualizationType: 'iterative',
  },
  {
    id: 'reflection',
    name: 'Reflection / Self-Critique',
    category: 'iterative-self-correcting',
    description: 'A "two-pass" system. The AI generates a draft, then is prompted to "critique your own work for logic errors," and finally rewrites the response based on that critique.',
    mentalModel: 'Draft → Critique → Revise',
    bestFor: 'Quality Improvement',
    vibe: 'The Critic',
    examplePrompt: 'Draft answer → Critique: "Missing depth" → Revised answer',
    visualizationType: 'iterative',
  },
  {
    id: 'cove',
    name: 'Chain-of-Verification (CoVe)',
    category: 'iterative-self-correcting',
    description: 'To stop hallucinations, the AI writes its answer, then generates a list of "fact-check" questions for itself. It answers those questions independently and corrects its original response if the facts don\'t match.',
    mentalModel: 'Fact-Checking',
    bestFor: 'Research, History',
    vibe: 'The Editor',
    examplePrompt: 'Answer → Verify Q1, Q2, Q3 → Check facts → Correct if needed',
    visualizationType: 'iterative',
  },
  {
    id: 'got',
    name: 'Graph-of-Thought (GoT)',
    category: 'advanced-graph-memory',
    description: 'Unlike a tree (which only moves forward), a graph allows thoughts to loop back or merge. You can combine two different "good ideas" from different branches into a single superior conclusion.',
    mentalModel: 'Graph Structure',
    bestFor: 'Deep Research',
    vibe: 'The Synthesizer',
    examplePrompt: 'Node 1: [idea A], Node 2: [idea B] → Merge → Superior solution',
    visualizationType: 'graph',
  },
  {
    id: 'bot',
    name: 'Buffer-of-Thought (BoT)',
    category: 'advanced-graph-memory',
    description: 'Uses a "thought library." When faced with a problem, the AI retrieves a pre-existing "reasoning template" (a meta-buffer) from its memory and adapts it to the specific task, saving time and increasing reliability.',
    mentalModel: 'Template Retrieval',
    bestFor: 'Repetitive Tasks',
    vibe: 'The Librarian',
    examplePrompt: 'Retrieve template → Adapt to problem → Apply solution',
    visualizationType: 'iterative',
  },
];

const SAMPLE_PROBLEMS = [
  'If a train travels 120 miles in 2 hours, what is its average speed?',
  'Explain the difference between supervised and unsupervised learning.',
  'What are the key factors to consider when designing a REST API?',
  'How does photosynthesis work?',
  'What is the time complexity of binary search?',
];

export const PromptReasoningPage: React.FC = () => {
  const {
    reasoningState,
    selectedPattern,
    isRunning,
    setPattern,
    runDemoReasoning,
    resetReasoningState,
  } = useReasoningStore();

  const [problem, setProblem] = useState(SAMPLE_PROBLEMS[0]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const handleRunReasoning = () => {
    runDemoReasoning(problem, selectedPattern);
  };

  const handleReset = () => {
    resetReasoningState();
    setProblem(SAMPLE_PROBLEMS[0]);
    setSelectedStepId(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-content mb-2">
            Prompt Reasoning Techniques
          </h1>
          <p className="text-content-muted">
            Explore modern AI reasoning patterns and understand how different prompt architectures work
          </p>
        </div>
        <Badge variant="violet">Interactive Demo</Badge>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Input */}
          <Card className="p-6">
            <h2 className="font-medium text-content mb-4">Problem Statement</h2>
            <div className="mb-4">
              <Textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                className="flex-1 min-h-[100px]"
                placeholder="Enter a problem or question to solve..."
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleRunReasoning} isLoading={isRunning}>
                <Play size={16} />
                Run Reasoning
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw size={16} />
              </Button>
            </div>
            <div className="mt-4">
              <p className="text-xs text-content-muted mb-2">Try these problems:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROBLEMS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setProblem(p)}
                    className="text-xs px-3 py-1.5 rounded-full bg-surface-muted hover:bg-surface-bright text-content-muted hover:text-content transition-colors"
                  >
                    {p.slice(0, 40)}...
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Visualization */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-content">Reasoning Process</h2>
              {reasoningState && (
                <span className="text-sm text-content-muted">
                  Step {reasoningState.currentStep + 1} of {reasoningState.steps.length}
                </span>
              )}
            </div>
            {reasoningState && reasoningState.steps.length > 0 ? (
              <div className="min-h-[400px]">
                <ReasoningPatternViz
                  pattern={reasoningState.pattern}
                  steps={reasoningState.steps}
                  nodes={reasoningState.nodes}
                  currentStep={reasoningState.currentStep}
                  onStepHover={setSelectedStepId}
                  selectedStepId={selectedStepId}
                />
              </div>
            ) : (
              <div className="bg-surface-elevated rounded-lg border border-surface-muted p-12 text-center min-h-[400px] flex items-center justify-center">
                <div>
                  <Brain size={48} className="mx-auto mb-4 text-content-muted" />
                  <p className="text-sm text-content-muted mb-2">No reasoning process yet</p>
                  <p className="text-xs text-content-subtle">
                    Select a pattern, enter a problem, and click "Run Reasoning" to see the process
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Final Answer */}
          {reasoningState?.finalAnswer && (
            <Card className="p-6">
              <h2 className="font-medium text-content mb-4">Final Answer</h2>
              <div className="p-4 rounded-lg bg-surface-elevated border border-surface-muted">
                <p className="text-content leading-relaxed">{reasoningState.finalAnswer}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ReasoningPatternSelector
            selectedPattern={selectedPattern}
            onPatternChange={setPattern}
            patterns={REASONING_PATTERNS}
          />

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-reasoning-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-content mb-1">How it works</h3>
                <p className="text-xs text-content-muted leading-relaxed">
                  Each reasoning pattern uses a different architectural approach to problem-solving.
                  Watch how the AI thinks through problems differently based on the selected pattern.
                </p>
              </div>
            </div>
          </Card>

          {/* Metrics */}
          {reasoningState && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-content mb-3">Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-content-muted">Total Steps</span>
                  <span className="font-mono text-reasoning-primary">
                    {reasoningState.metrics.totalSteps}
                  </span>
                </div>
                {reasoningState.metrics.totalBranches !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-content-muted">Branches</span>
                    <span className="font-mono text-reasoning-primary">
                      {reasoningState.metrics.totalBranches}
                    </span>
                  </div>
                )}
                {reasoningState.metrics.atomsCreated !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-content-muted">Atoms</span>
                    <span className="font-mono text-reasoning-primary">
                      {reasoningState.metrics.atomsCreated}
                    </span>
                  </div>
                )}
                {reasoningState.metrics.verificationsPerformed !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-content-muted">Verifications</span>
                    <span className="font-mono text-reasoning-primary">
                      {reasoningState.metrics.verificationsPerformed}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-content-muted">Execution Time</span>
                  <span className="font-mono text-reasoning-primary">
                    {Math.round(reasoningState.metrics.executionTime / 1000)}s
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
