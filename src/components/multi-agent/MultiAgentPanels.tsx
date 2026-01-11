/**
 * AI Learning Playground - Multi-Agent Panel Components
 */

import React from 'react';
import { Users, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { OrchestrationPattern, MultiAgentState } from '@/types';

// ============================================
// Pattern Configuration Panel
// ============================================

const PATTERNS = [
  { 
    value: 'supervisor' as OrchestrationPattern, 
    label: 'Supervisor', 
    description: 'Central coordinator delegates to workers' 
  },
  { 
    value: 'sequential' as OrchestrationPattern, 
    label: 'Sequential', 
    description: 'Agents work in predefined order' 
  },
  { 
    value: 'parallel' as OrchestrationPattern, 
    label: 'Parallel', 
    description: 'Agents work simultaneously' 
  },
  { 
    value: 'hierarchical' as OrchestrationPattern, 
    label: 'Hierarchical', 
    description: 'Multi-level delegation tree' 
  },
];

interface MultiAgentConfigProps {
  selectedPattern: OrchestrationPattern;
  onPatternChange: (pattern: OrchestrationPattern) => void;
}

export const MultiAgentConfig: React.FC<MultiAgentConfigProps> = ({
  selectedPattern,
  onPatternChange,
}) => {
  return (
    <Card className="p-6">
      <h2 className="font-medium text-content mb-4">Orchestration Pattern</h2>
      <div className="space-y-2">
        {PATTERNS.map((pattern) => {
          const isSelected = pattern.value === selectedPattern;
          
          return (
            <button
              key={pattern.value}
              onClick={() => onPatternChange(pattern.value)}
              className={cn(
                'w-full p-3 rounded-lg border text-left transition-all duration-200',
                isSelected
                  ? 'bg-multiagent-primary/10 border-multiagent-primary'
                  : 'bg-surface-elevated/50 border-surface-muted hover:border-surface-bright'
              )}
            >
              <h4 className={cn(
                'font-medium text-sm mb-0.5',
                isSelected ? 'text-multiagent-primary' : 'text-content'
              )}>
                {pattern.label}
              </h4>
              <p className="text-2xs text-content-muted">{pattern.description}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

// ============================================
// Metrics Panel
// ============================================

interface MultiAgentMetricsProps {
  state: MultiAgentState;
}

export const MultiAgentMetrics: React.FC<MultiAgentMetricsProps> = ({ state }) => {
  const agentCount = state.config.agents.length;
  const messageCount = state.messages.length;
  const completedTasks = state.completedTasks.length;
  const pendingTasks = state.taskQueue.filter(t => t.status === 'pending').length;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-content mb-4">Orchestration Metrics</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 rounded-lg bg-surface/50">
          <Users size={18} className="mx-auto mb-1 text-multiagent-primary" />
          <p className="text-xl font-bold text-content">{agentCount}</p>
          <p className="text-2xs text-content-muted">Agents</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-surface/50">
          <MessageSquare size={18} className="mx-auto mb-1 text-accent-cyan" />
          <p className="text-xl font-bold text-content">{messageCount}</p>
          <p className="text-2xs text-content-muted">Messages</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-surface/50">
          <CheckCircle size={18} className="mx-auto mb-1 text-accent-emerald" />
          <p className="text-xl font-bold text-content">{completedTasks}</p>
          <p className="text-2xs text-content-muted">Completed</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-surface/50">
          <Clock size={18} className="mx-auto mb-1 text-accent-amber" />
          <p className="text-xl font-bold text-content">{pendingTasks}</p>
          <p className="text-2xs text-content-muted">Pending</p>
        </div>
      </div>

      {/* Agent List */}
      <div className="mt-4 pt-4 border-t border-surface-muted">
        <h4 className="text-xs font-medium text-content-muted mb-2">Active Agents</h4>
        <div className="space-y-2">
          {state.config.agents.map((agent) => (
            <div
              key={agent.id}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg transition-colors',
                state.currentAgent === agent.id 
                  ? 'bg-multiagent-primary/10' 
                  : 'bg-surface/30'
              )}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: agent.color || '#64748b' }}
              >
                {agent.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content truncate">{agent.name}</p>
                <p className="text-2xs text-content-muted truncate">{agent.role}</p>
              </div>
              {state.currentAgent === agent.id && (
                <span className="w-2 h-2 rounded-full bg-multiagent-primary animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
