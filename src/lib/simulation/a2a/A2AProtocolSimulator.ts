import { SimulatedProtocol } from '../core/SimulatedProtocol';
import type { A2AMessage, A2AProtocolState, A2AScenario, A2ATask, A2ATaskHistoryEntry, A2ATaskTransition } from './types';

function createEmptyState(): A2AProtocolState {
  return {
    scenarioId: null,
    status: 'idle',
    agents: [],
    tasks: [],
    selectedTaskId: null,
    messages: [],
    metrics: {
      totalMessages: 0,
      completedTasks: 0,
      failedTasks: 0,
      canceledTasks: 0,
    },
  };
}

function createHistoryEntry(transition: A2ATaskTransition, index: number): A2ATaskHistoryEntry {
  return {
    status: transition.status,
    timestamp: index * 1000,
    summary: transition.summary,
  };
}

function buildMetrics(tasks: A2ATask[], messages: A2AMessage[]) {
  return {
    totalMessages: messages.length,
    completedTasks: tasks.filter((task) => task.status === 'completed').length,
    failedTasks: tasks.filter((task) => task.status === 'failed').length,
    canceledTasks: tasks.filter((task) => task.status === 'canceled').length,
  };
}

function cloneState(state: A2AProtocolState): A2AProtocolState {
  return JSON.parse(JSON.stringify(state)) as A2AProtocolState;
}

export class A2AProtocolSimulator extends SimulatedProtocol {
  private scenario: A2AScenario | null = null;
  private state: A2AProtocolState = createEmptyState();

  constructor(scenario?: A2AScenario) {
    super();
    if (scenario) {
      this.loadScenario(scenario);
    }
  }

  loadScenario(scenario: A2AScenario): void {
    this.scenario = JSON.parse(JSON.stringify(scenario)) as A2AScenario;
    this.reset();
  }

  getState(): A2AProtocolState {
    return cloneState(this.state);
  }

  reset(): void {
    this.clearLog();
    if (!this.scenario) {
      this.state = createEmptyState();
      return;
    }

    const task: A2ATask = {
      ...this.scenario.task,
      status: 'submitted',
      history: [],
    };

    this.state = {
      scenarioId: this.scenario.id,
      status: 'ready',
      agents: JSON.parse(JSON.stringify(this.scenario.agents)),
      tasks: [task],
      selectedTaskId: task.id,
      messages: [],
      metrics: buildMetrics([task], []),
    };
  }

  run(): A2AProtocolState {
    if (!this.scenario) {
      throw new Error('No A2A scenario loaded.');
    }

    this.reset();
    this.state.status = 'running';
    const task = this.state.tasks[0];

    this.scenario.transitions.forEach((transition, index) => {
      task.status = transition.status;
      task.history.push(createHistoryEntry(transition, index));

      const message: A2AMessage = {
        id: `a2a-message-${index + 1}`,
        kind: transition.messageKind ?? 'status',
        from: transition.by,
        to: transition.by === task.requesterAgentId ? task.responderAgentId : task.requesterAgentId,
        taskId: task.id,
        timestamp: index * 1000,
        summary: transition.summary,
      };

      this.state.messages.push(message);
      this.emit('a2a:transition', {
        taskId: task.id,
        status: transition.status,
        message,
      });
    });

    this.state.status = 'completed';
    this.state.metrics = buildMetrics(this.state.tasks, this.state.messages);
    this.emit('a2a:completed', {
      scenarioId: this.state.scenarioId,
      metrics: this.state.metrics,
    });
    return this.getState();
  }

  selectTask(taskId: string | null): A2AProtocolState {
    this.state.selectedTaskId = taskId;
    return this.getState();
  }

  retryTask(taskId: string): A2AProtocolState {
    const task = this.state.tasks.find((candidate) => candidate.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    if (task.status !== 'failed') {
      throw new Error(`Cannot retry task in "${task.status}" state.`);
    }

    const appended: A2ATaskTransition[] = [
      { status: 'submitted', summary: 'Coordinator retries the failed task.', by: task.requesterAgentId, messageKind: 'retry' },
      { status: 'accepted', summary: 'Remote agent accepts the retried task.', by: task.responderAgentId, messageKind: 'status' },
      { status: 'working', summary: 'Remote agent resumes execution.', by: task.responderAgentId, messageKind: 'status' },
      { status: 'completed', summary: 'Retry succeeds and returns an artifact.', by: task.responderAgentId, messageKind: 'artifact' },
    ];

    appended.forEach((transition, index) => {
      const timestamp = (this.state.messages.length + index) * 1000;
      task.status = transition.status;
      task.history.push({ status: transition.status, timestamp, summary: transition.summary });
      this.state.messages.push({
        id: `a2a-message-${this.state.messages.length + 1}`,
        kind: transition.messageKind ?? 'status',
        from: transition.by,
        to: transition.by === task.requesterAgentId ? task.responderAgentId : task.requesterAgentId,
        taskId: task.id,
        timestamp,
        summary: transition.summary,
      });
    });

    this.state.metrics = buildMetrics(this.state.tasks, this.state.messages);
    return this.getState();
  }

  cancelTask(taskId: string): A2AProtocolState {
    const task = this.state.tasks.find((candidate) => candidate.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    if (task.status === 'completed' || task.status === 'failed' || task.status === 'canceled') {
      throw new Error(`Cannot cancel task in "${task.status}" state.`);
    }

    const timestamp = this.state.messages.length * 1000;
    task.status = 'canceled';
    task.history.push({
      status: 'canceled',
      timestamp,
      summary: 'Requester cancels the remote task.',
    });
    this.state.messages.push({
      id: `a2a-message-${this.state.messages.length + 1}`,
      kind: 'cancel',
      from: task.requesterAgentId,
      to: task.responderAgentId,
      taskId: task.id,
      timestamp,
      summary: 'Requester cancels the remote task.',
    });
    this.state.metrics = buildMetrics(this.state.tasks, this.state.messages);
    return this.getState();
  }
}
