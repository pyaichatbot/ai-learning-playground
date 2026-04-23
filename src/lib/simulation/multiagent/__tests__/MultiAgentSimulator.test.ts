import { describe, expect, it } from 'vitest';
import { MultiAgentSimulator } from '../MultiAgentSimulator';
import {
  ALL_MULTI_AGENT_SCENARIOS,
  dispatchTreeScenario,
  networkScenario,
  parallelScenario,
  sequentialScenario,
  supervisorScenario,
} from '../scenarios';

describe('MultiAgentSimulator', () => {
  it('loads a scenario into a ready state', () => {
    const simulator = new MultiAgentSimulator();
    simulator.loadScenario(supervisorScenario);

    const state = simulator.getState();

    expect(state.scenarioId).toBe(supervisorScenario.id);
    expect(state.pattern).toBe('supervisor');
    expect(state.status).toBe('ready');
    expect(state.tasks).toHaveLength(5);
    expect(state.dependencyEdges).toHaveLength(4);
    expect(state.dispatchTree[0].taskId).toBe('brief-root');
  });

  it('routes tasks, emits messages, and aggregates results for the supervisor pattern', () => {
    const simulator = new MultiAgentSimulator(supervisorScenario);
    const completedEvents: number[] = [];

    simulator.on('simulation:completed', (event) => {
      completedEvents.push((event.payload as { metrics: { completedTasks: number } }).metrics.completedTasks);
    });

    const state = simulator.run();

    expect(completedEvents).toEqual([5]);
    expect(state.status).toBe('completed');
    expect(state.routing).toHaveLength(state.tasks.length);
    expect(state.messages.length).toBeGreaterThan(0);
    expect(state.aggregationEvents.some((event) => event.taskId === supervisorScenario.rootTask.id)).toBe(true);
    expect(state.metrics.totalTokens).toBeGreaterThan(0);
    expect(state.metrics.totalDuration).toBeGreaterThan(0);
    expect(state.finalResult).toContain(supervisorScenario.rootTask.title);
  });

  it('is deterministic across repeated runs for the same scenario', () => {
    const simulator = new MultiAgentSimulator(sequentialScenario);

    const first = simulator.run();
    const second = simulator.run();

    expect(first).toEqual(second);
  });

  it('preserves parallel waves and records routing edges', () => {
    const simulator = new MultiAgentSimulator(parallelScenario);
    const state = simulator.run();

    const market = state.tasks.find((task) => task.id === 'scan-market');
    const tech = state.tasks.find((task) => task.id === 'scan-tech');
    const ux = state.tasks.find((task) => task.id === 'scan-ux');

    expect(market?.startTimestamp).toBe(tech?.startTimestamp);
    expect(tech?.startTimestamp).toBe(ux?.startTimestamp);
    expect(state.agentGraph.edges.some((edge) => edge.kind === 'delegates-to')).toBe(true);
    expect(state.aggregationEvents.some((event) => event.taskId === parallelScenario.rootTask.id)).toBe(true);
  });

  it('emits a routed mesh and nested dispatch tree for the network and tree scenarios', () => {
    const networkSimulator = new MultiAgentSimulator(networkScenario);
    const networkState = networkSimulator.run();

    expect(networkState.messages.some((message) => message.kind !== 'delegate')).toBe(true);
    expect(networkState.routing.some((decision) => decision.reason.includes('Route-through path'))).toBe(true);

    const treeSimulator = new MultiAgentSimulator(dispatchTreeScenario);
    const treeState = treeSimulator.run();

    expect(treeState.dispatchTree.some((node) => node.depth >= 3)).toBe(true);
    expect(treeState.aggregationEvents.length).toBeGreaterThan(1);
    expect(treeState.finalResult).toContain(dispatchTreeScenario.rootTask.title);
  });

  it('exposes the built-in scenario catalog', () => {
    expect(ALL_MULTI_AGENT_SCENARIOS).toHaveLength(5);
  });
});

