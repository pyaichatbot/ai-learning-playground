export interface A2AAgentCard {
  name: string;
  description: string;
  version: string;
  protocolVersions: string[];
  provider: { organization: string; url: string };
  iconUrl?: string;
  documentationUrl?: string;
  supportedInterfaces: Array<{
    url: string;
    protocolBinding: 'JSONRPC' | 'GRPC' | 'REST';
  }>;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
  };
  skills: A2ASkill[];
  securitySchemes?: Record<string, unknown>;
}

export interface A2ASkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples: string[];
  inputModes?: string[];
  outputModes?: string[];
}

export type A2ATaskState =
  | 'submitted'
  | 'working'
  | 'input-required'
  | 'auth-required'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'rejected';

export const TERMINAL_STATES: A2ATaskState[] = ['completed', 'failed', 'canceled', 'rejected'];

export interface A2ATask {
  id: string;
  contextId: string;
  status: {
    state: A2ATaskState;
    message?: A2AMessage;
    timestamp: string;
  };
  artifacts: A2AArtifact[];
  history: A2AMessage[];
}

export type A2APart =
  | { kind: 'text'; text: string; mediaType?: string }
  | { kind: 'data'; data: unknown; mediaType?: string }
  | { kind: 'file'; url: string; mediaType?: string; filename?: string };

export interface A2AMessage {
  messageId: string;
  contextId?: string;
  taskId?: string;
  role: 'user' | 'agent';
  parts: A2APart[];
  metadata?: Record<string, unknown>;
}

export interface A2AArtifact {
  artifactId: string;
  name: string;
  description?: string;
  parts: A2APart[];
  metadata?: Record<string, unknown>;
}

export interface A2AEnvelope {
  jsonrpc: '2.0';
  method: string;
  params: unknown;
  id: number | string;
}

export interface A2AResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
  id: number | string;
}

export interface A2AProtocolMessage {
  id: string;
  direction: 'caller→callee' | 'callee→caller';
  method?: string;
  payload: A2AEnvelope | A2AResponse;
  timestamp: number;
  stateAfter?: A2ATaskState;
}

export interface A2ASimulatedStep {
  direction: 'caller→callee' | 'callee→caller';
  method?: string;
  delayMs: number;
  payload: A2AEnvelope | A2AResponse;
  stateAfter?: A2ATaskState;
  annotation?: string;
}

export interface A2AScenario {
  id: string;
  name: string;
  description: string;
  callerAgent: A2AAgentCard;
  calleeAgent: A2AAgentCard;
  steps: A2ASimulatedStep[];
}

export type A2AConnectionState = 'idle' | 'discovering' | 'connected' | 'running' | 'completed' | 'error';

export interface A2AStoreState {
  activeScenario: A2AScenario | null;
  connectionState: A2AConnectionState;
  taskState: A2ATaskState | null;
  messageLog: A2AProtocolMessage[];
  activeTab: 'cards' | 'lifecycle' | 'flow';
  selectedCardAgent: 'caller' | 'callee' | null;
  isReplaying: boolean;
  replayStep: number;
  setActiveScenario: (scenario: A2AScenario) => void;
  setConnectionState: (state: A2AConnectionState) => void;
  setTaskState: (state: A2ATaskState | null) => void;
  appendMessage: (message: A2AProtocolMessage) => void;
  clearMessages: () => void;
  setActiveTab: (tab: 'cards' | 'lifecycle' | 'flow') => void;
  setSelectedCardAgent: (agent: 'caller' | 'callee' | null) => void;
  setIsReplaying: (value: boolean) => void;
  setReplayStep: (step: number) => void;
  resetSession: () => void;
}
