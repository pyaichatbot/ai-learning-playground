import React, { useMemo, useState } from 'react';
import { ArrowLeft, GitBranch, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type DispatchStatus = 'pending' | 'running' | 'done' | 'failed';

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

const STEPS = [
  { id: 'root', label: '01 SPAWN', summary: 'The parent agent decomposes the task and creates child assignments.' },
  { id: 'security', label: '02 SECURITY', summary: 'A focused security subagent receives only the context it needs.' },
  { id: 'lint', label: '03 QUALITY', summary: 'A quality subagent checks formatting, lint, and naming drift.' },
  { id: 'tests', label: '04 TESTS', summary: 'A test subagent runs the smallest useful regression suite.' },
  { id: 'aggregate', label: '05 AGGREGATE', summary: 'The parent collects results, resolves conflicts, and returns one synthesized answer.' },
];

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  root: { x: 50, y: 18 },
  security: { x: 22, y: 55 },
  lint: { x: 50, y: 55 },
  tests: { x: 78, y: 55 },
  aggregate: { x: 50, y: 84 },
};

const FLOW_PATHS: Record<string, string> = {
  root: 'M 380 96 C 328 160 252 226 168 296',
  security: 'M 168 296 C 236 358 300 400 380 438',
  lint: 'M 380 96 C 380 200 380 276 380 438',
  tests: 'M 592 296 C 524 358 460 400 380 438',
  aggregate: 'M 168 296 C 300 470 492 470 592 296',
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

export const SubagentDispatchCockpit: React.FC<SubagentDispatchCockpitProps> = ({
  tree,
  selectedNodeId,
  className,
}) => {
  const activeTree = tree ?? TREE;
  const nodes = useMemo(() => [...flatten(activeTree), { ...activeTree, id: 'aggregate', name: 'Result Aggregator', agent: 'parent-agent', task: 'Merge child results into final output', status: 'pending' as const, tokenCost: 260, durationMs: 190, protocol: 'direct' as const, input: 'Child outputs', output: 'Unified response' }], [activeTree]);
  const [activeId, setActiveId] = useState(selectedNodeId ?? 'root');
  const [isRunning, setIsRunning] = useState(false);

  const activeStep = STEPS.find((step) => step.id === activeId) ?? STEPS[0];
  const activeNode = findNode(activeTree, activeId) ?? nodes.find((node) => node.id === activeId) ?? activeTree;
  const activePath = FLOW_PATHS[activeId] ?? FLOW_PATHS.root;
  const maxCost = Math.max(...nodes.map((node) => node.tokenCost));

  const runLesson = async () => {
    if (isRunning) return;
    setIsRunning(true);
    for (const step of STEPS) {
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
        <div className="mt-4 border-t border-[rgba(0,212,255,0.12)] pt-3 font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-[rgba(122,164,204,0.78)]">
          Experts can inspect token cost, duration, protocol, input, and output for every dispatch node.
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
          {Object.entries(FLOW_PATHS).map(([id, path]) => (
            <path
              key={id}
              d={path}
              fill="none"
              stroke={id === activeId ? 'rgba(240,192,96,0.94)' : 'rgba(0,212,255,0.14)'}
              strokeWidth={id === activeId ? 3 : 1.3}
              strokeDasharray={id === activeId ? '12 10' : '4 12'}
              className={id === activeId ? 'mcp-flow-route' : undefined}
              filter="url(#dispatchGlow)"
            />
          ))}
          {[0, 0.34, 0.68].map((delay) => (
            <circle key={delay} r={delay === 0 ? 5 : 3.8} fill="var(--telemetry)" filter="url(#dispatchGlow)">
              <animateMotion dur="1.85s" begin={`${delay}s`} repeatCount="indefinite" path={activePath} />
            </circle>
          ))}
        </svg>

        {nodes.map((node) => {
          const position = NODE_POSITIONS[node.id] ?? NODE_POSITIONS.root;
          const active = node.id === activeId;
          const heat = Math.max(0.18, node.tokenCost / maxCost);
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setActiveId(node.id)}
              className={cn(
                'absolute z-20 w-[160px] -translate-x-1/2 -translate-y-1/2 border px-4 py-4 text-center transition-all',
                active
                  ? 'border-[rgba(240,192,96,0.78)] bg-[rgba(240,192,96,0.13)] shadow-[0_0_34px_rgba(240,192,96,0.18)]'
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

        <div className="absolute bottom-0 left-1/2 grid w-[min(640px,94%)] -translate-x-1/2 grid-cols-5 gap-2">
          {STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveId(step.id)}
              className={cn(
                'border px-3 py-3 text-left font-mono text-[9px] uppercase tracking-[0.1em]',
                step.id === activeId
                  ? 'border-[rgba(240,192,96,0.72)] bg-[rgba(240,192,96,0.12)] text-[var(--telemetry)]'
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
        <div className="mt-3 font-mono text-[13px] uppercase tracking-[0.14em] text-[var(--telemetry)]">{activeNode.agent}</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="Protocol" value={activeNode.protocol} />
          <Metric label="Duration" value={`${activeNode.durationMs}ms`} />
          <Metric label="Tokens" value={String(activeNode.tokenCost)} />
          <Metric label="Status" value={activeNode.status} />
        </div>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[rgba(226,240,255,0.66)]">
          <p><span className="text-[var(--signal)]">Input:</span> {activeNode.input}</p>
          <p><span className="text-[var(--telemetry)]">Output:</span> {activeNode.output}</p>
        </div>
      </aside>

      <nav className="hud-panel absolute bottom-5 left-1/2 z-30 flex w-[min(820px,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-3 px-4 py-3">
        <button className="mcp-hud-button" type="button" onClick={() => void runLesson()} disabled={isRunning}>
          <Play size={13} />
          {isRunning ? 'PLAYING' : 'RUN LESSON'}
        </button>
        <button className="mcp-hud-button" type="button" onClick={() => setActiveId('root')}>
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
