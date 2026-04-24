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
  kind: 'request' | 'response' | 'merge';
  pathIds?: string[];
  agents?: AgentId[];
  routeLabel?: string;
  summary: string;
  payload: unknown;
};

const PATTERN_ROUTES: Record<'supervisor' | 'parallel' | 'swarm', { messages: MessageRoute[]; paths: Record<string, string>; note: string }> = {
  supervisor: {
    note: 'Hub-and-spoke: the lead agent controls task assignment and merges results.',
    messages: [
      { id: 'supervisor-research', label: '01 REQUEST', from: 'lead', to: 'research', kind: 'request', summary: 'Lead agent assigns evidence gathering to the researcher.', payload: { pattern: 'supervisor', type: 'task', owner: 'lead', assignee: 'researcher' } },
      { id: 'supervisor-research-return', label: '02 RESPONSE', from: 'research', to: 'lead', kind: 'response', summary: 'Researcher returns the evidence packet to the lead agent.', payload: { pattern: 'supervisor', type: 'result', from: 'researcher', artifacts: ['source map', 'notes', 'open questions'] } },
      { id: 'supervisor-build', label: '03 REQUEST', from: 'lead', to: 'builder', kind: 'request', summary: 'Lead agent assigns drafting to the builder after receiving research.', payload: { pattern: 'supervisor', type: 'task', owner: 'lead', assignee: 'builder' } },
      { id: 'supervisor-build-return', label: '04 RESPONSE', from: 'builder', to: 'lead', kind: 'response', summary: 'Builder returns a draft artifact to the lead agent for review routing.', payload: { pattern: 'supervisor', type: 'result', from: 'builder', artifact: 'draft answer' } },
      { id: 'supervisor-review', label: '05 REQUEST', from: 'lead', to: 'critic', kind: 'request', summary: 'Lead agent requests a review pass with quality constraints.', payload: { pattern: 'supervisor', type: 'review_request', checks: ['correctness', 'coverage', 'risk'] } },
      { id: 'supervisor-review-return', label: '06 RESPONSE', from: 'critic', to: 'lead', kind: 'response', summary: 'Reviewer returns findings to the lead instead of directly changing the answer.', payload: { pattern: 'supervisor', type: 'feedback', verdict: 'approved with edits' } },
      { id: 'supervisor-final', label: '07 MERGE', from: 'lead', to: 'synth', kind: 'merge', summary: 'Lead merges specialist outputs into the final response.', payload: { pattern: 'supervisor', type: 'finalize', confidence: 0.86 } },
    ],
    paths: {
      'supervisor-research': 'M 380 116 C 292 160 230 220 190 260',
      'supervisor-research-return': 'M 190 260 C 230 196 292 150 380 116',
      'supervisor-build': 'M 380 116 C 382 184 382 248 380 322',
      'supervisor-build-return': 'M 380 322 C 360 238 360 170 380 116',
      'supervisor-review': 'M 380 116 C 468 160 530 220 570 260',
      'supervisor-review-return': 'M 570 260 C 526 186 460 132 380 116',
      'supervisor-final': 'M 380 116 C 396 250 396 360 380 438',
    },
  },
  parallel: {
    note: 'Fan-out/fan-in: the lead launches parallel branches, gathers every result, then performs the final synthesis handoff.',
    messages: [
      {
        id: 'parallel-fanout',
        label: '01 FAN OUT',
        from: 'lead',
        to: 'research',
        kind: 'request',
        pathIds: ['parallel-fanout-a', 'parallel-fanout-b', 'parallel-fanout-c'],
        agents: ['lead', 'research', 'builder', 'critic'],
        routeLabel: 'lead → research + builder + reviewer',
        summary: 'Lead agent broadcasts the same parent task to Researcher, Builder, and Reviewer at the same time.',
        payload: {
          pattern: 'parallel',
          type: 'parallel_batch_request',
          parent: 'lead',
          branches: [
            { assignee: 'researcher', goal: 'collect evidence' },
            { assignee: 'builder', goal: 'draft candidate answer' },
            { assignee: 'reviewer', goal: 'prepare quality checks' },
          ],
          dependency: 'none_between_branches',
        },
      },
      { id: 'parallel-research-return', label: '02 RESPONSE', from: 'research', to: 'lead', kind: 'response', summary: 'Researcher returns evidence to the lead agent, not directly to the synthesizer.', payload: { pattern: 'parallel', type: 'branch_result', from: 'researcher', to: 'lead', result: 'evidence packet' } },
      { id: 'parallel-builder-return', label: '03 RESPONSE', from: 'builder', to: 'lead', kind: 'response', summary: 'Builder returns a draft artifact to the lead while other branches complete independently.', payload: { pattern: 'parallel', type: 'branch_result', from: 'builder', to: 'lead', result: 'draft answer' } },
      { id: 'parallel-review-return', label: '04 RESPONSE', from: 'critic', to: 'lead', kind: 'response', summary: 'Reviewer returns quality constraints to the lead for final aggregation.', payload: { pattern: 'parallel', type: 'branch_result', from: 'reviewer', to: 'lead', result: 'quality constraints' } },
      { id: 'parallel-final', label: '05 MERGE', from: 'lead', to: 'synth', kind: 'merge', summary: 'Lead agent merges the completed branch outputs, then hands a single final package to the synthesizer.', payload: { pattern: 'parallel', type: 'aggregate_and_finalize', gathered: ['evidence packet', 'draft answer', 'quality constraints'] } },
    ],
    paths: {
      'parallel-fanout-a': 'M 380 116 C 292 160 230 220 190 260',
      'parallel-fanout-b': 'M 380 116 C 380 190 380 250 380 322',
      'parallel-fanout-c': 'M 380 116 C 468 160 530 220 570 260',
      'parallel-research-return': 'M 190 260 C 230 196 292 150 380 116',
      'parallel-builder-return': 'M 380 322 C 356 238 358 170 380 116',
      'parallel-review-return': 'M 570 260 C 526 186 460 132 380 116',
      'parallel-final': 'M 380 116 C 396 250 396 360 380 438',
    },
  },
  swarm: {
    note: 'Swarm: the lead seeds the shared goal once, then agents coordinate peer-to-peer until consensus emerges.',
    messages: [
      {
        id: 'swarm-seed',
        label: '01 SEED',
        from: 'lead',
        to: 'research',
        kind: 'request',
        pathIds: ['swarm-seed-r', 'swarm-seed-b', 'swarm-seed-c'],
        agents: ['lead', 'research', 'builder', 'critic'],
        routeLabel: 'lead → swarm shared context',
        summary: 'Lead agent seeds the objective and shared constraints once, then stops controlling each handoff.',
        payload: {
          pattern: 'swarm',
          type: 'goal_seed',
          from: 'lead',
          recipients: ['researcher', 'builder', 'reviewer'],
          sharedContext: ['user objective', 'success criteria', 'time budget'],
          controlMode: 'peer_to_peer_after_seed',
        },
      },
      { id: 'swarm-r-b', label: '02 PEER REQ', from: 'research', to: 'builder', kind: 'request', summary: 'Researcher passes partial context directly to the builder.', payload: { pattern: 'swarm', route: 'peer', sharedContext: true } },
      { id: 'swarm-b-r', label: '03 PEER ACK', from: 'builder', to: 'research', kind: 'response', summary: 'Builder acknowledges the packet and asks for one missing detail.', payload: { pattern: 'swarm', route: 'peer_ack', needs: 'citation detail' } },
      { id: 'swarm-b-c', label: '04 PEER REQ', from: 'builder', to: 'critic', kind: 'request', summary: 'Builder asks reviewer for early critique before final drafting.', payload: { pattern: 'swarm', route: 'peer', earlyReview: true } },
      { id: 'swarm-c-r', label: '05 PEER RESP', from: 'critic', to: 'research', kind: 'response', summary: 'Reviewer sends a gap back to research without supervisor mediation.', payload: { pattern: 'swarm', route: 'peer', gap: 'missing evidence' } },
      { id: 'swarm-r-s', label: '06 VOTE', from: 'research', to: 'synth', kind: 'merge', summary: 'Researcher submits confidence to the synthesizer.', payload: { pattern: 'swarm', confidence: 0.82 } },
      { id: 'swarm-c-s', label: '07 VOTE', from: 'critic', to: 'synth', kind: 'merge', summary: 'Reviewer submits final approval to the synthesizer.', payload: { pattern: 'swarm', confidence: 0.9 } },
    ],
    paths: {
      'swarm-seed-r': 'M 380 116 C 292 160 230 220 190 260',
      'swarm-seed-b': 'M 380 116 C 380 190 380 250 380 322',
      'swarm-seed-c': 'M 380 116 C 468 160 530 220 570 260',
      'swarm-r-b': 'M 190 260 C 260 310 310 338 380 322',
      'swarm-b-r': 'M 380 322 C 298 336 246 306 190 260',
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

function messagePathIds(message: MessageRoute) {
  return message.pathIds ?? [message.id];
}

function messageAgentIds(message: MessageRoute) {
  return message.agents ?? [message.from, message.to];
}

function routeTone(kind: MessageRoute['kind']) {
  if (kind === 'response') {
    return {
      active: 'rgba(240,192,96,0.94)',
      idle: 'rgba(240,192,96,0.16)',
      fill: 'var(--telemetry)',
      activeClass: 'border-[rgba(240,192,96,0.72)] bg-[rgba(240,192,96,0.12)] text-[var(--telemetry)]',
    };
  }

  if (kind === 'merge') {
    return {
      active: 'rgba(61,220,132,0.92)',
      idle: 'rgba(61,220,132,0.15)',
      fill: 'var(--nominal)',
      activeClass: 'border-[rgba(61,220,132,0.68)] bg-[rgba(61,220,132,0.1)] text-[var(--nominal)]',
    };
  }

  return {
    active: 'rgba(0,212,255,0.92)',
    idle: 'rgba(0,212,255,0.14)',
    fill: 'var(--signal)',
    activeClass: 'border-[rgba(0,212,255,0.72)] bg-[rgba(0,212,255,0.12)] text-[var(--signal)]',
  };
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
  const activePathIds = messagePathIds(activeMessage);
  const activeAgentIds = messageAgentIds(activeMessage);
  const activeTone = routeTone(activeMessage.kind);

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
          Supervisor · Parallel · Swarm
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
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[rgba(0,212,255,0.12)] pt-3">
          <RouteLegend color="var(--signal)" label="Request" />
          <RouteLegend color="var(--telemetry)" label="Response" />
          <RouteLegend color="var(--nominal)" label="Merge" />
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
          {patternModel.messages.flatMap((message) => {
            const tone = routeTone(message.kind);
            return messagePathIds(message).map((pathId) => (
              <path
                key={pathId}
                d={patternModel.paths[pathId]}
                fill="none"
                stroke={message.id === activeMessage.id ? tone.active : tone.idle}
                strokeWidth={message.id === activeMessage.id ? 3 : 1.4}
                strokeDasharray={message.kind === 'response' ? '3 8' : message.kind === 'merge' ? '16 7' : '12 10'}
                className={message.id === activeMessage.id ? 'mcp-flow-route' : undefined}
                filter="url(#agentGlow)"
              />
            ));
          })}
          {activePathIds.flatMap((pathId, pathIndex) =>
            [0, 0.32, 0.64].map((delay) => (
              <circle key={`${pathId}-${delay}`} r={delay === 0 ? 5 : 3.6} fill={activeTone.fill} filter="url(#agentGlow)">
                <animateMotion
                  dur="1.8s"
                  begin={`${delay + pathIndex * 0.08}s`}
                  repeatCount="indefinite"
                  path={patternModel.paths[pathId]}
                />
              </circle>
            ))
          )}
        </svg>

        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            type="button"
            className={cn(
              'absolute z-20 w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full border px-4 py-4 text-center transition-all',
              activeAgentIds.includes(agent.id)
                ? 'border-[rgba(0,212,255,0.76)] bg-[rgba(0,212,255,0.12)] shadow-[0_0_34px_rgba(0,212,255,0.18)]'
                : 'border-[rgba(0,212,255,0.16)] bg-[rgba(2,8,16,0.72)]'
            )}
            style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[rgba(226,240,255,0.88)]">{agent.label}</div>
            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[rgba(122,164,204,0.8)]">{agent.role}</div>
          </button>
        ))}

        <div
          className="absolute -bottom-14 left-1/2 grid w-full -translate-x-1/2 gap-2"
          style={{ gridTemplateColumns: `repeat(${patternModel.messages.length}, minmax(0, 1fr))` }}
        >
          {patternModel.messages.map((message) => (
            <button
              key={message.id}
              type="button"
              onClick={() => setActiveMessageId(message.id)}
              className={cn(
                'min-w-0 border px-2 py-3 text-left font-mono text-[8px] uppercase tracking-[0.08em]',
                message.id === activeMessage.id
                  ? routeTone(message.kind).activeClass
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
        <div className="mt-3 font-mono text-[13px] uppercase tracking-[0.14em]" style={{ color: activeTone.fill }}>
          {activeMessage.kind} · {activeMessage.routeLabel ?? `${activeMessage.from} → ${activeMessage.to}`}
        </div>
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

function RouteLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-[rgba(122,164,204,0.82)]">
      <span className="mb-1 block h-[2px] rounded-full shadow-[0_0_12px_currentColor]" style={{ background: color, color }} />
      {label}
    </div>
  );
}
