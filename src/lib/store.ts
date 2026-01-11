/**
 * AI Learning Playground - Global State Store
 * 
 * Zustand store for managing application state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  ModuleType,
  AppState,
  Notification,
  UserPreferences,
  RAGPipelineState,
  AgentState,
  MultiAgentState,
  ChunkingConfig,
  AgentPattern,
  OrchestrationPattern,
  Chunk,
} from '@/types';
import { generateId } from '@/lib/utils';

// ============================================
// App Store
// ============================================

interface AppStore extends AppState {
  // Actions
  setActiveModule: (module: ModuleType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        activeModule: 'rag',
        sidebarOpen: true,
        theme: 'dark',
        notifications: [],

        // Actions
        setActiveModule: (module) => set({ activeModule: module }),
        
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        toggleTheme: () =>
          set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
        
        addNotification: (notification) =>
          set((state) => ({
            notifications: [
              {
                ...notification,
                id: generateId('notif'),
                timestamp: Date.now(),
                read: false,
              },
              ...state.notifications,
            ].slice(0, 50), // Keep last 50 notifications
          })),
        
        markNotificationRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          })),
        
        clearNotifications: () => set({ notifications: [] }),
      }),
      {
        name: 'ai-playground-app',
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          theme: state.theme,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);

// ============================================
// User Preferences Store
// ============================================

interface PreferencesStore extends UserPreferences {
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  defaultModule: 'rag',
  animationsEnabled: true,
  codeTheme: 'one-dark',
  fontSize: 'medium',
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      
      updatePreferences: (prefs) => set((state) => ({ ...state, ...prefs })),
      
      resetPreferences: () => set(defaultPreferences),
    }),
    { name: 'ai-playground-preferences' }
  )
);

// ============================================
// RAG Module Store
// ============================================

interface RAGStore {
  // State
  pipelineState: RAGPipelineState | null;
  chunkingConfig: ChunkingConfig;
  isProcessing: boolean;
  selectedChunkId: string | null;
  
  // Actions
  setChunkingConfig: (config: Partial<ChunkingConfig>) => void;
  setPipelineState: (state: Partial<RAGPipelineState>) => void;
  setProcessing: (processing: boolean) => void;
  selectChunk: (id: string | null) => void;
  resetRAGState: () => void;
  
  // Demo actions
  runDemoQuery: (query: string, document: string) => Promise<void>;
}

const defaultChunkingConfig: ChunkingConfig = {
  strategy: 'recursive',
  chunkSize: 500,
  chunkOverlap: 50,
  separators: ['\n\n', '\n', '. ', ' '],
};

export const useRAGStore = create<RAGStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      pipelineState: null,
      chunkingConfig: defaultChunkingConfig,
      isProcessing: false,
      selectedChunkId: null,

      // Actions
      setChunkingConfig: (config) =>
        set((state) => ({
          chunkingConfig: { ...state.chunkingConfig, ...config },
        })),

      setPipelineState: (newState) =>
        set((state) => ({
          pipelineState: state.pipelineState
            ? { ...state.pipelineState, ...newState }
            : (newState as RAGPipelineState),
        })),

      setProcessing: (processing) => set({ isProcessing: processing }),

      selectChunk: (id) => set({ selectedChunkId: id }),

      resetRAGState: () =>
        set({
          pipelineState: null,
          isProcessing: false,
          selectedChunkId: null,
        }),

      // Demo query execution
      runDemoQuery: async (query: string, document: string) => {
        const { chunkingConfig } = get();
        set({ isProcessing: true });

        try {
          // Add small delay to show processing state
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Validate inputs
          if (!document || document.trim().length === 0) {
            console.warn('Empty document provided');
            set({ isProcessing: false });
            return;
          }

          if (!query || query.trim().length === 0) {
            console.warn('Empty query provided');
            set({ isProcessing: false });
            return;
          }

          // Simulate chunking
          const chunks = simulateChunking(document, chunkingConfig);
          
          if (chunks.length === 0) {
            console.warn('No chunks generated');
            set({ isProcessing: false });
            return;
          }

          // Generate embeddings for chunks
          const chunksWithEmbeddings = chunks.map(chunk => ({
            ...chunk,
            embedding: generateMockEmbedding(chunk.content, 384),
          }));

          // Generate query embedding
          const queryEmbedding = generateMockEmbedding(query, 384);

          // Simulate search
          const searchResults = simulateSearch(chunksWithEmbeddings, query);
          
          // Update state progressively
          set({
            pipelineState: {
              documents: [
                {
                  id: generateId('doc'),
                  content: document,
                  metadata: {
                    title: 'Sample Document',
                    source: 'demo',
                    createdAt: new Date(),
                    fileType: 'text',
                    size: document.length,
                  },
                  chunks: chunksWithEmbeddings,
                },
              ],
              chunks: chunksWithEmbeddings,
              query,
              queryEmbedding,
              searchResults,
              context: searchResults.slice(0, 3).map((r) => r.chunk.content).join('\n\n'),
              timing: {
                chunking: 150,
                embedding: 200,
                retrieval: 100,
                generation: 500,
                total: 950,
              },
            },
            isProcessing: false,
          });
        } catch (error) {
          console.error('RAG demo error:', error);
          set({ 
            isProcessing: false,
            pipelineState: null,
          });
        }
      },
    }),
    { name: 'RAGStore' }
  )
);

// Helper function for demo chunking simulation
function simulateChunking(text: string, config: ChunkingConfig) {
  const { chunkSize, chunkOverlap } = config;
  const chunks = [];
  let start = 0;
  let index = 0;
  const maxIterations = 10000; // Safety limit to prevent infinite loops
  let iterations = 0;

  // Ensure chunkOverlap is less than chunkSize to prevent infinite loops
  const safeOverlap = Math.min(chunkOverlap, Math.max(1, chunkSize - 1));

  while (start < text.length && iterations < maxIterations) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      id: generateId('chunk'),
      documentId: 'demo',
      content: text.slice(start, end),
      index,
      startOffset: start,
      endOffset: end,
      metadata: {
        tokenCount: Math.ceil((end - start) / 4),
        overlap: index > 0 ? safeOverlap : 0,
      },
    });
    
    // Calculate next start position
    const nextStart = end - safeOverlap;
    
    // Safety check: ensure we always advance
    if (nextStart <= start) {
      start = end; // Move to end if we're not advancing
    } else {
      start = nextStart;
    }
    
    index++;
    iterations++;
  }

  if (iterations >= maxIterations) {
    console.warn('Chunking reached max iterations, may have infinite loop');
  }

  return chunks;
}

// Helper function to generate mock embeddings
function generateMockEmbedding(text: string, dimensions: number = 384): number[] {
  // Simple hash-based embedding for consistency
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const embedding: number[] = [];
  for (let i = 0; i < dimensions; i++) {
    const seed = hash + i * 7919; // Prime number for better distribution
    embedding.push((Math.sin(seed) * 0.1) + (Math.random() * 0.05 - 0.025));
  }
  
  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / norm);
}

// Helper function for demo search simulation
function simulateSearch(chunks: Array<Chunk & { embedding?: number[] }>, query: string) {
  const queryTerms = query.toLowerCase().split(/\s+/);
  
  return chunks
    .map((chunk) => {
      const content = chunk.content.toLowerCase();
      const score = queryTerms.reduce((acc, term) => {
        return acc + (content.includes(term) ? 0.3 : 0);
      }, Math.random() * 0.4);
      
      return {
        chunk,
        score: Math.min(score, 1),
        rank: 0,
        source: 'vector' as const,
        highlights: queryTerms.filter((t) => content.includes(t)),
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((result, index) => ({ ...result, rank: index + 1 }));
}

// ============================================
// Agent Module Store
// ============================================

interface AgentStore {
  // State
  agentState: AgentState | null;
  selectedPattern: AgentPattern;
  isRunning: boolean;
  currentStepIndex: number;
  
  // Actions
  setPattern: (pattern: AgentPattern) => void;
  setAgentState: (state: Partial<AgentState>) => void;
  setRunning: (running: boolean) => void;
  setCurrentStep: (index: number) => void;
  resetAgentState: () => void;
  
  // Demo actions
  runDemoTask: (task: string, pattern: AgentPattern) => Promise<void>;
}

export const useAgentStore = create<AgentStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      agentState: null,
      selectedPattern: 'react',
      isRunning: false,
      currentStepIndex: 0,

      // Actions
      setPattern: (pattern) => set({ selectedPattern: pattern }),

      setAgentState: (newState) =>
        set((state) => ({
          agentState: state.agentState
            ? { ...state.agentState, ...newState }
            : (newState as AgentState),
        })),

      setRunning: (running) => set({ isRunning: running }),

      setCurrentStep: (index) => set({ currentStepIndex: index }),

      resetAgentState: () =>
        set({
          agentState: null,
          isRunning: false,
          currentStepIndex: 0,
        }),

      // Demo task execution
      runDemoTask: async (task: string, pattern: AgentPattern) => {
        set({ isRunning: true, currentStepIndex: 0 });

        const steps = generateDemoSteps(task, pattern);
        const agentId = generateId('agent');

        set({
          agentState: {
            id: agentId,
            pattern,
            task,
            steps: [],
            currentStep: 0,
            status: 'thinking',
            tools: [
              {
                id: 'search',
                name: 'web_search',
                description: 'Search the web for information',
                parameters: [
                  { name: 'query', type: 'string', description: 'Search query', required: true },
                ],
                category: 'search',
              },
              {
                id: 'calculate',
                name: 'calculator',
                description: 'Perform mathematical calculations',
                parameters: [
                  { name: 'expression', type: 'string', description: 'Math expression', required: true },
                ],
                category: 'data',
              },
            ],
            memory: {
              shortTerm: [],
              longTerm: new Map(),
              scratchpad: '',
            },
            metrics: {
              totalSteps: 0,
              thoughtCount: 0,
              actionCount: 0,
              reflectionCount: 0,
              toolCalls: 0,
              totalTokens: 0,
              executionTime: 0,
            },
          },
        });

        // Simulate step-by-step execution
        for (let i = 0; i < steps.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          
          const { agentState } = get();
          if (!agentState) break;

          const currentStep = steps[i];
          const updatedSteps = [...agentState.steps, currentStep];
          const isLastStep = i === steps.length - 1;
          
          set({
            agentState: {
              ...agentState,
              steps: updatedSteps,
              currentStep: i,
              status: isLastStep ? 'completed' : agentState.status,
              metrics: {
                ...agentState.metrics,
                totalSteps: updatedSteps.length,
                thoughtCount: updatedSteps.filter((s) => s.type === 'thought').length,
                actionCount: updatedSteps.filter((s) => s.type === 'action').length,
                reflectionCount: updatedSteps.filter((s) => s.type === 'reflection').length,
                toolCalls: updatedSteps.filter((s) => s.metadata?.toolUsed).length,
              },
            },
            currentStepIndex: isLastStep ? steps.length - 1 : i,
          });
        }

        set({ isRunning: false });
      },
    }),
    { name: 'AgentStore' }
  )
);

// Helper function to generate demo steps
import type { AgentStep } from '@/types';

function generateDemoSteps(task: string, pattern: AgentPattern): AgentStep[] {
  const steps: AgentStep[] = [];
  let timestamp = Date.now();

  switch (pattern) {
    case 'react': {
      // ReAct: Reasoning + Acting in interleaved manner
      steps.push(
        {
          id: generateId('step'),
          type: 'thought' as const,
          content: `I need to understand the task: "${task}". Let me think about what information I need.`,
          timestamp: timestamp,
          duration: 150,
        },
        {
          id: generateId('step'),
          type: 'action' as const,
          content: 'Searching for relevant information to understand the topic better...',
          timestamp: timestamp += 200,
          duration: 300,
          metadata: {
            toolUsed: 'web_search',
            toolInput: { query: task.slice(0, 50) },
            toolOutput: 'Found 5 relevant results',
          },
        },
        {
          id: generateId('step'),
          type: 'observation' as const,
          content: 'The search returned useful information. I found key concepts and recent developments related to the topic.',
          timestamp: timestamp += 600,
          duration: 100,
        },
        {
          id: generateId('step'),
          type: 'thought' as const,
          content: 'Now I have enough context. Let me synthesize this information into a comprehensive answer.',
          timestamp: timestamp += 200,
          duration: 150,
        },
        {
          id: generateId('step'),
          type: 'final-answer' as const,
          content: `Based on my research and analysis, here is the answer to your question about "${task}": The key findings show...`,
          timestamp: timestamp += 300,
          duration: 200,
        }
      );
      break;
    }

    case 'reflection': {
      // Reflection: Self-critique and improvement loop
      steps.push(
        {
          id: generateId('step'),
          type: 'thought' as const,
          content: `I need to address: "${task}". Let me generate an initial response.`,
          timestamp: timestamp,
          duration: 150,
        },
        {
          id: generateId('step'),
          type: 'action' as const,
          content: 'Generating initial response based on available knowledge...',
          timestamp: timestamp += 200,
          duration: 300,
        },
        {
          id: generateId('step'),
          type: 'reflection' as const,
          content: 'Let me evaluate my approach. The initial response covers the basics, but I should verify accuracy and add more depth.',
          timestamp: timestamp += 400,
          duration: 200,
        },
        {
          id: generateId('step'),
          type: 'critique' as const,
          content: 'My initial response could be more specific. I should include concrete examples, data points, and address potential edge cases.',
          timestamp: timestamp += 300,
          duration: 150,
        },
        {
          id: generateId('step'),
          type: 'revision' as const,
          content: 'Revising my response to incorporate the critique. Adding specific examples and verifying claims.',
          timestamp: timestamp += 200,
          duration: 200,
        },
        {
          id: generateId('step'),
          type: 'final-answer' as const,
          content: `After reflection and revision, here is my improved answer to "${task}": [Enhanced response with examples and verified information]...`,
          timestamp: timestamp += 300,
          duration: 200,
        }
      );
      break;
    }

    case 'tool-use': {
      // Tool Use: Direct tool invocation based on need
      steps.push(
        {
          id: generateId('step'),
          type: 'thought' as const,
          content: `Task: "${task}". I need to identify which tools would be most helpful for this task.`,
          timestamp: timestamp,
          duration: 150,
        },
        {
          id: generateId('step'),
          type: 'action' as const,
          content: 'Analyzing task requirements and selecting appropriate tools. This task requires web search capabilities.',
          timestamp: timestamp += 200,
          duration: 200,
        },
        {
          id: generateId('step'),
          type: 'action' as const,
          content: 'Executing web_search tool to gather information...',
          timestamp: timestamp += 300,
          duration: 400,
          metadata: {
            toolUsed: 'web_search',
            toolInput: { query: task },
            toolOutput: 'Retrieved comprehensive information',
          },
        },
        {
          id: generateId('step'),
          type: 'thought' as const,
          content: 'Tool execution completed. Now I need to synthesize the retrieved information into a coherent answer.',
          timestamp: timestamp += 500,
          duration: 150,
        },
        {
          id: generateId('step'),
          type: 'final-answer' as const,
          content: `Based on the tool results, here is the answer to "${task}": [Synthesized information from tools]...`,
          timestamp: timestamp += 200,
          duration: 200,
        }
      );
      break;
    }

    case 'planning': {
      // Planning: Plan-then-execute approach
      steps.push(
        {
          id: generateId('step'),
          type: 'thought' as const,
          content: `Task: "${task}". Let me decompose this into smaller, manageable sub-tasks.`,
          timestamp: timestamp,
          duration: 150,
        },
        {
          id: generateId('step'),
          type: 'plan' as const,
          content: 'Plan: 1) Research the topic, 2) Identify key points, 3) Organize information, 4) Synthesize into answer',
          timestamp: timestamp += 200,
          duration: 200,
        },
        {
          id: generateId('step'),
          type: 'action' as const,
          content: 'Executing step 1: Researching the topic using web search...',
          timestamp: timestamp += 300,
          duration: 400,
          metadata: {
            toolUsed: 'web_search',
            toolInput: { query: task },
            toolOutput: 'Research completed',
          },
        },
        {
          id: generateId('step'),
          type: 'action' as const,
          content: 'Executing step 2-3: Identifying key points and organizing information...',
          timestamp: timestamp += 500,
          duration: 300,
        },
        {
          id: generateId('step'),
          type: 'thought' as const,
          content: 'Verifying that all planned steps are complete and the answer addresses the task comprehensively.',
          timestamp: timestamp += 400,
          duration: 150,
        },
        {
          id: generateId('step'),
          type: 'final-answer' as const,
          content: `Following the plan, here is the comprehensive answer to "${task}": [Organized and synthesized response]...`,
          timestamp: timestamp += 200,
          duration: 200,
        }
      );
      break;
    }
  }

  return steps;
}

// ============================================
// Multi-Agent Module Store
// ============================================

interface MultiAgentStore {
  // State
  multiAgentState: MultiAgentState | null;
  selectedPattern: OrchestrationPattern;
  isRunning: boolean;
  
  // Actions
  setPattern: (pattern: OrchestrationPattern) => void;
  setMultiAgentState: (state: Partial<MultiAgentState>) => void;
  setRunning: (running: boolean) => void;
  resetMultiAgentState: () => void;
  
  // Demo actions
  runDemoOrchestration: (task: string, pattern: OrchestrationPattern) => Promise<void>;
}

export const useMultiAgentStore = create<MultiAgentStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      multiAgentState: null,
      selectedPattern: 'supervisor',
      isRunning: false,

      // Actions
      setPattern: (pattern) => set({ selectedPattern: pattern }),

      setMultiAgentState: (newState) =>
        set((state) => ({
          multiAgentState: state.multiAgentState
            ? { ...state.multiAgentState, ...newState }
            : (newState as MultiAgentState),
        })),

      setRunning: (running) => set({ isRunning: running }),

      resetMultiAgentState: () =>
        set({
          multiAgentState: null,
          isRunning: false,
        }),

      // Demo orchestration
      runDemoOrchestration: async (task: string, pattern: OrchestrationPattern) => {
        set({ isRunning: true });

        const agents = [
          { id: 'researcher', name: 'Researcher', role: 'Research and gather information', color: '#06b6d4' },
          { id: 'writer', name: 'Writer', role: 'Create content based on research', color: '#8b5cf6' },
          { id: 'reviewer', name: 'Reviewer', role: 'Review and improve content', color: '#10b981' },
        ];

        set({
          multiAgentState: {
            config: {
              pattern,
              agents: agents.map((a) => ({
                ...a,
                description: a.role,
                tools: ['search', 'write'],
                systemPrompt: `You are a ${a.role} assistant.`,
              })),
              communication: {
                protocol: 'direct',
                messageFormat: 'structured',
                historyEnabled: true,
              },
            },
            messages: [],
            agentStates: new Map(),
            currentAgent: null,
            taskQueue: [
              {
                id: generateId('task'),
                description: task,
                status: 'pending',
                dependencies: [],
                createdAt: Date.now(),
              },
            ],
            completedTasks: [],
            metrics: {
              totalMessages: 0,
              agentContributions: new Map(),
              averageResponseTime: 0,
              taskCompletionRate: 0,
              totalExecutionTime: 0,
            },
          },
        });

        // Simulate message flow
        const demoMessages = generateDemoMessages(task, agents, pattern);
        const startTime = Date.now();
        
        for (let i = 0; i < demoMessages.length; i++) {
          const message = demoMessages[i];
          await new Promise((resolve) => setTimeout(resolve, 600));
          
          const { multiAgentState } = get();
          if (!multiAgentState) break;

          const isLastMessage = i === demoMessages.length - 1;
          const updatedMessages = [...multiAgentState.messages, message];
          
          // Update task completion
          let updatedTaskQueue = [...multiAgentState.taskQueue];
          let updatedCompletedTasks = [...multiAgentState.completedTasks];
          
          if (isLastMessage && message.type === 'completion') {
            // Move task from queue to completed
            updatedTaskQueue = updatedTaskQueue.map(t => 
              t.id === multiAgentState.taskQueue[0]?.id 
                ? { ...t, status: 'completed' as const, completedAt: Date.now() }
                : t
            );
            const completedTask = updatedTaskQueue.find(t => t.status === 'completed');
            if (completedTask) {
              updatedCompletedTasks.push(completedTask);
              updatedTaskQueue = updatedTaskQueue.filter(t => t.id !== completedTask.id);
            }
          }

          // Calculate metrics
          const totalExecutionTime = Date.now() - startTime;
          const averageResponseTime = updatedMessages.length > 0 
            ? totalExecutionTime / updatedMessages.length 
            : 0;
          const taskCompletionRate = multiAgentState.taskQueue.length > 0
            ? updatedCompletedTasks.length / (updatedCompletedTasks.length + updatedTaskQueue.length)
            : 0;

          // Update agent states
          const updatedAgentStates = new Map(multiAgentState.agentStates);
          if (message.from !== 'supervisor' && message.from !== 'all') {
            // For multi-agent, we store simplified state info
            // The full AgentState type is for single-agent patterns
            const existingState = updatedAgentStates.get(message.from);
            if (existingState) {
              // Keep existing state, just update if needed
              updatedAgentStates.set(message.from, existingState);
            } else {
              // Create a minimal state entry (we'll use a simplified structure)
              // Note: This is a workaround since AgentState is for single-agent patterns
              updatedAgentStates.set(message.from, {
                id: message.from,
                pattern: 'react',
                task: task,
                steps: [],
                currentStep: 0,
                status: isLastMessage ? 'idle' : 'thinking',
                tools: [],
                memory: { shortTerm: [], longTerm: new Map(), scratchpad: '' },
                metrics: {
                  totalSteps: 0,
                  thoughtCount: 0,
                  actionCount: 0,
                  reflectionCount: 0,
                  toolCalls: 0,
                  totalTokens: 0,
                  executionTime: 0,
                },
              });
            }
          }

          set({
            multiAgentState: {
              ...multiAgentState,
              messages: updatedMessages,
              currentAgent: message.from === 'all' ? null : message.from,
              taskQueue: updatedTaskQueue,
              completedTasks: updatedCompletedTasks,
              agentStates: updatedAgentStates,
              metrics: {
                ...multiAgentState.metrics,
                totalMessages: updatedMessages.length,
                averageResponseTime,
                taskCompletionRate,
                totalExecutionTime,
              },
            },
          });
        }

        set({ isRunning: false });
      },
    }),
    { name: 'MultiAgentStore' }
  )
);

// Helper function to generate demo messages
function generateDemoMessages(
  task: string,
  agents: Array<{ id: string; name: string }>,
  pattern: OrchestrationPattern
): Array<import('@/types').AgentMessage> {
  const baseTime = Date.now();
  let timestamp = baseTime;

  switch (pattern) {
    case 'supervisor': {
      // Supervisor: Central coordinator delegates to workers
      return [
        {
          id: generateId('msg'),
          from: 'supervisor',
          to: agents[0].id,
          type: 'task',
          content: `Research the following topic: ${task}`,
          timestamp: timestamp,
        },
        {
          id: generateId('msg'),
          from: agents[0].id,
          to: 'supervisor',
          type: 'response',
          content: 'I have gathered comprehensive information on the topic. Key findings include...',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: 'supervisor',
          to: agents[1].id,
          type: 'delegation',
          content: 'Based on the research, please create a draft document.',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: agents[1].id,
          to: 'supervisor',
          type: 'response',
          content: 'Draft completed. The document covers all main points from the research.',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: 'supervisor',
          to: agents[2].id,
          type: 'delegation',
          content: 'Please review the draft and suggest improvements.',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: agents[2].id,
          to: 'supervisor',
          type: 'feedback',
          content: 'Review complete. Suggested 3 improvements for clarity and accuracy.',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: 'supervisor',
          to: 'all',
          type: 'completion',
          content: 'Task completed successfully. Final output has been generated.',
          timestamp: timestamp += 500,
        },
      ];
    }

    case 'sequential': {
      // Sequential: Agents work one after another
      return [
        {
          id: generateId('msg'),
          from: agents[0].id,
          to: agents[1].id,
          type: 'task',
          content: `Starting sequential workflow. Researching: ${task}`,
          timestamp: timestamp,
        },
        {
          id: generateId('msg'),
          from: agents[0].id,
          to: agents[1].id,
          type: 'response',
          content: 'Research complete. Passing findings to next agent.',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: agents[1].id,
          to: agents[2].id,
          type: 'task',
          content: 'Creating document based on research findings.',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: agents[1].id,
          to: agents[2].id,
          type: 'response',
          content: 'Document draft completed. Ready for review.',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: agents[2].id,
          to: 'all',
          type: 'completion',
          content: 'Sequential workflow complete. Final reviewed document ready.',
          timestamp: timestamp += 1000,
        },
      ];
    }

    case 'parallel': {
      // Parallel: Agents work simultaneously
      return [
        {
          id: generateId('msg'),
          from: 'supervisor',
          to: 'all',
          type: 'task',
          content: `Parallel execution starting. Task: ${task}`,
          timestamp: timestamp,
        },
        {
          id: generateId('msg'),
          from: agents[0].id,
          to: 'supervisor',
          type: 'response',
          content: 'Researching topic in parallel...',
          timestamp: timestamp += 500,
        },
        {
          id: generateId('msg'),
          from: agents[1].id,
          to: 'supervisor',
          type: 'response',
          content: 'Drafting content structure in parallel...',
          timestamp: timestamp += 500,
        },
        {
          id: generateId('msg'),
          from: agents[2].id,
          to: 'supervisor',
          type: 'response',
          content: 'Preparing review framework in parallel...',
          timestamp: timestamp += 500,
        },
        {
          id: generateId('msg'),
          from: 'supervisor',
          to: 'all',
          type: 'delegation',
          content: 'Synthesizing parallel outputs...',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: 'supervisor',
          to: 'all',
          type: 'completion',
          content: 'Parallel execution complete. All agents finished simultaneously.',
          timestamp: timestamp += 1000,
        },
      ];
    }

    case 'hierarchical': {
      // Hierarchical: Multi-level delegation tree
      return [
        {
          id: generateId('msg'),
          from: 'supervisor',
          to: agents[0].id,
          type: 'task',
          content: `Top-level task: ${task}. Delegate research subtasks.`,
          timestamp: timestamp,
        },
        {
          id: generateId('msg'),
          from: agents[0].id,
          to: agents[1].id,
          type: 'delegation',
          content: 'Level 2: Researching primary sources...',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: agents[1].id,
          to: agents[2].id,
          type: 'delegation',
          content: 'Level 3: Analyzing research data...',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: agents[2].id,
          to: agents[1].id,
          type: 'response',
          content: 'Level 3 complete. Returning to level 2.',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: agents[1].id,
          to: agents[0].id,
          type: 'response',
          content: 'Level 2 complete. Returning to level 1.',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: agents[0].id,
          to: 'supervisor',
          type: 'response',
          content: 'Hierarchical task complete. All levels finished.',
          timestamp: timestamp += 1000,
        },
        {
          id: generateId('msg'),
          from: 'supervisor',
          to: 'all',
          type: 'completion',
          content: 'Hierarchical workflow complete.',
          timestamp: timestamp += 500,
        },
      ];
    }

    default: {
      // Default to supervisor pattern
      return generateDemoMessages(task, agents, 'supervisor');
    }
  }
}
