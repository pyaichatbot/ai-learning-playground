import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { MCPMessage } from '@/lib/simulation/mcp/types';
import { PayloadAnnotator } from './PayloadAnnotator';

interface MessageRowProps {
  message: MCPMessage;
}

export function MessageRow({ message }: MessageRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isError =
    message.direction === 'server→client' &&
    typeof message.payload === 'object' &&
    message.payload !== null &&
    'error' in message.payload &&
    Boolean((message.payload as { error?: unknown }).error);

  return (
    <div className="border-b border-[rgba(0,212,255,0.08)]">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[rgba(0,212,255,0.06)]"
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span
          className={`rounded px-2 py-0.5 font-mono text-2xs font-medium uppercase tracking-[0.08em] ${
            message.direction === 'client→server'
                ? 'border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.1)] text-[var(--signal)]'
                : isError
                  ? 'border border-[rgba(255,64,96,0.35)] bg-[rgba(77,0,20,0.45)] text-[var(--critical)]'
                : 'border border-[rgba(61,220,132,0.25)] bg-[rgba(61,220,132,0.1)] text-[var(--nominal)]'
          }`}
        >
          {message.direction}
        </span>
        <span className="method-badge">{message.method ?? 'response'}</span>
        <span className="ml-auto font-mono text-2xs text-[var(--telemetry)]">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </button>

      {expanded ? (
        <div className="px-4 pb-4">
          <PayloadAnnotator payload={message.payload} title="Message payload" />
        </div>
      ) : null}
    </div>
  );
}
