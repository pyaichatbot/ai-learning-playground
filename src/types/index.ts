/**
 * AI Learning Playground - Type Definitions
 * 
 * Core types for RAG, Agents, and Multi-Agent systems visualization
 */

// ============================================
// Common Types
// ============================================

export type ModuleType = 'rag' | 'agents' | 'multi-agent' | 'reasoning';

export type PlaygroundMode = 'basic' | 'advanced';

export type CockpitType = 'prompt-reality' | 'retrieval-reality' | 'cost-reality' | 'agent-reality';

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface TimeRange {
  start: number;
  end: number;
  duration: number;
}

// ============================================
// RAG Module Types
// ============================================

export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  chunks?: Chunk[];
}

export interface DocumentMetadata {
  title: string;
  source: string;
  createdAt: Date;
  fileType: string;
  size: number;
  tags?: string[];
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  index: number;
  startOffset: number;
  endOffset: number;
  embedding?: number[];
  metadata?: ChunkMetadata;
}

export interface ChunkMetadata {
  tokenCount: number;
  overlap: number;
  parentChunkId?: string;
  childChunkIds?: string[];
}

export type ChunkingStrategy = 
  | 'fixed-size'
  | 'sentence'
  | 'paragraph'
  | 'semantic'
  | 'recursive'
  | 'parent-child';

export interface ChunkingConfig {
  strategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
  minChunkSize?: number;
  maxChunkSize?: number;
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
  rank: number;
  source: 'vector' | 'keyword' | 'hybrid';
  highlights?: string[];
}

export interface RerankedResult extends SearchResult {
  originalRank: number;
  rerankedScore: number;
}

export interface RAGPipelineState {
  documents: Document[];
  chunks: Chunk[];
  query: string;
  queryEmbedding?: number[];
  searchResults: SearchResult[];
  rerankedResults?: RerankedResult[];
  context: string;
  response?: string;
  timing: PipelineTiming;
}

export interface PipelineTiming {
  chunking: number;
  embedding: number;
  retrieval: number;
  reranking?: number;
  generation: number;
  total: number;
}

// ============================================
// Agent Module Types
// ============================================

export type AgentPattern = 
  | 'react'
  | 'reflection'
  | 'tool-use'
  | 'planning'
  | 'self-ask';

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  category: ToolCategory;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
}

export type ToolCategory = 
  | 'search'
  | 'code'
  | 'data'
  | 'communication'
  | 'file'
  | 'custom';

export interface AgentStep {
  id: string;
  type: StepType;
  content: string;
  timestamp: number;
  duration: number;
  metadata?: StepMetadata;
}

export type StepType = 
  | 'thought'
  | 'action'
  | 'observation'
  | 'reflection'
  | 'plan'
  | 'critique'
  | 'revision'
  | 'final-answer';

export interface StepMetadata {
  toolUsed?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  confidence?: number;
  iteration?: number;
}

export interface AgentState {
  id: string;
  pattern: AgentPattern;
  task: string;
  steps: AgentStep[];
  currentStep: number;
  status: AgentStatus;
  tools: Tool[];
  memory: AgentMemory;
  metrics: AgentMetrics;
}

export type AgentStatus = 
  | 'idle'
  | 'thinking'
  | 'acting'
  | 'observing'
  | 'reflecting'
  | 'completed'
  | 'error';

export interface AgentMemory {
  shortTerm: string[];
  longTerm: Map<string, unknown>;
  scratchpad: string;
}

export interface AgentMetrics {
  totalSteps: number;
  thoughtCount: number;
  actionCount: number;
  reflectionCount: number;
  toolCalls: number;
  totalTokens: number;
  executionTime: number;
}

// ============================================
// Multi-Agent Module Types
// ============================================

export type OrchestrationPattern = 
  | 'supervisor'
  | 'sequential'
  | 'parallel'
  | 'hierarchical'
  | 'debate'
  | 'swarm';

export interface MultiAgentConfig {
  pattern: OrchestrationPattern;
  agents: AgentConfig[];
  supervisor?: SupervisorConfig;
  communication: CommunicationConfig;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  tools: string[];
  systemPrompt: string;
  color?: string;
}

export interface SupervisorConfig {
  routingStrategy: 'round-robin' | 'capability-based' | 'load-balanced' | 'llm-routed';
  maxIterations: number;
  terminationCondition: string;
}

export interface CommunicationConfig {
  protocol: 'direct' | 'broadcast' | 'pub-sub';
  messageFormat: 'text' | 'structured' | 'a2a';
  historyEnabled: boolean;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string | 'all';
  type: MessageType;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type MessageType = 
  | 'task'
  | 'response'
  | 'query'
  | 'feedback'
  | 'delegation'
  | 'completion';

export interface MultiAgentState {
  config: MultiAgentConfig;
  messages: AgentMessage[];
  agentStates: Map<string, AgentState>;
  currentAgent: string | null;
  taskQueue: Task[];
  completedTasks: Task[];
  metrics: MultiAgentMetrics;
}

export interface Task {
  id: string;
  description: string;
  assignedTo?: string;
  status: TaskStatus;
  dependencies: string[];
  result?: unknown;
  createdAt: number;
  completedAt?: number;
}

export type TaskStatus = 
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'blocked';

export interface MultiAgentMetrics {
  totalMessages: number;
  agentContributions: Map<string, number>;
  averageResponseTime: number;
  taskCompletionRate: number;
  totalExecutionTime: number;
}

// ============================================
// Visualization Types
// ============================================

export interface VisualizationNode {
  id: string;
  label: string;
  type: string;
  position: Position;
  data?: Record<string, unknown>;
  style?: NodeStyle;
}

export interface NodeStyle {
  color: string;
  borderColor: string;
  backgroundColor: string;
  size: number;
  shape: 'circle' | 'rectangle' | 'diamond' | 'hexagon';
}

export interface VisualizationEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: EdgeType;
  animated?: boolean;
  style?: EdgeStyle;
}

export type EdgeType = 
  | 'default'
  | 'data-flow'
  | 'message'
  | 'dependency'
  | 'hierarchy';

export interface EdgeStyle {
  color: string;
  width: number;
  dashed?: boolean;
  curve?: 'straight' | 'bezier' | 'step';
}

export interface GraphLayout {
  type: 'force' | 'tree' | 'radial' | 'dagre' | 'grid';
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  spacing?: number;
}

// ============================================
// UI State Types
// ============================================

export interface AppState {
  activeModule: ModuleType;
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface UserPreferences {
  defaultModule: ModuleType;
  fontSize: 'small' | 'medium' | 'large';
}

// ============================================
// Example/Demo Types
// ============================================

export interface Example {
  id: string;
  title: string;
  description: string;
  module: ModuleType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  config: unknown;
}

export interface RAGExample extends Example {
  module: 'rag';
  config: {
    document: string;
    queries: string[];
    chunkingConfig: ChunkingConfig;
    highlightFeatures: string[];
  };
}

export interface AgentExample extends Example {
  module: 'agents';
  config: {
    pattern: AgentPattern;
    task: string;
    tools: string[];
    expectedSteps: number;
  };
}

export interface MultiAgentExample extends Example {
  module: 'multi-agent';
  config: {
    pattern: OrchestrationPattern;
    agents: Partial<AgentConfig>[];
    task: string;
  };
}

// ============================================
// API Response Types
// ============================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: number;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// Event Types
// ============================================

// ============================================
// Reasoning Techniques Module Types
// ============================================

export type ReasoningPatternCategory = 
  | 'linear-sequential'
  | 'modular-parallel'
  | 'iterative-self-correcting'
  | 'advanced-graph-memory';

export type ReasoningPattern = 
  | 'cot' // Chain-of-Thought
  | 'cod' // Chain-of-Draft
  | 'system2' // System 2 / Hidden CoT
  | 'aot' // Atom of Thought
  | 'sot' // Skeleton-of-Thought
  | 'tot' // Tree-of-Thought
  | 'react' // ReAct (Reason + Act)
  | 'reflection' // Reflection / Self-Critique
  | 'cove' // Chain-of-Verification
  | 'got' // Graph-of-Thought
  | 'bot'; // Buffer-of-Thought

export interface ReasoningStep {
  id: string;
  type: ReasoningStepType;
  content: string;
  timestamp: number;
  duration: number;
  metadata?: ReasoningStepMetadata;
}

export type ReasoningStepType = 
  | 'thought'
  | 'draft'
  | 'atom'
  | 'branch'
  | 'evaluation'
  | 'pruning'
  | 'action'
  | 'observation'
  | 'critique'
  | 'verification'
  | 'correction'
  | 'merge'
  | 'retrieval'
  | 'final-answer';

export interface ReasoningStepMetadata {
  confidence?: number;
  branchId?: string;
  parentId?: string;
  childrenIds?: string[];
  atomType?: string;
  evaluationScore?: number;
  toolUsed?: string;
  verificationResult?: 'pass' | 'fail' | 'partial';
}

export interface ReasoningNode {
  id: string;
  label: string;
  type: ReasoningStepType;
  content: string;
  position?: Position;
  connections?: string[];
  metadata?: ReasoningStepMetadata;
}

export interface ReasoningState {
  pattern: ReasoningPattern;
  category: ReasoningPatternCategory;
  problem: string;
  steps: ReasoningStep[];
  nodes: ReasoningNode[];
  currentStep: number;
  status: ReasoningStatus;
  finalAnswer?: string;
  metrics: ReasoningMetrics;
}

export type ReasoningStatus = 
  | 'idle'
  | 'thinking'
  | 'drafting'
  | 'branching'
  | 'evaluating'
  | 'verifying'
  | 'correcting'
  | 'completed'
  | 'error';

export interface ReasoningMetrics {
  totalSteps: number;
  totalBranches?: number;
  prunedBranches?: number;
  atomsCreated?: number;
  verificationsPerformed?: number;
  correctionsMade?: number;
  totalTokens: number;
  executionTime: number;
  accuracy?: number;
}

export interface ReasoningPatternInfo {
  id: ReasoningPattern;
  name: string;
  category: ReasoningPatternCategory;
  description: string;
  mentalModel: string;
  bestFor: string;
  vibe: string;
  examplePrompt: string;
  visualizationType: 'linear' | 'tree' | 'graph' | 'atoms' | 'iterative';
}

export type PlaygroundEvent = 
  | { type: 'CHUNK_CREATED'; payload: Chunk }
  | { type: 'SEARCH_COMPLETED'; payload: SearchResult[] }
  | { type: 'AGENT_STEP'; payload: AgentStep }
  | { type: 'MESSAGE_SENT'; payload: AgentMessage }
  | { type: 'TASK_COMPLETED'; payload: Task }
  | { type: 'REASONING_STEP'; payload: ReasoningStep }
  | { type: 'ERROR'; payload: APIError };
