/**
 * AI Learning Playground - Multi-Agent Visualization Components
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ArrowRight, MessageSquare } from 'lucide-react';
import { cn, stringToColor } from '@/lib/utils';
import type { AgentMessage } from '@/types';

// ============================================
// Message Flow Visualization
// ============================================

interface MessageFlowVizProps {
  messages: AgentMessage[];
  agents: Array<{ id: string; name: string; color?: string }>;
  className?: string;
}

export const MessageFlowViz: React.FC<MessageFlowVizProps> = ({
  messages,
  agents,
  className,
}) => {
  const getAgentInfo = (id: string) => {
    if (id === 'supervisor') {
      return { name: 'Supervisor', color: '#f59e0b' };
    }
    const agent = agents.find((a) => a.id === id);
    return agent || { name: id, color: stringToColor(id) };
  };

  const messageTypeStyles: Record<string, string> = {
    task: 'border-accent-amber',
    response: 'border-accent-emerald',
    delegation: 'border-accent-violet',
    feedback: 'border-accent-cyan',
    completion: 'border-multiagent-primary',
    query: 'border-content-subtle',
  };

  return (
    <div className={cn('space-y-3', className)}>
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => {
          const fromAgent = getAgentInfo(message.from);
          const toAgent = message.to === 'all' ? { name: 'All Agents', color: '#64748b' } : getAgentInfo(message.to);

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                'p-4 rounded-lg bg-surface-elevated/50 border-l-4',
                messageTypeStyles[message.type] || 'border-surface-muted'
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: fromAgent.color }}
                >
                  {fromAgent.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-content">{fromAgent.name}</span>
                <ArrowRight size={14} className="text-content-subtle" />
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: toAgent.color }}
                >
                  {toAgent.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-content">{toAgent.name}</span>
                <span className="ml-auto text-2xs text-content-subtle capitalize px-2 py-0.5 rounded bg-surface-muted">
                  {message.type}
                </span>
              </div>

              {/* Content */}
              <p className="text-sm text-content-muted pl-8">{message.content}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {messages.length === 0 && (
        <div className="text-center py-8 text-content-subtle">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No messages yet. Start orchestration to see agent communication.</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Agent Network Graph
// ============================================

interface AgentNetworkProps {
  agents: Array<{ id: string; name: string; role: string; color?: string }>;
  connections: Array<{ from: string; to: string; active?: boolean }>;
  currentAgent?: string | null;
  className?: string;
}

export const AgentNetwork: React.FC<AgentNetworkProps> = ({
  agents,
  connections,
  currentAgent,
  className,
}) => {
  // Simple circular layout
  const centerX = 150;
  const centerY = 150;
  const radius = 100;

  const getPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  return (
    <div className={cn('relative', className)}>
      <svg width="300" height="300" className="w-full h-full">
        {/* Connections */}
        {connections.map((conn, i) => {
          const fromIndex = agents.findIndex((a) => a.id === conn.from);
          const toIndex = agents.findIndex((a) => a.id === conn.to);
          if (fromIndex === -1 || toIndex === -1) return null;

          const fromPos = getPosition(fromIndex, agents.length);
          const toPos = getPosition(toIndex, agents.length);

          return (
            <motion.line
              key={`${conn.from}-${conn.to}-${i}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke={conn.active ? '#10b981' : '#334155'}
              strokeWidth={conn.active ? 2 : 1}
              strokeDasharray={conn.active ? '5,5' : undefined}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}

        {/* Supervisor at center */}
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
          <circle cx={centerX} cy={centerY} r={20} fill="#f59e0b" className="drop-shadow-lg" />
          <User x={centerX - 10} y={centerY - 10} size={20} className="text-white" />
        </motion.g>

        {/* Agent Nodes */}
        {agents.map((agent, index) => {
          const pos = getPosition(index, agents.length);
          const isActive = agent.id === currentAgent;
          const color = agent.color || stringToColor(agent.id);

          return (
            <motion.g
              key={agent.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isActive ? 28 : 24}
                fill={color}
                className={cn('transition-all duration-300', isActive && 'drop-shadow-lg')}
                style={{ filter: isActive ? `drop-shadow(0 0 8px ${color})` : undefined }}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-xs font-bold"
              >
                {agent.name.charAt(0)}
              </text>
              <text
                x={pos.x}
                y={pos.y + 40}
                textAnchor="middle"
                className="fill-content-muted text-2xs"
              >
                {agent.name}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};
