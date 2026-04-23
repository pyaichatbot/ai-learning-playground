import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, CheckCircle2, RefreshCcw, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '@/components/shared';
import { usePlatformStore } from '@/lib/store';
import { A2AProtocolSimulator } from '@/lib/simulation/a2a/A2AProtocolSimulator';
import { A2A_SCENARIOS, DEFAULT_A2A_SCENARIO } from '@/lib/simulation/a2a/scenarios';
import type { A2AScenario, A2ATask, A2ATaskStatus } from '@/lib/simulation/a2a/types';
import { cn } from '@/lib/utils';

function statusVariant(status: A2ATaskStatus): 'cyan' | 'violet' | 'emerald' | 'amber' | 'default' {
  switch (status) {
    case 'completed':
      return 'emerald';
    case 'failed':
    case 'canceled':
      return 'amber';
    case 'working':
      return 'cyan';
    case 'accepted':
    case 'input-required':
      return 'violet';
    default:
      return 'default';
  }
}

export function A2AProtocolVisualizerCockpit() {
  const navigate = useNavigate();
  const { focusTarget } = usePlatformStore();
  const [activeScenario, setActiveScenario] = useState<A2AScenario>(DEFAULT_A2A_SCENARIO);
  const [simulator] = useState(() => new A2AProtocolSimulator(DEFAULT_A2A_SCENARIO));
  const [state, setState] = useState(() => simulator.run());
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    simulator.loadScenario(activeScenario);
    setState(simulator.run());
    setActionError(null);
  }, [activeScenario, simulator]);

  useEffect(() => {
    if (focusTarget && 'cockpit' in focusTarget && focusTarget.cockpit === 'a2a-protocol' && focusTarget.targetId) {
      setState(simulator.selectTask(focusTarget.targetId));
    }
  }, [focusTarget, simulator]);

  const selectedTask = useMemo<A2ATask | null>(
    () => state.tasks.find((task) => task.id === state.selectedTaskId) ?? state.tasks[0] ?? null,
    [state.selectedTaskId, state.tasks]
  );

  const handleRetry = () => {
    if (!selectedTask) return;
    try {
      setState(simulator.retryTask(selectedTask.id));
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Retry failed.');
    }
  };

  const handleCancel = () => {
    if (!selectedTask) return;
    try {
      setState(simulator.cancelTask(selectedTask.id));
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Cancel failed.');
    }
  };

  const openOrchestrationContext = () => {
    const focus = selectedTask?.orchestrationTarget;
    if (!focus || !('cockpit' in focus)) return;
    navigate(
      `/advanced/multi-agent?focusCockpit=${focus.cockpit}&focusTarget=${focus.targetId}&focusType=${focus.targetType ?? 'task'}`
    );
  };

  return (
    <div className="flex h-full flex-col bg-surface text-content">
      <div className="border-b border-content-subtle/20 px-6 py-5 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-content">A2A Protocol Visualizer</h1>
              <Badge variant="cyan">Phase 3</Badge>
              <Badge variant="violet">Cards · Lifecycle · Messages</Badge>
            </div>
            <p className="max-w-3xl text-sm text-content-muted">
              Explore how agents from different runtimes discover each other, exchange tasks, and recover from failures.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {A2A_SCENARIOS.map((scenario) => (
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_360px]">
          <Card className="p-6">
            <div>
              <h2 className="font-medium text-content">Agent cards</h2>
              <p className="text-sm text-content-muted">Each card advertises capabilities and an endpoint contract.</p>
            </div>
            <div className="mt-5 space-y-4">
              {state.agents.map((agent) => (
                <div key={agent.id} className="rounded-2xl border border-content-subtle/20 bg-surface-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-content">{agent.name}</div>
                      <div className="text-xs text-content-subtle">{agent.provider}</div>
                    </div>
                    <Badge variant="default">{agent.id}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-content-muted">{agent.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agent.capabilities.map((capability) => (
                      <span key={capability} className="rounded-full bg-surface px-2 py-1 text-2xs text-content-muted">
                        {capability}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-2xs text-content-subtle">{agent.endpoint}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div>
              <h2 className="font-medium text-content">Task lifecycle</h2>
              <p className="text-sm text-content-muted">Track the exact A2A task state transitions and message flow.</p>
            </div>

            {selectedTask ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-content-subtle/20 bg-surface-muted/30 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium text-content">{selectedTask.title}</div>
                    <Badge variant={statusVariant(selectedTask.status)}>{selectedTask.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-content-muted">{selectedTask.description}</p>
                </div>

                <div className="space-y-3">
                  {selectedTask.history.map((entry, index) => (
                    <div key={`${entry.status}-${index}`} className="flex gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-400" />
                      <div className="rounded-2xl border border-content-subtle/20 bg-surface-muted/30 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={statusVariant(entry.status)}>{entry.status}</Badge>
                          <span className="text-2xs text-content-subtle">{entry.timestamp}ms</span>
                        </div>
                        <p className="mt-2 text-sm text-content-muted">{entry.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-content-subtle/20 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-sm text-content">
                    <ArrowRightLeft size={16} />
                    Message exchange log
                  </div>
                  <div className="mt-3 space-y-3">
                    {state.messages.map((message) => (
                      <div key={message.id} className="rounded-xl border border-content-subtle/20 px-3 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="default">{message.kind}</Badge>
                          <span className="text-content">{message.from}</span>
                          <span className="text-content-subtle">→</span>
                          <span className="text-content">{message.to}</span>
                          <span className="text-2xs text-content-subtle">{message.timestamp}ms</span>
                        </div>
                        <p className="mt-2 text-content-muted">{message.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="font-medium text-content">Recovery controls</h2>
              <p className="mt-2 text-sm text-content-muted">Retry failed tasks, cancel active ones, or jump back into orchestration context.</p>
              <div className="mt-4 flex flex-col gap-3">
                <Button variant="secondary" onClick={handleRetry}>
                  <RefreshCcw size={14} />
                  Retry task
                </Button>
                <Button variant="secondary" onClick={handleCancel}>
                  <XCircle size={14} />
                  Cancel task
                </Button>
                <Button variant="secondary" onClick={openOrchestrationContext}>
                  <CheckCircle2 size={14} />
                  Open orchestration context
                </Button>
              </div>
              {actionError ? <p className="mt-3 text-sm text-accent-amber">{actionError}</p> : null}
            </Card>

            <Card className="p-5">
              <h3 className="font-medium text-content">Protocol summary</h3>
              <div className="mt-4 space-y-3 text-sm text-content-muted">
                <div className="flex items-center justify-between">
                  <span>Total messages</span>
                  <span className="text-content">{state.metrics.totalMessages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Completed tasks</span>
                  <span className="text-content">{state.metrics.completedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Failed tasks</span>
                  <span className="text-content">{state.metrics.failedTasks}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
