import React, { useMemo, useState } from 'react';
import { ArrowLeft, GitBranch, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type DispatchStatus = 'pending' | 'running' | 'done' | 'failed';
type DispatchFlowKind = 'spawn' | 'result' | 'aggregate';
type DispatchMode = 'parallel' | 'sequential';

export interface DispatchNode {
  id: string;
  name: string;
  agent: string;
  task: string;
  status: DispatchStatus;
  tokenCost: number;
  durationMs: number;
  protocol: 'direct' | 'a2a' | 'tool' | 'handoff';
  input: string;
  output: string;
  children?: DispatchNode[];
}

export interface SubagentDispatchCockpitProps {
  tree?: DispatchNode;
  selectedNodeId?: string;
  className?: string;
}

const TREE: DispatchNode = {
  id: 'root',
  name: 'Parent Agent',
  agent: 'coordinator',
  task: 'Review a pull request and delegate focused checks',
  status: 'running',
  tokenCost: 1280,
  durationMs: 180,
  protocol: 'direct',
  input: 'PR diff, repository context, policy constraints',
  output: 'Spawn security, lint, and test subagents',
  children: [
    {
      id: 'security',
      name: 'Security Scan',
      agent: 'security-subagent',
      task: 'Find auth, secrets, and injection risks',
      status: 'done',
      tokenCost: 620,
      durationMs: 420,
      protocol: 'a2a',
      input: 'Diff + threat model checklist',
      output: 'No critical issues; one API usage flagged',
    },
    {
      id: 'lint',
      name: 'Lint + Format',
      agent: 'quality-subagent',
      task: 'Check style, lint, and naming drift',
      status: 'done',
      tokenCost: 340,
      durationMs: 240,
      protocol: 'tool',
      input: 'Changed files and lint rules',
      output: 'Two formatting suggestions',
    },
    {
      id: 'tests',
      name: 'Test Runner',
      agent: 'test-subagent',
      task: 'Run focused regression tests',
      status: 'running',
      tokenCost: 510,
      durationMs: 360,
      protocol: 'handoff',
      input: 'Test matrix and impacted modules',
      output: 'Targeted coverage in progress',
    },
  ],
};

type DispatchStep = {
  id: string;
  label: string;
  summary: string;
  kind: DispatchFlowKind;
  nodeId: string;
  pathIds: string[];
  participants: string[];
  routeLabel: string;
};

const DISPATCH_MODES = [
  {
    id: 'parallel',
    label: 'Parallel',
    detail: 'Parent launches independent child agents together.',
  },
  {
    id: 'sequential',
    label: 'Sequential',
    detail: 'Parent waits for each result before spawning the next child.',
  },
] as const;

const PARALLEL_STEPS: DispatchStep[] = [
  {
    id: 'spawn',
    label: '01 SPAWN',
    summary: 'The parent agent decomposes the work and sends parallel spawn requests to all child agents.',
    kind: 'spawn',
    nodeId: 'root',
    pathIds: ['spawn-security', 'spawn-lint', 'spawn-tests'],
    participants: ['root', 'security', 'lint', 'tests'],
    routeLabel: 'parent → security + quality + tests',
  },
  {
    id: 'security-result',
    label: '02 RESULT',
    summary: 'The security subagent returns findings to the parent, including risks and confidence.',
    kind: 'result',
    nodeId: 'security',
    pathIds: ['return-security'],
    participants: ['security', 'root'],
    routeLabel: 'security-subagent → parent',
  },
  {
    id: 'quality-result',
    label: '03 RESULT',
    summary: 'The quality subagent returns formatting and lint findings to the parent.',
    kind: 'result',
    nodeId: 'lint',
    pathIds: ['return-lint'],
    participants: ['lint', 'root'],
    routeLabel: 'quality-subagent → parent',
  },
  {
    id: 'test-result',
    label: '04 RESULT',
    summary: 'The test subagent returns focused regression status to the parent.',
    kind: 'result',
    nodeId: 'tests',
    pathIds: ['return-tests'],
    participants: ['tests', 'root'],
    routeLabel: 'test-subagent → parent',
  },
  {
    id: 'aggregate',
    label: '05 AGGREGATE',
    summary: 'The parent agent merges child outputs into one synthesized answer.',
    kind: 'aggregate',
    nodeId: 'aggregate',
    pathIds: ['parent-aggregate'],
    participants: ['root', 'aggregate'],
    routeLabel: 'parent → final aggregate',
  },
];

const SEQUENTIAL_STEPS: DispatchStep[] = [
  {
    id: 'spawn-security',
    label: '01 SPAWN',
    summary: 'Parent starts with the highest-risk check and spawns only the security subagent.',
    kind: 'spawn',
    nodeId: 'root',
    pathIds: ['spawn-security'],
    participants: ['root', 'security'],
    routeLabel: 'parent → security-subagent',
  },
  {
    id: 'security-result',
    label: '02 RESULT',
    summary: 'Security returns findings first; the parent uses that output to decide the next focused check.',
    kind: 'result',
    nodeId: 'security',
    pathIds: ['return-security'],
    participants: ['security', 'root'],
    routeLabel: 'security-subagent → parent',
  },
  {
    id: 'spawn-quality',
    label: '03 SPAWN',
    summary: 'After reviewing security output, the parent spawns the quality subagent with narrower context.',
    kind: 'spawn',
    nodeId: 'root',
    pathIds: ['spawn-lint'],
    participants: ['root', 'lint'],
    routeLabel: 'parent → quality-subagent',
  },
  {
    id: 'quality-result',
    label: '04 RESULT',
    summary: 'Quality returns lint and formatting findings to the parent before tests are requested.',
    kind: 'result',
    nodeId: 'lint',
    pathIds: ['return-lint'],
    participants: ['lint', 'root'],
    routeLabel: 'quality-subagent → parent',
  },
  {
    id: 'spawn-tests',
    label: '05 SPAWN',
    summary: 'Parent uses the accumulated context to spawn the test runner with the smallest useful test matrix.',
    kind: 'spawn',
    nodeId: 'root',
    pathIds: ['spawn-tests'],
    participants: ['root', 'tests'],
    routeLabel: 'parent → test-subagent',
  },
  {
    id: 'test-result',
    label: '06 RESULT',
    summary: 'The test subagent returns focused regression status to the parent.',
    kind: 'result',
    nodeId: 'tests',
    pathIds: ['return-tests'],
    participants: ['tests', 'root'],
    routeLabel: 'test-subagent → parent',
  },
  {
    id: 'aggregate',
    label: '07 AGGREGATE',
    summary: 'The parent merges all sequential child outputs into one final answer.',
    kind: 'aggregate',
    nodeId: 'aggregate',
    pathIds: ['parent-aggregate'],
    participants: ['root', 'aggregate'],
    routeLabel: 'parent → final aggregate',
  },
];

const STEPS_BY_MODE: Record<DispatchMode, DispatchStep[]> = {
  parallel: PARALLEL_STEPS,
  sequential: SEQUENTIAL_STEPS,
};

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  root: { x: 50, y: 18 },
  security: { x: 16, y: 55 },
  lint: { x: 50, y: 55 },
  tests: { x: 84, y: 55 },
  aggregate: { x: 50, y: 84 },
};

const FLOW_PATHS: Record<string, string> = {
  'spawn-security': 'M 380 96 C 306 160 210 226 122 296',
  'spawn-lint': 'M 380 96 C 380 178 380 226 380 296',
  'spawn-tests': 'M 380 96 C 454 160 550 226 638 296',
  'return-security': 'M 122 296 C 202 206 294 142 380 96',
  'return-lint': 'M 380 296 C 360 220 360 150 380 96',
  'return-tests': 'M 638 296 C 558 206 466 142 380 96',
  'parent-aggregate': 'M 380 96 C 396 250 396 360 380 438',
};

function flatten(node: DispatchNode): DispatchNode[] {
  return [node, ...(node.children ?? [])];
}

function findNode(tree: DispatchNode, id: string): DispatchNode | null {
  if (tree.id === id) return tree;
  for (const child of tree.children ?? []) {
    const match = findNode(child, id);
    if (match) return match;
  }
  return null;
}

function statusColor(status: DispatchStatus) {
  if (status === 'done') return 'text-[var(--nominal)]';
  if (status === 'running') return 'text-[var(--telemetry)]';
  if (status === 'failed') return 'text-[var(--critical)]';
  return 'text-[rgba(122,164,204,0.8)]';
}

function flowTone(kind: DispatchFlowKind) {
  if (kind === 'result') {
    return {
      active: 'rgba(240,192,96,0.94)',
      idle: 'rgba(240,192,96,0.16)',
      fill: 'var(--telemetry)',
      activeClass: 'border-[rgba(240,192,96,0.72)] bg-[rgba(240,192,96,0.12)] text-[var(--telemetry)]',
      dash: '3 8',
    };
  }

  if (kind === 'aggregate') {
    return {
      active: 'rgba(61,220,132,0.92)',
      idle: 'rgba(61,220,132,0.15)',
      fill: 'var(--nominal)',
      activeClass: 'border-[rgba(61,220,132,0.68)] bg-[rgba(61,220,132,0.1)] text-[var(--nominal)]',
      dash: '16 7',
    };
  }

  return {
    active: 'rgba(0,212,255,0.92)',
    idle: 'rgba(0,212,255,0.14)',
    fill: 'var(--signal)',
    activeClass: 'border-[rgba(0,212,255,0.72)] bg-[rgba(0,212,255,0.12)] text-[var(--signal)]',
    dash: '12 10',
  };
}

function stepIdForNode(nodeId: string, steps: DispatchStep[]) {
  return steps.find((step) => step.nodeId === nodeId)?.id ?? steps[0].id;
}

export const SubagentDispatchCockpit: React.FC<SubagentDispatchCockpitProps> = ({
  tree,
  selectedNodeId,
  className,
}) => {
  const activeTree = tree ?? TREE;
  const nodes = useMemo(() => [...flatten(activeTree), { ...activeTree, id: 'aggregate', name: 'Result Aggregator', agent: 'parent-agent', task: 'Merge child results into final output', status: 'pending' as const, tokenCost: 260, durationMs: 190, protocol: 'direct' as const, input: 'Child outputs', output: 'Unified response' }], [activeTree]);
  const [activeMode, setActiveMode] = useState<DispatchMode>('parallel');
  const steps = STEPS_BY_MODE[activeMode];
  const initialStepId = selectedNodeId ? stepIdForNode(selectedNodeId, steps) : steps[0].id;
  const [activeId, setActiveId] = useState(initialStepId);
  const [isRunning, setIsRunning] = useState(false);

  const activeStep = steps.find((step) => step.id === activeId) ?? steps[0];
  const activeNode = findNode(activeTree, activeStep.nodeId) ?? nodes.find((node) => node.id === activeStep.nodeId) ?? activeTree;
  const activeTone = flowTone(activeStep.kind);
  const inspectorInput = activeStep.kind === 'spawn'
    ? 'Parent task context plus accumulated prior results, scoped to this child spawn.'
    : activeNode.input;
  const inspectorOutput = activeStep.kind === 'spawn'
    ? activeStep.routeLabel
    : activeNode.output;
  const maxCost = Math.max(...nodes.map((node) => node.tokenCost));

  const selectMode = (mode: DispatchMode) => {
    setActiveMode(mode);
    setActiveId(STEPS_BY_MODE[mode][0].id);
  };

  const runLesson = async () => {
    if (isRunning) return;
    setIsRunning(true);
    for (const step of steps) {
      setActiveId(step.id);
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
        <div className="hud-label text-[var(--telemetry)]">SUBAGENT DISPATCH TREE</div>
        <h1 className="mt-1 font-mono text-[13px] uppercase tracking-[0.38em] text-[rgba(226,240,255,0.86)]">
          Parent · Spawn · Aggregate
        </h1>
      </header>

      <aside className="hud-panel absolute left-6 top-24 z-20 w-[270px] p-4">
        <div className="hud-label text-[var(--signal)]">LEARN BY WATCHING</div>
        <div className="mt-3 font-mono text-[15px] uppercase tracking-[0.14em] text-[rgba(226,240,255,0.9)]">{activeStep.label}</div>
        <p className="mt-3 text-sm leading-6 text-[rgba(226,240,255,0.68)]">{activeStep.summary}</p>
        <div className="mt-4 grid gap-2">
          {DISPATCH_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => selectMode(mode.id)}
              className={cn(
                'border px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.12em]',
                activeMode === mode.id
                  ? 'border-[rgba(0,212,255,0.58)] bg-[rgba(0,212,255,0.1)] text-[var(--signal)]'
                  : 'border-[rgba(0,212,255,0.12)] bg-[rgba(2,8,16,0.5)] text-[rgba(226,240,255,0.56)]'
              )}
            >
              <span className="block">{mode.label}</span>
              <span className="mt-1 block text-[8px] leading-4 text-[rgba(122,164,204,0.8)]">{mode.detail}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 border-t border-[rgba(0,212,255,0.12)] pt-3 font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-[rgba(122,164,204,0.78)]">
          Experts can inspect token cost, duration, protocol, input, and output for every dispatch node.
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[rgba(0,212,255,0.12)] pt-3">
          <FlowLegend color="var(--signal)" label="Spawn" />
          <FlowLegend color="var(--telemetry)" label="Result" />
          <FlowLegend color="var(--nominal)" label="Aggregate" />
        </div>
      </aside>

      <section className="absolute left-[320px] right-[360px] top-[100px] z-10 h-[590px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 560" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="dispatchGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {steps.flatMap((step) => {
            const tone = flowTone(step.kind);
            return step.pathIds.map((pathId) => (
              <path
                key={pathId}
                d={FLOW_PATHS[pathId]}
                fill="none"
                stroke={step.id === activeId ? tone.active : tone.idle}
                strokeWidth={step.id === activeId ? 3 : 1.3}
                strokeDasharray={tone.dash}
                className={step.id === activeId ? 'mcp-flow-route' : undefined}
                filter="url(#dispatchGlow)"
              />
            ));
          })}
          {activeStep.pathIds.flatMap((pathId, pathIndex) =>
            [0, 0.34, 0.68].map((delay) => (
              <circle key={`${pathId}-${delay}`} r={delay === 0 ? 5 : 3.8} fill={activeTone.fill} filter="url(#dispatchGlow)">
                <animateMotion
                  dur="1.85s"
                  begin={`${delay + pathIndex * 0.08}s`}
                  repeatCount="indefinite"
                  path={FLOW_PATHS[pathId]}
                />
              </circle>
            ))
          )}
        </svg>

        {nodes.map((node) => {
          const position = NODE_POSITIONS[node.id] ?? NODE_POSITIONS.root;
          const active = activeStep.participants.includes(node.id);
          const heat = Math.max(0.18, node.tokenCost / maxCost);
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setActiveId(stepIdForNode(node.id, steps))}
              className={cn(
                'absolute z-20 -translate-x-1/2 -translate-y-1/2 border px-4 py-4 text-center transition-all',
                node.id === 'root' || node.id === 'aggregate' ? 'w-[160px]' : 'w-[132px]',
                active
                  ? `${activeTone.activeClass} shadow-[0_0_34px_rgba(0,212,255,0.16)]`
                  : 'border-[rgba(0,212,255,0.16)] bg-[rgba(2,8,16,0.72)]'
              )}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                boxShadow: active ? undefined : `0 0 ${Math.round(28 * heat)}px rgba(240,192,96,${0.08 * heat})`,
              }}
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.13em] text-[rgba(226,240,255,0.9)]">{node.name}</div>
              <div className={cn('mt-2 font-mono text-[8px] uppercase tracking-[0.1em]', statusColor(node.status))}>{node.status} · {node.tokenCost} tok</div>
            </button>
          );
        })}

        <div
          className="absolute bottom-0 left-1/2 grid w-[min(720px,98%)] -translate-x-1/2 gap-2"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveId(step.id)}
              className={cn(
                'min-w-0 border px-2 py-3 text-left font-mono text-[8px] uppercase tracking-[0.08em]',
                step.id === activeId
                  ? flowTone(step.kind).activeClass
                  : 'border-[rgba(0,212,255,0.13)] bg-[rgba(2,8,16,0.58)] text-[rgba(226,240,255,0.54)]'
              )}
            >
              {step.label}
            </button>
          ))}
        </div>
      </section>

      <aside className="hud-panel absolute right-6 top-24 z-20 w-[330px] p-4">
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-[var(--telemetry)]" />
          <div className="hud-label">NODE INSPECTOR</div>
        </div>
        <div className="mt-3 font-mono text-[13px] uppercase tracking-[0.14em]" style={{ color: activeTone.fill }}>
          {activeStep.kind} · {activeStep.routeLabel}
        </div>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[rgba(122,164,204,0.82)]">{activeNode.agent}</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="Protocol" value={activeNode.protocol} />
          <Metric label="Duration" value={`${activeNode.durationMs}ms`} />
          <Metric label="Tokens" value={String(activeNode.tokenCost)} />
          <Metric label="Status" value={activeNode.status} />
        </div>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[rgba(226,240,255,0.66)]">
          <p><span className="text-[var(--signal)]">Input:</span> {inspectorInput}</p>
          <p><span className="text-[var(--telemetry)]">Output:</span> {inspectorOutput}</p>
        </div>
      </aside>

      <nav className="hud-panel absolute bottom-5 left-1/2 z-30 flex w-[min(820px,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-3 px-4 py-3">
        <button className="mcp-hud-button" type="button" onClick={() => void runLesson()} disabled={isRunning}>
          <Play size={13} />
          {isRunning ? 'PLAYING' : 'RUN LESSON'}
        </button>
        <button className="mcp-hud-button" type="button" onClick={() => setActiveId(steps[0].id)}>
          <RotateCcw size={13} />
          RESET
        </button>
        <div className="hud-label ml-auto">Cost heat is encoded in node glow. Click any node for dispatch I/O.</div>
      </nav>
    </div>
  );
};

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
