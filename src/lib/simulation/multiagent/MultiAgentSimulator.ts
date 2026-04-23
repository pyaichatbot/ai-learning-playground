import { SimulatedProtocol, type ProtocolEvent } from '../core/SimulatedProtocol';
import type {
  MultiAgentAgent,
  MultiAgentAgentEdge,
  MultiAgentAgentGraph,
  MultiAgentAggregationEvent,
  MultiAgentDependencyEdge,
  MultiAgentDispatchTreeNode,
  MultiAgentMessage,
  MultiAgentMessageKind,
  MultiAgentMetrics,
  MultiAgentPattern,
  MultiAgentRoutingDecision,
  MultiAgentScenario,
  MultiAgentSimulationState,
  MultiAgentTaskSpec,
  MultiAgentTaskState,
} from './types';

const EXECUTION_ORDER_GAP = 4;
const BASE_TASK_TOKENS = 12;
const BASE_TASK_DURATION = 18;
const BASE_AGGREGATION_TOKENS = 5;

function cloneAgent(agent: MultiAgentAgent): MultiAgentAgent {
  return {
    ...agent,
    role: { ...agent.role },
    capabilities: [...agent.capabilities],
  };
}

function cloneTaskSpec(task: MultiAgentTaskSpec): MultiAgentTaskSpec {
  return {
    ...task,
    requiredCapabilities: [...task.requiredCapabilities],
    dependsOn: task.dependsOn ? [...task.dependsOn] : undefined,
    routeThrough: task.routeThrough ? [...task.routeThrough] : undefined,
  };
}

function cloneTaskState(task: MultiAgentTaskState): MultiAgentTaskState {
  return {
    ...task,
    requiredCapabilities: [...task.requiredCapabilities],
    dependsOn: task.dependsOn ? [...task.dependsOn] : undefined,
    routeThrough: task.routeThrough ? [...task.routeThrough] : undefined,
  };
}

function cloneState(state: MultiAgentSimulationState): MultiAgentSimulationState {
  return {
    ...state,
    agents: state.agents.map(cloneAgent),
    agentGraph: {
      nodes: state.agentGraph.nodes.map(cloneAgent),
      edges: state.agentGraph.edges.map((edge) => ({ ...edge })),
    },
    tasks: state.tasks.map(cloneTaskState),
    dependencyEdges: state.dependencyEdges.map((edge) => ({ ...edge })),
    dispatchTree: state.dispatchTree.map((node) => ({
      ...node,
      childIds: [...node.childIds],
    })),
    routing: state.routing.map((decision) => ({ ...decision })),
    messages: state.messages.map((message) => ({ ...message })),
    aggregationEvents: state.aggregationEvents.map((event) => ({ ...event })),
    metrics: { ...state.metrics },
  };
}

function emptyMetrics(): MultiAgentMetrics {
  return {
    totalTokens: 0,
    totalDuration: 0,
    totalMessages: 0,
    completedTasks: 0,
    aggregationEvents: 0,
    averageTaskDuration: 0,
  };
}

function emptyState(): MultiAgentSimulationState {
  return {
    scenarioId: null,
    pattern: null,
    status: 'idle',
    agents: [],
    agentGraph: { nodes: [], edges: [] },
    tasks: [],
    dependencyEdges: [],
    dispatchTree: [],
    routing: [],
    messages: [],
    aggregationEvents: [],
    metrics: emptyMetrics(),
    finalResult: null,
  };
}

function buildAgentGraph(agents: MultiAgentAgent[]): MultiAgentAgentGraph {
  const agentIds = new Set(agents.map((agent) => agent.id));
  const edges: MultiAgentAgentEdge[] = [];

  agents.forEach((agent) => {
    if (agent.reportsTo && agentIds.has(agent.reportsTo)) {
      edges.push({ from: agent.id, to: agent.reportsTo, kind: 'reports-to' });
    }
  });

  return {
    nodes: agents.map(cloneAgent),
    edges,
  };
}

function buildDependencyEdges(tasks: MultiAgentTaskSpec[]): MultiAgentDependencyEdge[] {
  const edges: MultiAgentDependencyEdge[] = [];

  tasks.forEach((task) => {
    (task.dependsOn ?? []).forEach((dependencyId) => {
      edges.push({ from: dependencyId, to: task.id, kind: 'blocks' });
    });
  });

  return edges;
}

function buildParentMap(
  rootTask: MultiAgentTaskSpec,
  tasks: MultiAgentTaskSpec[]
): Map<string, string | null> {
  const parentByTask = new Map<string, string | null>();
  parentByTask.set(rootTask.id, null);

  tasks.forEach((task) => {
    const parentId =
      task.parentTaskId ??
      (task.dependsOn && task.dependsOn.length === 1 ? task.dependsOn[0] : rootTask.id);
    parentByTask.set(task.id, parentId);
  });

  return parentByTask;
}

function buildChildrenMap(parentByTask: Map<string, string | null>): Map<string, string[]> {
  const children = new Map<string, string[]>();

  parentByTask.forEach((parentId, taskId) => {
    if (!parentId) return;
    const existing = children.get(parentId) ?? [];
    children.set(parentId, [...existing, taskId]);
  });

  return children;
}

function getDepth(taskId: string, parentByTask: Map<string, string | null>): number {
  let depth = 0;
  let current = parentByTask.get(taskId) ?? null;

  while (current) {
    depth += 1;
    current = parentByTask.get(current) ?? null;
  }

  return depth;
}

function orderTasks(rootTask: MultiAgentTaskSpec, tasks: MultiAgentTaskSpec[]): MultiAgentTaskSpec[] {
  const allTasks = [rootTask, ...tasks];
  const taskById = new Map(allTasks.map((task) => [task.id, task] as const));
  const originalIndex = new Map(allTasks.map((task, index) => [task.id, index] as const));
  const outgoing = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  allTasks.forEach((task) => indegree.set(task.id, 0));

  allTasks.forEach((task) => {
    const deps = [...new Set((task.dependsOn ?? []).filter((id) => taskById.has(id) && id !== task.id))];
    indegree.set(task.id, deps.length);

    deps.forEach((dependencyId) => {
      const existing = outgoing.get(dependencyId) ?? [];
      outgoing.set(dependencyId, [...existing, task.id]);
    });
  });

  const ready = allTasks
    .filter((task) => (indegree.get(task.id) ?? 0) === 0)
    .sort((left, right) => (originalIndex.get(left.id) ?? 0) - (originalIndex.get(right.id) ?? 0));

  const ordered: MultiAgentTaskSpec[] = [];

  while (ready.length > 0) {
    const next = ready.shift();
    if (!next) continue;

    ordered.push(next);

    const dependents = (outgoing.get(next.id) ?? []).sort(
      (left, right) => (originalIndex.get(left) ?? 0) - (originalIndex.get(right) ?? 0)
    );

    dependents.forEach((dependentId) => {
      const nextDegree = (indegree.get(dependentId) ?? 0) - 1;
      indegree.set(dependentId, nextDegree);
      if (nextDegree === 0) {
        const dependent = taskById.get(dependentId);
        if (dependent) {
          ready.push(dependent);
        }
      }
    });

    ready.sort((left, right) => (originalIndex.get(left.id) ?? 0) - (originalIndex.get(right.id) ?? 0));
  }

  return ordered.length === allTasks.length ? ordered : allTasks;
}

function groupTasksByWave(tasks: MultiAgentTaskSpec[]): MultiAgentTaskSpec[][] {
  const groups = new Map<number, MultiAgentTaskSpec[]>();

  tasks.forEach((task, index) => {
    const wave = task.wave ?? index;
    const existing = groups.get(wave) ?? [];
    groups.set(wave, [...existing, task]);
  });

  return [...groups.entries()]
    .sort(([leftWave], [rightWave]) => leftWave - rightWave)
    .map(([, group]) => group);
}

function edgeKey(edge: MultiAgentAgentEdge): string {
  return `${edge.kind}:${edge.from}->${edge.to}`;
}

function addUniqueEdge(edges: MultiAgentAgentEdge[], edge: MultiAgentAgentEdge): void {
  const key = edgeKey(edge);
  if (!edges.some((candidate) => edgeKey(candidate) === key)) {
    edges.push(edge);
  }
}

function formatTaskSummary(task: MultiAgentTaskSpec, agentName: string): string {
  return `${agentName} completed "${task.title}".`;
}

function selectAgentForTask(
  scenario: MultiAgentScenario,
  task: MultiAgentTaskSpec,
  taskIndex: number,
  agents: MultiAgentAgent[],
  parentAgentId: string | null
): { agentId: string; reason: string } {
  const rootAgent = agents.find((agent) => agent.role.id === 'supervisor') ?? agents[0];
  const workerAgents = agents.filter((agent) => agent.id !== rootAgent?.id);

  if (task.id === scenario.rootTask.id) {
    return {
      agentId: task.preferredAgentId && agents.some((agent) => agent.id === task.preferredAgentId)
        ? task.preferredAgentId
        : rootAgent?.id ?? agents[0].id,
      reason: 'Root task assigned to the primary coordinator.',
    };
  }

  if (task.preferredAgentId && agents.some((agent) => agent.id === task.preferredAgentId)) {
    return {
      agentId: task.preferredAgentId,
      reason: 'Preferred agent selected for this task.',
    };
  }

  if (scenario.pattern === 'network' && task.routeThrough && task.routeThrough.length > 0) {
    const finalHop = task.routeThrough[task.routeThrough.length - 1];
    if (agents.some((agent) => agent.id === finalHop)) {
      return {
        agentId: finalHop,
        reason: `Route-through path selected: ${task.routeThrough.join(' -> ')}.`,
      };
    }
  }

  const capabilityMatch = agents.find((agent) =>
    task.requiredCapabilities.every((capability) => agent.capabilities.includes(capability))
  );
  if (capabilityMatch) {
    return {
      agentId: capabilityMatch.id,
      reason: `Matched capabilities: ${task.requiredCapabilities.join(', ') || 'none'}.`,
    };
  }

  if (task.routeThrough && task.routeThrough.length > 0) {
    const finalHop = task.routeThrough[task.routeThrough.length - 1];
    if (agents.some((agent) => agent.id === finalHop)) {
      return {
        agentId: finalHop,
        reason: `Route-through path selected: ${task.routeThrough.join(' -> ')}.`,
      };
    }
  }

  if (scenario.pattern === 'sequential' || scenario.pattern === 'parallel') {
    const agent = workerAgents[taskIndex % Math.max(workerAgents.length, 1)] ?? rootAgent ?? agents[0];
    return {
      agentId: agent.id,
      reason:
        scenario.pattern === 'sequential'
          ? 'Sequential rotation across worker agents.'
          : `Parallel fan-out slot ${taskIndex + 1}.`,
    };
  }

  if (scenario.pattern === 'network' && parentAgentId) {
    return {
      agentId: parentAgentId,
      reason: 'Network task routed through the upstream agent.',
    };
  }

  const fallback = workerAgents[taskIndex % Math.max(workerAgents.length, 1)] ?? rootAgent ?? agents[0];
  return {
    agentId: fallback.id,
    reason: 'Fallback routing based on deterministic task order.',
  };
}

function computeTaskTokens(task: MultiAgentTaskSpec, depth: number, pattern: MultiAgentPattern): number {
  const patternBonus: Record<MultiAgentPattern, number> = {
    supervisor: 6,
    sequential: 4,
    parallel: 5,
    network: 7,
    'dispatch-tree': 8,
  };

  return (
    BASE_TASK_TOKENS +
    task.effort * 6 +
    task.requiredCapabilities.length * 3 +
    depth * 2 +
    patternBonus[pattern]
  );
}

function computeTaskDuration(task: MultiAgentTaskSpec, depth: number, pattern: MultiAgentPattern): number {
  const patternBonus: Record<MultiAgentPattern, number> = {
    supervisor: 8,
    sequential: 10,
    parallel: 4,
    network: 12,
    'dispatch-tree': 14,
  };

  return BASE_TASK_DURATION + task.effort * 8 + depth * 5 + patternBonus[pattern];
}

function createTaskState(task: MultiAgentTaskSpec, depth: number, assignedAgentId: string): MultiAgentTaskState {
  return {
    ...cloneTaskSpec(task),
    status: 'pending',
    assignedAgentId,
    depth,
    startTimestamp: 0,
    endTimestamp: 0,
    tokenCost: 0,
    duration: 0,
    resultSummary: '',
  };
}

function createDispatchNode(task: MultiAgentTaskSpec, depth: number, agentId: string): MultiAgentDispatchTreeNode {
  return {
    id: `dispatch-${task.id}`,
    taskId: task.id,
    parentId: null,
    childIds: [],
    agentId,
    depth,
    status: 'pending',
    tokenCost: 0,
    duration: 0,
  };
}

function buildInitialState(scenario: MultiAgentScenario): MultiAgentSimulationState {
  const orderedTasks = orderTasks(scenario.rootTask, scenario.tasks);
  const parentByTask = buildParentMap(scenario.rootTask, scenario.tasks);
  const agents = scenario.agents.map(cloneAgent);
  const dependencyEdges = buildDependencyEdges([scenario.rootTask, ...scenario.tasks]);
  const agentGraph = buildAgentGraph(agents);

  const tasks = orderedTasks.map((task, index) => {
    const depth = getDepth(task.id, parentByTask);
    const selection = selectAgentForTask(scenario, task, index, agents, null);
    return createTaskState(task, depth, selection.agentId);
  });

  const dispatchTree = orderedTasks.map((task, index) => {
    const depth = getDepth(task.id, parentByTask);
    const selection = selectAgentForTask(scenario, task, index, agents, null);
    const node = createDispatchNode(task, depth, selection.agentId);
    node.parentId = parentByTask.get(task.id) ?? null;
    return node;
  });

  const childrenByParent = buildChildrenMap(parentByTask);
  dispatchTree.forEach((node) => {
    node.childIds = [...(childrenByParent.get(node.taskId) ?? [])];
  });

  return {
    scenarioId: scenario.id,
    pattern: scenario.pattern,
    status: 'ready',
    agents,
    agentGraph,
    tasks,
    dependencyEdges,
    dispatchTree,
    routing: [],
    messages: [],
    aggregationEvents: [],
    metrics: emptyMetrics(),
    finalResult: null,
  };
}

export class MultiAgentSimulator extends SimulatedProtocol {
  private scenario: MultiAgentScenario | null = null;
  private state: MultiAgentSimulationState = emptyState();
  private eventClock = 0;

  constructor(scenario?: MultiAgentScenario) {
    super();
    if (scenario) {
      this.loadScenario(scenario);
    }
  }

  protected override emit(type: string, payload: unknown): void {
    const event: ProtocolEvent = {
      type,
      payload,
      timestamp: this.eventClock,
    };

    this.eventClock += 1;
    this.eventLog.push(event);
    this.bus.publish(type, event);
  }

  loadScenario(scenario: MultiAgentScenario): void {
    this.scenario = {
      ...scenario,
      agents: scenario.agents.map(cloneAgent),
      rootTask: cloneTaskSpec(scenario.rootTask),
      tasks: scenario.tasks.map(cloneTaskSpec),
    };
    this.reset();
  }

  getScenario(): MultiAgentScenario | null {
    if (!this.scenario) return null;

    return {
      ...this.scenario,
      agents: this.scenario.agents.map(cloneAgent),
      rootTask: cloneTaskSpec(this.scenario.rootTask),
      tasks: this.scenario.tasks.map(cloneTaskSpec),
    };
  }

  getState(): MultiAgentSimulationState {
    return cloneState(this.state);
  }

  reset(): void {
    this.eventClock = 0;
    this.eventLog = [];

    if (this.scenario) {
      this.state = buildInitialState(this.scenario);
      return;
    }

    this.state = emptyState();
  }

  run(): MultiAgentSimulationState {
    if (!this.scenario) {
      throw new Error('No multi-agent scenario loaded.');
    }

    this.reset();
    this.state.status = 'running';

    const scenario = this.scenario;
    const orderedTasks = orderTasks(scenario.rootTask, scenario.tasks);
    const taskGroups = scenario.pattern === 'parallel' ? groupTasksByWave(orderedTasks) : orderedTasks.map((task) => [task]);
    const taskById = new Map(this.state.tasks.map((task) => [task.id, task] as const));
    const dispatchByTaskId = new Map(this.state.dispatchTree.map((node) => [node.taskId, node] as const));
    const parentByTask = buildParentMap(scenario.rootTask, scenario.tasks);
    const childrenByParent = buildChildrenMap(parentByTask);
    const completedTasks = new Set<string>();
    const aggregatedParents = new Set<string>();
    const taskDurations: number[] = [];
    const taskTokens: number[] = [];
    let logicalTime = 0;

    this.emit('simulation:started', {
      scenarioId: scenario.id,
      pattern: scenario.pattern,
      taskCount: orderedTasks.length,
    });

    taskGroups.forEach((group, groupIndex) => {
      const waveStart = logicalTime;
      let waveEnd = logicalTime;

      group.forEach((task, taskIndex) => {
        const taskState = taskById.get(task.id);
        const dispatchNode = dispatchByTaskId.get(task.id);
        if (!taskState || !dispatchNode) {
          return;
        }

        const parentId = parentByTask.get(task.id) ?? null;
        const parentTaskState = parentId ? taskById.get(parentId) : null;
        const parentAgentId = parentTaskState?.assignedAgentId ?? null;
        const selection = selectAgentForTask(
          scenario,
          task,
          taskIndex + groupIndex,
          this.state.agents,
          parentAgentId
        );

        const routingDecision: MultiAgentRoutingDecision = {
          taskId: task.id,
          fromAgentId: parentAgentId ?? selection.agentId,
          toAgentId: selection.agentId,
          reason: selection.reason,
        };
        this.state.routing = [...this.state.routing, routingDecision];
        this.emit('task:routed', routingDecision);

        const duration = computeTaskDuration(task, taskState.depth, scenario.pattern);
        const tokenCost = computeTaskTokens(task, taskState.depth, scenario.pattern);
        const startTimestamp = scenario.pattern === 'parallel' ? waveStart : logicalTime;
        const endTimestamp = startTimestamp + duration;

        taskState.assignedAgentId = selection.agentId;
        taskState.status = 'running';
        taskState.startTimestamp = startTimestamp;
        taskState.endTimestamp = endTimestamp;
        taskState.duration = duration;
        taskState.tokenCost = tokenCost;
        taskState.resultSummary = formatTaskSummary(
          task,
          this.state.agents.find((agent) => agent.id === selection.agentId)?.name ?? selection.agentId
        );

        dispatchNode.agentId = selection.agentId;
        dispatchNode.status = 'running';
        dispatchNode.tokenCost = tokenCost;
        dispatchNode.duration = duration;

        this.emit('task:started', {
          taskId: task.id,
          assignedAgentId: selection.agentId,
          parentTaskId: parentId,
          startTimestamp,
        });

        if (parentAgentId && parentAgentId !== selection.agentId) {
          this.appendMessage(
            this.buildHandoffMessage(parentAgentId, selection.agentId, task, scenario.pattern, startTimestamp)
          );
        }

        this.emit('task:completed', {
          taskId: task.id,
          assignedAgentId: selection.agentId,
          duration,
          tokenCost,
          endTimestamp,
        });

        if (scenario.pattern === 'network' && task.routeThrough && task.routeThrough.length > 2) {
          this.appendRouteMessages(task, task.routeThrough, startTimestamp, selection.agentId);
        }

        taskState.status = 'completed';
        dispatchNode.status = 'completed';
        completedTasks.add(task.id);
        taskDurations.push(duration);
        taskTokens.push(tokenCost);

        if (scenario.pattern === 'parallel') {
          waveEnd = Math.max(waveEnd, endTimestamp);
        } else {
          logicalTime = endTimestamp;
        }

        this.maybeEmitAggregations(
          task.id,
          taskById,
          dispatchByTaskId,
          parentByTask,
          childrenByParent,
          aggregatedParents,
          completedTasks
        );
      });

      if (scenario.pattern === 'parallel') {
        logicalTime = groupIndex === taskGroups.length - 1 ? waveEnd : waveEnd + EXECUTION_ORDER_GAP;
      }
    });

    const messageTokens = this.state.messages.reduce((total, message) => total + message.tokenCost, 0);
    const aggregationTokens = this.state.aggregationEvents.reduce((total, event) => total + event.tokenCost, 0);
    const totalTokens = taskTokens.reduce((total, value) => total + value, 0) + messageTokens + aggregationTokens;
    const averageTaskDuration =
      taskDurations.length > 0 ? taskDurations.reduce((total, value) => total + value, 0) / taskDurations.length : 0;

    this.state.metrics = {
      totalTokens,
      totalDuration: logicalTime,
      totalMessages: this.state.messages.length,
      completedTasks: completedTasks.size,
      aggregationEvents: this.state.aggregationEvents.length,
      averageTaskDuration,
    };

    const rootAggregation = [...this.state.aggregationEvents].reverse().find(
      (event) => event.taskId === scenario.rootTask.id
    );

    this.state.finalResult =
      rootAggregation?.summary ??
      `Completed ${completedTasks.size} tasks across ${this.state.agents.length} agents for ${scenario.name}.`;
    this.state.status = 'completed';

    this.emit('simulation:completed', {
      scenarioId: scenario.id,
      metrics: this.state.metrics,
      finalResult: this.state.finalResult,
    });

    return this.getState();
  }

  simulate(): MultiAgentSimulationState {
    return this.run();
  }

  private appendMessage(message: MultiAgentMessage): void {
    this.state.messages = [...this.state.messages, message];
    this.emit('message:sent', message);
    addUniqueEdge(this.state.agentGraph.edges, {
      from: message.from,
      to: message.to,
      kind: 'delegates-to',
    });
  }

  private buildHandoffMessage(
    fromAgentId: string,
    toAgentId: string,
    task: MultiAgentTaskSpec,
    pattern: MultiAgentPattern,
    timestamp: number
  ): MultiAgentMessage {
    const fromAgent = this.state.agents.find((agent) => agent.id === fromAgentId);
    const toAgent = this.state.agents.find((agent) => agent.id === toAgentId);
    const kind: MultiAgentMessageKind = pattern === 'network' ? 'cross-check' : 'delegate';

    return {
      id: `message-${task.id}-${this.state.messages.length + 1}`,
      from: fromAgentId,
      to: toAgentId,
      kind,
      content: `${fromAgent?.name ?? fromAgentId} assigned "${task.title}" to ${toAgent?.name ?? toAgentId}.`,
      tokenCost: 2 + Math.max(0, task.routeThrough?.length ?? 0),
      timestamp,
    };
  }

  private appendRouteMessages(
    task: MultiAgentTaskSpec,
    routeThrough: string[],
    timestamp: number,
    finalAgentId: string
  ): void {
    for (let index = 0; index < routeThrough.length - 1; index += 1) {
      const fromAgentId = routeThrough[index];
      const toAgentId = routeThrough[index + 1];
      const fromAgent = this.state.agents.find((agent) => agent.id === fromAgentId);
      const toAgent = this.state.agents.find((agent) => agent.id === toAgentId);
      const message: MultiAgentMessage = {
        id: `route-${task.id}-${index}`,
        from: fromAgentId,
        to: toAgentId,
        kind: index === routeThrough.length - 2 ? 'result' : 'cross-check',
        content: `${fromAgent?.name ?? fromAgentId} passed "${task.title}" to ${toAgent?.name ?? toAgentId}.`,
        tokenCost: 1 + index,
        timestamp: timestamp + index + 1,
      };

      this.appendMessage(message);
      if (fromAgentId !== toAgentId) {
        addUniqueEdge(this.state.agentGraph.edges, {
          from: fromAgentId,
          to: toAgentId,
          kind: 'collaborates-with',
        });
      }
    }

    const finalHop = routeThrough[routeThrough.length - 1];
    if (finalHop !== finalAgentId) {
      addUniqueEdge(this.state.agentGraph.edges, {
        from: finalHop,
        to: finalAgentId,
        kind: 'collaborates-with',
      });
    }
  }

  private maybeEmitAggregations(
    taskId: string,
    taskById: Map<string, MultiAgentTaskState>,
    dispatchByTaskId: Map<string, MultiAgentDispatchTreeNode>,
    parentByTask: Map<string, string | null>,
    childrenByParent: Map<string, string[]>,
    aggregatedParents: Set<string>,
    completedTasks: Set<string>
  ): void {
    let current = taskId;

    while (true) {
      const parentId = parentByTask.get(current) ?? null;
      if (!parentId || aggregatedParents.has(parentId)) {
        return;
      }

      const children = childrenByParent.get(parentId) ?? [];
      if (children.length === 0 || !children.every((childId) => completedTasks.has(childId))) {
        return;
      }

      const childStates = children
        .map((childId) => taskById.get(childId))
        .filter((task): task is MultiAgentTaskState => Boolean(task));
      const parentTask = taskById.get(parentId);
      const parentDispatch = dispatchByTaskId.get(parentId);
      const aggregateTimestamp = childStates.reduce((max, child) => Math.max(max, child.endTimestamp), 0);
      const tokenCost = BASE_AGGREGATION_TOKENS + childStates.length * 2;
      const duration = Math.max(
        4,
        childStates.reduce((total, child) => total + child.duration, 0) -
          Math.min(...childStates.map((child) => child.startTimestamp))
      );
      const agentId = parentTask?.assignedAgentId ?? parentDispatch?.agentId ?? this.state.agents[0]?.id ?? 'agent';
      const aggregationEvent: MultiAgentAggregationEvent = {
        id: `aggregation-${parentId}-${this.state.aggregationEvents.length + 1}`,
        taskId: parentId,
        agentId,
        sourceTaskIds: [...children],
        summary: `${this.state.agents.find((agent) => agent.id === agentId)?.name ?? agentId} merged ${
          children.length
        } child result(s) for "${parentTask?.title ?? parentId}".`,
        tokenCost,
        duration,
        timestamp: aggregateTimestamp,
      };

      this.state.aggregationEvents = [...this.state.aggregationEvents, aggregationEvent];
      this.emit('aggregation:emitted', aggregationEvent);
      addUniqueEdge(this.state.agentGraph.edges, {
        from: agentId,
        to: parentId,
        kind: 'delegates-to',
      });

      aggregatedParents.add(parentId);
      current = parentId;
    }
  }
}

