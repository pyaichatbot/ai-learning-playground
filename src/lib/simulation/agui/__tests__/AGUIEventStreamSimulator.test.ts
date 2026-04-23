import { describe, expect, it } from 'vitest';
import { AGUIEventStreamSimulator } from '../AGUIEventStreamSimulator';
import { AGUI_SCENARIOS, DEFAULT_AGUI_SCENARIO } from '../scenarios';

describe('AGUIEventStreamSimulator', () => {
  it('loads a scenario into a ready state', () => {
    const simulator = new AGUIEventStreamSimulator();
    simulator.loadScenario(DEFAULT_AGUI_SCENARIO);

    const state = simulator.getState();

    expect(state.scenarioId).toBe(DEFAULT_AGUI_SCENARIO.id);
    expect(state.status).toBe('ready');
    expect(state.events.length).toBeGreaterThan(0);
    expect(state.selectedEventId).toBe(state.events[0].id);
  });

  it('runs deterministically and emits events in order', () => {
    const simulator = new AGUIEventStreamSimulator(DEFAULT_AGUI_SCENARIO);
    const first = simulator.run();
    const second = simulator.run();

    expect(first).toEqual(second);
    expect(first.status).toBe('completed');
    expect(first.metrics.totalEvents).toBe(DEFAULT_AGUI_SCENARIO.events.length);
    expect(first.events.map((event) => event.timestamp)).toEqual([0, 1000, 2000, 3000, 4000, 5000, 6000]);
  });

  it('filters visible events by type and source', () => {
    const simulator = new AGUIEventStreamSimulator(DEFAULT_AGUI_SCENARIO);
    simulator.run();

    const toolOnly = simulator.setFilters({ type: 'tool.called' });
    expect(toolOnly.visibleEvents).toHaveLength(1);
    expect(toolOnly.metrics.visibleEvents).toBe(1);

    const agentOnly = simulator.setFilters({ type: 'all', source: 'agent' });
    expect(agentOnly.visibleEvents.every((event) => event.source === 'agent')).toBe(true);
  });

  it('injects a synthetic failure for recovery walkthroughs', () => {
    const simulator = new AGUIEventStreamSimulator(AGUI_SCENARIOS[1]);
    simulator.run();
    const state = simulator.injectFailure('Injected stream failure');

    expect(state.events.at(-1)?.type).toBe('run.failed');
    expect(state.metrics.failures).toBeGreaterThan(0);
  });

  it('creates custom scenarios from event definitions', () => {
    const simulator = new AGUIEventStreamSimulator();
    const custom = simulator.createCustomScenario('custom', 'Custom', 'Manual builder', [
      {
        type: 'session.started',
        source: 'server',
        title: 'Start',
        summary: 'Custom scenario started.',
      },
      {
        type: 'run.completed',
        source: 'server',
        title: 'Done',
        summary: 'Custom scenario completed.',
      },
    ]);

    simulator.loadScenario(custom);
    const state = simulator.run();
    expect(state.metrics.totalEvents).toBe(2);
    expect(state.events[1].type).toBe('run.completed');
  });
});
