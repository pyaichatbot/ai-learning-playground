import { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { useMCPStore } from '@/lib/store';
import type { MCPMessage } from '@/lib/simulation/mcp/types';
import { MessageRow } from './MessageRow';

type FilterMode = 'all' | 'requests' | 'responses' | 'errors';

const FILTERS: Array<{ id: FilterMode; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'requests', label: 'Requests' },
  { id: 'responses', label: 'Responses' },
  { id: 'errors', label: 'Errors' },
];

export function InspectorTab() {
  const { clearMessages, messageLog } = useMCPStore();
  const [filter, setFilter] = useState<FilterMode>('all');

  const filteredMessages = messageLog.filter((message: MCPMessage) => {
    if (filter === 'all') return true;
    if (filter === 'requests') return message.direction === 'client→server';
    if (filter === 'responses') return message.direction === 'server→client';
    return (
      message.direction === 'server→client' &&
      typeof message.payload === 'object' &&
      message.payload !== null &&
      'error' in message.payload &&
      Boolean((message.payload as { error?: unknown }).error)
    );
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-content-subtle/20 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-content-muted">
          <Filter size={16} />
          <span>Filter</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                filter === item.id
                  ? 'bg-brand-500/10 text-brand-300'
                  : 'bg-surface-muted text-content-muted hover:text-content'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={clearMessages}
          className="ml-auto flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-xs text-content-muted hover:text-content"
        >
          <RotateCcw size={14} />
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => <MessageRow key={message.id} message={message} />)
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <h3 className="font-medium text-content">No messages yet</h3>
              <p className="mt-2 text-sm text-content-muted">
                Make a call in the Explorer tab to see the raw JSON-RPC traffic here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
