export type FocusTarget =
  | {
      kind?: 'cockpit';
      cockpit: string;
      targetId: string;
      targetType?: string;
      meta?: Record<string, unknown>;
    }
  | {
      kind: 'scenario';
      id: string;
    }
  | {
      kind: 'event';
      id: string;
    }
  | {
      kind: 'step';
      id: string;
    }
  | {
      kind: 'resource';
      id: string;
      uri?: string;
    }
  | {
      kind: 'tool';
      id: string;
      name?: string;
    }
  | {
      kind: 'custom';
      id: string;
      label?: string;
      meta?: Record<string, unknown>;
    };

export interface SimulationEvent<TPayload = unknown> {
  id: string;
  type: string;
  timestamp: number;
  source?: string;
  payload: TPayload;
  focus?: FocusTarget[];
  meta?: Record<string, unknown>;
}

export interface ReplayState<TState = unknown> {
  cursor: number;
  playing: boolean;
  speed: number;
  direction: 1 | -1;
  loop: boolean;
  currentFocus?: FocusTarget | null;
  selectedEventId?: string | null;
  derivedState?: TState;
}

export interface SessionSnapshot<
  TScenario = ScenarioDefinition,
  TState = unknown,
  TEvent extends SimulationEvent = SimulationEvent,
> {
  version: 1;
  id: string;
  sessionId: string;
  createdAt: number;
  updatedAt: number;
  scenario: TScenario;
  events: TEvent[];
  replay: ReplayState<TState>;
  focus?: FocusTarget | null;
  notes?: string;
  meta?: Record<string, unknown>;
}

export interface ScenarioDefinition<
  TConfig = Record<string, unknown>,
  TMeta = Record<string, unknown>,
> {
  id: string;
  name: string;
  description?: string;
  kind?: string;
  version?: number;
  category?: string;
  origin?: 'builtin' | 'custom' | 'imported';
  tags?: string[];
  config?: TConfig;
  meta?: TMeta;
  createdAt?: number;
  updatedAt?: number;
}

export type SessionSnapshotInput<
  TScenario = ScenarioDefinition,
  TState = unknown,
  TEvent extends SimulationEvent = SimulationEvent,
> = Omit<SessionSnapshot<TScenario, TState, TEvent>, 'version' | 'sessionId' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<SessionSnapshot<TScenario, TState, TEvent>, 'version' | 'sessionId' | 'createdAt' | 'updatedAt'>>;

export function createReplayState<TState = unknown>(
  overrides: Partial<ReplayState<TState>> = {},
): ReplayState<TState> {
  return {
    cursor: 0,
    playing: false,
    speed: 1,
    direction: 1,
    loop: false,
    currentFocus: null,
    selectedEventId: null,
    ...overrides,
  };
}

export function createSessionSnapshot<
  TScenario = ScenarioDefinition,
  TState = unknown,
  TEvent extends SimulationEvent = SimulationEvent,
>(input: SessionSnapshotInput<TScenario, TState, TEvent>): SessionSnapshot<TScenario, TState, TEvent> {
  const timestamp = Date.now();

  return {
    version: input.version ?? 1,
    id: input.id,
    sessionId: input.sessionId ?? input.id,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp,
    scenario: input.scenario,
    events: input.events,
    replay: input.replay,
    focus: input.focus ?? null,
    notes: input.notes,
    meta: input.meta,
  };
}
