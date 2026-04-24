import type { A2AScenario, A2AAgentCard } from './types';

const assistantAgent: A2AAgentCard = {
  name: 'General Assistant',
  description: 'A general-purpose AI assistant that delegates specialized tasks to domain agents.',
  version: '1.0.0',
  protocolVersions: ['0.3.0'],
  provider: { organization: 'AI Playground', url: 'https://ai-playground.example' },
  supportedInterfaces: [{ url: 'https://assistant.example/a2a/v1', protocolBinding: 'JSONRPC' }],
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['text/plain', 'application/json'],
  capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: true },
  skills: [
    { id: 'general-qa', name: 'Q&A', description: 'Answer questions on any topic', tags: ['qa', 'general'], examples: ['What is the capital of France?'] },
    { id: 'task-delegation', name: 'Task Delegation', description: 'Delegate to specialist agents', tags: ['orchestration'], examples: ['Research latest AI papers'] },
  ],
};

const researchAgent: A2AAgentCard = {
  name: 'Research Specialist',
  description: 'Deep research agent specialized in literature review, citation finding, and synthesis.',
  version: '2.1.0',
  protocolVersions: ['0.3.0'],
  provider: { organization: 'Research Labs', url: 'https://research-labs.example' },
  supportedInterfaces: [{ url: 'https://research.example/a2a/v1', protocolBinding: 'JSONRPC' }],
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['text/plain', 'application/json', 'application/pdf'],
  capabilities: { streaming: true, pushNotifications: true, stateTransitionHistory: true },
  skills: [
    { id: 'literature-review', name: 'Literature Review', description: 'Find and synthesize academic papers', tags: ['research', 'academic', 'papers'], examples: ['Summarize 2024 papers on LLM fine-tuning', 'Find citations for RAG survey'] },
    { id: 'fact-check', name: 'Fact Check', description: 'Verify claims against trusted sources', tags: ['verification', 'accuracy'], examples: ['Is this statistic accurate?'] },
    { id: 'citation-format', name: 'Citation Formatting', description: 'Format citations in APA, MLA, Chicago', tags: ['formatting', 'academic'], examples: ['Format these papers in APA'] },
  ],
};

const langGraphAgent: A2AAgentCard = {
  name: 'LangGraph Workflow',
  description: 'Agentic workflow orchestrator built on LangGraph — manages multi-step stateful workflows.',
  version: '3.0.0',
  protocolVersions: ['0.3.0'],
  provider: { organization: 'LangChain Inc', url: 'https://langchain.com' },
  supportedInterfaces: [{ url: 'https://workflows.langchain.com/a2a/v1', protocolBinding: 'JSONRPC' }],
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['text/plain', 'application/json'],
  capabilities: { streaming: true, pushNotifications: true, stateTransitionHistory: true },
  skills: [
    { id: 'code-review', name: 'Code Review', description: 'Multi-step automated code review with lint, test, security scan', tags: ['code', 'quality', 'review'], examples: ['Review this PR', 'Check for security issues in auth module'] },
    { id: 'data-pipeline', name: 'Data Pipeline', description: 'ETL pipeline execution with error handling', tags: ['data', 'etl', 'pipeline'], examples: ['Process this CSV and output summary stats'] },
  ],
};

const crewAIAgent: A2AAgentCard = {
  name: 'CrewAI Support Crew',
  description: 'Customer support crew built on CrewAI — routes, triages, and resolves support tickets with specialized sub-agents.',
  version: '1.5.0',
  protocolVersions: ['0.3.0'],
  provider: { organization: 'CrewAI', url: 'https://crewai.com' },
  supportedInterfaces: [{ url: 'https://support.crewai.example/a2a/v1', protocolBinding: 'JSONRPC' }],
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['text/plain', 'application/json'],
  capabilities: { streaming: false, pushNotifications: true, stateTransitionHistory: false },
  skills: [
    { id: 'ticket-triage', name: 'Ticket Triage', description: 'Classify and route support tickets', tags: ['support', 'triage', 'routing'], examples: ['Triage this bug report', 'Route this billing question'] },
    { id: 'ticket-resolve', name: 'Ticket Resolution', description: 'Resolve common support issues autonomously', tags: ['support', 'resolution'], examples: ['Resolve password reset issue', 'Help with billing inquiry'] },
  ],
};

export const twoAgentDelegationScenario: A2AScenario = {
  id: 'two-agent-delegation',
  name: 'Two-Agent Delegation',
  description: 'A general assistant agent delegates a research task to a specialist research agent. Shows the complete A2A lifecycle: discovery → sendMessage → submitted → working → completed.',
  callerAgent: assistantAgent,
  calleeAgent: researchAgent,
  steps: [
    {
      direction: 'caller→callee',
      method: 'GET /.well-known/agent.json',
      delayMs: 600,
      annotation: 'Caller fetches the callee\'s Agent Card to discover capabilities and validate it supports the required skill.',
      payload: { jsonrpc: '2.0', method: 'GET /.well-known/agent.json', params: {}, id: 0 },
    },
    {
      direction: 'callee→caller',
      delayMs: 400,
      annotation: 'Callee returns its Agent Card — name, skills, capabilities, supported input/output modes, authentication.',
      payload: { jsonrpc: '2.0', result: researchAgent, id: 0 },
    },
    {
      direction: 'caller→callee',
      method: 'a2a_sendMessage',
      delayMs: 600,
      annotation: 'Caller sends the task using a2a_sendMessage with a user-role message. The task prompt targets the literature-review skill.',
      payload: {
        jsonrpc: '2.0',
        method: 'a2a_sendMessage',
        params: {
          message: {
            messageId: 'msg-001',
            contextId: 'ctx-research-42',
            role: 'user',
            parts: [
              { kind: 'text', text: 'Summarize the five most important papers on LLM fine-tuning published in 2024.' },
              { kind: 'data', data: { skillId: 'literature-review', yearRange: '2024' } },
            ],
          },
          configuration: { returnImmediately: false, historyLength: 5, acceptedOutputModes: ['text/plain', 'application/json'] },
        },
        id: 1,
      },
      stateAfter: 'submitted',
    },
    {
      direction: 'callee→caller',
      delayMs: 400,
      annotation: 'Callee acknowledges the task — state is submitted. Caller receives a taskId to track progress.',
      payload: {
        jsonrpc: '2.0',
        result: {
          kind: 'task',
          id: 'task-8c2f3b21',
          contextId: 'ctx-research-42',
          status: { state: 'submitted', message: { role: 'agent', parts: [{ kind: 'text', text: 'Starting literature review for 2024 LLM fine-tuning papers.' }] }, timestamp: new Date().toISOString() },
          artifacts: [],
          history: [],
        },
        id: 1,
      },
      stateAfter: 'submitted',
    },
    {
      direction: 'callee→caller',
      method: 'SSE: statusUpdate',
      delayMs: 1200,
      annotation: 'Callee streams a status update via SSE — state transitions to working.',
      payload: {
        jsonrpc: '2.0',
        result: { statusUpdate: { taskId: 'task-8c2f3b21', contextId: 'ctx-research-42', status: { state: 'working', message: { role: 'agent', parts: [{ kind: 'text', text: 'Searching arXiv and Semantic Scholar for 2024 fine-tuning papers…' }] }, timestamp: new Date().toISOString() } } },
        id: 'sse-1',
      },
      stateAfter: 'working',
    },
    {
      direction: 'callee→caller',
      method: 'SSE: artifactUpdate',
      delayMs: 1400,
      annotation: 'Callee streams a partial artifact — the summary is being built chunk by chunk.',
      payload: {
        jsonrpc: '2.0',
        result: {
          artifactUpdate: {
            taskId: 'task-8c2f3b21',
            artifact: { artifactId: 'art-001', name: 'Literature Summary', parts: [{ kind: 'text', text: '**1. RLHF-V** (Feb 2024): Introduces visual instruction tuning for multimodal LLMs using 1.4k human feedback annotations…' }] },
            append: true,
            lastChunk: false,
          },
        },
        id: 'sse-2',
      },
      stateAfter: 'working',
    },
    {
      direction: 'callee→caller',
      method: 'SSE: statusUpdate',
      delayMs: 1600,
      annotation: 'Final status update — task is completed. The full artifact is now available.',
      payload: {
        jsonrpc: '2.0',
        result: {
          statusUpdate: {
            taskId: 'task-8c2f3b21',
            status: {
              state: 'completed',
              message: { role: 'agent', parts: [{ kind: 'text', text: 'Literature review complete. 5 papers summarized with citations.' }] },
              timestamp: new Date().toISOString(),
            },
          },
        },
        id: 'sse-3',
      },
      stateAfter: 'completed',
    },
  ],
};

export const crossFrameworkScenario: A2AScenario = {
  id: 'cross-framework',
  name: 'Cross-Framework Exchange',
  description: 'A LangGraph workflow agent delegates to a CrewAI support crew. Demonstrates A2A bridging agents from different frameworks — they share no code, only the protocol.',
  callerAgent: langGraphAgent,
  calleeAgent: crewAIAgent,
  steps: [
    {
      direction: 'caller→callee',
      method: 'GET /.well-known/agent.json',
      delayMs: 500,
      annotation: 'LangGraph agent fetches CrewAI\'s Agent Card. No shared SDK — they communicate only via A2A JSON-RPC.',
      payload: { jsonrpc: '2.0', method: 'GET /.well-known/agent.json', params: {}, id: 0 },
    },
    {
      direction: 'callee→caller',
      delayMs: 300,
      annotation: 'CrewAI returns its card. Caller confirms ticket-triage exists and can continue.',
      payload: { jsonrpc: '2.0', result: crewAIAgent, id: 0 },
    },
    {
      direction: 'caller→callee',
      method: 'a2a_sendMessage',
      delayMs: 700,
      annotation: 'LangGraph sends a ticket with a structured data payload.',
      payload: {
        jsonrpc: '2.0',
        method: 'a2a_sendMessage',
        params: {
          message: {
            messageId: 'msg-xf-001',
            contextId: 'ctx-xf-101',
            role: 'user',
            parts: [
              { kind: 'text', text: 'Triage and route this customer support ticket.' },
              { kind: 'data', data: { skillId: 'ticket-triage', ticket: { id: 'TKT-4821', subject: 'Cannot log in after password reset', priority: 'high', customerId: 'C-9901' } } },
            ],
          },
        },
        id: 1,
      },
      stateAfter: 'submitted',
    },
    {
      direction: 'callee→caller',
      delayMs: 500,
      annotation: 'CrewAI acknowledges and immediately starts triaging.',
      payload: {
        jsonrpc: '2.0',
        result: {
          kind: 'task',
          id: 'task-xf-001',
          contextId: 'ctx-xf-101',
          status: { state: 'working', message: { role: 'agent', parts: [{ kind: 'text', text: 'Triage Specialist analyzing TKT-4821.' }] }, timestamp: new Date().toISOString() },
          artifacts: [],
          history: [],
        },
        id: 1,
      },
      stateAfter: 'working',
    },
    {
      direction: 'callee→caller',
      method: 'SSE: statusUpdate',
      delayMs: 1200,
      annotation: 'Task completed — CrewAI returns the triage result as a structured artifact.',
      payload: {
        jsonrpc: '2.0',
        result: {
          statusUpdate: {
            taskId: 'task-xf-001',
            status: {
              state: 'completed',
              message: { role: 'agent', parts: [{ kind: 'text', text: 'Triage complete.' }, { kind: 'data', data: { category: 'auth-issue', priority: 'P1', assignTo: 'auth-team', suggestedAction: 'Clear MFA state and resend reset email', confidence: 0.94 } }] },
              timestamp: new Date().toISOString(),
            },
          },
        },
        id: 'sse-xf-1',
      },
      stateAfter: 'completed',
    },
  ],
};

export const inputRequiredScenario: A2AScenario = {
  id: 'input-required',
  name: 'Input Required (Agent Asks for Clarification)',
  description: 'Research agent pauses the task and asks the caller for clarification before proceeding.',
  callerAgent: assistantAgent,
  calleeAgent: researchAgent,
  steps: [
    {
      direction: 'caller→callee',
      method: 'a2a_sendMessage',
      delayMs: 500,
      annotation: 'Caller sends an ambiguous research request.',
      payload: {
        jsonrpc: '2.0',
        method: 'a2a_sendMessage',
        params: {
          message: {
            messageId: 'msg-ir-001',
            contextId: 'ctx-ir-10',
            role: 'user',
            parts: [{ kind: 'text', text: 'Find papers about transformers published in 2023.' }],
          },
        },
        id: 1,
      },
      stateAfter: 'submitted',
    },
    {
      direction: 'callee→caller',
      delayMs: 600,
      annotation: 'Callee transitions to input-required and asks for clarification.',
      payload: {
        jsonrpc: '2.0',
        result: {
          kind: 'task',
          id: 'task-ir-001',
          contextId: 'ctx-ir-10',
          status: {
            state: 'input-required',
            message: { role: 'agent', parts: [{ kind: 'text', text: 'Which domain? (a) NLP/language models, (b) computer vision, (c) multimodal, (d) all domains?' }] },
            timestamp: new Date().toISOString(),
          },
          artifacts: [],
          history: [],
        },
        id: 1,
      },
      stateAfter: 'input-required',
    },
    {
      direction: 'caller→callee',
      method: 'a2a_sendMessage',
      delayMs: 1000,
      annotation: 'Caller sends a follow-up message with the clarification.',
      payload: {
        jsonrpc: '2.0',
        method: 'a2a_sendMessage',
        params: {
          message: {
            messageId: 'msg-ir-002',
            contextId: 'ctx-ir-10',
            taskId: 'task-ir-001',
            role: 'user',
            parts: [{ kind: 'text', text: 'Option (a) — NLP and language models only.' }],
          },
        },
        id: 2,
      },
      stateAfter: 'working',
    },
    {
      direction: 'callee→caller',
      delayMs: 500,
      annotation: 'Task resumes processing with the clarified scope.',
      payload: {
        jsonrpc: '2.0',
        result: { statusUpdate: { taskId: 'task-ir-001', status: { state: 'working', message: { role: 'agent', parts: [{ kind: 'text', text: 'Searching for NLP transformer papers from 2023…' }] }, timestamp: new Date().toISOString() } } },
        id: 'sse-ir-1',
      },
      stateAfter: 'working',
    },
    {
      direction: 'callee→caller',
      method: 'SSE: statusUpdate',
      delayMs: 1400,
      annotation: 'Task completes — the clarification led to a focused result.',
      payload: {
        jsonrpc: '2.0',
        result: { statusUpdate: { taskId: 'task-ir-001', status: { state: 'completed', message: { role: 'agent', parts: [{ kind: 'text', text: 'Found 47 NLP transformer papers from 2023. Top 10 by citation count summarized.' }] }, timestamp: new Date().toISOString() } } },
        id: 'sse-ir-2',
      },
      stateAfter: 'completed',
    },
  ],
};

export const errorRecoveryScenario: A2AScenario = {
  id: 'error-recovery',
  name: 'Error Recovery',
  description: 'A task fails mid-execution, then the caller retries with corrected parameters.',
  callerAgent: langGraphAgent,
  calleeAgent: researchAgent,
  steps: [
    {
      direction: 'caller→callee',
      method: 'a2a_sendMessage',
      delayMs: 500,
      annotation: 'Caller sends a task with an invalid date range parameter.',
      payload: {
        jsonrpc: '2.0',
        method: 'a2a_sendMessage',
        params: {
          message: {
            messageId: 'msg-err-001',
            contextId: 'ctx-err-20',
            role: 'user',
            parts: [
              { kind: 'text', text: 'Find all ML papers from 1980 to 1970.' },
              { kind: 'data', data: { yearStart: 1980, yearEnd: 1970 } },
            ],
          },
        },
        id: 1,
      },
      stateAfter: 'submitted',
    },
    {
      direction: 'callee→caller',
      delayMs: 600,
      annotation: 'Callee detects invalid parameters and returns a failed state with structured error data.',
      payload: {
        jsonrpc: '2.0',
        result: {
          kind: 'task',
          id: 'task-err-001',
          contextId: 'ctx-err-20',
          status: {
            state: 'failed',
            message: { role: 'agent', parts: [{ kind: 'text', text: 'Invalid parameters: yearStart (1980) must be before yearEnd (1970).' }, { kind: 'data', data: { errorCode: -32602, field: 'yearEnd', suggestion: 'Swap yearStart and yearEnd values.' } }] },
            timestamp: new Date().toISOString(),
          },
          artifacts: [],
          history: [],
        },
        id: 1,
      },
      stateAfter: 'failed',
    },
    {
      direction: 'caller→callee',
      method: 'a2a_sendMessage',
      delayMs: 800,
      annotation: 'Caller sends a corrected retry request with a new contextId.',
      payload: {
        jsonrpc: '2.0',
        method: 'a2a_sendMessage',
        params: {
          message: {
            messageId: 'msg-err-002',
            contextId: 'ctx-err-21',
            role: 'user',
            parts: [
              { kind: 'text', text: 'Find all ML papers from 1970 to 1980.' },
              { kind: 'data', data: { yearStart: 1970, yearEnd: 1980 } },
            ],
          },
        },
        id: 2,
      },
      stateAfter: 'submitted',
    },
    {
      direction: 'callee→caller',
      delayMs: 400,
      annotation: 'Retry succeeds — task transitions through submitted to working.',
      payload: {
        jsonrpc: '2.0',
        result: { kind: 'task', id: 'task-err-002', contextId: 'ctx-err-21', status: { state: 'working', message: { role: 'agent', parts: [{ kind: 'text', text: 'Searching for early ML papers 1970–1980…' }] }, timestamp: new Date().toISOString() }, artifacts: [], history: [] },
        id: 2,
      },
      stateAfter: 'working',
    },
    {
      direction: 'callee→caller',
      method: 'SSE: statusUpdate',
      delayMs: 1200,
      annotation: 'Retry completes successfully. Error recovery demonstrated end-to-end.',
      payload: {
        jsonrpc: '2.0',
        result: { statusUpdate: { taskId: 'task-err-002', status: { state: 'completed', message: { role: 'agent', parts: [{ kind: 'text', text: 'Found 12 foundational ML papers from 1970–1980, including early backpropagation work.' }] }, timestamp: new Date().toISOString() } } },
        id: 'sse-err-1',
      },
      stateAfter: 'completed',
    },
  ],
};

export const ALL_A2A_SCENARIOS: A2AScenario[] = [
  twoAgentDelegationScenario,
  crossFrameworkScenario,
  inputRequiredScenario,
  errorRecoveryScenario,
];
