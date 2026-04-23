import type { FocusTarget, SimulationEvent } from '../core/session';

export type AGUIEventType =
  | 'session.started'
  | 'run.created'
  | 'message.delta'
  | 'tool.called'
  | 'tool.output'
  | 'state.updated'
  | 'run.completed'
  | 'run.failed';

export type AGUIStreamSource = 'server' | 'agent' | 'ui';

export interface AGUIEventPayload {
  title: string;
  summary: string;
  body?: string;
  data?: Record<string, unknown>;
}

export interface AGUIEvent extends SimulationEvent<AGUIEventPayload> {
  type: AGUIEventType;
  source: AGUIStreamSource;
  tags: string[];
}

export interface AGUIEventDefinition {
  type: AGUIEventType;
  source: AGUIStreamSource;
  title: string;
  summary: string;
  body?: string;
  tags?: string[];
  payload?: Record<string, unknown>;
  focus?: FocusTarget[];
}

export interface AGUIScenario {
  id: string;
  name: string;
  description: string;
  category: 'assistant' | 'handoff' | 'human-in-loop';
  events: AGUIEventDefinition[];
}

export interface AGUIVisibleEventFilters {
  type: AGUIEventType | 'all';
  source: AGUIStreamSource | 'all';
}

export interface AGUIMetrics {
  totalEvents: number;
  visibleEvents: number;
  toolCalls: number;
  failures: number;
  streamedMessages: number;
}

export interface AGUIEventStreamState {
  scenarioId: string | null;
  status: 'idle' | 'ready' | 'running' | 'completed';
  events: AGUIEvent[];
  visibleEvents: AGUIEvent[];
  selectedEventId: string | null;
  filters: AGUIVisibleEventFilters;
  metrics: AGUIMetrics;
}
