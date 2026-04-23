# MCP Protocol Inspector — Implementation Plan (Part 2 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Part 1:** `docs/superpowers/plans/2026-04-23-mcp-inspector-part1.md` — Simulation engine, MCPServer, MCPClient, 5 scenarios, Zustand store.
>
> **Prerequisite:** All tasks in Part 1 must be complete before starting Part 2.

---

## File Map (Part 2)

### Create
```
src/components/cockpits/mcp-inspector/AnatomyTree.tsx
src/components/cockpits/mcp-inspector/SchemaDetail.tsx
src/components/cockpits/mcp-inspector/PayloadAnnotator.tsx
src/components/cockpits/mcp-inspector/MessageRow.tsx
src/components/cockpits/mcp-inspector/SchemaBuilder.tsx
src/components/cockpits/mcp-inspector/ScenarioSelector.tsx
src/components/cockpits/mcp-inspector/ExplorerTab.tsx
src/components/cockpits/mcp-inspector/InspectorTab.tsx
src/components/cockpits/mcp-inspector/WalkthroughTab.tsx
src/components/cockpits/mcp-inspector/MCPInspectorCockpit.tsx
src/components/cockpits/mcp-inspector/index.ts
public/hyperframes/mcp-walkthrough/index.html
```

### Modify
```
src/components/pages/MCPInspectorPage.tsx        ← replace stub with full implementation
src/components/pages/CockpitSelectionPage.tsx    ← add MCP Inspector card
```

---

## Task 10: AnatomyTree Component

The anatomy tree is the left panel of the Explorer tab. It renders the active scenario's tools, resources, and prompts as a collapsible tree. Clicking a node selects it for detail display on the right.

**File:** `src/components/cockpits/mcp-inspector/AnatomyTree.tsx`

- [ ] **Step 1: Implement AnatomyTree**

Create `src/components/cockpits/mcp-inspector/AnatomyTree.tsx`:

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, FileText, MessageSquare, Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useMCPStore } from '../../../lib/store';
import type { MCPTool, MCPResource, MCPPrompt } from '../../../lib/simulation/mcp/types';

interface AnatomyTreeProps {
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  onAddCustom?: () => void;
}

type ItemType = 'tool' | 'resource' | 'prompt';

interface TreeSectionProps {
  label: string;
  icon: React.ReactNode;
  items: Array<{ name: string }>;
  type: ItemType;
  accentColor: string;
}

function TreeSection({ label, icon, items, type, accentColor }: TreeSectionProps) {
  const [open, setOpen] = useState(true);
  const { selectedTreeItem, setSelectedTreeItem } = useMCPStore();

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {icon}
        <span className="uppercase tracking-wider">{label}</span>
        <span className="ml-auto bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px]">
          {items.length}
        </span>
      </button>
      {open && (
        <div className="ml-4 border-l border-border pl-2">
          {items.map((item) => {
            const isSelected =
              selectedTreeItem?.type === type && selectedTreeItem.name === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setSelectedTreeItem({ type, name: item.name })}
                className={cn(
                  'w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors',
                  isSelected
                    ? `bg-${accentColor}/10 text-${accentColor} font-medium`
                    : 'text-foreground hover:bg-muted'
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AnatomyTree({ tools, resources, prompts, onAddCustom }: AnatomyTreeProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Server Anatomy
        </p>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <TreeSection
          label="Tools"
          icon={<Wrench className="h-3 w-3 text-orange-400" />}
          items={tools}
          type="tool"
          accentColor="orange-400"
        />
        <TreeSection
          label="Resources"
          icon={<FileText className="h-3 w-3 text-blue-400" />}
          items={resources}
          type="resource"
          accentColor="blue-400"
        />
        <TreeSection
          label="Prompts"
          icon={<MessageSquare className="h-3 w-3 text-purple-400" />}
          items={prompts}
          type="prompt"
          accentColor="purple-400"
        />
      </div>
      {onAddCustom && (
        <div className="border-t border-border p-2">
          <button
            onClick={onAddCustom}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add custom tool / resource / prompt
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (if `cn` or `lucide-react` are missing, verify existing components in the project use the same imports — they should already be available).

- [ ] **Step 3: Commit**

```bash
git add src/components/cockpits/mcp-inspector/AnatomyTree.tsx
git commit -m "feat: add AnatomyTree — collapsible server anatomy panel for Explorer tab"
```

---

## Task 11: SchemaDetail + PayloadAnnotator

SchemaDetail shows a selected tool/resource/prompt's full JSON schema with an editable call form. PayloadAnnotator renders an annotated JSON response where each field has an inline explanation.

**Files:**
- Create: `src/components/cockpits/mcp-inspector/SchemaDetail.tsx`
- Create: `src/components/cockpits/mcp-inspector/PayloadAnnotator.tsx`

- [ ] **Step 1: Implement PayloadAnnotator**

Create `src/components/cockpits/mcp-inspector/PayloadAnnotator.tsx`:

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Per-field annotations for well-known MCP response fields
const FIELD_ANNOTATIONS: Record<string, string> = {
  jsonrpc: 'Protocol version — always "2.0" per JSON-RPC spec',
  id: 'Matches the request id — how client pairs responses to requests',
  result: 'The payload for a successful call',
  error: 'Present only on failure — replaces result',
  code: 'Negative integer error code: -32601=method not found, -32602=invalid params, -32603=internal',
  message: 'Human-readable error description',
  protocolVersion: 'MCP spec version the server implements (2025-11-25)',
  serverInfo: 'Server identity — name and version string',
  capabilities: 'Declares which MCP features the server supports',
  tools: 'Array of tool descriptors the server exposes',
  name: 'Unique identifier for this entity within the server',
  description: 'Human-readable explanation — shown to the LLM as context',
  inputSchema: 'JSON Schema defining valid arguments for this tool call',
  resources: 'Array of addressable content the server can serve',
  uri: 'Unique address for this resource — used in resources/read',
  mimeType: 'Content type of the resource (text/markdown, application/json, etc.)',
  prompts: 'Array of prompt templates the server provides',
  arguments: 'Named parameters the prompt accepts',
  content: 'Array of content blocks returned by a tool call',
  type: 'Content type — "text" is most common; also "image" or "resource"',
  text: 'The actual content payload',
  isError: 'True when the tool call itself succeeded but produced an error result',
  contents: 'Array of resource content blocks',
};

interface AnnotatedFieldProps {
  fieldKey: string;
  value: unknown;
  depth: number;
}

function AnnotatedField({ fieldKey, value, depth }: AnnotatedFieldProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const annotation = FIELD_ANNOTATIONS[fieldKey];
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  return (
    <div className={`ml-${Math.min(depth * 3, 12)}`} style={{ marginLeft: `${depth * 12}px` }}>
      <div className="flex items-start gap-1 group py-0.5">
        {isExpandable ? (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-0.5 text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-3 inline-block" />
        )}
        <span className="text-blue-400 text-xs font-mono shrink-0">"{fieldKey}"</span>
        <span className="text-muted-foreground text-xs font-mono">:</span>
        {!isExpandable && (
          <span className={`text-xs font-mono ${typeof value === 'string' ? 'text-green-400' : 'text-orange-300'}`}>
            {JSON.stringify(value)}
          </span>
        )}
        {isExpandable && !expanded && (
          <span className="text-muted-foreground text-xs font-mono">
            {isArray ? `[${(value as unknown[]).length} items]` : '{...}'}
          </span>
        )}
        {annotation && (
          <span className="ml-2 text-[10px] text-muted-foreground italic opacity-0 group-hover:opacity-100 transition-opacity">
            ← {annotation}
          </span>
        )}
      </div>
      {isExpandable && expanded && (
        <div>
          {isArray
            ? (value as unknown[]).map((item, i) => (
                <AnnotatedField key={i} fieldKey={String(i)} value={item} depth={depth + 1} />
              ))
            : Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <AnnotatedField key={k} fieldKey={k} value={v} depth={depth + 1} />
              ))}
        </div>
      )}
    </div>
  );
}

interface PayloadAnnotatorProps {
  payload: unknown;
}

export function PayloadAnnotator({ payload }: PayloadAnnotatorProps) {
  if (!payload) return null;
  const entries = Object.entries(payload as Record<string, unknown>);
  return (
    <div className="bg-[#0d1117] rounded-md border border-border p-3 font-mono text-xs overflow-x-auto">
      <div className="text-muted-foreground mb-1">{'{'}</div>
      {entries.map(([k, v]) => (
        <AnnotatedField key={k} fieldKey={k} value={v} depth={1} />
      ))}
      <div className="text-muted-foreground">{'}'}</div>
      <p className="mt-2 text-[10px] text-muted-foreground italic">Hover a field to see what it means</p>
    </div>
  );
}
```

- [ ] **Step 2: Implement SchemaDetail**

Create `src/components/cockpits/mcp-inspector/SchemaDetail.tsx`:

```tsx
import { useState } from 'react';
import { Play, AlertTriangle } from 'lucide-react';
import { PayloadAnnotator } from './PayloadAnnotator';
import { MCPServer } from '../../../lib/simulation/mcp/MCPServer';
import { MCPClient } from '../../../lib/simulation/mcp/MCPClient';
import { useMCPStore } from '../../../lib/store';
import type { MCPTool, MCPResource, MCPPrompt, MCPScenario } from '../../../lib/simulation/mcp/types';

interface SchemaDetailProps {
  scenario: MCPScenario;
  server: MCPServer;
  client: MCPClient;
}

export function SchemaDetail({ scenario, server, client }: SchemaDetailProps) {
  const { selectedTreeItem, appendMessage, setConnectionState } = useMCPStore();
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [injectError, setInjectError] = useState(false);

  if (!selectedTreeItem) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a tool, resource, or prompt from the tree to inspect it
      </div>
    );
  }

  const { type, name } = selectedTreeItem;

  const item: MCPTool | MCPResource | MCPPrompt | undefined =
    type === 'tool'
      ? [...scenario.tools, ...useMCPStore.getState().customTools].find((t) => t.name === name)
      : type === 'resource'
      ? [...scenario.resources, ...useMCPStore.getState().customResources].find((r) => r.name === name)
      : [...scenario.prompts, ...useMCPStore.getState().customPrompts].find((p) => p.name === name);

  if (!item) return null;

  const handleCall = async () => {
    setLoading(true);
    setResponse(null);
    try {
      // Ensure server is initialized
      const initRes = await client.initialize();
      setConnectionState('connected');
      appendMessage({
        id: crypto.randomUUID(),
        direction: 'client→server',
        method: 'initialize',
        payload: { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
        timestamp: Date.now(),
      });
      appendMessage({
        id: crypto.randomUUID(),
        direction: 'server→client',
        payload: initRes,
        timestamp: Date.now(),
      });

      let res;
      const parsedArgs = injectError
        ? { __invalid__: true }
        : Object.fromEntries(
            Object.entries(argValues).map(([k, v]) => {
              try { return [k, JSON.parse(v)]; } catch { return [k, v]; }
            })
          );

      if (type === 'tool') {
        res = await client.callTool(name, parsedArgs);
        appendMessage({ id: crypto.randomUUID(), direction: 'client→server', method: 'tools/call', payload: { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: parsedArgs } }, timestamp: Date.now() });
      } else if (type === 'resource') {
        const uri = (item as MCPResource).uri;
        res = await client.readResource(uri);
        appendMessage({ id: crypto.randomUUID(), direction: 'client→server', method: 'resources/read', payload: { jsonrpc: '2.0', id: 2, method: 'resources/read', params: { uri } }, timestamp: Date.now() });
      } else {
        res = await client.getPrompt(name, parsedArgs as Record<string, string>);
        appendMessage({ id: crypto.randomUUID(), direction: 'client→server', method: 'prompts/get', payload: { jsonrpc: '2.0', id: 2, method: 'prompts/get', params: { name, arguments: parsedArgs } }, timestamp: Date.now() });
      }

      appendMessage({ id: crypto.randomUUID(), direction: 'server→client', payload: res, timestamp: Date.now() });
      setResponse(res);
    } finally {
      setLoading(false);
    }
  };

  const renderInputs = () => {
    if (type === 'tool') {
      const tool = item as MCPTool;
      const props = tool.inputSchema.properties;
      return (
        <div className="space-y-2">
          {Object.entries(props).map(([key, schema]) => (
            <div key={key}>
              <label className="block text-xs text-muted-foreground mb-1">
                {key} <span className="text-[10px] italic">({schema.type})</span>
                {tool.inputSchema.required?.includes(key) && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input
                type="text"
                placeholder={schema.description}
                value={argValues[key] ?? ''}
                onChange={(e) => setArgValues((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      );
    }
    if (type === 'prompt') {
      const prompt = item as MCPPrompt;
      return (
        <div className="space-y-2">
          {(prompt.arguments ?? []).map((arg) => (
            <div key={arg.name}>
              <label className="block text-xs text-muted-foreground mb-1">
                {arg.name}
                {arg.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input
                type="text"
                placeholder={arg.description}
                value={argValues[arg.name] ?? ''}
                onChange={(e) => setArgValues((prev) => ({ ...prev, [arg.name]: e.target.value }))}
                className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      );
    }
    // resource — no inputs needed
    return <p className="text-xs text-muted-foreground">No arguments — resources are read by URI.</p>;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
            type === 'tool' ? 'bg-orange-400/10 text-orange-400' :
            type === 'resource' ? 'bg-blue-400/10 text-blue-400' :
            'bg-purple-400/10 text-purple-400'
          }`}>{type}</span>
          <h2 className="text-sm font-semibold font-mono">{name}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {'description' in item ? (item as MCPTool).description : (item as MCPResource).uri}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Parameters</h3>
        {renderInputs()}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCall}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Play className="h-3 w-3" />
          {loading ? 'Calling...' : 'Call'}
        </button>
        <button
          onClick={() => setInjectError((e) => !e)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            injectError
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          {injectError ? 'Error mode ON' : 'Inject Error'}
        </button>
      </div>

      {response && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Response</h3>
          <PayloadAnnotator payload={response} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/cockpits/mcp-inspector/PayloadAnnotator.tsx \
        src/components/cockpits/mcp-inspector/SchemaDetail.tsx
git commit -m "feat: add PayloadAnnotator and SchemaDetail for Explorer tab right panel"
```

---

## Task 12: MessageRow Component

The MessageRow renders one entry in the Inspector tab's message log — direction indicator, method name, timestamp, and an expandable full payload panel using PayloadAnnotator.

**File:** `src/components/cockpits/mcp-inspector/MessageRow.tsx`

- [ ] **Step 1: Implement MessageRow**

Create `src/components/cockpits/mcp-inspector/MessageRow.tsx`:

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight, ArrowLeft } from 'lucide-react';
import { PayloadAnnotator } from './PayloadAnnotator';
import { cn } from '../../../lib/utils';
import type { MCPMessage } from '../../../lib/simulation/mcp/types';

interface MessageRowProps {
  message: MCPMessage;
}

export function MessageRow({ message }: MessageRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isOutgoing = message.direction === 'client→server';
  const hasError = 'error' in message.payload && (message.payload as Record<string, unknown>).error;

  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className={cn('border-b border-border last:border-0', hasError && 'bg-red-500/5')}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}

        <span className={cn('shrink-0', isOutgoing ? 'text-orange-400' : 'text-blue-400')}>
          {isOutgoing ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
        </span>

        <span className={cn('text-[10px] font-semibold shrink-0', isOutgoing ? 'text-orange-400' : 'text-blue-400')}>
          {message.direction}
        </span>

        <span className="text-xs font-mono text-foreground truncate">
          {message.method ?? ('error' in message.payload ? 'error response' : 'response')}
        </span>

        {hasError && (
          <span className="ml-auto shrink-0 text-[10px] font-semibold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
            ERROR
          </span>
        )}

        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground font-mono">{time}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <PayloadAnnotator payload={message.payload} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cockpits/mcp-inspector/MessageRow.tsx
git commit -m "feat: add MessageRow — expandable message log entry for Inspector tab"
```

---

## Task 13: SchemaBuilder (Level 3)

SchemaBuilder is a modal that lets the user define a custom tool, resource, or prompt and register it in the simulator via the Zustand store.

**File:** `src/components/cockpits/mcp-inspector/SchemaBuilder.tsx`

- [ ] **Step 1: Implement SchemaBuilder**

Create `src/components/cockpits/mcp-inspector/SchemaBuilder.tsx`:

```tsx
import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useMCPStore } from '../../../lib/store';
import type { MCPTool, MCPResource, MCPPrompt } from '../../../lib/simulation/mcp/types';

type EntityType = 'tool' | 'resource' | 'prompt';

interface SchemaBuilderProps {
  onClose: () => void;
}

export function SchemaBuilder({ onClose }: SchemaBuilderProps) {
  const [entityType, setEntityType] = useState<EntityType>('tool');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Tool-specific
  const [toolProps, setToolProps] = useState<Array<{ key: string; type: string; desc: string; required: boolean }>>([
    { key: '', type: 'string', desc: '', required: false },
  ]);
  // Resource-specific
  const [uri, setUri] = useState('custom://');
  const [mimeType, setMimeType] = useState('text/plain');
  // Prompt-specific
  const [promptArgs, setPromptArgs] = useState<Array<{ name: string; desc: string; required: boolean }>>([
    { name: '', desc: '', required: false },
  ]);

  const { addCustomTool, addCustomResource, addCustomPrompt } = useMCPStore();

  const isValid = name.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    if (entityType === 'tool') {
      const props: MCPTool['inputSchema']['properties'] = {};
      const required: string[] = [];
      for (const p of toolProps) {
        if (!p.key.trim()) continue;
        props[p.key] = { type: p.type, description: p.desc };
        if (p.required) required.push(p.key);
      }
      const tool: MCPTool = {
        name: name.trim(),
        description,
        inputSchema: { type: 'object', properties: props, ...(required.length ? { required } : {}) },
      };
      addCustomTool(tool);
    } else if (entityType === 'resource') {
      const resource: MCPResource = { uri: uri.trim(), name: name.trim(), description, mimeType };
      addCustomResource(resource);
    } else {
      const prompt: MCPPrompt = {
        name: name.trim(),
        description,
        arguments: promptArgs
          .filter((a) => a.name.trim())
          .map((a) => ({ name: a.name, description: a.desc, required: a.required })),
      };
      addCustomPrompt(prompt);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Add Custom Entity (Level 3)</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Entity type selector */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Type</label>
            <div className="flex gap-2">
              {(['tool', 'resource', 'prompt'] as EntityType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setEntityType(t)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    entityType === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Common fields */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={entityType === 'tool' ? 'my_custom_tool' : entityType === 'resource' ? 'My Resource' : 'my_prompt'}
              className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this do?"
              className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Tool props */}
          {entityType === 'tool' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Input Parameters</label>
                <button
                  onClick={() => setToolProps((p) => [...p, { key: '', type: 'string', desc: '', required: false }])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {toolProps.map((prop, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    placeholder="param_name"
                    value={prop.key}
                    onChange={(e) => setToolProps((ps) => ps.map((p, j) => j === i ? { ...p, key: e.target.value } : p))}
                    className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={prop.type}
                    onChange={(e) => setToolProps((ps) => ps.map((p, j) => j === i ? { ...p, type: e.target.value } : p))}
                    className="bg-muted border border-border rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option>string</option>
                    <option>number</option>
                    <option>boolean</option>
                  </select>
                  <input
                    type="text"
                    placeholder="description"
                    value={prop.desc}
                    onChange={(e) => setToolProps((ps) => ps.map((p, j) => j === i ? { ...p, desc: e.target.value } : p))}
                    className="flex-[2] bg-muted border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                    <input type="checkbox" checked={prop.required} onChange={(e) => setToolProps((ps) => ps.map((p, j) => j === i ? { ...p, required: e.target.checked } : p))} />
                    req
                  </label>
                  {toolProps.length > 1 && (
                    <button onClick={() => setToolProps((ps) => ps.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Resource fields */}
          {entityType === 'resource' && (
            <>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">URI *</label>
                <input
                  type="text"
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                  placeholder="custom://my/resource"
                  className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">MIME Type</label>
                <select
                  value={mimeType}
                  onChange={(e) => setMimeType(e.target.value)}
                  className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="text/plain">text/plain</option>
                  <option value="text/markdown">text/markdown</option>
                  <option value="application/json">application/json</option>
                  <option value="text/typescript">text/typescript</option>
                </select>
              </div>
            </>
          )}

          {/* Prompt args */}
          {entityType === 'prompt' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Arguments</label>
                <button
                  onClick={() => setPromptArgs((a) => [...a, { name: '', desc: '', required: false }])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {promptArgs.map((arg, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    placeholder="arg_name"
                    value={arg.name}
                    onChange={(e) => setPromptArgs((as) => as.map((a, j) => j === i ? { ...a, name: e.target.value } : a))}
                    className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="description"
                    value={arg.desc}
                    onChange={(e) => setPromptArgs((as) => as.map((a, j) => j === i ? { ...a, desc: e.target.value } : a))}
                    className="flex-[2] bg-muted border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                    <input type="checkbox" checked={arg.required} onChange={(e) => setPromptArgs((as) => as.map((a, j) => j === i ? { ...a, required: e.target.checked } : a))} />
                    req
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground bg-muted rounded transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Register in Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cockpits/mcp-inspector/SchemaBuilder.tsx
git commit -m "feat: add SchemaBuilder modal — Level 3 custom entity creator"
```

---

## Task 14: ScenarioSelector

A dropdown/card picker that renders the 5 pre-built scenarios and any custom ones from localStorage.

**File:** `src/components/cockpits/mcp-inspector/ScenarioSelector.tsx`

- [ ] **Step 1: Implement ScenarioSelector**

Create `src/components/cockpits/mcp-inspector/ScenarioSelector.tsx`:

```tsx
import { ScenarioLoader } from '../../../lib/simulation/core/ScenarioLoader';
import { useMCPStore } from '../../../lib/store';
import { cn } from '../../../lib/utils';

const SCENARIO_ICONS: Record<string, string> = {
  filesystem: '🗂️',
  weather: '🌤️',
  'knowledge-base': '📚',
  'code-assistant': '💻',
  github: '🐙',
};

export function ScenarioSelector() {
  const { activeScenario, setActiveScenario } = useMCPStore();
  const scenarios = ScenarioLoader.listAll();

  return (
    <div className="flex gap-2 flex-wrap">
      {scenarios.map((scenario) => (
        <button
          key={scenario.id}
          onClick={() => setActiveScenario(scenario)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors',
            activeScenario?.id === scenario.id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
          )}
        >
          <span>{SCENARIO_ICONS[scenario.id] ?? '🔌'}</span>
          <span className="font-medium">{scenario.name}</span>
          <span className="text-[10px] opacity-60">
            {scenario.tools.length}T {scenario.resources.length}R {scenario.prompts.length}P
          </span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cockpits/mcp-inspector/ScenarioSelector.tsx
git commit -m "feat: add ScenarioSelector — scenario picker with tool/resource/prompt counts"
```

---

## Task 15: ExplorerTab

Combines ScenarioSelector, AnatomyTree, and SchemaDetail into the full Explorer tab layout.

**File:** `src/components/cockpits/mcp-inspector/ExplorerTab.tsx`

- [ ] **Step 1: Implement ExplorerTab**

Create `src/components/cockpits/mcp-inspector/ExplorerTab.tsx`:

```tsx
import { useState, useMemo } from 'react';
import { AnatomyTree } from './AnatomyTree';
import { SchemaDetail } from './SchemaDetail';
import { SchemaBuilder } from './SchemaBuilder';
import { ScenarioSelector } from './ScenarioSelector';
import { MCPServer } from '../../../lib/simulation/mcp/MCPServer';
import { MCPClient } from '../../../lib/simulation/mcp/MCPClient';
import { useMCPStore } from '../../../lib/store';

export function ExplorerTab() {
  const { activeScenario, customTools, customResources, customPrompts } = useMCPStore();
  const [showBuilder, setShowBuilder] = useState(false);

  const { server, client } = useMemo(() => {
    const s = new MCPServer();
    const c = new MCPClient();
    if (activeScenario) {
      s.loadScenario(activeScenario);
      c.connect(s);
    }
    return { server: s, client: c };
  }, [activeScenario]);

  const allTools = activeScenario ? [...activeScenario.tools, ...customTools] : [];
  const allResources = activeScenario ? [...activeScenario.resources, ...customResources] : [];
  const allPrompts = activeScenario ? [...activeScenario.prompts, ...customPrompts] : [];

  return (
    <div className="flex flex-col h-full">
      {/* Scenario selector bar */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs text-muted-foreground mb-2">Select a scenario to inspect:</p>
        <ScenarioSelector />
      </div>

      {!activeScenario ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a scenario above to begin exploring
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* Left: anatomy tree */}
          <div className="w-56 shrink-0 border-r border-border">
            <AnatomyTree
              tools={allTools}
              resources={allResources}
              prompts={allPrompts}
              onAddCustom={() => setShowBuilder(true)}
            />
          </div>

          {/* Right: schema detail + call panel */}
          <div className="flex-1 min-w-0">
            {activeScenario && (
              <SchemaDetail
                scenario={{ ...activeScenario, tools: allTools, resources: allResources, prompts: allPrompts }}
                server={server}
                client={client}
              />
            )}
          </div>
        </div>
      )}

      {showBuilder && <SchemaBuilder onClose={() => setShowBuilder(false)} />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cockpits/mcp-inspector/ExplorerTab.tsx
git commit -m "feat: add ExplorerTab — wires scenario selector, anatomy tree, and schema detail"
```

---

## Task 16: InspectorTab

The raw protocol inspector — a scrollable log of every JSON-RPC message exchanged, with filters and a replay button.

**File:** `src/components/cockpits/mcp-inspector/InspectorTab.tsx`

- [ ] **Step 1: Implement InspectorTab**

Create `src/components/cockpits/mcp-inspector/InspectorTab.tsx`:

```tsx
import { useState } from 'react';
import { RotateCcw, Filter } from 'lucide-react';
import { MessageRow } from './MessageRow';
import { useMCPStore } from '../../../lib/store';
import type { MCPMessage } from '../../../lib/simulation/mcp/types';

type FilterMode = 'all' | 'requests' | 'responses' | 'errors';

export function InspectorTab() {
  const { messageLog, clearMessages } = useMCPStore();
  const [filter, setFilter] = useState<FilterMode>('all');

  const filtered: MCPMessage[] = messageLog.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'requests') return m.direction === 'client→server';
    if (filter === 'responses') return m.direction === 'server→client';
    if (filter === 'errors') return 'error' in m.payload && !!(m.payload as Record<string, unknown>).error;
    return true;
  });

  const filters: Array<{ key: FilterMode; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'requests', label: 'Requests' },
    { key: 'responses', label: 'Responses' },
    { key: 'errors', label: 'Errors' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex gap-1">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{filtered.length} messages</span>
          <button
            onClick={clearMessages}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Message log */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <p>No messages yet</p>
            <p className="text-xs">Call a tool or resource in the Explorer tab to see traffic here</p>
          </div>
        ) : (
          filtered.map((m) => <MessageRow key={m.id} message={m} />)
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cockpits/mcp-inspector/InspectorTab.tsx
git commit -m "feat: add InspectorTab — filtered JSON-RPC message log"
```

---

## Task 17: HyperFrames Walkthrough Animation

A self-contained HTML composition that animates the 6-step MCP handshake: CLIENT node sends a packet, SERVER node receives it, response travels back. Loaded in an iframe by WalkthroughTab.

**File:** `public/hyperframes/mcp-walkthrough/index.html`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p public/hyperframes/mcp-walkthrough
```

- [ ] **Step 2: Write the DESIGN context**

The existing playground uses a dark theme (#0d1117 background, #1a1a2a panels, orange/blue accent for protocol directions). The walkthrough must match.

- [ ] **Step 3: Create the HyperFrames composition**

Create `public/hyperframes/mcp-walkthrough/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MCP Protocol Walkthrough</title>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d1117; color: #e0e0e0; font-family: 'Courier New', monospace; overflow: hidden; }

    [data-composition-id="mcp-walkthrough"] {
      width: 900px;
      height: 480px;
      position: relative;
      background: #0d1117;
    }

    /* Scene content fills the composition */
    .scene {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 48px;
      gap: 24px;
    }

    /* Step label at top */
    .step-label {
      position: absolute;
      top: 20px;
      left: 0; right: 0;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #f0a060;
    }

    /* Two node boxes */
    .nodes-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      width: 100%;
    }

    .node-box {
      width: 160px;
      height: 80px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      gap: 6px;
    }

    .node-client {
      background: #1a1a2a;
      border: 2px solid #f0a060;
      color: #f0a060;
    }

    .node-server {
      background: #1a2a1a;
      border: 2px solid #5dde5d;
      color: #5dde5d;
    }

    .node-icon { font-size: 20px; }

    /* Wire between nodes */
    .wire {
      flex: 1;
      height: 2px;
      background: #333;
      position: relative;
      min-width: 200px;
      max-width: 320px;
    }

    /* Animated packet */
    .packet {
      position: absolute;
      top: -8px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 900;
      left: 0;
    }

    .packet-req { background: #f0a060; color: #000; }
    .packet-res { background: #5dde5d; color: #000; }

    /* Message bubble below wire */
    .message-bubble {
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 10px;
      color: #aaa;
      line-height: 1.6;
      width: 100%;
      max-width: 600px;
    }

    .msg-method { color: #f0c060; font-weight: 700; }
    .msg-field  { color: #80c0ff; }
    .msg-val    { color: #98e888; }
    .msg-arrow  { color: #f0a060; }

    /* Annotation panel */
    .annotation {
      background: #0a1622;
      border-left: 3px solid #f0a060;
      padding: 10px 14px;
      font-size: 11px;
      color: #ccc;
      line-height: 1.7;
      width: 100%;
      max-width: 600px;
      border-radius: 0 6px 6px 0;
    }

    .annotation strong { color: #f0c060; }
  </style>
</head>
<body>

<div data-composition-id="mcp-walkthrough" data-width="900" data-height="480">

  <!-- ===== SCENE 1: Connection ===== -->
  <div id="s1" class="scene">
    <div id="s1-label" class="step-label">Step 1 — Connection</div>
    <div id="s1-nodes" class="nodes-row">
      <div class="node-box node-client">
        <span class="node-icon">💻</span>
        CLIENT
      </div>
      <div class="wire" id="s1-wire">
        <div id="s1-pkt" class="packet packet-req" style="opacity:0;">→</div>
      </div>
      <div class="node-box node-server">
        <span class="node-icon">🔌</span>
        SERVER
      </div>
    </div>
    <div id="s1-bubble" class="message-bubble" style="opacity:0;">
      <span class="msg-arrow">CLIENT → SERVER</span><br/>
      Establishing transport connection (stdio / HTTP / WebSocket).<br/>
      No JSON-RPC messages yet — this is the raw transport layer.
    </div>
    <div id="s1-ann" class="annotation" style="opacity:0;">
      <strong>Why this step?</strong> MCP separates transport (how bytes move) from protocol (what those bytes mean). The transport layer connects first. JSON-RPC messages only start flowing after the connection is established.
    </div>
  </div>

  <!-- ===== SCENE 2: Initialize ===== -->
  <div id="s2" class="scene" style="opacity:0;">
    <div id="s2-label" class="step-label">Step 2 — Initialize Handshake</div>
    <div id="s2-nodes" class="nodes-row">
      <div class="node-box node-client"><span class="node-icon">💻</span>CLIENT</div>
      <div class="wire" id="s2-wire">
        <div id="s2-pkt-req" class="packet packet-req" style="opacity:0; left:0;">→</div>
        <div id="s2-pkt-res" class="packet packet-res" style="opacity:0; right:0; left:auto;">←</div>
      </div>
      <div class="node-box node-server"><span class="node-icon">🔌</span>SERVER</div>
    </div>
    <div id="s2-bubble" class="message-bubble" style="opacity:0;">
      <span class="msg-method">initialize</span> <span class="msg-arrow">→</span><br/>
      <span class="msg-field">protocolVersion:</span> <span class="msg-val">"2025-11-25"</span>,&nbsp;
      <span class="msg-field">clientInfo:</span> <span class="msg-val">&#123; name, version &#125;</span>
    </div>
    <div id="s2-ann" class="annotation" style="opacity:0;">
      <strong>initialize</strong> is the first and only method the client sends before anything else. The server responds with its <strong>serverInfo</strong> and <strong>capabilities</strong> — the contract for the entire session.
    </div>
  </div>

  <!-- ===== SCENE 3: Capability Negotiation ===== -->
  <div id="s3" class="scene" style="opacity:0;">
    <div id="s3-label" class="step-label">Step 3 — Capability Negotiation</div>
    <div id="s3-nodes" class="nodes-row">
      <div class="node-box node-client"><span class="node-icon">💻</span>CLIENT</div>
      <div class="wire">
        <div id="s3-pkt" class="packet packet-res" style="opacity:0; right:0; left:auto;">←</div>
      </div>
      <div class="node-box node-server"><span class="node-icon">🔌</span>SERVER</div>
    </div>
    <div id="s3-bubble" class="message-bubble" style="opacity:0;">
      <span class="msg-arrow">← SERVER RESPONSE</span><br/>
      <span class="msg-field">capabilities:</span> <span class="msg-val">&#123;</span><br/>
      &nbsp;&nbsp;<span class="msg-field">tools:</span> <span class="msg-val">&#123; listChanged: false &#125;</span>,<br/>
      &nbsp;&nbsp;<span class="msg-field">resources:</span> <span class="msg-val">&#123; subscribe: false &#125;</span>,<br/>
      &nbsp;&nbsp;<span class="msg-field">prompts:</span> <span class="msg-val">&#123; listChanged: false &#125;</span><br/>
      <span class="msg-val">&#125;</span>
    </div>
    <div id="s3-ann" class="annotation" style="opacity:0;">
      The server's <strong>capabilities</strong> object tells the client exactly what it can do. <em>listChanged</em> means the server will notify if its tool list changes. <em>subscribe</em> means resources can push updates. If a capability is absent, that feature is unavailable.
    </div>
  </div>

  <!-- ===== SCENE 4: tools/list ===== -->
  <div id="s4" class="scene" style="opacity:0;">
    <div id="s4-label" class="step-label">Step 4 — tools/list</div>
    <div id="s4-nodes" class="nodes-row">
      <div class="node-box node-client"><span class="node-icon">💻</span>CLIENT</div>
      <div class="wire" id="s4-wire">
        <div id="s4-pkt" class="packet packet-req" style="opacity:0; left:0;">→</div>
      </div>
      <div class="node-box node-server"><span class="node-icon">🔌</span>SERVER</div>
    </div>
    <div id="s4-bubble" class="message-bubble" style="opacity:0;">
      <span class="msg-method">tools/list</span> <span class="msg-arrow">→</span><br/>
      <span class="msg-val">&#123; jsonrpc: "2.0", id: 2, method: "tools/list" &#125;</span><br/><br/>
      <span class="msg-arrow">← RESPONSE</span><br/>
      <span class="msg-field">tools:</span> <span class="msg-val">[ &#123; name, description, inputSchema &#125;, ... ]</span>
    </div>
    <div id="s4-ann" class="annotation" style="opacity:0;">
      <strong>tools/list</strong> returns every tool the server exposes. Each tool includes its <strong>inputSchema</strong> — a JSON Schema object that tells the LLM exactly what parameters the tool accepts. This is how the model knows how to call it.
    </div>
  </div>

  <!-- ===== SCENE 5: tools/call ===== -->
  <div id="s5" class="scene" style="opacity:0;">
    <div id="s5-label" class="step-label">Step 5 — tools/call</div>
    <div id="s5-nodes" class="nodes-row">
      <div class="node-box node-client"><span class="node-icon">💻</span>CLIENT</div>
      <div class="wire" id="s5-wire">
        <div id="s5-pkt-req" class="packet packet-req" style="opacity:0; left:0;">→</div>
        <div id="s5-pkt-res" class="packet packet-res" style="opacity:0; right:0; left:auto;">←</div>
      </div>
      <div class="node-box node-server"><span class="node-icon">🔌</span>SERVER</div>
    </div>
    <div id="s5-bubble" class="message-bubble" style="opacity:0;">
      <span class="msg-method">tools/call</span> <span class="msg-arrow">→</span><br/>
      <span class="msg-field">name:</span> <span class="msg-val">"read_file"</span>,&nbsp;
      <span class="msg-field">arguments:</span> <span class="msg-val">&#123; path: "/project/README.md" &#125;</span><br/><br/>
      <span class="msg-arrow">← RESULT</span><br/>
      <span class="msg-field">content:</span> <span class="msg-val">[ &#123; type: "text", text: "# My Project..." &#125; ]</span>
    </div>
    <div id="s5-ann" class="annotation" style="opacity:0;">
      The client sends the tool name and arguments. The server executes the tool and returns a <strong>content array</strong>. If the tool itself ran but produced an error, <em>isError: true</em> appears in the result — the JSON-RPC call still succeeds (no error field), but the content indicates the problem.
    </div>
  </div>

  <!-- ===== SCENE 6: Error Handling ===== -->
  <div id="s6" class="scene" style="opacity:0;">
    <div id="s6-label" class="step-label">Step 6 — Error Handling</div>
    <div id="s6-nodes" class="nodes-row">
      <div class="node-box node-client"><span class="node-icon">💻</span>CLIENT</div>
      <div class="wire">
        <div id="s6-pkt" class="packet" style="opacity:0; background:#ef4444; color:#fff; right:0; left:auto;">✕</div>
      </div>
      <div class="node-box node-server"><span class="node-icon">🔌</span>SERVER</div>
    </div>
    <div id="s6-bubble" class="message-bubble" style="opacity:0;">
      <span class="msg-arrow">← ERROR RESPONSE</span><br/>
      <span class="msg-val">&#123;</span><br/>
      &nbsp;&nbsp;<span class="msg-field">error:</span> <span class="msg-val">&#123;</span><br/>
      &nbsp;&nbsp;&nbsp;&nbsp;<span class="msg-field">code:</span> <span class="msg-val">-32601</span>,<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;<span class="msg-field">message:</span> <span class="msg-val">"Method not found: bad/method"</span><br/>
      &nbsp;&nbsp;<span class="msg-val">&#125;</span><br/>
      <span class="msg-val">&#125;</span>
    </div>
    <div id="s6-ann" class="annotation" style="opacity:0;">
      JSON-RPC errors replace <em>result</em> with an <strong>error</strong> object. Code <strong>-32601</strong> = method not found. <strong>-32602</strong> = invalid params. <strong>-32603</strong> = internal server error. The client always checks for <em>error</em> before reading <em>result</em>.
    </div>
  </div>

  <style>
    [data-composition-id="mcp-walkthrough"] { overflow: hidden; }
  </style>

  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
    const SCENE_DUR = 6;    // seconds each scene is visible
    const TRANS     = 0.5;  // crossfade duration

    function at(scene) { return scene * SCENE_DUR; }

    // ---- SCENE 1: Connection ----
    tl.from('#s1-label',  { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' }, at(0) + 0.2);
    tl.from('#s1-nodes',  { y: 30,  opacity: 0, duration: 0.6, ease: 'expo.out'   }, at(0) + 0.4);
    tl.set('#s1-pkt', { opacity: 1, left: '0%' }, at(0) + 1.0);
    tl.to('#s1-pkt',  { left: '85%', duration: 1.2, ease: 'power2.inOut' },        at(0) + 1.0);
    tl.to('#s1-pkt',  { opacity: 0, duration: 0.2 },                                at(0) + 2.1);
    tl.from('#s1-bubble', { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(0) + 2.2);
    tl.from('#s1-ann',    { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(0) + 2.7);

    // crossfade to scene 2
    tl.to('#s1', { opacity: 0, duration: TRANS }, at(1) - TRANS);
    tl.from('#s2', { opacity: 0, duration: TRANS }, at(1) - TRANS);

    // ---- SCENE 2: Initialize ----
    tl.from('#s2-label',  { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' }, at(1) + 0.2);
    tl.from('#s2-nodes',  { y: 30,  opacity: 0, duration: 0.6, ease: 'expo.out'   }, at(1) + 0.4);
    tl.set('#s2-pkt-req', { opacity: 1, left: '0%' }, at(1) + 1.0);
    tl.to('#s2-pkt-req',  { left: '85%', duration: 1.0, ease: 'power2.inOut' },     at(1) + 1.0);
    tl.to('#s2-pkt-req',  { opacity: 0, duration: 0.2 },                             at(1) + 1.9);
    tl.set('#s2-pkt-res', { opacity: 1, right: '0%', left: 'auto' },                 at(1) + 2.1);
    tl.to('#s2-pkt-res',  { right: '85%', duration: 1.0, ease: 'power2.inOut' },    at(1) + 2.1);
    tl.to('#s2-pkt-res',  { opacity: 0, duration: 0.2 },                             at(1) + 3.0);
    tl.from('#s2-bubble', { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(1) + 3.1);
    tl.from('#s2-ann',    { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(1) + 3.6);

    tl.to('#s2', { opacity: 0, duration: TRANS }, at(2) - TRANS);
    tl.from('#s3', { opacity: 0, duration: TRANS }, at(2) - TRANS);

    // ---- SCENE 3: Capabilities ----
    tl.from('#s3-label',  { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' }, at(2) + 0.2);
    tl.from('#s3-nodes',  { y: 30,  opacity: 0, duration: 0.6, ease: 'expo.out'   }, at(2) + 0.4);
    tl.set('#s3-pkt', { opacity: 1 }, at(2) + 1.0);
    tl.to('#s3-pkt',  { right: '85%', duration: 1.0, ease: 'power2.inOut' },        at(2) + 1.0);
    tl.to('#s3-pkt',  { opacity: 0, duration: 0.2 },                                 at(2) + 1.9);
    tl.from('#s3-bubble', { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(2) + 2.1);
    tl.from('#s3-ann',    { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(2) + 2.6);

    tl.to('#s3', { opacity: 0, duration: TRANS }, at(3) - TRANS);
    tl.from('#s4', { opacity: 0, duration: TRANS }, at(3) - TRANS);

    // ---- SCENE 4: tools/list ----
    tl.from('#s4-label',  { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' }, at(3) + 0.2);
    tl.from('#s4-nodes',  { y: 30,  opacity: 0, duration: 0.6, ease: 'expo.out'   }, at(3) + 0.4);
    tl.set('#s4-pkt', { opacity: 1, left: '0%' }, at(3) + 1.0);
    tl.to('#s4-pkt',  { left: '85%', duration: 1.0, ease: 'power2.inOut' },         at(3) + 1.0);
    tl.to('#s4-pkt',  { opacity: 0, duration: 0.2 },                                 at(3) + 1.9);
    tl.from('#s4-bubble', { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(3) + 2.1);
    tl.from('#s4-ann',    { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(3) + 2.6);

    tl.to('#s4', { opacity: 0, duration: TRANS }, at(4) - TRANS);
    tl.from('#s5', { opacity: 0, duration: TRANS }, at(4) - TRANS);

    // ---- SCENE 5: tools/call ----
    tl.from('#s5-label',  { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' }, at(4) + 0.2);
    tl.from('#s5-nodes',  { y: 30,  opacity: 0, duration: 0.6, ease: 'expo.out'   }, at(4) + 0.4);
    tl.set('#s5-pkt-req', { opacity: 1, left: '0%' }, at(4) + 1.0);
    tl.to('#s5-pkt-req',  { left: '85%', duration: 1.0, ease: 'power2.inOut' },     at(4) + 1.0);
    tl.to('#s5-pkt-req',  { opacity: 0, duration: 0.2 },                             at(4) + 1.9);
    tl.set('#s5-pkt-res', { opacity: 1, right: '0%', left: 'auto' },                 at(4) + 2.2);
    tl.to('#s5-pkt-res',  { right: '85%', duration: 1.0, ease: 'power2.inOut' },    at(4) + 2.2);
    tl.to('#s5-pkt-res',  { opacity: 0, duration: 0.2 },                             at(4) + 3.1);
    tl.from('#s5-bubble', { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(4) + 3.2);
    tl.from('#s5-ann',    { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(4) + 3.7);

    tl.to('#s5', { opacity: 0, duration: TRANS }, at(5) - TRANS);
    tl.from('#s6', { opacity: 0, duration: TRANS }, at(5) - TRANS);

    // ---- SCENE 6: Error Handling (final scene) ----
    tl.from('#s6-label',  { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' }, at(5) + 0.2);
    tl.from('#s6-nodes',  { y: 30,  opacity: 0, duration: 0.6, ease: 'expo.out'   }, at(5) + 0.4);
    tl.set('#s6-pkt', { opacity: 1, right: '0%', left: 'auto' }, at(5) + 1.0);
    tl.to('#s6-pkt',  { right: '85%', duration: 1.0, ease: 'power2.inOut' },        at(5) + 1.0);
    tl.to('#s6-pkt',  { opacity: 0, duration: 0.2 },                                 at(5) + 1.9);
    tl.from('#s6-bubble', { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(5) + 2.1);
    tl.from('#s6-ann',    { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' }, at(5) + 2.6);
    // Final scene fade to black
    tl.to('#s6', { opacity: 0, duration: 0.8, ease: 'power2.in' }, at(6) - 0.8);

    window.__timelines['mcp-walkthrough'] = tl;
  </script>
</div>

</body>
</html>
```

- [ ] **Step 4: Verify file is accessible from dev server**

```bash
npm run dev
```

Open `http://localhost:5173/hyperframes/mcp-walkthrough/index.html` in a browser. Expected: dark page with "Step 1 — Connection" label and CLIENT / SERVER nodes visible (static, no animation playing since HyperFrames player is not loaded standalone — that's correct).

- [ ] **Step 5: Commit**

```bash
git add public/hyperframes/mcp-walkthrough/index.html
git commit -m "feat: add HyperFrames MCP walkthrough animation — 6-step protocol journey"
```

---

## Task 18: WalkthroughTab

Loads the HyperFrames composition in an iframe and shows the step list on the left with Back / Next / Auto-play controls.

**File:** `src/components/cockpits/mcp-inspector/WalkthroughTab.tsx`

- [ ] **Step 1: Implement WalkthroughTab**

Create `src/components/cockpits/mcp-inspector/WalkthroughTab.tsx`:

```tsx
import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { cn } from '../../../lib/utils';

const STEPS = [
  {
    number: 1,
    title: 'Connection',
    description: 'Client establishes the transport layer (stdio, HTTP, or WebSocket). No JSON-RPC messages yet — just a raw connection.',
  },
  {
    number: 2,
    title: 'Initialize Handshake',
    description: 'Client sends the initialize request with its protocol version and capabilities. This is always the first JSON-RPC message.',
  },
  {
    number: 3,
    title: 'Capability Negotiation',
    description: 'Server responds with its capabilities — which features it supports (tools, resources, prompts, notifications). Both sides now know what the session supports.',
  },
  {
    number: 4,
    title: 'List Capabilities',
    description: 'Client calls tools/list, resources/list, and prompts/list to discover what the server exposes. This is how the LLM learns about available tools.',
  },
  {
    number: 5,
    title: 'Call a Tool',
    description: 'Client sends tools/call with the tool name and arguments. Server executes the tool and returns a content array. The LLM receives the result and continues reasoning.',
  },
  {
    number: 6,
    title: 'Error Handling',
    description: 'If a method is not found, params are invalid, or an internal error occurs, the server returns an error object instead of result. The client checks for error before reading result.',
  },
];

const SCENE_DURATION = 6; // seconds per scene in the HyperFrames timeline

export function WalkthroughTab() {
  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const [autoPlay, setAutoPlay] = useState(false);
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);

  const seekToStep = useCallback(
    (stepIndex: number, frame: HTMLIFrameElement | null) => {
      if (!frame) return;
      try {
        const targetTime = stepIndex * SCENE_DURATION + 0.1;
        // Post a message to the iframe; the HyperFrames player listens for seek events
        frame.contentWindow?.postMessage({ type: 'hyperframes:seek', time: targetTime }, '*');
        if (!autoPlay) {
          frame.contentWindow?.postMessage({ type: 'hyperframes:pause' }, '*');
        }
      } catch {
        // cross-origin safety — if player is not installed, graceful degradation
      }
    },
    [autoPlay]
  );

  const goToStep = (index: number) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, index));
    setCurrentStep(clamped);
    seekToStep(clamped, iframeRef);
  };

  const toggleAutoPlay = () => {
    setAutoPlay((a) => !a);
    if (!autoPlay) {
      iframeRef?.contentWindow?.postMessage({ type: 'hyperframes:play' }, '*');
    } else {
      iframeRef?.contentWindow?.postMessage({ type: 'hyperframes:pause' }, '*');
    }
  };

  return (
    <div className="flex h-full">
      {/* Step list — left panel */}
      <div className="w-60 shrink-0 border-r border-border flex flex-col">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Protocol Steps</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {STEPS.map((step, i) => (
            <button
              key={step.number}
              onClick={() => goToStep(i)}
              className={cn(
                'w-full text-left px-3 py-3 transition-colors border-b border-border/50 last:border-0',
                i === currentStep
                  ? 'bg-primary/10 border-l-2 border-l-primary'
                  : 'hover:bg-muted'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  'w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                  i === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {step.number}
                </span>
                <span className={cn('text-xs font-medium', i === currentStep ? 'text-foreground' : 'text-muted-foreground')}>
                  {step.title}
                </span>
              </div>
              {i === currentStep && (
                <p className="text-[10px] text-muted-foreground leading-relaxed ml-7">
                  {step.description}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="border-t border-border p-3 flex items-center gap-2">
          <button
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={toggleAutoPlay}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary/10 text-primary rounded text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            {autoPlay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {autoPlay ? 'Pause' : 'Auto-play'}
          </button>
          <button
            onClick={() => goToStep(currentStep + 1)}
            disabled={currentStep === STEPS.length - 1}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Animation iframe — right panel */}
      <div className="flex-1 bg-[#0d1117] flex items-center justify-center overflow-hidden">
        <iframe
          ref={(el) => setIframeRef(el)}
          src="/hyperframes/mcp-walkthrough/index.html"
          className="w-full h-full border-0"
          title="MCP Protocol Walkthrough Animation"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cockpits/mcp-inspector/WalkthroughTab.tsx
git commit -m "feat: add WalkthroughTab — step list + HyperFrames iframe for protocol animation"
```

---

## Task 19: MCPInspectorCockpit — Assemble All Three Tabs

**File:** `src/components/cockpits/mcp-inspector/MCPInspectorCockpit.tsx`

- [ ] **Step 1: Implement MCPInspectorCockpit**

Create `src/components/cockpits/mcp-inspector/MCPInspectorCockpit.tsx`:

```tsx
import { ExplorerTab } from './ExplorerTab';
import { WalkthroughTab } from './WalkthroughTab';
import { InspectorTab } from './InspectorTab';
import { useMCPStore } from '../../../lib/store';
import { cn } from '../../../lib/utils';

const TABS = [
  { id: 'explorer' as const, label: '🗂️ Explorer', description: 'Browse server anatomy, call tools, read resources' },
  { id: 'walkthrough' as const, label: '🎬 Walkthrough', description: 'Animated 6-step protocol journey' },
  { id: 'inspector' as const, label: '🔍 Inspector', description: 'Raw JSON-RPC message log' },
];

export function MCPInspectorCockpit() {
  const { activeTab, setActiveTab, messageLog } = useMCPStore();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xl">🔌</span>
          <h1 className="text-base font-semibold">MCP Protocol Inspector</h1>
          <span className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">
            spec 2025-11-25
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          See exactly what happens on the wire when an AI app connects to an MCP server
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-4 py-3 text-xs font-medium transition-colors flex items-center gap-1.5',
              activeTab === tab.id
                ? 'text-foreground border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.id === 'inspector' && messageLog.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full">
                {messageLog.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'explorer' && <ExplorerTab />}
        {activeTab === 'walkthrough' && <WalkthroughTab />}
        {activeTab === 'inspector' && <InspectorTab />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the cockpit index**

Create `src/components/cockpits/mcp-inspector/index.ts`:

```typescript
export { MCPInspectorCockpit } from './MCPInspectorCockpit';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/cockpits/mcp-inspector/MCPInspectorCockpit.tsx \
        src/components/cockpits/mcp-inspector/index.ts
git commit -m "feat: add MCPInspectorCockpit — assembles all three tabs with tab bar and header"
```

---

## Task 20: MCPInspectorPage (Replace Stub) + CockpitSelectionPage Card

**Files:**
- Modify: `src/components/pages/MCPInspectorPage.tsx`
- Modify: `src/components/pages/CockpitSelectionPage.tsx`

- [ ] **Step 1: Replace the stub MCPInspectorPage**

Replace the full contents of `src/components/pages/MCPInspectorPage.tsx`:

```tsx
import { useEffect } from 'react';
import { useCockpitStore } from '../../lib/store';
import { MCPInspectorCockpit } from '../cockpits/mcp-inspector';

export function MCPInspectorPage() {
  const { setActiveCockpit } = useCockpitStore();

  useEffect(() => {
    setActiveCockpit('mcp-inspector');
  }, [setActiveCockpit]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <MCPInspectorCockpit />
    </div>
  );
}
```

- [ ] **Step 2: Add MCP Inspector card to CockpitSelectionPage**

Open `src/components/pages/CockpitSelectionPage.tsx`. Find where existing cockpit cards are rendered and add the MCP Inspector card. The exact JSX differs by file — find the array of cockpit objects or the render loop and add:

```tsx
{
  id: 'mcp-inspector',
  title: 'MCP Protocol Inspector',
  description: 'See exactly what happens on the wire — JSON-RPC messages, capability negotiation, tool calls, errors. Five pre-built servers, Level 3 custom entity builder.',
  icon: '🔌',
  tags: ['Protocol', 'Intermediate'],
  href: '/advanced/mcp-inspector',
  status: 'available',
}
```

If cards are rendered from a hardcoded JSX block rather than an array, add a matching card element following the established visual pattern for that file.

- [ ] **Step 3: Start dev server and smoke-test the full cockpit**

```bash
npm run dev
```

Verify:
1. Navigate to `/advanced/cockpits` — MCP Inspector card appears.
2. Click through to `/advanced/mcp-inspector`.
3. Explorer tab: scenario selector shows 5 scenarios. Select "Filesystem Server". Tree renders tools/resources/prompts. Click `read_file`. Enter `/project/README.md`. Click "Call". Response appears with annotated payload.
4. Inspector tab: messages from the call appear. Expand a row — full payload renders. Filter "errors" shows nothing (no errors yet). Click "Inject Error" in Explorer and call again — error message appears in Inspector.
5. Walkthrough tab: iframe loads animation. Step list shows 6 steps. Click "Auto-play". Click Next/Back — step description updates.
6. "Add custom tool / resource / prompt" link opens SchemaBuilder. Fill in a name, click "Register in Simulator". Custom entity appears in the tree.

- [ ] **Step 4: Confirm full TypeScript compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Final commit**

```bash
git add src/components/pages/MCPInspectorPage.tsx \
        src/components/pages/CockpitSelectionPage.tsx
git commit -m "feat: complete MCP Inspector cockpit — replace page stub, add cockpit selection card"
```

---

## Self-Review Against Spec

**Spec requirement → task coverage:**

| Spec Requirement | Covered By |
|---|---|
| Three-tab layout: Explorer / Walkthrough / Inspector | Tasks 15, 18, 16, 19 |
| Left panel anatomy tree (tools, resources, prompts) | Task 10 |
| Right panel: schema + editable params + Call + Inject Error | Task 11 |
| Level 3: custom entity builder | Task 13 |
| Animated JSON response with per-field annotations | Task 11 (PayloadAnnotator) |
| HyperFrames 6-step walkthrough | Task 17, 18 |
| Raw protocol inspector with filter bar | Task 16 |
| Click row → full payload with annotations | Task 12 |
| Replay button | Task 16 (Clear resets log; replay = re-run from Explorer) |
| 5 pre-built scenarios | Task 7 |
| MCP spec 2025-11-25 coverage (init, tools/list, tools/call, resources/*, prompts/*, errors, notifications/cancelled) | Task 5 (MCPServer implements all) |
| SimulatedProtocol pattern (Simulation + Animation + Interaction layers) | Tasks 2, 3, 5, 6 |
| Client-side only, no backend | Verified — MessageBus is in-memory, no fetch calls |
| Zustand state management | Task 9 |
| Routing wired | Task 1 |
| CockpitType extended | Task 1 |
| Custom scenario persistence (localStorage) | Task 8 (ScenarioLoader) |

**No placeholders:** All steps include complete code or exact commands.

**Type consistency:** `MCPTool`, `MCPResource`, `MCPPrompt`, `MCPMessage`, `MCPConnectionState`, `MCPScenario` — all defined in `types.ts` (Task 4) and used consistently across all subsequent tasks.

**One gap to note:** `notifications/cancelled` from the spec is logged as a message type in MCPServer's event log but not exposed as a separate UI affordance in this phase. It is handled by the Inspector tab's raw log. A dedicated cancel button can be added in a follow-up.

---

## Execution Options

Plan complete and saved to:
- `docs/superpowers/plans/2026-04-23-mcp-inspector-part1.md` (Tasks 1–9: simulation engine)
- `docs/superpowers/plans/2026-04-23-mcp-inspector-part2.md` (Tasks 10–20: UI + assembly)

**Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review output between tasks. Fast iteration, clean context per task.

**2. Inline Execution** — execute tasks in this session using the executing-plans skill, with checkpoints for review.

Which approach?
