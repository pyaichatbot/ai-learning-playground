import React, { useMemo, useState } from 'react';
import { ArrowLeft, Bot, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type RuntimeFlowKind = 'intent' | 'llm' | 'plan' | 'skill' | 'local-tool' | 'web' | 'mcp' | 'observation' | 'synthesis' | 'final';
type RuntimeNodeId = 'user' | 'agent' | 'llm' | 'skills' | 'local' | 'web' | 'mcp' | 'memory' | 'answer';

type RuntimeStep = {
  id: string;
  label: string;
  kind: RuntimeFlowKind;
  from: RuntimeNodeId;
  to: RuntimeNodeId;
  pathId: string;
  summary: string;
  payload: unknown;
  participants?: RuntimeNodeId[];
};

type RuntimeScenario = {
  id: string;
  name: string;
  detail: string;
  steps: RuntimeStep[];
};

const NODES: Record<RuntimeNodeId, { label: string; detail: string; x: number; y: number }> = {
  user: { label: 'User Goal', detail: 'deliverable intent', x: 13, y: 48 },
  agent: { label: 'Agent Runtime', detail: 'planner + executor', x: 50, y: 47 },
  llm: { label: 'LLM', detail: 'reason + generate', x: 50, y: 18 },
  skills: { label: 'Skills', detail: 'task playbooks', x: 20, y: 18 },
  local: { label: 'Built-in Tools', detail: 'grep · bash · files', x: 18, y: 78 },
  web: { label: 'Web Search', detail: 'fresh external facts', x: 80, y: 18 },
  mcp: { label: 'MCP Remote', detail: 'server tools/resources', x: 84, y: 48 },
  memory: { label: 'Scratchpad', detail: 'observations', x: 50, y: 80 },
  answer: { label: 'Final Answer', detail: 'synthesized output', x: 86, y: 80 },
};

const FLOW_PATHS: Record<string, string> = {
  'user-agent': 'M 98 270 C 186 230 264 232 356 264',
  'agent-plan': 'M 364 254 C 338 226 424 226 396 254 C 424 282 338 282 364 254',
  'agent-llm': 'M 380 244 C 382 200 382 142 380 100',
  'llm-agent': 'M 400 100 C 426 160 426 212 400 244',
  'agent-skill': 'M 366 246 C 306 174 220 126 152 100',
  'skill-agent': 'M 152 100 C 238 154 314 198 370 246',
  'agent-local': 'M 368 298 C 290 366 198 414 137 438',
  'local-agent': 'M 137 438 C 244 370 314 324 368 298',
  'agent-web': 'M 402 244 C 482 150 546 112 608 100',
  'web-agent': 'M 608 100 C 532 154 462 202 398 246',
  'agent-mcp': 'M 414 270 C 494 246 566 246 638 270',
  'mcp-agent': 'M 638 270 C 552 334 480 330 414 298',
  'agent-memory': 'M 392 304 C 406 360 402 410 380 448',
  'memory-agent': 'M 380 448 C 430 410 430 354 396 304',
  'agent-answer': 'M 410 300 C 502 356 574 402 654 448',
};

const SCENARIOS: RuntimeScenario[] = [
  {
    id: 'repo-review',
    name: 'Repo Review',
    detail: 'Skills + local tools + MCP docs',
    steps: [
      { id: 'review-intent', label: '01 GOAL', kind: 'intent', from: 'user', to: 'agent', pathId: 'user-agent', summary: 'User asks for a grounded code review, not a hardcoded tool sequence.', payload: { userGoal: 'Review this cockpit change and explain risks, evidence, and verification.' } },
      { id: 'review-llm-request', label: '02 LLM', kind: 'llm', from: 'agent', to: 'llm', pathId: 'agent-llm', summary: 'The runtime sends only the goal, constraints, and available capabilities to the LLM. It does not ask the LLM to touch files directly.', payload: { promptContext: ['user goal', 'available skills', 'local tool policy', 'MCP boundary'], ask: 'Propose a safe review plan.' } },
      { id: 'review-plan', label: '03 PLAN', kind: 'plan', from: 'llm', to: 'agent', pathId: 'llm-agent', summary: 'The LLM returns a plan draft. The agent runtime owns execution and decides which capabilities to invoke.', payload: { plan: ['load review workflow', 'inspect changed files', 'run typecheck/tests', 'consult MCP/docs only if needed', 'summarize findings'] } },
      { id: 'review-skill', label: '04 SKILL', kind: 'skill', from: 'agent', to: 'skills', pathId: 'agent-skill', summary: 'A review skill gives process rules: findings first, tight file references, and no unrelated rewrites.', payload: { skill: 'code-review', provides: ['review rubric', 'finding format', 'verification discipline'] } },
      { id: 'review-local', label: '05 LOCAL', kind: 'local-tool', from: 'agent', to: 'local', pathId: 'agent-local', summary: 'The agent uses local tools to inspect files and run checks in the workspace.', payload: { calls: ['rg for affected code', 'sed file slices', 'npx tsc --noEmit'], boundary: 'local computer' } },
      { id: 'review-local-result', label: '06 RESULT', kind: 'observation', from: 'local', to: 'agent', pathId: 'local-agent', summary: 'Local tools return concrete observations that constrain what the agent can claim.', payload: { observations: ['typecheck passes', 'layout overlap exists', 'route registry updated'] } },
      { id: 'review-mcp', label: '07 MCP', kind: 'mcp', from: 'agent', to: 'mcp', pathId: 'agent-mcp', summary: 'If external protocol context is needed, the agent calls a remote MCP tool/resource instead of guessing.', payload: { mcpCall: 'resources/read or tools/call', purpose: 'retrieve external capability or protocol context' } },
      { id: 'review-mcp-result', label: '08 OBSERVE', kind: 'observation', from: 'mcp', to: 'agent', pathId: 'mcp-agent', summary: 'MCP results come back as structured evidence, not as an automatic final answer.', payload: { observation: 'remote documentation/tool output', rule: 'cross-check before using in response' } },
      { id: 'review-synth', label: '09 SYNTH', kind: 'synthesis', from: 'agent', to: 'memory', pathId: 'agent-memory', summary: 'The agent writes observations into its scratchpad before asking the LLM to draft the answer.', payload: { scratchpad: ['findings', 'verification', 'residual risks'] } },
      { id: 'review-draft-request', label: '10 DRAFT', kind: 'llm', from: 'agent', to: 'llm', pathId: 'agent-llm', summary: 'The agent sends verified scratchpad evidence to the LLM for final response drafting.', payload: { promptContext: ['findings', 'file evidence', 'verification status', 'residual risks'], ask: 'Draft a concise review response without inventing unsupported findings.' }, participants: ['agent', 'memory', 'llm'] },
      { id: 'review-draft-result', label: '11 DRAFT', kind: 'plan', from: 'llm', to: 'agent', pathId: 'llm-agent', summary: 'The LLM returns a draft. The agent still owns the final response and may constrain or reject unsupported wording.', payload: { draft: 'findings-first review summary with verified evidence and residual risks' }, participants: ['llm', 'agent', 'memory'] },
      { id: 'review-final', label: '12 FINAL', kind: 'final', from: 'agent', to: 'answer', pathId: 'agent-answer', summary: 'The agent sends the final answer after checking the LLM draft against scratchpad evidence.', payload: { finalAnswer: 'review findings + verification summary + next recommended fix' }, participants: ['agent', 'memory', 'answer'] },
    ],
  },
  {
    id: 'current-research',
    name: 'Current Research',
    detail: 'Web search + MCP + synthesis',
    steps: [
      { id: 'research-intent', label: '01 GOAL', kind: 'intent', from: 'user', to: 'agent', pathId: 'user-agent', summary: 'User asks a time-sensitive question where stale memory is not enough.', payload: { userGoal: 'Explain the latest library behavior and cite current evidence.' } },
      { id: 'research-llm-request', label: '02 LLM', kind: 'llm', from: 'agent', to: 'llm', pathId: 'agent-llm', summary: 'The runtime asks the LLM to plan the research strategy, not to invent current facts from memory.', payload: { promptContext: ['user goal', 'freshness requirement', 'source policy'], ask: 'Plan current-source verification.' } },
      { id: 'research-plan', label: '03 PLAN', kind: 'plan', from: 'llm', to: 'agent', pathId: 'llm-agent', summary: 'The LLM proposes a source-first strategy; the agent executes the browser and MCP calls.', payload: { plan: ['search official docs', 'open strongest source', 'compare with MCP snippets', 'synthesize with caveats'] } },
      { id: 'research-web', label: '04 WEB', kind: 'web', from: 'agent', to: 'web', pathId: 'agent-web', summary: 'Web search/browser fetches current external information.', payload: { tool: 'web search / browser', sourcePreference: 'official docs first' } },
      { id: 'research-web-result', label: '05 RESULT', kind: 'observation', from: 'web', to: 'agent', pathId: 'web-agent', summary: 'Search results become timestamped evidence the agent can cite or qualify.', payload: { observation: 'current documentation excerpt + URL + date checked' } },
      { id: 'research-mcp', label: '06 MCP', kind: 'mcp', from: 'agent', to: 'mcp', pathId: 'agent-mcp', summary: 'The agent may also query a specialized MCP knowledge server for structured data.', payload: { mcpCall: 'tools/call: search_docs', args: { query: 'current API behavior' } } },
      { id: 'research-mcp-result', label: '07 OBSERVE', kind: 'observation', from: 'mcp', to: 'agent', pathId: 'mcp-agent', summary: 'MCP returns structured snippets that are reconciled with browser evidence.', payload: { observation: 'ranked snippets with metadata', conflictPolicy: 'prefer primary docs when sources disagree' } },
      { id: 'research-synth', label: '08 SYNTH', kind: 'synthesis', from: 'agent', to: 'memory', pathId: 'agent-memory', summary: 'The agent distills evidence into a scratchpad before asking the LLM to draft the cited answer.', payload: { scratchpad: ['official source', 'MCP snippet', 'known uncertainty'] } },
      { id: 'research-draft-request', label: '09 DRAFT', kind: 'llm', from: 'agent', to: 'llm', pathId: 'agent-llm', summary: 'The agent sends current evidence and citation constraints to the LLM for answer drafting.', payload: { promptContext: ['official source', 'MCP snippet', 'checked date', 'uncertainty'], ask: 'Draft a cited answer using only verified current evidence.' }, participants: ['agent', 'memory', 'llm'] },
      { id: 'research-draft-result', label: '10 DRAFT', kind: 'plan', from: 'llm', to: 'agent', pathId: 'llm-agent', summary: 'The LLM returns a draft answer. The agent checks it against source evidence before delivery.', payload: { draft: 'evidence-backed answer with source links and checked date' }, participants: ['llm', 'agent', 'memory'] },
      { id: 'research-final', label: '11 FINAL', kind: 'final', from: 'agent', to: 'answer', pathId: 'agent-answer', summary: 'The agent returns the final answer after validating the LLM draft against the scratchpad.', payload: { finalAnswer: 'answer + cited source links + checked date' }, participants: ['agent', 'memory', 'answer'] },
    ],
  },
  {
    id: 'incident-triage',
    name: 'Incident Triage',
    detail: 'MCP observability + bash + skill',
    steps: [
      { id: 'incident-intent', label: '01 GOAL', kind: 'intent', from: 'user', to: 'agent', pathId: 'user-agent', summary: 'User asks the agent to diagnose a failing service without jumping straight to edits.', payload: { userGoal: 'Find why deployment is failing and propose the safest fix.' } },
      { id: 'incident-llm-request', label: '02 LLM', kind: 'llm', from: 'agent', to: 'llm', pathId: 'agent-llm', summary: 'The runtime asks the LLM for a triage plan, while withholding direct control over shell, logs, and MCP tools.', payload: { promptContext: ['incident goal', 'safe-debugging policy', 'available observability MCP'], ask: 'Plan the safest diagnostic sequence.' } },
      { id: 'incident-plan', label: '03 PLAN', kind: 'plan', from: 'llm', to: 'agent', pathId: 'llm-agent', summary: 'The LLM suggests the order; the agent runtime decides and executes each capability.', payload: { plan: ['load debugging skill', 'inspect remote logs', 'verify locally', 'propose minimal fix'] } },
      { id: 'incident-skill', label: '04 SKILL', kind: 'skill', from: 'agent', to: 'skills', pathId: 'agent-skill', summary: 'Incident-response skill forces a safe order: observe, isolate, verify, then suggest action.', payload: { skill: 'systematic-debugging', order: ['reproduce', 'inspect logs', 'form hypothesis', 'verify'] } },
      { id: 'incident-mcp', label: '05 MCP LOGS', kind: 'mcp', from: 'agent', to: 'mcp', pathId: 'agent-mcp', summary: 'The agent queries a remote observability MCP server for logs or traces.', payload: { mcpCall: 'tools/call: query_logs', args: { service: 'api', window: '30m' } } },
      { id: 'incident-mcp-result', label: '06 LOGS', kind: 'observation', from: 'mcp', to: 'agent', pathId: 'mcp-agent', summary: 'Remote logs identify symptoms, but the agent still verifies locally before recommending a fix.', payload: { observation: '500s started after config change; stack trace points to missing env var' } },
      { id: 'incident-local', label: '07 BASH', kind: 'local-tool', from: 'agent', to: 'local', pathId: 'agent-local', summary: 'The agent uses local shell/tests to validate the hypothesis in the repository.', payload: { calls: ['grep ENV_VAR', 'run focused test', 'inspect deploy config'], boundary: 'local workspace' } },
      { id: 'incident-local-result', label: '08 RESULT', kind: 'observation', from: 'local', to: 'agent', pathId: 'local-agent', summary: 'Local checks confirm whether the remote log hypothesis is real.', payload: { observation: 'deploy config references OLD_API_KEY; app now expects NEW_API_KEY' } },
      { id: 'incident-synth', label: '09 SYNTH', kind: 'synthesis', from: 'agent', to: 'memory', pathId: 'agent-memory', summary: 'Agent combines logs, local checks, and skill constraints into a safe scratchpad recommendation.', payload: { scratchpad: ['remote symptom', 'local root cause', 'safe remediation', 'rollback option'] } },
      { id: 'incident-draft-request', label: '10 DRAFT', kind: 'llm', from: 'agent', to: 'llm', pathId: 'agent-llm', summary: 'The agent sends verified incident evidence to the LLM for a safe response draft.', payload: { promptContext: ['remote symptom', 'local root cause', 'minimal fix', 'rollback option'], ask: 'Draft a cautious incident response with verification and rollback.' }, participants: ['agent', 'memory', 'llm'] },
      { id: 'incident-draft-result', label: '11 DRAFT', kind: 'plan', from: 'llm', to: 'agent', pathId: 'llm-agent', summary: 'The LLM returns a draft. The agent checks that remediation is supported by logs and local verification.', payload: { draft: 'root cause, minimal fix, verification command, rollback note' }, participants: ['llm', 'agent', 'memory'] },
      { id: 'incident-final', label: '12 FINAL', kind: 'final', from: 'agent', to: 'answer', pathId: 'agent-answer', summary: 'The agent returns the final triage response from the verified scratchpad and checked LLM draft.', payload: { finalAnswer: 'root cause + minimal config fix + verification + rollback note' }, participants: ['agent', 'memory', 'answer'] },
    ],
  },
];

function flowTone(kind: RuntimeFlowKind) {
  if (kind === 'observation') return { active: 'rgba(240,192,96,0.94)', idle: 'rgba(240,192,96,0.16)', fill: 'var(--telemetry)', label: 'Observation', border: 'border-[rgba(240,192,96,0.72)] bg-[rgba(240,192,96,0.12)] text-[var(--telemetry)]', dash: '3 8' };
  if (kind === 'llm') return { active: 'rgba(34,211,238,0.94)', idle: 'rgba(34,211,238,0.15)', fill: '#67e8f9', label: 'LLM call', border: 'border-cyan-300/70 bg-cyan-300/10 text-cyan-100', dash: '8 6' };
  if (kind === 'plan') return { active: 'rgba(34,211,238,0.94)', idle: 'rgba(34,211,238,0.15)', fill: '#67e8f9', label: 'LLM plan', border: 'border-cyan-300/70 bg-cyan-300/10 text-cyan-100', dash: '4 7' };
  if (kind === 'skill') return { active: 'rgba(167,139,250,0.94)', idle: 'rgba(167,139,250,0.16)', fill: '#a78bfa', label: 'Skill', border: 'border-[#a78bfa]/70 bg-[#a78bfa]/12 text-[#c4b5fd]', dash: '10 8' };
  if (kind === 'local-tool') return { active: 'rgba(61,220,132,0.94)', idle: 'rgba(61,220,132,0.15)', fill: 'var(--nominal)', label: 'Local tool', border: 'border-[rgba(61,220,132,0.68)] bg-[rgba(61,220,132,0.1)] text-[var(--nominal)]', dash: '12 10' };
  if (kind === 'web') return { active: 'rgba(0,212,255,0.94)', idle: 'rgba(0,212,255,0.14)', fill: 'var(--signal)', label: 'Web', border: 'border-[rgba(0,212,255,0.72)] bg-[rgba(0,212,255,0.12)] text-[var(--signal)]', dash: '2 7' };
  if (kind === 'mcp') return { active: 'rgba(255,110,64,0.94)', idle: 'rgba(255,110,64,0.15)', fill: '#ff8a4c', label: 'MCP', border: 'border-[rgba(255,138,76,0.72)] bg-[rgba(255,138,76,0.12)] text-[#ffb088]', dash: '16 7' };
  if (kind === 'synthesis') return { active: 'rgba(61,220,132,0.94)', idle: 'rgba(61,220,132,0.14)', fill: 'var(--nominal)', label: 'Synthesis', border: 'border-[rgba(61,220,132,0.68)] bg-[rgba(61,220,132,0.1)] text-[var(--nominal)]', dash: '18 8' };
  if (kind === 'final') return { active: 'rgba(61,220,132,0.94)', idle: 'rgba(61,220,132,0.14)', fill: 'var(--nominal)', label: 'Answer', border: 'border-[rgba(61,220,132,0.68)] bg-[rgba(61,220,132,0.1)] text-[var(--nominal)]', dash: '20 7' };
  return { active: 'rgba(0,212,255,0.94)', idle: 'rgba(0,212,255,0.14)', fill: 'var(--signal)', label: 'Request', border: 'border-[rgba(0,212,255,0.72)] bg-[rgba(0,212,255,0.12)] text-[var(--signal)]', dash: '12 10' };
}

function packetJson(value: unknown) {
  return JSON.stringify(value, null, 2).slice(0, 1000);
}

export const AgentRuntimeCockpit: React.FC = () => {
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);
  const activeScenario = useMemo(
    () => SCENARIOS.find((scenario) => scenario.id === activeScenarioId) ?? SCENARIOS[0],
    [activeScenarioId]
  );
  const activeSteps = activeScenario.steps;
  const [activeStepId, setActiveStepId] = useState(SCENARIOS[0].steps[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const activeStep = useMemo(
    () => activeSteps.find((step) => step.id === activeStepId) ?? activeSteps[0],
    [activeStepId, activeSteps]
  );
  const activeTone = flowTone(activeStep.kind);
  const activeNodes = activeStep.participants ?? [activeStep.from, activeStep.to];

  const selectScenario = (scenarioId: string) => {
    const nextScenario = SCENARIOS.find((scenario) => scenario.id === scenarioId) ?? SCENARIOS[0];
    setActiveScenarioId(nextScenario.id);
    setActiveStepId(nextScenario.steps[0].id);
    setIsRunning(false);
  };

  const runLesson = async () => {
    if (isRunning) return;
    setIsRunning(true);
    for (const step of activeSteps) {
      setActiveStepId(step.id);
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
        <div className="hud-label text-[var(--signal)]">AGENT RUNTIME COCKPIT</div>
        <h1 className="mt-1 font-mono text-[13px] uppercase tracking-[0.38em] text-[rgba(226,240,255,0.86)]">
          Goal · Agent · LLM · Tools · MCP · Skills · Answer
        </h1>
      </header>

      <aside className="hud-panel absolute left-6 top-24 z-20 w-[290px] p-4">
        <div className="hud-label text-[var(--signal)]">LEARN BY WATCHING</div>
        <div className="mt-3 font-mono text-[15px] uppercase tracking-[0.14em] text-[rgba(226,240,255,0.9)]">{activeStep.label}</div>
        <p className="mt-3 text-sm leading-6 text-[rgba(226,240,255,0.68)]">{activeStep.summary}</p>
        <div className="mt-4 border-t border-[rgba(0,212,255,0.12)] pt-3">
          <div className="hud-label text-[var(--telemetry)]">SCENARIOS</div>
          <div className="mt-2 grid gap-2">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => selectScenario(scenario.id)}
                className={cn(
                  'border px-3 py-2 text-left transition-all',
                  scenario.id === activeScenario.id
                    ? 'border-[rgba(0,212,255,0.66)] bg-[rgba(0,212,255,0.1)] text-[var(--signal)]'
                    : 'border-[rgba(0,212,255,0.13)] bg-[rgba(2,8,16,0.5)] text-[rgba(226,240,255,0.58)] hover:border-[rgba(0,212,255,0.34)]'
                )}
              >
                <span className="block font-mono text-[10px] uppercase tracking-[0.14em]">{scenario.name}</span>
                <span className="mt-1 block text-[11px] leading-4 text-[rgba(122,164,204,0.86)]">{scenario.detail}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[rgba(0,212,255,0.12)] pt-3">
          <FlowLegend color="var(--signal)" label="Intent/Web" />
          <FlowLegend color="#67e8f9" label="LLM/Plan" />
          <FlowLegend color="#a78bfa" label="Skill" />
          <FlowLegend color="var(--nominal)" label="Local/Final" />
          <FlowLegend color="#ff8a4c" label="MCP" />
          <FlowLegend color="var(--telemetry)" label="Observation" />
        </div>
      </aside>

      <section className="absolute left-[330px] right-[360px] top-[96px] z-10 h-[610px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 560" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="agentRuntimeGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {activeSteps.map((step) => {
            const tone = flowTone(step.kind);
            return (
              <path
                key={step.id}
                d={FLOW_PATHS[step.pathId]}
                fill="none"
                stroke={step.id === activeStep.id ? tone.active : tone.idle}
                strokeWidth={step.id === activeStep.id ? 3 : 1.2}
                strokeDasharray={tone.dash}
                className={step.id === activeStep.id ? 'mcp-flow-route' : undefined}
                filter="url(#agentRuntimeGlow)"
              />
            );
          })}
          {[0, 0.32, 0.64].map((delay) => (
            <circle key={delay} r={delay === 0 ? 5 : 3.6} fill={activeTone.fill} filter="url(#agentRuntimeGlow)">
              <animateMotion dur="1.75s" begin={`${delay}s`} repeatCount="indefinite" path={FLOW_PATHS[activeStep.pathId]} />
            </circle>
          ))}
        </svg>

        {Object.entries(NODES).map(([nodeId, node]) => {
          const active = activeNodes.includes(nodeId as RuntimeNodeId);
          return (
            <button
              key={nodeId}
              type="button"
              className={cn(
                'absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-3 text-center transition-all',
                nodeId === 'agent'
                  ? 'w-[180px] px-4 py-5'
                  : nodeId === 'skills' || nodeId === 'llm' || nodeId === 'web'
                    ? 'w-[112px]'
                    : nodeId === 'memory' || nodeId === 'answer'
                      ? 'w-[132px]'
                      : 'w-[138px]',
                active ? activeTone.border : 'border-[rgba(0,212,255,0.16)] bg-[rgba(2,8,16,0.72)] text-[rgba(226,240,255,0.74)]'
              )}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              {nodeId === 'agent' ? <Bot className="mx-auto mb-2 h-5 w-5" /> : null}
              <div className="font-mono text-[10px] uppercase tracking-[0.13em]">{node.label}</div>
              <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[rgba(122,164,204,0.82)]">{node.detail}</div>
            </button>
          );
        })}

        <div
          className="absolute -bottom-4 left-1/2 grid w-full -translate-x-1/2 gap-2"
          style={{ gridTemplateColumns: `repeat(${activeSteps.length}, minmax(0, 1fr))` }}
        >
          {activeSteps.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
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
          <Bot size={15} className="text-[var(--signal)]" />
          <div className="hud-label">RUNTIME INSPECTOR</div>
        </div>
        <div className="mt-3 font-mono text-[13px] uppercase tracking-[0.14em]" style={{ color: activeTone.fill }}>
          {activeTone.label} · {activeStep.from} → {activeStep.to}
        </div>
        <pre className="mt-4 max-h-[360px] overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-4 text-[rgba(226,240,255,0.68)]">{packetJson(activeStep.payload)}</pre>
      </aside>

      <nav className="hud-panel absolute bottom-5 left-1/2 z-30 flex w-[min(860px,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-3 px-4 py-3">
        <button className="mcp-hud-button" type="button" onClick={() => void runLesson()} disabled={isRunning}>
          <Play size={13} />
          {isRunning ? 'PLAYING' : 'RUN AGENT LOOP'}
        </button>
        <button className="mcp-hud-button" type="button" onClick={() => setActiveStepId(activeSteps[0].id)}>
          <RotateCcw size={13} />
          RESET
        </button>
        <div className="hud-label ml-auto">Experts: inspect capability routing, local-vs-remote boundaries, skill context, observations, and final synthesis.</div>
      </nav>
    </div>
  );
};

function FlowLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-[rgba(122,164,204,0.82)]">
      <span className="mb-1 block h-[2px] rounded-full shadow-[0_0_12px_currentColor]" style={{ background: color, color }} />
      {label}
    </div>
  );
}
