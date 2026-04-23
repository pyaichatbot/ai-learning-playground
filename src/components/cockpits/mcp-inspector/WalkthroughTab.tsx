import { useEffect, useMemo, useState } from 'react';
import { Button, Card } from '@/components/shared';
import { useMCPStore } from '@/lib/store';

const STEPS = [
  {
    title: 'Real App Story',
    detail: 'See how a real AI product decides to use MCP before any packet details show up.',
  },
  {
    title: 'Handshake',
    detail: 'Watch initialize establish the contract between the MCP client and server.',
  },
  {
    title: 'Discovery',
    detail: 'The server returns capability shape so the app knows what it can actually use.',
  },
  {
    title: 'Capability Types',
    detail: 'Understand why tools, resources, and prompts solve different jobs.',
  },
  {
    title: 'Execution',
    detail: 'Inspect a concrete tool call with real arguments flowing through the app.',
  },
  {
    title: 'Recovery',
    detail: 'See how resilient apps absorb MCP errors and still preserve user trust.',
  },
];

export function WalkthroughTab() {
  const { walkthroughStep, setWalkthroughStep } = useMCPStore();
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (!autoPlay) return undefined;

    const timer = window.setInterval(() => {
      setWalkthroughStep((walkthroughStep + 1) % STEPS.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, [autoPlay, setWalkthroughStep, walkthroughStep]);

  const iframeSrc = useMemo(() => {
    const base = import.meta.env.BASE_URL;
    return `${base}hyperframes/mcp-walkthrough/index.html?step=${walkthroughStep}`;
  }, [walkthroughStep]);

  return (
    <div className="grid h-full gap-4 overflow-auto p-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="p-5">
        <div className="space-y-4">
          <div>
            <h2 className="font-medium text-content">Hybrid command center walkthrough</h2>
            <p className="text-sm text-content-muted">
              Start with the end-to-end product story, then inspect handshake, discovery, capability types,
              execution, and recovery on one motion-led surface.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-400/20 bg-brand-500/5 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-content-muted">Reading the motion</div>
            <div className="mt-2 text-sm text-content">
              Blue packets show active protocol flow, green highlights show stable capability use, and the
              recovery stage makes error handling visible instead of hiding it behind text.
            </div>
          </div>

          <div className="space-y-2">
            {STEPS.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setWalkthroughStep(index)}
                className={`block w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                  walkthroughStep === index
                    ? 'border-brand-400/40 bg-brand-500/10'
                    : 'border-content-subtle/20 bg-surface-muted hover:border-content-subtle/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-elevated text-xs text-content-muted">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-content">{step.title}</h3>
                    <p className="text-xs text-content-muted">{step.detail}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setWalkthroughStep(Math.max(0, walkthroughStep - 1))}
              disabled={walkthroughStep === 0}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              onClick={() => setWalkthroughStep(Math.min(STEPS.length - 1, walkthroughStep + 1))}
              disabled={walkthroughStep === STEPS.length - 1}
            >
              Next
            </Button>
            <Button variant="ghost" onClick={() => setAutoPlay((current) => !current)}>
              {autoPlay ? 'Stop Auto-play' : 'Auto-play'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="min-h-[560px] p-3">
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          title="MCP hybrid command center walkthrough"
          className="h-full min-h-[520px] w-full rounded-2xl border border-content-subtle/20 bg-slate-950"
        />
      </Card>
    </div>
  );
}
