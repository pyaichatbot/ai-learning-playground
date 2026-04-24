import { SimulatedProtocol } from '../core/SimulatedProtocol';
import type {
  A2AAgentCard,
  A2AConnectionState,
  A2AProtocolMessage,
  A2AScenario,
  A2ASimulatedStep,
  A2ATaskState,
} from './types';

interface ReplayOptions {
  delayMs?: number;
}

export class A2ASimulator extends SimulatedProtocol {
  private scenario: A2AScenario | null = null;
  private connectionState: A2AConnectionState = 'idle';
  private taskState: A2ATaskState | null = null;
  private messageLog: A2AProtocolMessage[] = [];
  private aborted = false;

  loadScenario(scenario: A2AScenario): void {
    this.scenario = scenario;
    this.connectionState = 'idle';
    this.taskState = null;
    this.messageLog = [];
    this.aborted = false;
    this.clearLog();
  }

  getCallerCard(): A2AAgentCard | null {
    return this.scenario?.callerAgent ?? null;
  }

  getCalleeCard(): A2AAgentCard | null {
    return this.scenario?.calleeAgent ?? null;
  }

  getMessageLog(): A2AProtocolMessage[] {
    return [...this.messageLog];
  }

  getConnectionState(): A2AConnectionState {
    return this.connectionState;
  }

  getTaskState(): A2ATaskState | null {
    return this.taskState;
  }

  async discover(): Promise<A2AAgentCard> {
    if (!this.scenario) {
      throw new Error('No scenario loaded');
    }

    this.setConnectionState('discovering');
    await this.sleep(400);
    this.setConnectionState('connected');
    return this.scenario.calleeAgent;
  }

  async replay(options: ReplayOptions = {}): Promise<void> {
    if (!this.scenario) {
      throw new Error('No scenario loaded');
    }

    this.aborted = false;
    this.messageLog = [];
    this.setConnectionState('running');

    for (const step of this.scenario.steps) {
      if (this.aborted) {
        break;
      }

      const delay = options.delayMs ?? step.delayMs;
      if (delay > 0) {
        await this.sleep(delay);
      }
      this.emitStep(step);
    }

    if (!this.aborted) {
      this.setConnectionState('completed');
    }
  }

  abort(): void {
    this.aborted = true;
  }

  reset(): void {
    this.aborted = true;
    this.connectionState = 'idle';
    this.taskState = null;
    this.messageLog = [];
    this.clearLog();
  }

  private emitStep(step: A2ASimulatedStep): void {
    const message: A2AProtocolMessage = {
      id: globalThis.crypto.randomUUID(),
      direction: step.direction,
      method: step.method,
      payload: step.payload,
      timestamp: Date.now(),
      stateAfter: step.stateAfter,
    };

    this.messageLog.push(message);

    if (step.stateAfter) {
      this.taskState = step.stateAfter;
      this.emit('task-state', step.stateAfter);
    }

    this.emit('message', message);
  }

  private setConnectionState(state: A2AConnectionState): void {
    this.connectionState = state;
    this.emit('state-change', state);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}