import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const FIELD_ANNOTATIONS: Record<string, string> = {
  jsonrpc: 'JSON-RPC protocol version.',
  id: 'Pairs this response with the original request.',
  method: 'The protocol operation being invoked.',
  params: 'Arguments sent by the client for this request.',
  result: 'Successful response payload from the server.',
  error: 'Failure payload returned instead of a result.',
  code: 'JSON-RPC error code.',
  message: 'Human-readable error explanation.',
  protocolVersion: 'The MCP version negotiated during initialize.',
  serverInfo: 'The server name and version.',
  capabilities: 'Capabilities the server exposes to the client.',
  tools: 'Declared callable tools on the server.',
  resources: 'Declared readable resources on the server.',
  prompts: 'Declared prompt templates on the server.',
  name: 'Unique identifier for this entity.',
  description: 'Human-readable description of the entity.',
  inputSchema: 'JSON Schema describing valid tool arguments.',
  arguments: 'Named values used to instantiate the prompt or call.',
  uri: 'Address of the resource to read.',
  content: 'Primary returned content payload.',
  contents: 'Collection of resource content blocks.',
  text: 'Text returned to the client.',
  isError: 'Tool succeeded at the transport level but returned an error outcome.',
};

function getValueColor(value: unknown): string {
  if (typeof value === 'string') return 'text-emerald-400';
  if (typeof value === 'number') return 'text-amber-300';
  if (typeof value === 'boolean') return 'text-violet-300';
  if (value === null) return 'text-content-subtle';
  return 'text-content';
}

interface PayloadNodeProps {
  label?: string;
  value: unknown;
  depth?: number;
}

function PayloadNode({ label, value, depth = 0 }: PayloadNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isArray = Array.isArray(value);
  const isObject = typeof value === 'object' && value !== null && !isArray;
  const isExpandable = isArray || isObject;
  const annotation = label ? FIELD_ANNOTATIONS[label] : undefined;

  if (!isExpandable) {
    return (
      <div className="space-y-1" style={{ marginLeft: depth * 14 }}>
        <div className="flex flex-wrap items-start gap-2 text-xs font-mono">
          {label ? <span className="text-[var(--signal)]">"{label}"</span> : null}
          {label ? <span className="text-[var(--text-dim)]">:</span> : null}
          <span className={getValueColor(value)}>{JSON.stringify(value)}</span>
        </div>
        {annotation ? <p className="text-2xs text-[var(--text-secondary)]">{annotation}</p> : null}
      </div>
    );
  }

  const entries = isArray
    ? (value as unknown[]).map((item, index) => [String(index), item] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div className="space-y-1" style={{ marginLeft: depth * 14 }}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {label ? <span className="text-[var(--signal)]">"{label}"</span> : null}
            {label ? <span className="text-[var(--text-dim)]">:</span> : null}
            <span className="text-[var(--text-primary)]">
              {isArray ? `[${entries.length} items]` : '{…}'}
            </span>
          </div>
          {annotation ? <p className="text-2xs text-[var(--text-secondary)]">{annotation}</p> : null}
        </div>
      </div>

      {expanded ? (
        <div className="space-y-2 border-l border-[rgba(0,212,255,0.12)] pl-3">
          {entries.map(([childLabel, childValue]) => (
            <PayloadNode key={`${label ?? 'root'}-${childLabel}`} label={childLabel} value={childValue} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface PayloadAnnotatorProps {
  payload: unknown;
  title?: string;
}

export function PayloadAnnotator({ payload, title = 'Payload' }: PayloadAnnotatorProps) {
  const stablePayload = useMemo(() => payload, [payload]);

  return (
    <div className="hud-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-medium text-[var(--text-primary)]">{title}</h3>
        <span className="method-badge">
          annotated
        </span>
      </div>
      <div className="space-y-2 overflow-auto">
        <PayloadNode value={stablePayload} />
      </div>
    </div>
  );
}
