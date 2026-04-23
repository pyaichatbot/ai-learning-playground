import { SimulatedProtocol } from '../core/SimulatedProtocol';
import type { AGUIEvent, AGUIEventDefinition, AGUIEventStreamState, AGUIScenario, AGUIVisibleEventFilters } from './types';

const DEFAULT_FILTERS: AGUIVisibleEventFilters = {
  type: 'all',
  source: 'all',
};

function createEmptyState(): AGUIEventStreamState {
  return {
    scenarioId: null,
    status: 'idle',
    events: [],
    visibleEvents: [],
    selectedEventId: null,
    filters: { ...DEFAULT_FILTERS },
    metrics: {
      totalEvents: 0,
      visibleEvents: 0,
      toolCalls: 0,
      failures: 0,
      streamedMessages: 0,
    },
  };
}

function materializeEvent(definition: AGUIEventDefinition, index: number): AGUIEvent {
  return {
    id: `agui-event-${index + 1}`,
    type: definition.type,
    timestamp: index * 1000,
    source: definition.source,
    payload: {
      title: definition.title,
      summary: definition.summary,
      body: definition.body,
      data: definition.payload,
    },
    focus: definition.focus,
    meta: {
      tags: definition.tags ?? [],
    },
    tags: definition.tags ?? [],
  };
}

function applyFilters(events: AGUIEvent[], filters: AGUIVisibleEventFilters): AGUIEvent[] {
  return events.filter((event) => {
    const typeMatch = filters.type === 'all' || event.type === filters.type;
    const sourceMatch = filters.source === 'all' || event.source === filters.source;
    return typeMatch && sourceMatch;
  });
}

function buildMetrics(events: AGUIEvent[], visibleEvents: AGUIEventStreamState['visibleEvents']) {
  return {
    totalEvents: events.length,
    visibleEvents: visibleEvents.length,
    toolCalls: events.filter((event) => event.type === 'tool.called').length,
    failures: events.filter((event) => event.type === 'run.failed').length,
    streamedMessages: events.filter((event) => event.type === 'message.delta').length,
  };
}

export class AGUIEventStreamSimulator extends SimulatedProtocol {
  private scenario: AGUIScenario | null = null;
  private state: AGUIEventStreamState = createEmptyState();

  constructor(scenario?: AGUIScenario) {
    super();
    if (scenario) {
      this.loadScenario(scenario);
    }
  }

  loadScenario(scenario: AGUIScenario): void {
    this.scenario = JSON.parse(JSON.stringify(scenario)) as AGUIScenario;
    this.reset();
  }

  getState(): AGUIEventStreamState {
    return JSON.parse(JSON.stringify(this.state)) as AGUIEventStreamState;
  }

  reset(): void {
    this.clearLog();

    if (!this.scenario) {
      this.state = createEmptyState();
      return;
    }

    const events = this.scenario.events.map(materializeEvent);
    const visibleEvents = applyFilters(events, DEFAULT_FILTERS);
    this.state = {
      scenarioId: this.scenario.id,
      status: 'ready',
      events,
      visibleEvents,
      selectedEventId: visibleEvents[0]?.id ?? null,
      filters: { ...DEFAULT_FILTERS },
      metrics: buildMetrics(events, visibleEvents),
    };
  }

  run(): AGUIEventStreamState {
    if (!this.scenario) {
      throw new Error('No AG-UI scenario loaded.');
    }

    this.reset();
    this.state.status = 'running';

    for (const event of this.state.events) {
      this.emit('agui:event', event);
    }

    this.state.visibleEvents = applyFilters(this.state.events, this.state.filters);
    this.state.metrics = buildMetrics(this.state.events, this.state.visibleEvents);
    this.state.status = 'completed';
    this.emit('agui:completed', {
      scenarioId: this.state.scenarioId,
      totalEvents: this.state.metrics.totalEvents,
    });
    return this.getState();
  }

  setFilters(filters: Partial<AGUIVisibleEventFilters>): AGUIEventStreamState {
    this.state.filters = {
      ...this.state.filters,
      ...filters,
    };
    this.state.visibleEvents = applyFilters(this.state.events, this.state.filters);
    this.state.selectedEventId =
      this.state.visibleEvents.find((event) => event.id === this.state.selectedEventId)?.id ??
      this.state.visibleEvents[0]?.id ??
      null;
    this.state.metrics = buildMetrics(this.state.events, this.state.visibleEvents);
    return this.getState();
  }

  selectEvent(eventId: string | null): AGUIEventStreamState {
    this.state.selectedEventId = eventId;
    return this.getState();
  }

  injectFailure(summary: string): AGUIEventStreamState {
    const failureEvent: AGUIEvent = {
      id: `agui-event-${this.state.events.length + 1}`,
      type: 'run.failed',
      timestamp: this.state.events.length * 1000,
      source: 'server',
      payload: {
        title: 'Injected failure',
        summary,
        body: 'A synthetic failure was inserted into the stream for walkthrough purposes.',
        data: { synthetic: true },
      },
      tags: ['error', 'synthetic'],
      meta: { tags: ['error', 'synthetic'] },
    };
    this.state.events = [...this.state.events, failureEvent];
    this.state.visibleEvents = applyFilters(this.state.events, this.state.filters);
    this.state.metrics = buildMetrics(this.state.events, this.state.visibleEvents);
    this.state.status = 'completed';
    return this.getState();
  }

  createCustomScenario(id: string, name: string, description: string, events: AGUIEventDefinition[]): AGUIScenario {
    return {
      id,
      name,
      description,
      category: 'assistant',
      events,
    };
  }
}
