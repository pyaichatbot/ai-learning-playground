import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Shield, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { A2AAgentCard } from '@/lib/simulation/a2a/types';

const ANNOTATIONS: Record<string, string> = {
  'capabilities.streaming': 'Supports streaming responses or SSE updates while work is in progress.',
  'capabilities.pushNotifications': 'Can push state changes to an external callback endpoint.',
  'capabilities.stateTransitionHistory': 'Exposes historical transitions when the caller inspects task state.',
};

const BADGE_ACCENT = {
  caller: 'border-[#00d4ff]/25 bg-[#00d4ff]/10 text-[#00d4ff]',
  callee: 'border-[#a78bfa]/25 bg-[#a78bfa]/10 text-[#a78bfa]',
};

interface AgentCardDisplayProps {
  card: A2AAgentCard;
  role: 'caller' | 'callee';
  selected?: boolean;
  onClick?: () => void;
}

export function AgentCardDisplay({ card, role, selected = false, onClick }: AgentCardDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div
      className={cn(
        'cursor-pointer rounded-xl border bg-[rgba(10,22,40,0.72)] transition-all duration-200 backdrop-blur-md',
        selected
          ? 'border-[#a78bfa] shadow-[0_0_20px_rgba(167,139,250,0.2)]'
          : 'border-[rgba(167,139,250,0.15)] hover:border-[rgba(167,139,250,0.35)]'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className={cn('rounded border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase', BADGE_ACCENT[role])}>
              {role}
            </span>
            <span className="text-[10px] font-mono text-[#7aa4cc]">v{card.version}</span>
          </div>
          <h3 className="truncate text-sm font-semibold text-[#e8f4ff]">{card.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-[#7aa4cc]">{card.description}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
          className="mt-1 shrink-0 text-[#7aa4cc] hover:text-[#e8f4ff]"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {!expanded ? (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {card.capabilities.streaming ? (
            <span className="rounded border border-[#3ddc84]/20 bg-[#3ddc84]/10 px-1.5 py-0.5 text-[9px] font-mono text-[#3ddc84]">
              streaming
            </span>
          ) : null}
          {card.capabilities.pushNotifications ? (
            <span className="rounded border border-[#f0c060]/20 bg-[#f0c060]/10 px-1.5 py-0.5 text-[9px] font-mono text-[#f0c060]">
              push
            </span>
          ) : null}
          <span className="rounded border border-[#7aa4cc]/20 bg-[#7aa4cc]/10 px-1.5 py-0.5 text-[9px] font-mono text-[#7aa4cc]">
            {card.skills.length} skills
          </span>
        </div>
      ) : null}

      {expanded ? (
        <div className="space-y-4 border-t border-[rgba(167,139,250,0.15)] px-4 py-3">
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#7aa4cc]">Capabilities</div>
            {Object.entries(card.capabilities).map(([key, value]) => (
              <div key={key} className="group mb-1 flex items-center gap-2">
                {value ? <Check className="h-3 w-3 shrink-0 text-[#3ddc84]" /> : <X className="h-3 w-3 shrink-0 text-[#2a4060]" />}
                <span className="text-[11px] font-mono text-[#e8f4ff]">{key}</span>
                <span className="opacity-0 transition-opacity group-hover:opacity-100 text-[10px] italic text-[#7aa4cc]">
                  {ANNOTATIONS[`capabilities.${key}`]}
                </span>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#7aa4cc]">Skills</div>
            {card.skills.map((skill) => (
              <div key={skill.id} className="mb-2 rounded-lg border border-[rgba(167,139,250,0.1)] bg-[rgba(0,0,0,0.3)] p-2">
                <div className="mb-1 flex items-center gap-2">
                  <Zap className="h-3 w-3 text-[#f0c060]" />
                  <span className="text-[11px] font-semibold text-[#e8f4ff]">{skill.name}</span>
                  <span className="text-[9px] font-mono text-[#2a4060]">{skill.id}</span>
                </div>
                <p className="mb-1.5 text-[10px] text-[#7aa4cc]">{skill.description}</p>
                <div className="flex flex-wrap gap-1">
                  {skill.tags.map((tag) => (
                    <span key={tag} className="rounded border border-[#a78bfa]/20 bg-[#a78bfa]/10 px-1.5 py-0.5 text-[9px] font-mono text-[#a78bfa]">
                      {tag}
                    </span>
                  ))}
                </div>
                {skill.examples[0] ? <div className="mt-1.5 text-[9px] italic text-[#7aa4cc]">e.g. "{skill.examples[0]}"</div> : null}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7aa4cc]">Input modes</div>
              {card.defaultInputModes.map((mode) => (
                <div key={mode} className="text-[10px] font-mono text-[#e8f4ff]">{mode}</div>
              ))}
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7aa4cc]">Output modes</div>
              {card.defaultOutputModes.map((mode) => (
                <div key={mode} className="text-[10px] font-mono text-[#e8f4ff]">{mode}</div>
              ))}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowRaw((value) => !value);
              }}
              className="flex items-center gap-1 text-[10px] font-mono text-[#7aa4cc] hover:text-[#e8f4ff]"
            >
              <Shield className="h-3 w-3" />
              {showRaw ? 'Hide' : 'Show'} raw Agent Card JSON
            </button>
            {showRaw ? (
              <pre className="mt-2 overflow-x-auto rounded-lg border border-[rgba(167,139,250,0.1)] bg-[#020810] p-3 text-[9px] font-mono text-[#7aa4cc]">
                {JSON.stringify(card, null, 2)}
              </pre>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}