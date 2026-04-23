import React, { useMemo, useState } from 'react';
import { ArrowLeft, Play, RadioTower, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { MultiAgentState, OrchestrationPattern } from '@/types';

export interface MultiAgentOrchestrationCockpitProps {
  state?: MultiAgentState | null;
  pattern?: OrchestrationPattern;
  className?: string;
}

const PATTERNS = [
  {
    id: 'supervisor',
    label: 'Supervisor',
    detail: 'One lead agent plans, delegates, and merges outputs.',
  },
  {
    id: 'parallel',
    label: 'Parallel',
    detail: 'Multiple specialists work independently, then converge.',
  },
  {
    id: 'swarm',
    label: 'Swarm',
    detail: 'Agents route messages peer-to-peer with shared context.',
  },
] as const;

const AGENTS = [
  { id: 'lead', label: 'Lead Agent', role: 'plans task', x: 50, y: 22, tone: 'cyan' },
  { id: 'research', label: 'Researcher', role: 'finds evidence', x: 22, y: 50, tone: 'cyan' },
  { id: 'builder', label: 'Builder', role: 'creates draft', x: 50, y: 62, tone: 'amber' },
  { id: 'critic', label: 'Reviewer', role: 'checks quality', x: 78, y: 50, tone: 'cyan' },
  { id: 'synth', label: 'Synthesizer', role: 'final answer', x: 50, y: 84, tone: 'amber' },
] as const;

type AgentId = (typeof AGENTS)[number]['id'];
type MessageRoute = {
  id: string;
  label: string;
  from: AgentId;
  to: AgentId;
  summary: string;
  payload: unknown;
};

const PATTERN_ROUTES: Record<'supervisor' | 'parallel' | 'swarm', { messages: MessageRoute[]; paths: Record<string, string>; note: string }> = {
  supervisor: {
    note: 'Hub-and-spoke: the lead agent controls task assignment and merges results.',
    messages: [
      { id: 'supervisor-research', label: '01 DELEGATE', from: 'lead', to: 'research', summary: 'Lead agent assigns evidence gathering to the researcher.', payload: { pattern: 'supervisor', type: 'task', owner: 'lead', assignee: 'researcher' } },
      { id: 'supervisor-build', label: '02 DELEGATE', from: 'lead', to: 'builder', summary: 'Lead agent assigns drafting to the builder after planning the route.', payload: { pattern: 'supervisor', type: 'task', owner: 'lead', assignee: 'builder' } },
      { id: 'supervisor-review', label: '03 DELEGATE', from: 'lead', to: 'critic', summary: 'Lead agent requests a review pass with quality constraints.', payload: { pattern: 'supervisor', type: 'review_request', checks: ['correctness', 'coverage', 'risk'] } },
      { id: 'supervisor-return', label: '04 RETURN', from: 'critic', to: 'lead', summary: 'Reviewer returns findings to the lead instead of directly changing the answer.', payload: { pattern: 'supervisor', type: 'feedback', verdict: 'approved with edits' } },
      { id: 'supervisor-final', label: '05 MERGE', from: 'lead', to: 'synth', summary: 'Lead merges specialist outputs into the final response.', payload: { pattern: 'supervisor', type: 'finalize', confidence: 0.86 } },
    ],
    paths: {
      'supervisor-research': 'M 380 116 C 292 160 230 220 190 260',
      'supervisor-build': 'M 380 116 C 382 184 382 248 380 322',
      'supervisor-review': 'M 380 116 C 468 160 530 220 570 260',
      'supervisor-return': 'M 570 260 C 526 186 460 132 380 116',
      'supervisor-final': 'M 380 116 C 396 250 396 360 380 438',
    },
  },
  parallel: {
    note: 'Fan-out/fan-in: specialists run concurrently, then converge on synthesis.',
    messages: [
      { id: 'parallel-fanout-a', label: '01 FAN OUT', from: 'lead', to: 'research', summary: 'The task is broadcast to the researcher as an independent branch.', payload: { pattern: 'parallel', branch: 'research', dependency: 'none' } },
      { id: 'parallel-fanout-b', label: '02 FAN OUT', from: 'lead', to: 'builder', summary: 'The builder receives a parallel drafting branch.', payload: { pattern: 'parallel', branch: 'draft', dependency: 'none' } },
      { id: 'parallel-fanout-c', label: '03 FAN OUT', from: 'lead', to: 'critic', summary: 'The reviewer starts criteria and risk checks in parallel.', payload: { pattern: 'parallel', branch: 'review', dependency: 'none' } },
      { id: 'parallel-gather-a', label: '04 FAN IN', from: 'research', to: 'synth', summary: 'Research output converges into the synthesizer.', payload: { pattern: 'parallel', result: 'evidence packet' } },
      { id: 'parallel-gather-b', label: '05 FAN IN', from: 'critic', to: 'synth', summary: 'Review constraints converge into the final synthesis.', payload: { pattern: 'parallel', result: 'quality constraints' } },
    ],
    paths: {
      'parallel-fanout-a': 'M 380 116 C 292 160 230 220 190 260',
      'parallel-fanout-b': 'M 380 116 C 380 190 380 250 380 322',
      'parallel-fanout-c': 'M 380 116 C 468 160 530 220 570 260',
      'parallel-gather-a': 'M 190 260 C 236 354 300 420 380 438',
      'parallel-gather-b': 'M 570 260 C 524 354 460 420 380 438',
    },
  },
  swarm: {
    note: 'Peer-to-peer: agents pass context laterally until enough consensus emerges.',
    messages: [
      { id: 'swarm-r-b', label: '01 PEER', from: 'research', to: 'builder', summary: 'Researcher passes partial context directly to the builder.', payload: { pattern: 'swarm', route: 'peer', sharedContext: true } },
      { id: 'swarm-b-c', label: '02 PEER', from: 'builder', to: 'critic', summary: 'Builder asks reviewer for early critique before final drafting.', payload: { pattern: 'swarm', route: 'peer', earlyReview: true } },
      { id: 'swarm-c-r', label: '03 PEER', from: 'critic', to: 'research', summary: 'Reviewer sends a gap back to research without supervisor mediation.', payload: { pattern: 'swarm', route: 'peer', gap: 'missing evidence' } },
      { id: 'swarm-r-s', label: '04 VOTE', from: 'research', to: 'synth', summary: 'Researcher submits confidence to the synthesizer.', payload: { pattern: 'swarm', confidence: 0.82 } },
      { id: 'swarm-c-s', label: '05 VOTE', from: 'critic', to: 'synth', summary: 'Reviewer submits final approval to the synthesizer.', payload: { pattern: 'swarm', confidence: 0.9 } },
    ],
    paths: {
      'swarm-r-b': 'M 190 260 C 260 310 310 338 380 322',
      'swarm-b-c': 'M 380 322 C 462 320 518 292 570 260',
      'swarm-c-r': 'M 570 260 C 430 214 316 214 190 260',
      'swarm-r-s': 'M 190 260 C 236 354 300 420 380 438',
      'swarm-c-s': 'M 570 260 C 524 354 460 420 380 438',
    },
  },
};

function packetJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export const MultiAgentOrchestrationCockpit: React.FC<MultiAgentOrchestrationCockpitProps> = ({
  pattern,
  className,
}) => {
  const [activePattern, setActivePattern] = useState<OrchestrationPattern>(pattern ?? 'supervisor');
  const normalizedPattern = activePattern === 'parallel' || activePattern === 'swarm' ? activePattern : 'supervisor';
  const patternModel = PATTERN_ROUTES[normalizedPattern];
  const [activeMessageId, setActiveMessageId] = useState(patternModel.messages[0].id);
  const [isRunning, setIsRunning] = useState(false);

  const activeMessage = useMemo(
    () => patternModel.messages.find((message) => message.id === activeMessageId) ?? patternModel.messages[0],
    [activeMessageId, patternModel]
  );
  const activePath = patternModel.paths[activeMessage.id];

  const selectPattern = (nextPattern: OrchestrationPattern) => {
    const nextNormalized = nextPattern === 'parallel' || nextPattern === 'swarm' ? nextPattern : 'supervisor';
    setActivePattern(nextPattern);
    setActiveMessageId(PATTERN_ROUTES[nextNormalized].messages[0].id);
  };

  const runLesson = async () => {
    if (isRunning) return;
    setIsRunning(true);
    for (const message of patternModel.messages) {
      setActiveMessageId(message.id);
      await new Promise((resolve) => window.setTimeout(resolve, 1450));
    }
    setIsRunning(false);
  };

  return (
    <div className={cn('deep-space-void relative h-full min-h-[820px] overflow-hidden text-[var(--text-primary)]', className)}>
      <Link to="/advanced/cockpits" className="mcp-hud-button absolute left-6 top-5 z-30">
        <ArrowLeft size={13} />
        COCKPITS
      </Link>

      <header className="absolute left-1/2 top-5 z-20 -translate-x-1/2 text-center">
        <div className="hud-label text-[var(--signal)]">MULTI-AGENT ORCHESTRATION</div>
        <h1 className="mt-1 font-mono text-[13px] uppercase tracking-[0.38em] text-[rgba(226,240,255,0.86)]">
          Supervisor · Parallel · Network
        </h1>
      </header>

      <aside className="hud-panel absolute left-6 top-24 z-20 w-[270px] p-4">
        <div className="hud-label text-[var(--signal)]">LEARN BY WATCHING</div>
        <div className="mt-3 font-mono text-[15px] uppercase tracking-[0.14em] text-[rgba(226,240,255,0.9)]">{activeMessage.label}</div>
        <p className="mt-3 text-sm leading-6 text-[rgba(226,240,255,0.68)]">{activeMessage.summary}</p>
        <div className="mt-4 grid gap-2">
          {PATTERNS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectPattern(item.id)}
              className={cn(
                'border px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.12em]',
                activePattern === item.id
                  ? 'border-[rgba(0,212,255,0.58)] bg-[rgba(0,212,255,0.1)] text-[var(--signal)]'
                  : 'border-[rgba(0,212,255,0.12)] bg-[rgba(2,8,16,0.5)] text-[rgba(226,240,255,0.56)]'
              )}
            >
              <span className="block">{item.label}</span>
              <span className="mt-1 block text-[8px] leading-4 text-[rgba(122,164,204,0.8)]">{item.detail}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 border-t border-[rgba(0,212,255,0.12)] pt-3 font-mono text-[9px] uppercase leading-5 tracking-[0.1em] text-[rgba(122,164,204,0.82)]">
          {patternModel.note}
        </div>
      </aside>

      <section className="absolute left-[320px] right-[360px] top-[100px] z-10 h-[590px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 560" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="agentGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {patternModel.messages.map((message) => (
            <path
              key={message.id}
              d={patternModel.paths[message.id]}
              fill="none"
              stroke={message.id === activeMessage.id ? 'rgba(0,212,255,0.92)' : 'rgba(0,212,255,0.14)'}
              strokeWidth={message.id === activeMessage.id ? 3 : 1.4}
              strokeDasharray={message.id === activeMessage.id ? '12 10' : '4 12'}
              className={message.id === activeMessage.id ? 'mcp-flow-route' : undefined}
              filter="url(#agentGlow)"
            />
          ))}
          {[0, 0.32, 0.64].map((delay) => (
            <circle key={delay} r={delay === 0 ? 5 : 3.6} fill="var(--signal)" filter="url(#agentGlow)">
              <animateMotion dur="1.8s" begin={`${delay}s`} repeatCount="indefinite" path={activePath} />
            </circle>
          ))}
        </svg>

        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            type="button"
            className={cn(
              'absolute z-20 w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full border px-4 py-4 text-center transition-all',
              activeMessage.from === agent.id || activeMessage.to === agent.id
                ? 'border-[rgba(0,212,255,0.76)] bg-[rgba(0,212,255,0.12)] shadow-[0_0_34px_rgba(0,212,255,0.18)]'
                : 'border-[rgba(0,212,255,0.16)] bg-[rgba(2,8,16,0.72)]'
            )}
            style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[rgba(226,240,255,0.88)]">{agent.label}</div>
            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[rgba(122,164,204,0.8)]">{agent.role}</div>
          </button>
        ))}

        <div className="absolute bottom-0 left-1/2 grid w-[min(640px,94%)] -translate-x-1/2 grid-cols-5 gap-2">
          {patternModel.messages.map((message) => (
            <button
              key={message.id}
              type="button"
              onClick={() => setActiveMessageId(message.id)}
              className={cn(
                'border px-3 py-3 text-left font-mono text-[9px] uppercase tracking-[0.1em]',
                message.id === activeMessage.id
                  ? 'border-[rgba(0,212,255,0.72)] bg-[rgba(0,212,255,0.12)] text-[var(--signal)]'
                  : 'border-[rgba(0,212,255,0.13)] bg-[rgba(2,8,16,0.58)] text-[rgba(226,240,255,0.54)]'
              )}
            >
              {message.label}
            </button>
          ))}
        </div>
      </section>

      <aside className="hud-panel absolute right-6 top-24 z-20 w-[330px] p-4">
        <div className="flex items-center gap-2">
          <RadioTower size={15} className="text-[var(--signal)]" />
          <div className="hud-label">MESSAGE INSPECTOR</div>
        </div>
        <div className="mt-3 font-mono text-[13px] uppercase tracking-[0.14em] text-[var(--telemetry)]">{activeMessage.from} → {activeMessage.to}</div>
        <pre className="mt-4 max-h-[300px] overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-4 text-[rgba(226,240,255,0.68)]">{packetJson(activeMessage.payload)}</pre>
      </aside>

      <nav className="hud-panel absolute bottom-5 left-1/2 z-30 flex w-[min(820px,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-3 px-4 py-3">
        <button className="mcp-hud-button" type="button" onClick={() => void runLesson()} disabled={isRunning}>
          <Play size={13} />
          {isRunning ? 'PLAYING' : 'RUN LESSON'}
        </button>
        <button className="mcp-hud-button" type="button" onClick={() => setActiveMessageId(patternModel.messages[0].id)}>
          <RotateCcw size={13} />
          RESET
        </button>
        <div className="hud-label ml-auto">Experts: inspect routing shape, handoff payloads, and orchestration pattern tradeoffs.</div>
      </nav>
    </div>
  );
};
