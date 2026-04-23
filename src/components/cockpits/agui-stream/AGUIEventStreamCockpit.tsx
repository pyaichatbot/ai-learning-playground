import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, Filter, Radio, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '@/components/shared';
import { usePlatformStore } from '@/lib/store';
import { AGUIEventStreamSimulator } from '@/lib/simulation/agui/AGUIEventStreamSimulator';
import { AGUI_SCENARIOS, DEFAULT_AGUI_SCENARIO } from '@/lib/simulation/agui/scenarios';
import type { AGUIEvent, AGUIEventType, AGUIScenario } from '@/lib/simulation/agui/types';
import { cn } from '@/lib/utils';

const EVENT_TYPES: Array<AGUIEventType | 'all'> = [
  'all',
  'session.started',
  'run.created',
  'message.delta',
  'tool.called',
  'tool.output',
  'state.updated',
  'run.completed',
  'run.failed',
];

export function AGUIEventStreamCockpit() {
  const navigate = useNavigate();
  const { focusTarget } = usePlatformStore();
  const [activeScenario, setActiveScenario] = useState<AGUIScenario>(DEFAULT_AGUI_SCENARIO);
  const [simulator] = useState(() => new AGUIEventStreamSimulator(DEFAULT_AGUI_SCENARIO));
  const [state, setState] = useState(() => simulator.run());

  const selectedEvent = useMemo<AGUIEvent | null>(
    () => state.visibleEvents.find((event) => event.id === state.selectedEventId) ?? state.visibleEvents[0] ?? null,
    [state.selectedEventId, state.visibleEvents]
  );

  useEffect(() => {
    simulator.loadScenario(activeScenario);
    setState(simulator.run());
  }, [activeScenario, simulator]);

  useEffect(() => {
    if (focusTarget && 'cockpit' in focusTarget && focusTarget.cockpit === 'agui-stream' && focusTarget.targetId) {
      setState(simulator.selectEvent(focusTarget.targetId));
    }
  }, [focusTarget, simulator]);

  const selectedOrchestrationFocus = selectedEvent?.focus?.find(
    (item): item is Extract<typeof item, { cockpit: string; targetId: string }> =>
      'cockpit' in item && item.cockpit === 'multi-agent'
  );

  return (
    <div className="flex h-full flex-col bg-surface text-content">
      <div className="border-b border-content-subtle/20 px-6 py-5 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-content">AG-UI Event Stream</h1>
              <Badge variant="cyan">Phase 3</Badge>
              <Badge variant="violet">Stream · Payload · Replay</Badge>
            </div>
            <p className="max-w-3xl text-sm text-content-muted">
              Inspect how an agent backend streams state and event patches into a live application shell.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {AGUI_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setActiveScenario(scenario)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  activeScenario.id === scenario.id
                    ? 'border-brand-400 bg-brand-500/10 text-brand-200'
                    : 'border-content-subtle/20 bg-surface-muted text-content-muted hover:text-content'
                )}
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-medium text-content">Event stream</h2>
                  <p className="text-sm text-content-muted">
                    Replay a deterministic AG-UI stream and filter to the events that matter.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setState(simulator.setFilters({ type }))}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-2xs transition-colors',
                        state.filters.type === type
                          ? 'border-brand-400 bg-brand-500/10 text-brand-200'
                          : 'border-content-subtle/20 text-content-muted'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {state.visibleEvents.map((event) => {
                  const isSelected = event.id === selectedEvent?.id;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setState(simulator.selectEvent(event.id))}
                      className={cn(
                        'w-full rounded-2xl border px-4 py-4 text-left transition-colors',
                        isSelected
                          ? 'border-brand-400 bg-brand-500/10'
                          : 'border-content-subtle/20 bg-surface-muted/30 hover:border-content-subtle/40'
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={event.type === 'run.failed' ? 'amber' : 'default'}>{event.type}</Badge>
                        <span className="text-2xs uppercase tracking-[0.18em] text-content-subtle">{event.source}</span>
                        <span className="text-2xs text-content-subtle">{event.timestamp}ms</span>
                      </div>
                      <div className="mt-3 text-sm font-medium text-content">{event.payload.title}</div>
                      <p className="mt-1 text-sm text-content-muted">{event.payload.summary}</p>
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-5">
                <div className="flex items-center gap-2 text-content-muted">
                  <Radio size={16} />
                  <span className="text-sm">Visible events</span>
                </div>
                <div className="mt-3 text-3xl font-semibold text-content">{state.metrics.visibleEvents}</div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-2 text-content-muted">
                  <Filter size={16} />
                  <span className="text-sm">Tool calls</span>
                </div>
                <div className="mt-3 text-3xl font-semibold text-content">{state.metrics.toolCalls}</div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-2 text-content-muted">
                  <Bot size={16} />
                  <span className="text-sm">Failures</span>
                </div>
                <div className="mt-3 text-3xl font-semibold text-content">{state.metrics.failures}</div>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-medium text-content">Payload inspector</h2>
                  <p className="text-sm text-content-muted">Inspect the selected event envelope and UI impact.</p>
                </div>
                <Badge variant="emerald">{activeScenario.category}</Badge>
              </div>

              {selectedEvent ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-content">{selectedEvent.payload.title}</div>
                    <p className="mt-1 text-sm text-content-muted">{selectedEvent.payload.summary}</p>
                  </div>
                  {selectedEvent.payload.body ? (
                    <div className="rounded-2xl border border-content-subtle/20 bg-surface-muted/30 p-4 text-sm text-content-muted">
                      {selectedEvent.payload.body}
                    </div>
                  ) : null}
                  <pre className="overflow-auto rounded-2xl border border-content-subtle/20 bg-black/30 p-4 text-xs text-brand-100">
                    {JSON.stringify(
                      {
                        id: selectedEvent.id,
                        type: selectedEvent.type,
                        source: selectedEvent.source,
                        payload: selectedEvent.payload.data ?? {},
                      },
                      null,
                      2
                    )}
                  </pre>
                  {selectedOrchestrationFocus ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        navigate(
                          `/advanced/multi-agent?focusCockpit=multi-agent&focusTarget=${selectedOrchestrationFocus.targetId}&focusType=${selectedOrchestrationFocus.targetType ?? 'task'}`
                        )
                      }
                    >
                      Open orchestration context
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-content">
                <Sparkles size={16} />
                <h3 className="font-medium">Event type explorer</h3>
              </div>
              <div className="mt-4 space-y-3 text-sm text-content-muted">
                <p><strong className="text-content">`message.delta`</strong> drives token-by-token visible output.</p>
                <p><strong className="text-content">`tool.called` / `tool.output`</strong> bridge the UI shell and backend.</p>
                <p><strong className="text-content">`state.updated`</strong> patches local UI state without a full rerender.</p>
                <p><strong className="text-content">`run.failed`</strong> keeps recovery inside the same stream contract.</p>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-medium text-content">Custom sequence builder</h3>
              <p className="mt-2 text-sm text-content-muted">
                The simulator also supports custom event sequences, so Tranche E workflow steps can later open exact AG-UI runs instead of generic demos.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-brand-300">
                <span>Foundation ready for import/export and replay</span>
                <ArrowRight size={14} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
