import { describe, expect, it } from 'vitest';
import { A2AProtocolSimulator } from '../A2AProtocolSimulator';
import { A2A_SCENARIOS, DEFAULT_A2A_SCENARIO } from '../scenarios';

describe('A2AProtocolSimulator', () => {
  it('loads a scenario into a ready state', () => {
    const simulator = new A2AProtocolSimulator();
    simulator.loadScenario(DEFAULT_A2A_SCENARIO);

    const state = simulator.getState();

    expect(state.scenarioId).toBe(DEFAULT_A2A_SCENARIO.id);
    expect(state.status).toBe('ready');
    expect(state.tasks).toHaveLength(1);
    expect(state.selectedTaskId).toBe(state.tasks[0].id);
  });

  it('runs deterministic lifecycle transitions and message logs', () => {
    const simulator = new A2AProtocolSimulator(DEFAULT_A2A_SCENARIO);
    const first = simulator.run();
    const second = simulator.run();

    expect(first).toEqual(second);
    expect(first.tasks[0].status).toBe('completed');
    expect(first.messages).toHaveLength(DEFAULT_A2A_SCENARIO.transitions.length);
  });

  it('supports retrying failed tasks', () => {
    const simulator = new A2AProtocolSimulator(A2A_SCENARIOS[2]);
    simulator.run();
    const state = simulator.retryTask('task-failure-retry');

    expect(state.tasks[0].status).toBe('completed');
    expect(state.messages.some((message) => message.kind === 'retry')).toBe(true);
  });

  it('rejects invalid retries', () => {
    const simulator = new A2AProtocolSimulator(DEFAULT_A2A_SCENARIO);
    simulator.run();
    expect(() => simulator.retryTask('task-cross-framework')).toThrow(/Cannot retry/);
  });

  it('supports canceling active tasks and rejects canceling terminal tasks', () => {
    const simulator = new A2AProtocolSimulator(A2A_SCENARIOS[1]);
    simulator.reset();
    const canceled = simulator.cancelTask('task-input-required');
    expect(canceled.tasks[0].status).toBe('canceled');

    const completedSimulator = new A2AProtocolSimulator(DEFAULT_A2A_SCENARIO);
    completedSimulator.run();
    expect(() => completedSimulator.cancelTask('task-cross-framework')).toThrow(/Cannot cancel/);
  });
});
