import type { FocusTarget } from '../core/session';

export type A2ATaskStatus =
  | 'submitted'
  | 'accepted'
  | 'working'
  | 'input-required'
  | 'completed'
  | 'failed'
  | 'canceled';

export type A2AMessageKind = 'request' | 'status' | 'artifact' | 'error' | 'retry' | 'cancel';

export interface A2AAgentCard {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  endpoint: string;
}

export interface A2AMessage {
  id: string;
  kind: A2AMessageKind;
  from: string;
  to: string;
  taskId: string;
  timestamp: number;
  summary: string;
}

export interface A2ATaskHistoryEntry {
  status: A2ATaskStatus;
  timestamp: number;
  summary: string;
}

export interface A2ATask {
  id: string;
  title: string;
  description: string;
  requesterAgentId: string;
  responderAgentId: string;
  status: A2ATaskStatus;
  history: A2ATaskHistoryEntry[];
  orchestrationTarget?: FocusTarget;
}

export interface A2ATaskTransition {
  status: A2ATaskStatus;
  summary: string;
  by: string;
  messageKind?: A2AMessageKind;
}

export interface A2AScenario {
  id: string;
  name: string;
  description: string;
  agents: A2AAgentCard[];
  task: Omit<A2ATask, 'status' | 'history'>;
  transitions: A2ATaskTransition[];
}

export interface A2AMetrics {
  totalMessages: number;
  completedTasks: number;
  failedTasks: number;
  canceledTasks: number;
}

export interface A2AProtocolState {
  scenarioId: string | null;
  status: 'idle' | 'ready' | 'running' | 'completed';
  agents: A2AAgentCard[];
  tasks: A2ATask[];
  selectedTaskId: string | null;
  messages: A2AMessage[];
  metrics: A2AMetrics;
}
