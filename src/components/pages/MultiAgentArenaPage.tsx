/**
 * AI Learning Playground - Multi-Agent Arena Page
 */

import React, { useState } from 'react';
import { Play, RotateCcw, Info } from 'lucide-react';
import { Card, Button, Badge } from '@/components/shared';
import { MessageFlowViz, AgentNetwork } from '@/components/multi-agent';
import { useMultiAgentStore } from '@/lib/store';
import { MultiAgentConfig, MultiAgentMetrics } from '@/components/multi-agent/MultiAgentPanels';

const SAMPLE_TASKS = [
  'Research and write a comprehensive blog post about AI safety',
  'Analyze market trends and create an investment recommendation report',
  'Design and document a microservices architecture for an e-commerce platform',
  'Create a marketing campaign strategy for a new product launch',
];

export const MultiAgentArenaPage: React.FC = () => {
  const {
    multiAgentState,
    selectedPattern,
    isRunning,
    setPattern,
    runDemoOrchestration,
    resetMultiAgentState,
  } = useMultiAgentStore();

  const [task, setTask] = useState(SAMPLE_TASKS[0]);

  const handleRunOrchestration = () => {
    runDemoOrchestration(task, selectedPattern);
  };

  const handleReset = () => {
    resetMultiAgentState();
    setTask(SAMPLE_TASKS[0]);
  };

  const agents = multiAgentState?.config.agents || [
    { id: 'researcher', name: 'Researcher', role: 'Research', color: '#06b6d4' },
    { id: 'writer', name: 'Writer', role: 'Content creation', color: '#8b5cf6' },
    { id: 'reviewer', name: 'Reviewer', role: 'Quality review', color: '#10b981' },
  ];

  const connections = multiAgentState?.messages.flatMap((m, i) => {
    const isActive = i === multiAgentState.messages.length - 1;
    
    // Handle 'all' broadcasts - create connections to all agents
    if (m.to === 'all') {
      return agents.map(agent => ({
        from: m.from === 'all' ? 'supervisor' : m.from,
        to: agent.id,
        active: isActive,
      }));
    }
    
    // Regular point-to-point connection
    return [{
      from: m.from === 'all' ? 'supervisor' : m.from,
      to: m.to,
      active: isActive,
    }];
  }) || [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-content mb-2">Multi-Agent Arena</h1>
          <p className="text-content-muted">
            Visualize how multiple AI agents coordinate to complete complex tasks
          </p>
        </div>
        <Badge variant="emerald">Interactive Demo</Badge>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Input */}
          <Card className="p-6">
            <h2 className="font-medium text-content mb-4">Orchestration Task</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="input flex-1"
                placeholder="Describe the task..."
              />
              <Button onClick={handleRunOrchestration} isLoading={isRunning}>
                <Play size={16} />
                Start
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw size={16} />
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {SAMPLE_TASKS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setTask(t)}
                  className="text-xs px-3 py-1.5 rounded-full bg-surface-muted hover:bg-surface-bright text-content-muted hover:text-content transition-colors"
                >
                  {t.slice(0, 30)}...
                </button>
              ))}
            </div>
          </Card>

          {/* Agent Network */}
          <Card className="p-6">
            <h2 className="font-medium text-content mb-4">Agent Network</h2>
            <div className="flex justify-center">
              <AgentNetwork
                agents={agents}
                connections={connections}
                currentAgent={multiAgentState?.currentAgent}
              />
            </div>
          </Card>

          {/* Message Flow */}
          <Card className="p-6">
            <h2 className="font-medium text-content mb-4">Message Flow</h2>
            <div className="max-h-[400px] overflow-y-auto">
              <MessageFlowViz
                messages={multiAgentState?.messages || []}
                agents={agents}
              />
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <MultiAgentConfig
            selectedPattern={selectedPattern}
            onPatternChange={setPattern}
          />
          
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-multiagent-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-content mb-1">Orchestration</h3>
                <p className="text-xs text-content-muted">
                  Watch how the supervisor delegates tasks to specialized agents
                  and coordinates their outputs.
                </p>
              </div>
            </div>
          </Card>

          {multiAgentState && <MultiAgentMetrics state={multiAgentState} />}
        </div>
      </div>
    </div>
  );
};
