import { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { A2AMessageRow } from './A2AMessageRow';
import { useA2AStore } from '@/lib/store';
import type { A2AProtocolMessage } from '@/lib/simulation/a2a/types';

type FilterMode = 'all' | 'outgoing' | 'incoming' | 'errors';

export function MessageFlowTab() {
  const { messageLog, clearMessages } = useA2AStore();
  const [filter, setFilter] = useState<FilterMode>('all');

  const filtered: A2AProtocolMessage[] = messageLog.filter((message) => {
    if (filter === 'all') {
      return true;
    }
    if (filter === 'outgoing') {
      return message.direction === 'caller→callee';
    }
    if (filter === 'incoming') {
      return message.direction === 'callee→caller';
    }
    return message.stateAfter === 'failed' || ('error' in message.payload && Boolean(message.payload.error));
  });

  const filters: Array<{ key: FilterMode; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'outgoing', label: 'Caller to Callee' },
    { key: 'incoming', label: 'Callee to Caller' },
    { key: 'errors', label: 'Errors' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[rgba(167,139,250,0.15)] px-4 py-2.5">
        <Filter className="h-3.5 w-3.5 text-[#2a4060]" />
        <div className="flex gap-1">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={
                filter === key
                  ? 'rounded border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-2.5 py-1 text-[11px] font-mono text-[#a78bfa]'
                  : 'rounded px-2.5 py-1 text-[11px] font-mono text-[#7aa4cc] transition-colors hover:text-[#e8f4ff]'
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#2a4060]">{filtered.length} messages</span>
          <button
            type="button"
            onClick={clearMessages}
            className="flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-mono text-[#7aa4cc] transition-colors hover:text-[#e8f4ff]"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[#2a4060]">
            <p>No messages yet</p>
            <p className="text-xs">Run a scenario in Agent Cards to populate the protocol log.</p>
          </div>
        ) : (
          filtered.map((message) => <A2AMessageRow key={message.id} message={message} />)
        )}
      </div>
    </div>
  );
}