/**
 * AI Learning Playground - Cockpit Selection Page
 * 
 * Lists available and upcoming Advanced Mode cockpits.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Compass, Layers3, Network, Route } from 'lucide-react';
import { Card, Button } from '@/components/shared';
import {
  useCockpitStore,
  useModeStore,
  usePlatformStore,
  type CockpitCompletionState,
} from '@/lib/store';
import type { CockpitType } from '@/types';

const cockpitCatalog: Array<{
  id: CockpitType;
  name: string;
  question: string;
  description: string;
  group: 'Foundations' | 'Protocols' | 'Orchestration' | 'Workflow';
  status: 'available' | 'coming-soon';
}> = [
  {
    id: 'mcp-inspector',
    name: 'MCP Protocol Inspector',
    question: 'What actually happens on the wire when an AI app connects to an MCP server?',
    description: 'Inspect JSON-RPC traffic, capability negotiation, tool calls, and protocol errors.',
    group: 'Protocols',
    status: 'available' as const,
  },
  {
    id: 'prompt-reality',
    name: 'Prompt Reality Cockpit',
    question: 'What actually happens to my prompt before the model responds?',
    description: 'Understand prompt constraints, token pressure, and instruction conflict behavior.',
    group: 'Foundations',
    status: 'available' as const,
  },
  {
    id: 'multi-agent',
    name: 'Multi-Agent Orchestration',
    question: 'How do agents divide work, communicate, and fail?',
    description: 'Visualize orchestration patterns, inter-agent traffic, and agent responsibilities.',
    group: 'Orchestration',
    status: 'available' as const,
  },
  {
    id: 'subagent-dispatch',
    name: 'Subagent Dispatch Tree',
    question: 'How does a parent agent spawn, delegate to, and aggregate subagents?',
    description: 'Inspect dispatch trees, dependency fan-out, cost heatmaps, and result aggregation.',
    group: 'Orchestration',
    status: 'available' as const,
  },
  {
    id: 'agui-stream',
    name: 'AG-UI Event Stream',
    question: 'What events flow between an agent backend and a user-facing app?',
    description: 'Follow simulated SSE event streams, payloads, and guided protocol walkthroughs.',
    group: 'Protocols',
    status: 'available' as const,
  },
  {
    id: 'a2a-protocol',
    name: 'A2A Protocol Visualizer',
    question: 'How do agents from different frameworks discover each other and exchange tasks?',
    description: 'Explore agent cards, task lifecycle state, and cross-agent message flow.',
    group: 'Protocols',
    status: 'available' as const,
  },
  {
    id: 'llm-finetuning',
    name: 'LLM Fine-Tuning Animator',
    question: 'What happens across the fine-tuning pipeline and training loop?',
    description: 'Study training stages, metrics, techniques, and the ML Training Lab entry point.',
    group: 'Foundations',
    status: 'coming-soon' as const,
  },
  {
    id: 'workflow-dag',
    name: 'Workflow & DAG Visualizer',
    question: 'How does a full AI workflow execute step by step?',
    description: 'Replay DAG execution, inspect state transitions, and connect back into prior cockpits.',
    group: 'Workflow',
    status: 'coming-soon' as const,
  },
];

const GROUP_ORDER = ['Foundations', 'Protocols', 'Orchestration', 'Workflow'] as const;
const GROUP_ICONS = {
  Foundations: BookOpen,
  Protocols: Network,
  Orchestration: Layers3,
  Workflow: Route,
};
const PATHWAY_LABELS = {
  beginner: 'Beginner Path',
  builder: 'Builder Path',
  expert: 'Expert Explorer',
} as const;

function getCompletionLabel(state?: CockpitCompletionState): string {
  switch (state) {
    case 'explored':
      return 'Explored';
    case 'walkthrough-complete':
      return 'Walkthrough complete';
    case 'sandbox-built':
      return 'Sandbox built';
    default:
      return 'Not started';
  }
}

export const CockpitSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveCockpit } = useCockpitStore();
  const { mode, setMode } = useModeStore();
  const { pathway, setPathway, completion } = usePlatformStore();

  // Ensure Advanced Mode is activated when accessing this page
  useEffect(() => {
    if (mode !== 'advanced') {
      setMode('advanced');
    }
  }, [mode, setMode]);

  const handleSelectCockpit = (cockpitId: CockpitType, status: 'available' | 'coming-soon') => {
    if (status !== 'available') return;
    setActiveCockpit(cockpitId);
    navigate(`/advanced/${cockpitId}`);
  };

  const availableCockpits = cockpitCatalog.filter((cockpit) => cockpit.status === 'available');
  const completedCount = availableCockpits.filter((cockpit) => completion[cockpit.id]).length;
  const nextCockpit =
    availableCockpits.find((cockpit) => !completion[cockpit.id]) ?? availableCockpits[0];

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="p-6 lg:p-8 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-content-subtle">
                <Compass size={14} />
                Playground Map
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-content">
                One learning ecosystem, eight cockpits
              </h1>
              <p className="text-content-muted max-w-3xl">
                Move from first-principles understanding to protocol fluency, orchestration, and capstone workflow execution. Each cockpit answers one system-level question and hands you to the next one with context.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(PATHWAY_LABELS) as Array<keyof typeof PATHWAY_LABELS>).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPathway(value)}
                  className={
                    pathway === value
                      ? 'rounded-full bg-brand-500/10 px-3 py-2 text-sm text-brand-300'
                      : 'rounded-full bg-surface-muted px-3 py-2 text-sm text-content-muted'
                  }
                >
                  {PATHWAY_LABELS[value]}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-content-subtle">
                Progress rail
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-content">
                {completedCount} / {availableCockpits.length} available cockpits explored
              </h2>
            </div>

            {nextCockpit ? (
              <div className="rounded-2xl border border-brand-400/20 bg-brand-500/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-brand-300">Next best cockpit</div>
                <h3 className="mt-2 font-semibold text-content">{nextCockpit.name}</h3>
                <p className="mt-1 text-sm text-content-muted">{nextCockpit.question}</p>
              </div>
            ) : null}

            <div className="space-y-2 text-sm text-content-muted">
              <div className="flex items-center justify-between">
                <span>Active pathway</span>
                <span className="text-content">{PATHWAY_LABELS[pathway]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Start here</span>
                <span className="text-content">Prompt Reality → MCP → Orchestration</span>
              </div>
            </div>
          </Card>
        </div>

        {GROUP_ORDER.map((group, groupIndex) => {
          const GroupIcon = GROUP_ICONS[group];
          const cockpits = cockpitCatalog.filter((cockpit) => cockpit.group === group);

          return (
            <section key={group} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted text-brand-400">
                  <GroupIcon size={18} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-content">{group}</h2>
                  <p className="text-sm text-content-muted">
                    {group === 'Foundations'
                      ? 'Build intuition before diving into protocols and orchestration.'
                      : group === 'Protocols'
                        ? 'Learn the interfaces and event shapes that connect AI systems.'
                        : group === 'Orchestration'
                          ? 'See teams of agents delegate, coordinate, and recover.'
                          : 'Synthesize everything into end-to-end execution.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {cockpits.map((cockpit, index) => {
                  const isAvailable = cockpit.status === 'available';
                  return (
                    <motion.div
                      key={cockpit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * (groupIndex + index) }}
                    >
                      <Card
                        className={`p-5 ${isAvailable ? 'hover:border-surface-bright cursor-pointer' : 'opacity-60'}`}
                        onClick={() => handleSelectCockpit(cockpit.id, cockpit.status)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-content mb-1">{cockpit.name}</h3>
                              <p className="text-sm text-content-muted">{cockpit.question}</p>
                            </div>
                            <p className="text-sm text-content-subtle">{cockpit.description}</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-surface-muted px-2 py-1 text-2xs text-content-muted">
                                {getCompletionLabel(completion[cockpit.id])}
                              </span>
                            </div>
                          </div>
                          {isAvailable ? (
                            <div className="flex items-center gap-2 text-xs text-brand-400">
                              <span>Open</span>
                              <ArrowRight size={14} />
                            </div>
                          ) : (
                            <span className="text-xs text-content-subtle">Coming soon</span>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="pt-2">
          <Button variant="ghost" onClick={() => navigate('/advanced/landing')}>
            Back to Advanced Mode overview
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
