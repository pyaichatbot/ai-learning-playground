/**
 * AI Learning Playground - Agent Lab Page
 */

import React, { useState } from 'react';
import { Play, RotateCcw, Info, Zap, Brain, Clock } from 'lucide-react';
import { Card, Button, Badge, ProgressBar } from '@/components/shared';
import { AgentStepViz, AgentPatternSelector } from '@/components/agents';
import { useAgentStore } from '@/lib/store';

const SAMPLE_TASKS = [
  'Research the latest developments in quantum computing and summarize key findings',
  'Analyze the pros and cons of remote work for software teams',
  'Find the best practices for implementing microservices architecture',
  'Compare different machine learning frameworks for production use',
];

export const AgentLabPage: React.FC = () => {
  const {
    agentState,
    selectedPattern,
    isRunning,
    currentStepIndex,
    setPattern,
    runDemoTask,
    resetAgentState,
  } = useAgentStore();

  const [task, setTask] = useState(SAMPLE_TASKS[0]);

  const handleRunAgent = () => {
    runDemoTask(task, selectedPattern);
  };

  const handleReset = () => {
    resetAgentState();
    setTask(SAMPLE_TASKS[0]);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-content mb-2">Agent Lab</h1>
          <p className="text-content-muted">
            Visualize AI agent reasoning patterns and decision-making processes
          </p>
        </div>
        <Badge variant="violet">Interactive Demo</Badge>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Steps Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Input */}
          <Card className="p-6">
            <h2 className="font-medium text-content mb-4">Agent Task</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="input flex-1"
                placeholder="Describe the task for the agent..."
              />
              <Button onClick={handleRunAgent} isLoading={isRunning}>
                <Play size={16} />
                Run Agent
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw size={16} />
              </Button>
            </div>

            {/* Quick Tasks */}
            <div className="mt-4">
              <p className="text-sm text-content-muted mb-2">Example tasks:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TASKS.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setTask(t)}
                    className="text-xs px-3 py-1.5 rounded-full bg-surface-muted hover:bg-surface-bright text-content-muted hover:text-content transition-colors text-left"
                  >
                    {t.slice(0, 40)}...
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Progress */}
          {agentState && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-content">
                  Agent Progress
                </span>
                <span className="text-sm text-content-muted">
                  Step {currentStepIndex + 1} of {agentState.steps.length}
                </span>
              </div>
              <ProgressBar
                value={currentStepIndex + 1}
                max={agentState.steps.length}
                variant="agent"
              />
            </Card>
          )}

          {/* Agent Steps */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-content">Reasoning Steps</h2>
              {agentState && (
                <span className="text-sm text-content-muted">
                  {agentState.steps.length} steps
                </span>
              )}
            </div>
            <AgentStepViz
              steps={agentState?.steps || []}
              currentStepIndex={currentStepIndex}
            />
          </Card>
        </div>

        {/* Right Column - Config & Metrics */}
        <div className="space-y-6">
          {/* Pattern Selector */}
          <Card className="p-6">
            <h2 className="font-medium text-content mb-4">Agent Pattern</h2>
            <AgentPatternSelector
              selectedPattern={selectedPattern}
              onSelect={setPattern}
            />
          </Card>

          {/* Info Card */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-agent-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-content mb-1">About Patterns</h3>
                <p className="text-xs text-content-muted leading-relaxed">
                  Different patterns excel at different tasks. ReAct is great for 
                  tool-heavy tasks, while Reflection helps improve output quality 
                  through self-critique.
                </p>
              </div>
            </div>
          </Card>

          {/* Agent Metrics */}
          {agentState && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-content mb-4">Agent Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-surface/50">
                  <Brain size={20} className="mx-auto mb-1 text-agent-primary" />
                  <p className="text-xl font-bold text-content">
                    {agentState.metrics.thoughtCount}
                  </p>
                  <p className="text-2xs text-content-muted">Thoughts</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-surface/50">
                  <Zap size={20} className="mx-auto mb-1 text-accent-amber" />
                  <p className="text-xl font-bold text-content">
                    {agentState.metrics.actionCount}
                  </p>
                  <p className="text-2xs text-content-muted">Actions</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-surface/50">
                  <RotateCcw size={20} className="mx-auto mb-1 text-accent-violet" />
                  <p className="text-xl font-bold text-content">
                    {agentState.metrics.reflectionCount}
                  </p>
                  <p className="text-2xs text-content-muted">Reflections</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-surface/50">
                  <Clock size={20} className="mx-auto mb-1 text-accent-cyan" />
                  <p className="text-xl font-bold text-content">
                    {agentState.metrics.toolCalls}
                  </p>
                  <p className="text-2xs text-content-muted">Tool Calls</p>
                </div>
              </div>
            </Card>
          )}

          {/* Tools Available */}
          {agentState && agentState.tools.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-content mb-3">Available Tools</h3>
              <div className="space-y-2">
                {agentState.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-2 rounded-lg bg-surface/50 border border-surface-muted"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={12} className="text-accent-amber" />
                      <span className="text-sm font-medium text-content">
                        {tool.name}
                      </span>
                    </div>
                    <p className="text-2xs text-content-muted">{tool.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
