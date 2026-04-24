import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { A2AProtocolMessage, A2ATaskState } from '@/lib/simulation/a2a/types';

const STATE_COLORS: Record<A2ATaskState, string> = {
  submitted: 'border-[#f0c060]/30 bg-[#f0c060]/10 text-[#f0c060]',
  working: 'border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]',
  'input-required': 'border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa]',
  'auth-required': 'border-[#fb923c]/30 bg-[#fb923c]/10 text-[#fb923c]',
  completed: 'border-[#3ddc84]/30 bg-[#3ddc84]/10 text-[#3ddc84]',
  failed: 'border-[#ff4060]/30 bg-[#ff4060]/10 text-[#ff4060]',
  canceled: 'border-[#7aa4cc]/30 bg-[#7aa4cc]/10 text-[#7aa4cc]',
  rejected: 'border-[#ff4060]/30 bg-[#ff4060]/10 text-[#ff4060]',
};

interface A2AMessageRowProps {
  message: A2AProtocolMessage;
}

export function A2AMessageRow({ message }: A2AMessageRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isOutgoing = message.direction === 'caller→callee';
  const hasError = message.stateAfter === 'failed' || ('error' in message.payload && Boolean(message.payload.error));
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className={cn('last:border-0 border-b border-[rgba(167,139,250,0.1)]', hasError ? 'bg-[#ff4060]/5' : null)}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[rgba(167,139,250,0.05)]"
      >
        {expanded ? <ChevronDown className="h-3 w-3 shrink-0 text-[#2a4060]" /> : <ChevronRight className="h-3 w-3 shrink-0 text-[#2a4060]" />}
        <span
          className={cn(
            'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold',
            isOutgoing ? 'border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]' : 'border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa]'
          )}
        >
          {message.direction}
        </span>
        <span className="flex-1 truncate text-[11px] font-mono text-[#e8f4ff]">{message.method ?? 'response'}</span>
        {message.stateAfter ? (
          <span className={cn('shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-mono font-semibold', STATE_COLORS[message.stateAfter])}>
            {message.stateAfter}
          </span>
        ) : null}
        {hasError ? (
          <span className="shrink-0 rounded border border-[#ff4060]/30 bg-[#ff4060]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#ff4060]">
            ERROR
          </span>
        ) : null}
        <span className="shrink-0 text-[10px] font-mono text-[#2a4060]">{timestamp}</span>
      </button>

      {expanded ? (
        <div className="px-4 pb-3">
          <pre className="overflow-x-auto rounded-lg border border-[rgba(167,139,250,0.1)] bg-[#020810] p-3 text-[10px] font-mono text-[#7aa4cc]">
            {JSON.stringify(message.payload, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}