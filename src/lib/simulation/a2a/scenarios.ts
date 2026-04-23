import type { A2AScenario } from './types';

export const A2A_SCENARIOS: A2AScenario[] = [
  {
    id: 'cross-framework-handoff',
    name: 'Cross-Framework Handoff',
    description: 'A planner agent delegates a protocol review task to a specialist agent and receives a result artifact.',
    agents: [
      {
        id: 'planner',
        name: 'Planner Agent',
        provider: 'Playground',
        description: 'Coordinates the upstream user intent and delegates to specialists.',
        capabilities: ['planning', 'delegation'],
        endpoint: 'https://planner.local/card',
      },
      {
        id: 'protocol-reviewer',
        name: 'Protocol Reviewer',
        provider: 'Remote Vendor',
        description: 'Reviews interoperability and returns a structured artifact.',
        capabilities: ['review', 'protocol-analysis'],
        endpoint: 'https://reviewer.remote/card',
      },
    ],
    task: {
      id: 'task-cross-framework',
      title: 'Review AG-UI and A2A integration risks',
      description: 'Inspect the protocol contract and surface interoperability concerns.',
      requesterAgentId: 'planner',
      responderAgentId: 'protocol-reviewer',
      orchestrationTarget: { cockpit: 'multi-agent', targetId: 'network-root', targetType: 'task' },
    },
    transitions: [
      { status: 'submitted', summary: 'Planner submits the task to the remote card.', by: 'planner', messageKind: 'request' },
      { status: 'accepted', summary: 'Remote agent accepts the work.', by: 'protocol-reviewer', messageKind: 'status' },
      { status: 'working', summary: 'The remote agent processes the protocol bundle.', by: 'protocol-reviewer', messageKind: 'status' },
      { status: 'completed', summary: 'A structured artifact returns to the planner.', by: 'protocol-reviewer', messageKind: 'artifact' },
    ],
  },
  {
    id: 'input-required',
    name: 'Input Required Pause',
    description: 'A remote agent pauses for clarification, then resumes and completes.',
    agents: [
      {
        id: 'requester',
        name: 'Requester',
        provider: 'Playground',
        description: 'Submits a task to a remote runtime.',
        capabilities: ['task-routing'],
        endpoint: 'https://requester.local/card',
      },
      {
        id: 'validator',
        name: 'Validator',
        provider: 'Partner Runtime',
        description: 'Requests missing context before finishing the job.',
        capabilities: ['validation', 'review'],
        endpoint: 'https://validator.partner/card',
      },
    ],
    task: {
      id: 'task-input-required',
      title: 'Validate imported workflow edges',
      description: 'Confirm the imported workflow has enough metadata to normalize safely.',
      requesterAgentId: 'requester',
      responderAgentId: 'validator',
      orchestrationTarget: { cockpit: 'multi-agent', targetId: 'dispatch-root', targetType: 'task' },
    },
    transitions: [
      { status: 'submitted', summary: 'Requester sends the task.', by: 'requester', messageKind: 'request' },
      { status: 'accepted', summary: 'Validator accepts the task.', by: 'validator', messageKind: 'status' },
      { status: 'input-required', summary: 'Validator asks for the missing branch metadata.', by: 'validator', messageKind: 'status' },
      { status: 'working', summary: 'Requester provides the missing metadata and work resumes.', by: 'requester', messageKind: 'status' },
      { status: 'completed', summary: 'Validator returns a normalization artifact.', by: 'validator', messageKind: 'artifact' },
    ],
  },
  {
    id: 'failure-retry',
    name: 'Failure and Retry',
    description: 'A remote execution fails, then gets retried through the deterministic recovery flow.',
    agents: [
      {
        id: 'coordinator',
        name: 'Coordinator',
        provider: 'Playground',
        description: 'Coordinates remote work and retries when needed.',
        capabilities: ['coordination', 'retry'],
        endpoint: 'https://coordinator.local/card',
      },
      {
        id: 'runner',
        name: 'Remote Runner',
        provider: 'External Runtime',
        description: 'Executes remote tasks and may fail transiently.',
        capabilities: ['execution', 'artifact-generation'],
        endpoint: 'https://runner.external/card',
      },
    ],
    task: {
      id: 'task-failure-retry',
      title: 'Run interoperability smoke test',
      description: 'Execute a smoke test against the remote protocol runtime.',
      requesterAgentId: 'coordinator',
      responderAgentId: 'runner',
      orchestrationTarget: { cockpit: 'multi-agent', targetId: 'parallel-root', targetType: 'task' },
    },
    transitions: [
      { status: 'submitted', summary: 'Coordinator submits the smoke test.', by: 'coordinator', messageKind: 'request' },
      { status: 'accepted', summary: 'Remote runner accepts the task.', by: 'runner', messageKind: 'status' },
      { status: 'working', summary: 'The remote runner starts execution.', by: 'runner', messageKind: 'status' },
      { status: 'failed', summary: 'The remote runtime fails with a retryable transport error.', by: 'runner', messageKind: 'error' },
    ],
  },
];

export const DEFAULT_A2A_SCENARIO = A2A_SCENARIOS[0];
