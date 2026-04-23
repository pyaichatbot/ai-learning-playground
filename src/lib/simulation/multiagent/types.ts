export type MultiAgentPattern =
  | 'supervisor'
  | 'sequential'
  | 'parallel'
  | 'network'
  | 'dispatch-tree';

export type MultiAgentTaskKind =
  | 'coordination'
  | 'research'
  | 'analysis'
  | 'draft'
  | 'review'
  | 'synthesis'
  | 'validation'
  | 'dispatch';

export type MultiAgentMessageKind =
  | 'delegate'
  | 'handoff'
  | 'status'
  | 'cross-check'
  | 'aggregate'
  | 'result';

export type MultiAgentEdgeKind = 'reports-to' | 'delegates-to' | 'collaborates-with';

export type MultiAgentTaskStatus = 'pending' | 'running' | 'completed';

export interface MultiAgentRole {
  id: string;
  label: string;
  description: string;
}

export interface MultiAgentCapability {
  id: string;
  label: string;
  description?: string;
}

export interface MultiAgentAgent {
  id: string;
  name: string;
  role: MultiAgentRole;
  capabilities: string[];
  color?: string;
  reportsTo?: string;
}

export interface MultiAgentTaskSpec {
  id: string;
  title: string;
  description: string;
  kind: MultiAgentTaskKind;
  effort: number;
  requiredCapabilities: string[];
  preferredAgentId?: string;
  parentTaskId?: string;
  dependsOn?: string[];
  wave?: number;
  routeThrough?: string[];
}

export interface MultiAgentScenario {
  id: string;
  name: string;
  description: string;
  pattern: MultiAgentPattern;
  rootTask: MultiAgentTaskSpec;
  tasks: MultiAgentTaskSpec[];
  agents: MultiAgentAgent[];
}

export interface MultiAgentTaskState extends MultiAgentTaskSpec {
  status: MultiAgentTaskStatus;
  assignedAgentId: string;
  depth: number;
  startTimestamp: number;
  endTimestamp: number;
  tokenCost: number;
  duration: number;
  resultSummary: string;
}

export interface MultiAgentDependencyEdge {
  from: string;
  to: string;
  kind: 'blocks';
}

export interface MultiAgentAgentEdge {
  from: string;
  to: string;
  kind: MultiAgentEdgeKind;
}

export interface MultiAgentAgentGraph {
  nodes: MultiAgentAgent[];
  edges: MultiAgentAgentEdge[];
}

export interface MultiAgentDispatchTreeNode {
  id: string;
  taskId: string;
  parentId: string | null;
  childIds: string[];
  agentId: string;
  depth: number;
  status: MultiAgentTaskStatus;
  tokenCost: number;
  duration: number;
}

export interface MultiAgentMessage {
  id: string;
  from: string;
  to: string;
  kind: MultiAgentMessageKind;
  taskId?: string;
  content: string;
  tokenCost: number;
  timestamp: number;
}

export interface MultiAgentRoutingDecision {
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  reason: string;
}

export interface MultiAgentAggregationEvent {
  id: string;
  taskId: string;
  agentId: string;
  sourceTaskIds: string[];
  summary: string;
  tokenCost: number;
  duration: number;
  timestamp: number;
}

export interface MultiAgentMetrics {
  totalTokens: number;
  totalDuration: number;
  totalMessages: number;
  completedTasks: number;
  aggregationEvents: number;
  averageTaskDuration: number;
}

export interface MultiAgentSimulationState {
  scenarioId: string | null;
  pattern: MultiAgentPattern | null;
  status: 'idle' | 'ready' | 'running' | 'completed';
  agents: MultiAgentAgent[];
  agentGraph: MultiAgentAgentGraph;
  tasks: MultiAgentTaskState[];
  dependencyEdges: MultiAgentDependencyEdge[];
  dispatchTree: MultiAgentDispatchTreeNode[];
  routing: MultiAgentRoutingDecision[];
  messages: MultiAgentMessage[];
  aggregationEvents: MultiAgentAggregationEvent[];
  metrics: MultiAgentMetrics;
  finalResult: string | null;
}

