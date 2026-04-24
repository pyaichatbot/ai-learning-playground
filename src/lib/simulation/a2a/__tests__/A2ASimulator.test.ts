import { beforeEach, describe, expect, it } from 'vitest';
import { A2ASimulator } from '../A2ASimulator';
import { twoAgentDelegationScenario } from '../scenarios';

describe('A2ASimulator', () => {
  let simulator: A2ASimulator;

  beforeEach(() => {
    simulator = new A2ASimulator();
  });

  it('loadScenario sets agents and clears log', () => {
    simulator.loadScenario(twoAgentDelegationScenario);

    expect(simulator.getCallerCard()?.name).toBe(twoAgentDelegationScenario.callerAgent.name);
    expect(simulator.getCalleeCard()?.name).toBe(twoAgentDelegationScenario.calleeAgent.name);
    expect(simulator.getMessageLog()).toHaveLength(0);
  });

  it('discover emits a discovering event and returns callee card', async () => {
    simulator.loadScenario(twoAgentDelegationScenario);
    const events: string[] = [];

    simulator.on('state-change', (event) => {
      events.push(event.payload as string);
    });

    const card = await simulator.discover();

    expect(card.name).toBe(twoAgentDelegationScenario.calleeAgent.name);
    expect(events).toContain('discovering');
    expect(events).toContain('connected');
  });

  it('replay emits all steps in order', async () => {
    simulator.loadScenario(twoAgentDelegationScenario);
    await simulator.discover();
    const messages: unknown[] = [];

    simulator.on('message', (event) => {
      messages.push(event.payload);
    });

    await simulator.replay({ delayMs: 0 });

    expect(messages.length).toBe(twoAgentDelegationScenario.steps.length);
  });

  it('reset clears log and connection state', async () => {
    simulator.loadScenario(twoAgentDelegationScenario);
    await simulator.discover();

    simulator.reset();

    expect(simulator.getMessageLog()).toHaveLength(0);
    expect(simulator.getConnectionState()).toBe('idle');
  });

  it('getEventLog accumulates all emitted events', async () => {
    simulator.loadScenario(twoAgentDelegationScenario);
    await simulator.discover();

    expect(simulator.getEventLog().length).toBeGreaterThan(0);
  });
});