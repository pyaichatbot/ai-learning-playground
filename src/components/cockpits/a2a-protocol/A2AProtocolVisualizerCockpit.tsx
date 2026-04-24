import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Play, RadioTower, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ALL_A2A_SCENARIOS } from '@/lib/simulation/a2a/scenarios';
import type { A2AAgentCard, A2AScenario, A2ASimulatedStep } from '@/lib/simulation/a2a/types';
import { useA2AStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type FlowKind = 'discover' | 'request' | 'response' | 'stream' | 'error';
type A2AVisualStep = A2ASimulatedStep & {
  id: string;
  label: string;
  kind: FlowKind;
  pathId:
    | 'discovery-request'
    | 'card-response'
    | 'task-request'
    | 'followup-request'
    | 'retry-request'
    | 'ack-response'
    | 'stream-to-caller'
    | 'error-response';
};

const FLOW_PATHS = {
  'discovery-request': 'M 172 284 C 268 178 492 178 588 284',
  'card-response': 'M 588 284 C 488 154 268 154 172 284',
  'task-request': 'M 172 302 C 298 268 462 268 588 302',
  'followup-request': 'M 172 330 C 300 386 462 386 588 330',
  'retry-request': 'M 172 338 C 292 432 468 432 588 338',
  'ack-response': 'M 588 318 C 492 432 268 432 172 318',
  'stream-to-caller': 'M 588 318 C 520 404 342 458 172 318',
  'error-response': 'M 588 318 C 492 432 268 432 172 318',
} as const;

const STATE_RAIL = ['submitted', 'working', 'input-required', 'auth-required', 'completed', 'failed'] as const;

function packetJson(value: unknown) {
  return JSON.stringify(value, null, 2).slice(0, 1100);
}

function stepKind(step: A2ASimulatedStep): FlowKind {
  if (step.stateAfter === 'failed' || 'error' in step.payload) return 'error';
  if (step.method?.startsWith('SSE')) return 'stream';
  if (step.method?.includes('agent.json')) return step.direction === 'caller→callee' ? 'discover' : 'response';
  return step.direction === 'caller→callee' ? 'request' : 'response';
}

function stepLabel(scenario: A2AScenario, step: A2ASimulatedStep, index: number) {
  if (step.method?.includes('agent.json')) return index === 0 ? 'DISCOVER' : 'CARD';
  if (step.method === 'SSE: artifactUpdate') return 'ARTIFACT';
  if (step.method === 'SSE: statusUpdate') {
    if (step.stateAfter === 'completed') return 'COMPLETED';
    if (step.stateAfter === 'failed') return 'FAILED';
    return 'STREAM';
  }
  if (step.stateAfter === 'failed') return 'FAILED';
  if (step.stateAfter === 'input-required') return 'INPUT REQUIRED';
  if (step.stateAfter === 'completed') return 'COMPLETED';
  if (step.direction === 'caller→callee' && step.method === 'a2a_sendMessage') {
    const previousState = scenario.steps[index - 1]?.stateAfter;
    if (previousState === 'input-required') return 'FOLLOW-UP';
    if (previousState === 'failed') return 'RETRY';
    return 'TASK';
  }
  return step.method?.replace('a2a_', '') ?? 'RESPONSE';
}

function pathForStep(scenario: A2AScenario, step: A2ASimulatedStep, index: number): A2AVisualStep['pathId'] {
  if (step.method?.includes('agent.json')) return 'discovery-request';
  if (step.direction === 'callee→caller' && index === 1 && scenario.steps[0]?.method?.includes('agent.json')) return 'card-response';
  if (step.stateAfter === 'failed' || 'error' in step.payload) return 'error-response';
  if (step.method?.startsWith('SSE')) return 'stream-to-caller';

  if (step.direction === 'caller→callee') {
    const previousState = scenario.steps[index - 1]?.stateAfter;
    if (previousState === 'input-required') return 'followup-request';
    if (previousState === 'failed') return 'retry-request';
    return 'task-request';
  }

  return 'ack-response';
}

function flowTone(kind: FlowKind) {
  if (kind === 'response') {
    return { active: 'rgba(240,192,96,0.94)', idle: 'rgba(240,192,96,0.16)', fill: 'var(--telemetry)', text: 'text-[var(--telemetry)]', border: 'border-[rgba(240,192,96,0.7)] bg-[rgba(240,192,96,0.12)] text-[var(--telemetry)]', dash: '3 8' };
  }
  if (kind === 'stream') {
    return { active: 'rgba(167,139,250,0.95)', idle: 'rgba(167,139,250,0.15)', fill: '#a78bfa', text: 'text-[#a78bfa]', border: 'border-[#a78bfa]/70 bg-[#a78bfa]/12 text-[#c4b5fd]', dash: '1 9' };
  }
  if (kind === 'error') {
    return { active: 'rgba(255,64,96,0.95)', idle: 'rgba(255,64,96,0.16)', fill: 'var(--critical)', text: 'text-[var(--critical)]', border: 'border-[rgba(255,64,96,0.7)] bg-[rgba(255,64,96,0.12)] text-[var(--critical)]', dash: '10 5 2 5' };
  }
  return { active: 'rgba(0,212,255,0.94)', idle: 'rgba(0,212,255,0.14)', fill: 'var(--signal)', text: 'text-[var(--signal)]', border: 'border-[rgba(0,212,255,0.72)] bg-[rgba(0,212,255,0.12)] text-[var(--signal)]', dash: '12 10' };
}

function buildVisualSteps(scenario: A2AScenario): A2AVisualStep[] {
  return scenario.steps.map((step, index) => {
    const kind = stepKind(step);
    const pathId = pathForStep(scenario, step, index);
    return {
      ...step,
      id: `${scenario.id}-${index}`,
      label: `${String(index + 1).padStart(2, '0')} ${stepLabel(scenario, step, index)}`,
      kind,
      pathId,
    };
  });
}

export function A2AProtocolVisualizerCockpit() {
  const { setActiveScenario, setConnectionState, setTaskState, clearMessages, appendMessage, setReplayStep } = useA2AStore();
  const [scenarioId, setScenarioId] = useState(ALL_A2A_SCENARIOS[0].id);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const activeScenario = ALL_A2A_SCENARIOS.find((scenario) => scenario.id === scenarioId) ?? ALL_A2A_SCENARIOS[0];
  const visualSteps = useMemo(() => buildVisualSteps(activeScenario), [activeScenario]);
  const activeStep = visualSteps[activeIndex] ?? visualSteps[0];
  const activeTone = flowTone(activeStep.kind);
  const activeState = activeStep.stateAfter ?? null;

  useEffect(() => {
    setActiveScenario(activeScenario);
    setActiveIndex(0);
    clearMessages();
    setConnectionState('idle');
    setTaskState(null);
    setReplayStep(0);
  }, [activeScenario, clearMessages, setActiveScenario, setConnectionState, setReplayStep, setTaskState]);

  const selectScenario = (nextScenarioId: string) => {
    setScenarioId(nextScenarioId);
    setIsRunning(false);
  };

  const selectStep = (index: number) => {
    const step = visualSteps[index];
    setActiveIndex(index);
    setReplayStep(index + 1);
    setConnectionState(index === 0 ? 'discovering' : step.stateAfter === 'failed' ? 'error' : step.stateAfter === 'completed' ? 'completed' : 'running');
    setTaskState(step.stateAfter ?? null);
    clearMessages();
    visualSteps.slice(0, index + 1).forEach((item, itemIndex) => {
      appendMessage({
        id: item.id,
        direction: item.direction,
        method: item.method,
        payload: item.payload,
        timestamp: Date.now() + itemIndex,
        stateAfter: item.stateAfter,
      });
    });
  };

  const runLesson = async () => {
    if (isRunning) return;
    setIsRunning(true);
    clearMessages();
    for (let index = 0; index < visualSteps.length; index += 1) {
      selectStep(index);
      await new Promise((resolve) => window.setTimeout(resolve, 1350));
    }
    setIsRunning(false);
  };

  return (
    <div className="deep-space-void relative h-full min-h-[820px] overflow-hidden text-[var(--text-primary)]">
      <Link to="/advanced/cockpits" className="mcp-hud-button absolute left-6 top-5 z-30">
        <ArrowLeft size={13} />
        COCKPITS
      </Link>

      <header className="absolute left-1/2 top-5 z-20 -translate-x-1/2 text-center">
        <div className="hud-label text-[#a78bfa]">A2A Protocol Visualizer</div>
        <h1 className="mt-1 font-mono text-[13px] uppercase tracking-[0.38em] text-[rgba(226,240,255,0.86)]">
          Discover · Delegate · Stream · Complete
        </h1>
      </header>

      <aside className="hud-panel absolute left-6 top-24 z-20 w-[290px] p-4">
        <div className="hud-label text-[var(--signal)]">LEARN BY WATCHING</div>
        <div className="mt-3 font-mono text-[15px] uppercase tracking-[0.14em] text-[rgba(226,240,255,0.9)]">{activeStep.label}</div>
        <p className="mt-3 text-sm leading-6 text-[rgba(226,240,255,0.68)]">{activeStep.annotation ?? activeScenario.description}</p>
        <div className="mt-4 grid gap-2">
          {ALL_A2A_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => selectScenario(scenario.id)}
              className={cn(
                'border px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.1em]',
                scenario.id === activeScenario.id
                  ? 'border-[#a78bfa]/60 bg-[#a78bfa]/10 text-[#c4b5fd]'
                  : 'border-[rgba(0,212,255,0.12)] bg-[rgba(2,8,16,0.5)] text-[rgba(226,240,255,0.56)]'
              )}
            >
              <span className="block">{scenario.name}</span>
              <span className="mt-1 block text-[8px] leading-4 text-[rgba(122,164,204,0.82)]">{scenario.steps.length} protocol events</span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 border-t border-[rgba(0,212,255,0.12)] pt-3">
          <FlowLegend color="var(--signal)" label="Request" />
          <FlowLegend color="var(--telemetry)" label="Response" />
          <FlowLegend color="#a78bfa" label="Stream" />
          <FlowLegend color="var(--critical)" label="Error" />
        </div>
      </aside>

      <section className="absolute left-[330px] right-[360px] top-[100px] z-10 h-[590px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 560" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="a2aGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {visualSteps.map((step) => {
            const tone = flowTone(step.kind);
            return (
              <path
                key={step.id}
                d={FLOW_PATHS[step.pathId]}
                fill="none"
                stroke={step.id === activeStep.id ? tone.active : tone.idle}
                strokeWidth={step.id === activeStep.id ? 3 : 1.25}
                strokeDasharray={tone.dash}
                className={step.id === activeStep.id ? 'mcp-flow-route' : undefined}
                filter="url(#a2aGlow)"
              />
            );
          })}
          {[0, 0.32, 0.64].map((delay) => (
            <circle key={delay} r={delay === 0 ? 5 : 3.6} fill={activeTone.fill} filter="url(#a2aGlow)">
              <animateMotion dur="1.75s" begin={`${delay}s`} repeatCount="indefinite" path={FLOW_PATHS[activeStep.pathId]} />
            </circle>
          ))}
        </svg>

        <AgentNode agent={activeScenario.callerAgent} role="CALLER AGENT" className="left-[18%] top-[52%]" active={activeStep.direction === 'caller→callee'} tone="cyan" />
        <AgentNode agent={activeScenario.calleeAgent} role="CALLEE AGENT" className="left-[82%] top-[52%]" active={activeStep.direction === 'callee→caller'} tone="violet" />

        <div className="absolute left-1/2 top-[12%] w-[270px] -translate-x-1/2 rounded-full border border-[#a78bfa]/24 bg-[rgba(2,8,16,0.72)] px-5 py-3 text-center shadow-[0_0_42px_rgba(167,139,250,0.12)]">
          <div className="hud-label text-[#a78bfa]">A2A TRANSPORT</div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(226,240,255,0.82)]">{activeStep.method ?? 'JSON-RPC response'}</div>
        </div>

        <div className="absolute bottom-0 left-1/2 grid w-full -translate-x-1/2 gap-2" style={{ gridTemplateColumns: `repeat(${visualSteps.length}, minmax(0, 1fr))` }}>
          {visualSteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => selectStep(index)}
              className={cn(
                'min-w-0 border px-2 py-3 text-left font-mono text-[8px] uppercase tracking-[0.06em]',
                step.id === activeStep.id ? flowTone(step.kind).border : 'border-[rgba(0,212,255,0.13)] bg-[rgba(2,8,16,0.58)] text-[rgba(226,240,255,0.54)]'
              )}
            >
              {step.label}
            </button>
          ))}
        </div>
      </section>

      <aside className="hud-panel absolute right-6 top-24 z-20 w-[330px] p-4">
        <div className="flex items-center gap-2">
          <RadioTower size={15} className={activeTone.text} />
          <div className="hud-label">PROTOCOL INSPECTOR</div>
        </div>
        <div className="mt-3 font-mono text-[13px] uppercase tracking-[0.14em]" style={{ color: activeTone.fill }}>
          {activeStep.kind} · {activeStep.direction}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="Method" value={activeStep.method ?? 'response'} />
          <Metric label="State" value={activeState ?? 'none'} />
          <Metric label="JSON-RPC id" value={String(activeStep.payload.id)} />
          <Metric label="Step" value={`${activeIndex + 1}/${visualSteps.length}`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {STATE_RAIL.map((state) => (
            <span
              key={state}
              className={cn(
                'border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em]',
                state === activeState ? 'border-[#a78bfa]/70 bg-[#a78bfa]/12 text-[#c4b5fd]' : 'border-[rgba(0,212,255,0.12)] text-[rgba(122,164,204,0.65)]'
              )}
            >
              {state}
            </span>
          ))}
        </div>
        <pre className="mt-4 max-h-[310px] overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-4 text-[rgba(226,240,255,0.68)]">{packetJson(activeStep.payload)}</pre>
      </aside>

      <nav className="hud-panel absolute bottom-5 left-1/2 z-30 flex w-[min(820px,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-3 px-4 py-3">
        <button className="mcp-hud-button" type="button" onClick={() => void runLesson()} disabled={isRunning}>
          <Play size={13} />
          {isRunning ? 'PLAYING' : 'RUN A2A EXCHANGE'}
        </button>
        <button className="mcp-hud-button" type="button" onClick={() => selectStep(0)}>
          <RotateCcw size={13} />
          RESET
        </button>
        <div className="hud-label ml-auto">Experts: inspect Agent Cards, JSON-RPC envelopes, task state, SSE updates, and failure recovery.</div>
      </nav>
    </div>
  );
}

function AgentNode({ agent, role, className, active, tone }: { agent: A2AAgentCard; role: string; className: string; active: boolean; tone: 'cyan' | 'violet' }) {
  const activeClass = tone === 'cyan'
    ? 'border-[rgba(0,212,255,0.76)] bg-[rgba(0,212,255,0.12)] shadow-[0_0_34px_rgba(0,212,255,0.18)]'
    : 'border-[#a78bfa]/75 bg-[#a78bfa]/12 shadow-[0_0_34px_rgba(167,139,250,0.2)]';

  return (
    <button
      type="button"
      className={cn(
        'absolute z-20 w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border px-5 py-5 text-center transition-all',
        active ? activeClass : 'border-[rgba(0,212,255,0.16)] bg-[rgba(2,8,16,0.72)]',
        className
      )}
    >
      <div className="hud-label">{role}</div>
      <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.14em] text-[rgba(226,240,255,0.9)]">{agent.name}</div>
      <div className="mt-2 font-mono text-[8px] uppercase leading-4 tracking-[0.1em] text-[rgba(122,164,204,0.85)]">
        {agent.skills.slice(0, 2).map((skill) => skill.name).join(' · ')}
      </div>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[rgba(0,212,255,0.1)] bg-[rgba(2,8,16,0.38)] px-2 py-2">
      <div className="hud-label text-[8px]">{label}</div>
      <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--telemetry)]">{value}</div>
    </div>
  );
}

function FlowLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-[rgba(122,164,204,0.82)]">
      <span className="mb-1 block h-[2px] rounded-full shadow-[0_0_12px_currentColor]" style={{ background: color, color }} />
      {label}
    </div>
  );
}
