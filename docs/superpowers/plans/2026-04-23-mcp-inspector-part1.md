# MCP Protocol Inspector — Implementation Plan (Part 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Part 2:** `docs/superpowers/plans/2026-04-23-mcp-inspector-part2.md` — UI components, tabs, cockpit assembly.

**Goal:** Build the MCP Protocol Inspector cockpit — a fully interactive, simulation-based, three-tab visualization of the Model Context Protocol (spec 2025-11-25) that teaches users what happens on the wire when an AI app connects to an MCP server.

**Architecture:** Three-layer SimulatedProtocol engine running entirely in-browser. Simulation Layer = MCPServer state machine + MCPClient + MessageBus (no network, no API keys). Animation Layer = HyperFrames (Walkthrough tab) + GSAP (in-page highlights). Interaction Layer = three levels: watch, edit-and-call, build-custom. All state in a Zustand slice added to `src/lib/store.ts`.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui, Zustand, Vitest, HyperFrames, GSAP, React Router v6

---

## File Map

### Create
```
src/lib/simulation/core/SimulatedProtocol.ts
src/lib/simulation/core/MessageBus.ts
src/lib/simulation/core/ScenarioLoader.ts
src/lib/simulation/mcp/types.ts
src/lib/simulation/mcp/MCPServer.ts
src/lib/simulation/mcp/MCPClient.ts
src/lib/simulation/mcp/scenarios/filesystem.ts
src/lib/simulation/mcp/scenarios/weather.ts
src/lib/simulation/mcp/scenarios/knowledgeBase.ts
src/lib/simulation/mcp/scenarios/codeAssistant.ts
src/lib/simulation/mcp/scenarios/github.ts
src/lib/simulation/mcp/scenarios/index.ts
src/lib/simulation/mcp/__tests__/MessageBus.test.ts
src/lib/simulation/mcp/__tests__/MCPServer.test.ts
src/lib/simulation/mcp/__tests__/MCPClient.test.ts
src/components/pages/MCPInspectorPage.tsx        ← stub only (Part 1)
```

### Modify
```
src/types/index.ts                              ← add 'mcp-inspector' to CockpitType
src/App.tsx                                     ← add /advanced/mcp-inspector route
src/lib/store.ts                                ← add useMCPStore
```

---

## Task 1: Wire Types, Route, and Page Stub

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/App.tsx`
- Create: `src/components/pages/MCPInspectorPage.tsx`

- [ ] **Step 1: Add `mcp-inspector` to CockpitType**

Open `src/types/index.ts`. Find the `CockpitType` union and add the new value:

```typescript
// Before:
export type CockpitType = 'prompt-reality' | 'retrieval-reality' | 'cost-reality' | 'agent-reality';

// After:
export type CockpitType = 'prompt-reality' | 'retrieval-reality' | 'cost-reality' | 'agent-reality' | 'mcp-inspector';
```

- [ ] **Step 2: Add the route in App.tsx**

Open `src/App.tsx`. Find the block of `<Route>` elements inside the advanced section (near `/advanced/prompt-reality`) and add:

```tsx
<Route
  path="/advanced/mcp-inspector"
  element={
    <RouteGuard>
      <MCPInspectorPage />
    </RouteGuard>
  }
/>
```

Add the import at the top of the file alongside the other page imports:

```tsx
import { MCPInspectorPage } from './components/pages/MCPInspectorPage';
```

- [ ] **Step 3: Create the page stub**

Create `src/components/pages/MCPInspectorPage.tsx`:

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCockpitStore } from '../../lib/store';

export function MCPInspectorPage() {
  const navigate = useNavigate();
  const { setActiveCockpit } = useCockpitStore();

  useEffect(() => {
    setActiveCockpit('mcp-inspector');
  }, [setActiveCockpit]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <p className="text-muted-foreground">MCP Inspector — coming soon</p>
    </div>
  );
}
```

- [ ] **Step 4: Verify dev server starts cleanly**

```bash
npm run dev
```

Navigate to `http://localhost:5173/advanced/mcp-inspector`. Expected: page renders without errors (shows "coming soon" text).

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/App.tsx src/components/pages/MCPInspectorPage.tsx
git commit -m "feat: wire mcp-inspector route and page stub"
```

---

## Task 2: MessageBus

**Files:**
- Create: `src/lib/simulation/core/MessageBus.ts`
- Create: `src/lib/simulation/mcp/__tests__/MessageBus.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/simulation/mcp/__tests__/MessageBus.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { MessageBus } from '../../core/MessageBus';

describe('MessageBus', () => {
  it('calls subscribed handler when a message is published', () => {
    const bus = new MessageBus();
    const handler = vi.fn();
    bus.subscribe('test', handler);
    bus.publish('test', { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('does not call handler for a different channel', () => {
    const bus = new MessageBus();
    const handler = vi.fn();
    bus.subscribe('alpha', handler);
    bus.publish('beta', { value: 1 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls multiple handlers on the same channel', () => {
    const bus = new MessageBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.subscribe('ch', h1);
    bus.subscribe('ch', h2);
    bus.publish('ch', 'msg');
    expect(h1).toHaveBeenCalledWith('msg');
    expect(h2).toHaveBeenCalledWith('msg');
  });

  it('unsubscribes cleanly', () => {
    const bus = new MessageBus();
    const handler = vi.fn();
    const unsub = bus.subscribe('ch', handler);
    unsub();
    bus.publish('ch', 'msg');
    expect(handler).not.toHaveBeenCalled();
  });

  it('clear() stops all handlers', () => {
    const bus = new MessageBus();
    const handler = vi.fn();
    bus.subscribe('ch', handler);
    bus.clear();
    bus.publish('ch', 'msg');
    expect(handler).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/lib/simulation/mcp/__tests__/MessageBus.test.ts
```

Expected: FAIL — `Cannot find module '../../core/MessageBus'`

- [ ] **Step 3: Implement MessageBus**

Create `src/lib/simulation/core/MessageBus.ts`:

```typescript
type MessageHandler = (message: unknown) => void;

export class MessageBus {
  private handlers = new Map<string, MessageHandler[]>();

  subscribe(channel: string, handler: MessageHandler): () => void {
    const existing = this.handlers.get(channel) ?? [];
    this.handlers.set(channel, [...existing, handler]);
    return () => {
      const current = this.handlers.get(channel) ?? [];
      this.handlers.set(channel, current.filter((h) => h !== handler));
    };
  }

  publish(channel: string, message: unknown): void {
    const handlers = this.handlers.get(channel) ?? [];
    handlers.forEach((h) => h(message));
  }

  clear(): void {
    this.handlers.clear();
  }
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx vitest run src/lib/simulation/mcp/__tests__/MessageBus.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation/core/MessageBus.ts src/lib/simulation/mcp/__tests__/MessageBus.test.ts
git commit -m "feat: add MessageBus — in-memory pub/sub transport for simulation layer"
```

---

## Task 3: SimulatedProtocol Base Class

**Files:**
- Create: `src/lib/simulation/core/SimulatedProtocol.ts`

No separate test file — this abstract class is tested indirectly through MCPServer tests. The contract is simple enough to verify there.

- [ ] **Step 1: Implement SimulatedProtocol**

Create `src/lib/simulation/core/SimulatedProtocol.ts`:

```typescript
import { MessageBus } from './MessageBus';

export interface ProtocolEvent {
  type: string;
  payload: unknown;
  timestamp: number;
}

export abstract class SimulatedProtocol {
  protected bus: MessageBus;
  protected eventLog: ProtocolEvent[] = [];

  constructor() {
    this.bus = new MessageBus();
  }

  protected emit(type: string, payload: unknown): void {
    const event: ProtocolEvent = { type, payload, timestamp: Date.now() };
    this.eventLog.push(event);
    this.bus.publish(type, event);
  }

  on(eventType: string, handler: (event: ProtocolEvent) => void): () => void {
    return this.bus.subscribe(eventType, handler as (msg: unknown) => void);
  }

  getEventLog(): ProtocolEvent[] {
    return [...this.eventLog];
  }

  clearLog(): void {
    this.eventLog = [];
    this.bus.clear();
  }

  abstract reset(): void;
}
```

- [ ] **Step 2: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to the new files.

- [ ] **Step 3: Commit**

```bash
git add src/lib/simulation/core/SimulatedProtocol.ts
git commit -m "feat: add SimulatedProtocol base class — shared engine for all cockpits"
```

---

## Task 4: MCP Type Definitions

**Files:**
- Create: `src/lib/simulation/mcp/types.ts`

No test file — pure TypeScript type declarations.

- [ ] **Step 1: Write MCP types**

Create `src/lib/simulation/mcp/types.ts`:

```typescript
// JSON-RPC 2.0 envelope types
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

// MCP entity types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
  logging?: Record<string, never>;
}

// Tool call result
export interface MCPToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

// Resource read result
export interface MCPResourceContent {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

// Prompt get result
export interface MCPPromptMessage {
  role: 'user' | 'assistant';
  content: { type: 'text'; text: string };
}

// Scenario definition — everything a SimulatedMCPServer needs
export interface MCPScenario {
  id: string;
  name: string;
  description: string;
  serverInfo: { name: string; version: string };
  capabilities: MCPServerCapabilities;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  toolHandlers: Record<
    string,
    (params: Record<string, unknown>) => MCPToolResult
  >;
  resourceHandlers: Record<string, () => MCPResourceContent>;
  promptHandlers: Record<
    string,
    (args: Record<string, string>) => MCPPromptMessage[]
  >;
}

// Message logged to the Inspector tab
export interface MCPMessage {
  id: string;
  direction: 'client→server' | 'server→client';
  method?: string;
  payload: JSONRPCRequest | JSONRPCResponse;
  timestamp: number;
}

export type MCPConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
```

- [ ] **Step 2: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/simulation/mcp/types.ts
git commit -m "feat: add MCP protocol type definitions (spec 2025-11-25)"
```

---

## Task 5: MCPServer — Full State Machine

**Files:**
- Create: `src/lib/simulation/mcp/MCPServer.ts`
- Create: `src/lib/simulation/mcp/__tests__/MCPServer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/simulation/mcp/__tests__/MCPServer.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MCPServer } from '../MCPServer';
import { filesystemScenario } from '../scenarios/filesystem';

describe('MCPServer', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer();
    server.loadScenario(filesystemScenario);
  });

  describe('initialize', () => {
    it('returns protocolVersion and serverInfo on first call', async () => {
      const res = await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-11-25', clientInfo: { name: 'test', version: '1.0' }, capabilities: {} },
      });
      expect(res.error).toBeUndefined();
      expect((res.result as Record<string, unknown>).protocolVersion).toBe('2025-11-25');
      expect((res.result as Record<string, unknown>).serverInfo).toEqual(filesystemScenario.serverInfo);
    });

    it('returns Not initialized error if tools/list called before initialize', async () => {
      const res = await server.handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
      expect(res.error).toBeDefined();
      expect(res.error?.code).toBe(-32600);
    });
  });

  describe('tools/list', () => {
    it('returns all tools after initialization', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      const res = await server.handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
      expect(res.error).toBeUndefined();
      const tools = (res.result as { tools: unknown[] }).tools;
      expect(tools).toHaveLength(filesystemScenario.tools.length);
      expect(tools[0]).toMatchObject({ name: 'read_file' });
    });
  });

  describe('tools/call', () => {
    it('returns tool result for a valid call', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      const res = await server.handle({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'list_dir', arguments: { path: '/project' } },
      });
      expect(res.error).toBeUndefined();
      const content = (res.result as { content: Array<{ type: string; text: string }> }).content;
      expect(content[0].type).toBe('text');
      expect(content[0].text).toContain('README.md');
    });

    it('returns method-not-found for unknown tool', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      const res = await server.handle({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      });
      expect(res.error).toBeDefined();
      expect(res.error?.code).toBe(-32601);
    });
  });

  describe('resources/list', () => {
    it('returns all resources', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      const res = await server.handle({ jsonrpc: '2.0', id: 5, method: 'resources/list' });
      const resources = (res.result as { resources: unknown[] }).resources;
      expect(resources).toHaveLength(filesystemScenario.resources.length);
    });
  });

  describe('resources/read', () => {
    it('returns resource content by URI', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      const res = await server.handle({
        jsonrpc: '2.0',
        id: 6,
        method: 'resources/read',
        params: { uri: 'file:///project/README.md' },
      });
      expect(res.error).toBeUndefined();
      const contents = (res.result as { contents: Array<{ text: string }> }).contents;
      expect(contents[0].text).toContain('My Project');
    });

    it('returns error for unknown URI', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      const res = await server.handle({
        jsonrpc: '2.0',
        id: 7,
        method: 'resources/read',
        params: { uri: 'file:///not/found' },
      });
      expect(res.error).toBeDefined();
    });
  });

  describe('prompts/list + prompts/get', () => {
    it('lists prompts', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      const res = await server.handle({ jsonrpc: '2.0', id: 8, method: 'prompts/list' });
      const prompts = (res.result as { prompts: unknown[] }).prompts;
      expect(prompts).toHaveLength(filesystemScenario.prompts.length);
    });

    it('returns prompt messages on get', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      const res = await server.handle({
        jsonrpc: '2.0',
        id: 9,
        method: 'prompts/get',
        params: { name: 'summarize_file', arguments: { path: '/project/README.md' } },
      });
      expect(res.error).toBeUndefined();
      const messages = (res.result as { messages: unknown[] }).messages;
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('unknown method', () => {
    it('returns -32601 for unknown method after init', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      const res = await server.handle({ jsonrpc: '2.0', id: 10, method: 'not/a/method' });
      expect(res.error?.code).toBe(-32601);
    });
  });

  describe('event log', () => {
    it('logs request and response events for each call', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      const log = server.getEventLog();
      expect(log.some((e) => e.type === 'request')).toBe(true);
      expect(log.some((e) => e.type === 'response')).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears state so tools/list fails before re-initialize', async () => {
      await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 't', version: '1' }, capabilities: {} } });
      server.reset();
      const res = await server.handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
      expect(res.error).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: Run — confirm failure**

```bash
npx vitest run src/lib/simulation/mcp/__tests__/MCPServer.test.ts
```

Expected: FAIL — module not found (MCPServer, filesystem scenario don't exist yet).

- [ ] **Step 3: Create filesystem scenario (needed by tests)**

Create `src/lib/simulation/mcp/scenarios/filesystem.ts`:

```typescript
import type { MCPScenario } from '../types';

const FILES: Record<string, string> = {
  '/project/README.md': '# My Project\n\nA demonstration project for the MCP Inspector.\n\n## Features\n- Tool calling\n- Resource reading\n- Prompt generation',
  '/project/src/index.ts': 'export function main(): void {\n  console.log("Hello from simulated filesystem");\n}\nmain();',
  '/project/package.json': '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "main": "src/index.ts"\n}',
};

const DIRS: Record<string, string[]> = {
  '/project': ['README.md', 'package.json', 'src/'],
  '/project/src': ['index.ts', 'utils.ts'],
};

export const filesystemScenario: MCPScenario = {
  id: 'filesystem',
  name: 'Filesystem Server',
  description:
    'Simulates a filesystem MCP server — lists directories, reads files, and generates summarization prompts.',
  serverInfo: { name: 'filesystem-server', version: '1.0.0' },
  capabilities: {
    tools: { listChanged: false },
    resources: { subscribe: false, listChanged: false },
    prompts: { listChanged: false },
  },
  tools: [
    {
      name: 'read_file',
      description: 'Read the contents of a file at the given path.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute file path to read' },
        },
        required: ['path'],
      },
    },
    {
      name: 'list_dir',
      description: 'List files and directories at the given path.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute directory path to list' },
        },
        required: ['path'],
      },
    },
  ],
  resources: [
    {
      uri: 'file:///project/README.md',
      name: 'README.md',
      description: 'Project readme',
      mimeType: 'text/markdown',
    },
    {
      uri: 'file:///project/src/index.ts',
      name: 'index.ts',
      description: 'Main entry point',
      mimeType: 'text/typescript',
    },
    {
      uri: 'file:///project/package.json',
      name: 'package.json',
      description: 'Project manifest',
      mimeType: 'application/json',
    },
  ],
  prompts: [
    {
      name: 'summarize_file',
      description: 'Generate a prompt asking the LLM to summarize a file',
      arguments: [{ name: 'path', description: 'Path to the file', required: true }],
    },
  ],
  toolHandlers: {
    read_file: (params) => {
      const path = params.path as string;
      const content = FILES[path];
      if (!content) {
        return {
          content: [{ type: 'text', text: `Error: file not found: ${path}` }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: content }] };
    },
    list_dir: (params) => {
      const path = params.path as string;
      const entries = DIRS[path];
      if (!entries) {
        return {
          content: [{ type: 'text', text: `Error: directory not found: ${path}` }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: entries.join('\n') }] };
    },
  },
  resourceHandlers: {
    'file:///project/README.md': () => ({
      contents: [
        {
          uri: 'file:///project/README.md',
          mimeType: 'text/markdown',
          text: FILES['/project/README.md'],
        },
      ],
    }),
    'file:///project/src/index.ts': () => ({
      contents: [
        {
          uri: 'file:///project/src/index.ts',
          mimeType: 'text/typescript',
          text: FILES['/project/src/index.ts'],
        },
      ],
    }),
    'file:///project/package.json': () => ({
      contents: [
        {
          uri: 'file:///project/package.json',
          mimeType: 'application/json',
          text: FILES['/project/package.json'],
        },
      ],
    }),
  },
  promptHandlers: {
    summarize_file: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please read and summarize the file at: ${args.path}. Focus on its main purpose and key details.`,
        },
      },
    ],
  },
};
```

- [ ] **Step 4: Implement MCPServer**

Create `src/lib/simulation/mcp/MCPServer.ts`:

```typescript
import { SimulatedProtocol } from '../core/SimulatedProtocol';
import type {
  JSONRPCRequest,
  JSONRPCResponse,
  MCPScenario,
  MCPToolResult,
} from './types';

type ServerState = 'idle' | 'initialized';

export class MCPServer extends SimulatedProtocol {
  private state: ServerState = 'idle';
  private scenario: MCPScenario | null = null;

  loadScenario(scenario: MCPScenario): void {
    this.scenario = scenario;
    this.state = 'idle';
    this.clearLog();
  }

  async handle(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    this.emit('request', request);
    let response: JSONRPCResponse;
    try {
      response = await this.dispatch(request);
    } catch (err) {
      response = {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32603, message: 'Internal error', data: String(err) },
      };
    }
    this.emit('response', response);
    return response;
  }

  private async dispatch(req: JSONRPCRequest): Promise<JSONRPCResponse> {
    if (!this.scenario) {
      return { jsonrpc: '2.0', id: req.id, error: { code: -32603, message: 'No scenario loaded' } };
    }
    if (req.method !== 'initialize' && this.state === 'idle') {
      return { jsonrpc: '2.0', id: req.id, error: { code: -32600, message: 'Not initialized — call initialize first' } };
    }
    switch (req.method) {
      case 'initialize':           return this.handleInitialize(req);
      case 'tools/list':           return this.handleToolsList(req);
      case 'tools/call':           return this.handleToolsCall(req);
      case 'resources/list':       return this.handleResourcesList(req);
      case 'resources/read':       return this.handleResourcesRead(req);
      case 'prompts/list':         return this.handlePromptsList(req);
      case 'prompts/get':          return this.handlePromptsGet(req);
      default:
        return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `Method not found: ${req.method}` } };
    }
  }

  private handleInitialize(req: JSONRPCRequest): JSONRPCResponse {
    this.state = 'initialized';
    this.emit('state-change', 'initialized');
    return {
      jsonrpc: '2.0',
      id: req.id,
      result: {
        protocolVersion: '2025-11-25',
        serverInfo: this.scenario!.serverInfo,
        capabilities: this.scenario!.capabilities,
      },
    };
  }

  private handleToolsList(req: JSONRPCRequest): JSONRPCResponse {
    return { jsonrpc: '2.0', id: req.id, result: { tools: this.scenario!.tools } };
  }

  private handleToolsCall(req: JSONRPCRequest): JSONRPCResponse {
    const params = req.params as { name: string; arguments: Record<string, unknown> };
    const handler = this.scenario!.toolHandlers[params.name];
    if (!handler) {
      return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `Unknown tool: ${params.name}` } };
    }
    const result: MCPToolResult = handler(params.arguments ?? {});
    return { jsonrpc: '2.0', id: req.id, result };
  }

  private handleResourcesList(req: JSONRPCRequest): JSONRPCResponse {
    return { jsonrpc: '2.0', id: req.id, result: { resources: this.scenario!.resources } };
  }

  private handleResourcesRead(req: JSONRPCRequest): JSONRPCResponse {
    const { uri } = req.params as { uri: string };
    const handler = this.scenario!.resourceHandlers[uri];
    if (!handler) {
      return { jsonrpc: '2.0', id: req.id, error: { code: -32602, message: `Resource not found: ${uri}` } };
    }
    return { jsonrpc: '2.0', id: req.id, result: handler() };
  }

  private handlePromptsList(req: JSONRPCRequest): JSONRPCResponse {
    return { jsonrpc: '2.0', id: req.id, result: { prompts: this.scenario!.prompts } };
  }

  private handlePromptsGet(req: JSONRPCRequest): JSONRPCResponse {
    const { name, arguments: args = {} } = req.params as { name: string; arguments?: Record<string, string> };
    const handler = this.scenario!.promptHandlers[name];
    if (!handler) {
      return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `Unknown prompt: ${name}` } };
    }
    const messages = handler(args);
    return { jsonrpc: '2.0', id: req.id, result: { messages } };
  }

  reset(): void {
    this.state = 'idle';
    this.clearLog();
  }
}
```

- [ ] **Step 5: Run tests — confirm pass**

```bash
npx vitest run src/lib/simulation/mcp/__tests__/MCPServer.test.ts
```

Expected: PASS — all tests green. If any test fails, read the error and fix before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/lib/simulation/core/SimulatedProtocol.ts \
        src/lib/simulation/mcp/MCPServer.ts \
        src/lib/simulation/mcp/scenarios/filesystem.ts \
        src/lib/simulation/mcp/__tests__/MCPServer.test.ts
git commit -m "feat: add MCPServer state machine with filesystem scenario"
```

---

## Task 6: MCPClient

**Files:**
- Create: `src/lib/simulation/mcp/MCPClient.ts`
- Create: `src/lib/simulation/mcp/__tests__/MCPClient.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/simulation/mcp/__tests__/MCPClient.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MCPClient } from '../MCPClient';
import { MCPServer } from '../MCPServer';
import { filesystemScenario } from '../scenarios/filesystem';

describe('MCPClient', () => {
  let client: MCPClient;
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer();
    server.loadScenario(filesystemScenario);
    client = new MCPClient();
    client.connect(server);
  });

  it('initialize returns server info', async () => {
    const res = await client.initialize();
    expect(res.error).toBeUndefined();
    expect((res.result as Record<string, unknown>).protocolVersion).toBe('2025-11-25');
  });

  it('listTools returns tool array after initialize', async () => {
    await client.initialize();
    const res = await client.listTools();
    const tools = (res.result as { tools: unknown[] }).tools;
    expect(tools.length).toBeGreaterThan(0);
  });

  it('callTool returns result', async () => {
    await client.initialize();
    const res = await client.callTool('list_dir', { path: '/project' });
    expect(res.error).toBeUndefined();
  });

  it('listResources returns resource array', async () => {
    await client.initialize();
    const res = await client.listResources();
    const resources = (res.result as { resources: unknown[] }).resources;
    expect(resources.length).toBeGreaterThan(0);
  });

  it('readResource returns content', async () => {
    await client.initialize();
    const res = await client.readResource('file:///project/README.md');
    expect(res.error).toBeUndefined();
  });

  it('listPrompts returns prompts', async () => {
    await client.initialize();
    const res = await client.listPrompts();
    const prompts = (res.result as { prompts: unknown[] }).prompts;
    expect(prompts.length).toBeGreaterThan(0);
  });

  it('getPrompt returns messages', async () => {
    await client.initialize();
    const res = await client.getPrompt('summarize_file', { path: '/project/README.md' });
    const messages = (res.result as { messages: unknown[] }).messages;
    expect(messages.length).toBeGreaterThan(0);
  });

  it('emits request and response events', async () => {
    const events: string[] = [];
    client.on('request', () => events.push('request'));
    client.on('response', () => events.push('response'));
    await client.initialize();
    expect(events).toContain('request');
    expect(events).toContain('response');
  });

  it('reset clears event log', async () => {
    await client.initialize();
    client.reset();
    expect(client.getEventLog()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run — confirm failure**

```bash
npx vitest run src/lib/simulation/mcp/__tests__/MCPClient.test.ts
```

Expected: FAIL — `Cannot find module '../MCPClient'`

- [ ] **Step 3: Implement MCPClient**

Create `src/lib/simulation/mcp/MCPClient.ts`:

```typescript
import { SimulatedProtocol } from '../core/SimulatedProtocol';
import type { MCPServer } from './MCPServer';
import type { JSONRPCRequest, JSONRPCResponse } from './types';

export class MCPClient extends SimulatedProtocol {
  private server: MCPServer | null = null;
  private requestCounter = 0;

  connect(server: MCPServer): void {
    this.server = server;
    this.emit('connected', null);
  }

  async send(method: string, params?: Record<string, unknown>): Promise<JSONRPCResponse> {
    if (!this.server) throw new Error('Not connected — call connect(server) first');
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: ++this.requestCounter,
      method,
      params,
    };
    this.emit('request', request);
    const response = await this.server.handle(request);
    this.emit('response', response);
    return response;
  }

  async initialize(): Promise<JSONRPCResponse> {
    return this.send('initialize', {
      protocolVersion: '2025-11-25',
      clientInfo: { name: 'MCP Inspector Playground', version: '1.0.0' },
      capabilities: {},
    });
  }

  async listTools(): Promise<JSONRPCResponse> {
    return this.send('tools/list');
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<JSONRPCResponse> {
    return this.send('tools/call', { name, arguments: args });
  }

  async listResources(): Promise<JSONRPCResponse> {
    return this.send('resources/list');
  }

  async readResource(uri: string): Promise<JSONRPCResponse> {
    return this.send('resources/read', { uri });
  }

  async listPrompts(): Promise<JSONRPCResponse> {
    return this.send('prompts/list');
  }

  async getPrompt(name: string, args?: Record<string, string>): Promise<JSONRPCResponse> {
    return this.send('prompts/get', { name, arguments: args });
  }

  reset(): void {
    this.requestCounter = 0;
    this.clearLog();
  }
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx vitest run src/lib/simulation/mcp/__tests__/MCPClient.test.ts
```

Expected: PASS — 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation/mcp/MCPClient.ts src/lib/simulation/mcp/__tests__/MCPClient.test.ts
git commit -m "feat: add MCPClient — JSON-RPC 2.0 client connecting to MCPServer"
```

---

## Task 7: Remaining Four Scenarios

**Files:**
- Create: `src/lib/simulation/mcp/scenarios/weather.ts`
- Create: `src/lib/simulation/mcp/scenarios/knowledgeBase.ts`
- Create: `src/lib/simulation/mcp/scenarios/codeAssistant.ts`
- Create: `src/lib/simulation/mcp/scenarios/github.ts`
- Create: `src/lib/simulation/mcp/scenarios/index.ts`

- [ ] **Step 1: Create weather scenario**

Create `src/lib/simulation/mcp/scenarios/weather.ts`:

```typescript
import type { MCPScenario } from '../types';

export const weatherScenario: MCPScenario = {
  id: 'weather',
  name: 'Weather Tool',
  description: 'Simulates a weather service MCP server — current conditions and 5-day forecasts.',
  serverInfo: { name: 'weather-server', version: '1.0.0' },
  capabilities: { tools: { listChanged: false }, prompts: { listChanged: false } },
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather for a city.',
      inputSchema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name, e.g. "London"' },
        },
        required: ['city'],
      },
    },
    {
      name: 'get_forecast',
      description: 'Get a 5-day forecast for a city.',
      inputSchema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' },
          days: { type: 'number', description: 'Number of forecast days (1-5)' },
        },
        required: ['city'],
      },
    },
  ],
  resources: [],
  prompts: [
    {
      name: 'weather_report',
      description: 'Generate a prompt for a natural language weather summary',
      arguments: [
        { name: 'city', description: 'City to report on', required: true },
        { name: 'style', description: 'casual or formal', required: false },
      ],
    },
  ],
  toolHandlers: {
    get_weather: (params) => {
      const city = (params.city as string) || 'Unknown';
      const data = {
        city,
        temperature: 18,
        unit: 'celsius',
        condition: 'Partly cloudy',
        humidity: 62,
        windSpeed: 14,
        windUnit: 'km/h',
      };
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    },
    get_forecast: (params) => {
      const city = (params.city as string) || 'Unknown';
      const days = Math.min(Number(params.days ?? 3), 5);
      const conditions = ['Sunny', 'Partly cloudy', 'Overcast', 'Light rain', 'Clear'];
      const forecast = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        condition: conditions[i % conditions.length],
        high: 20 - i,
        low: 12 - i,
      }));
      return { content: [{ type: 'text', text: JSON.stringify({ city, forecast }, null, 2) }] };
    },
  },
  resourceHandlers: {},
  promptHandlers: {
    weather_report: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Write a ${args.style ?? 'casual'} weather summary for ${args.city}. Use the get_weather tool first to fetch current conditions.`,
        },
      },
    ],
  },
};
```

- [ ] **Step 2: Create knowledge base scenario**

Create `src/lib/simulation/mcp/scenarios/knowledgeBase.ts`:

```typescript
import type { MCPScenario } from '../types';

const KB_ARTICLES: Record<string, string> = {
  'kb://articles/mcp-overview': '# MCP Overview\n\nThe Model Context Protocol (MCP) is a JSON-RPC 2.0-based standard for connecting AI models to external tools, resources, and prompts. It defines three capability types: Tools (callable functions), Resources (readable content), and Prompts (templated messages).',
  'kb://articles/tool-calling': '# Tool Calling\n\nTools in MCP are callable functions. The server declares them via tools/list. The client invokes them via tools/call with a name and arguments object matching the tool\'s inputSchema.',
  'kb://articles/resources': '# Resources\n\nResources are readable content addressed by URI. Use resources/list to discover them and resources/read to retrieve their content. Resources can be files, database records, API responses, or any addressable content.',
  'kb://articles/prompts': '# Prompts\n\nPrompts are templates that the server provides. Use prompts/list to discover them and prompts/get to instantiate with arguments. They return structured message arrays ready to send to an LLM.',
  'kb://articles/error-codes': '# MCP Error Codes\n\n-32700: Parse error\n-32600: Invalid request\n-32601: Method not found\n-32602: Invalid params\n-32603: Internal error',
};

export const knowledgeBaseScenario: MCPScenario = {
  id: 'knowledge-base',
  name: 'Knowledge Base',
  description: 'Simulates a documentation knowledge base — full-text search and article retrieval.',
  serverInfo: { name: 'kb-server', version: '1.0.0' },
  capabilities: {
    tools: { listChanged: false },
    resources: { subscribe: false, listChanged: false },
    prompts: { listChanged: false },
  },
  tools: [
    {
      name: 'search',
      description: 'Full-text search over KB articles.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query string' },
        },
        required: ['query'],
      },
    },
    {
      name: 'retrieve',
      description: 'Retrieve a KB article by its URI.',
      inputSchema: {
        type: 'object',
        properties: {
          uri: { type: 'string', description: 'Article URI (kb://articles/...)' },
        },
        required: ['uri'],
      },
    },
  ],
  resources: [
    { uri: 'kb://articles/mcp-overview', name: 'MCP Overview', description: 'What MCP is and how it works', mimeType: 'text/markdown' },
    { uri: 'kb://articles/tool-calling', name: 'Tool Calling', description: 'How tools/list and tools/call work', mimeType: 'text/markdown' },
    { uri: 'kb://articles/resources', name: 'Resources', description: 'Resource listing and reading', mimeType: 'text/markdown' },
    { uri: 'kb://articles/prompts', name: 'Prompts', description: 'Prompt discovery and instantiation', mimeType: 'text/markdown' },
    { uri: 'kb://articles/error-codes', name: 'Error Codes', description: 'JSON-RPC error code reference', mimeType: 'text/markdown' },
  ],
  prompts: [
    {
      name: 'explain_concept',
      description: 'Generate a prompt to explain an MCP concept',
      arguments: [
        { name: 'concept', description: 'Concept to explain (e.g. "tool calling")', required: true },
        { name: 'audience', description: 'beginner or expert', required: false },
      ],
    },
    {
      name: 'compare_capabilities',
      description: 'Generate a prompt comparing two MCP capability types',
      arguments: [
        { name: 'typeA', description: 'First capability type', required: true },
        { name: 'typeB', description: 'Second capability type', required: true },
      ],
    },
  ],
  toolHandlers: {
    search: (params) => {
      const query = (params.query as string).toLowerCase();
      const matches = Object.entries(KB_ARTICLES)
        .filter(([, content]) => content.toLowerCase().includes(query))
        .map(([uri]) => ({ uri, snippet: `...${query} found in ${uri.split('/').pop()}...` }));
      return {
        content: [{ type: 'text', text: matches.length ? JSON.stringify(matches, null, 2) : 'No results found.' }],
      };
    },
    retrieve: (params) => {
      const uri = params.uri as string;
      const content = KB_ARTICLES[uri];
      if (!content) {
        return { content: [{ type: 'text', text: `Article not found: ${uri}` }], isError: true };
      }
      return { content: [{ type: 'text', text: content }] };
    },
  },
  resourceHandlers: Object.fromEntries(
    Object.entries(KB_ARTICLES).map(([uri, text]) => [
      uri,
      () => ({ contents: [{ uri, mimeType: 'text/markdown', text }] }),
    ])
  ),
  promptHandlers: {
    explain_concept: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Explain the MCP concept of "${args.concept}" for a ${args.audience ?? 'beginner'} audience. Use concrete examples and keep it practical.`,
        },
      },
    ],
    compare_capabilities: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Compare MCP ${args.typeA} and ${args.typeB}. What are they each for, how do you use them, and when would you choose one over the other?`,
        },
      },
    ],
  },
};
```

- [ ] **Step 3: Create code assistant scenario**

Create `src/lib/simulation/mcp/scenarios/codeAssistant.ts`:

```typescript
import type { MCPScenario } from '../types';

export const codeAssistantScenario: MCPScenario = {
  id: 'code-assistant',
  name: 'Code Assistant',
  description: 'Simulates a code quality MCP server — lint, format, and test execution.',
  serverInfo: { name: 'code-assistant-server', version: '1.0.0' },
  capabilities: {
    tools: { listChanged: false },
    resources: { subscribe: false, listChanged: false },
    prompts: { listChanged: false },
  },
  tools: [
    {
      name: 'run_lint',
      description: 'Run ESLint on a file and return diagnostics.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to lint' },
        },
        required: ['path'],
      },
    },
    {
      name: 'format',
      description: 'Format a file using Prettier and return the formatted content.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to format' },
          parser: { type: 'string', description: 'Prettier parser (typescript, json, markdown)' },
        },
        required: ['path'],
      },
    },
    {
      name: 'run_tests',
      description: 'Run tests matching a pattern and return results.',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Test file glob pattern' },
        },
        required: ['pattern'],
      },
    },
  ],
  resources: [
    { uri: 'code://config/eslint', name: '.eslintrc', description: 'Active ESLint configuration', mimeType: 'application/json' },
    { uri: 'code://config/prettier', name: '.prettierrc', description: 'Active Prettier configuration', mimeType: 'application/json' },
  ],
  prompts: [
    {
      name: 'code_review',
      description: 'Generate a prompt to perform a code review on a file',
      arguments: [{ name: 'path', description: 'File to review', required: true }],
    },
    {
      name: 'fix_lint_errors',
      description: 'Generate a prompt to fix lint errors in a file',
      arguments: [{ name: 'path', description: 'File with lint errors', required: true }],
    },
    {
      name: 'write_tests',
      description: 'Generate a prompt to write tests for a function',
      arguments: [
        { name: 'path', description: 'Source file', required: true },
        { name: 'functionName', description: 'Function to test', required: true },
      ],
    },
  ],
  toolHandlers: {
    run_lint: (params) => ({
      content: [{
        type: 'text',
        text: JSON.stringify({
          file: params.path,
          errors: [
            { line: 12, column: 5, rule: 'no-unused-vars', message: "'tempResult' is assigned a value but never used.", severity: 'error' },
          ],
          warnings: [
            { line: 8, column: 1, rule: 'no-console', message: 'Unexpected console statement.', severity: 'warn' },
          ],
          summary: '1 error, 1 warning',
        }, null, 2),
      }],
    }),
    format: (params) => ({
      content: [{
        type: 'text',
        text: `// Formatted with Prettier (${params.parser ?? 'typescript'})\nexport function main(): void {\n  console.log("formatted");\n}\n`,
      }],
    }),
    run_tests: (params) => ({
      content: [{
        type: 'text',
        text: JSON.stringify({
          pattern: params.pattern,
          passed: 14,
          failed: 1,
          skipped: 2,
          duration: '1.23s',
          failures: [{
            test: 'formatCurrency handles negative values',
            file: 'src/utils/currency.test.ts',
            error: 'Expected "-$10.00" but received "($10.00)"',
          }],
        }, null, 2),
      }],
    }),
  },
  resourceHandlers: {
    'code://config/eslint': () => ({
      contents: [{
        uri: 'code://config/eslint',
        mimeType: 'application/json',
        text: JSON.stringify({
          extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
          rules: { 'no-console': 'warn', 'no-unused-vars': 'error' },
        }, null, 2),
      }],
    }),
    'code://config/prettier': () => ({
      contents: [{
        uri: 'code://config/prettier',
        mimeType: 'application/json',
        text: JSON.stringify({
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
        }, null, 2),
      }],
    }),
  },
  promptHandlers: {
    code_review: (args) => [{
      role: 'user',
      content: { type: 'text', text: `Please review the code at ${args.path}. Run lint first, then provide feedback on quality, correctness, and style.` },
    }],
    fix_lint_errors: (args) => [{
      role: 'user',
      content: { type: 'text', text: `Use run_lint on ${args.path}, then fix each error in the file. Preserve behavior — only fix style and lint issues.` },
    }],
    write_tests: (args) => [{
      role: 'user',
      content: { type: 'text', text: `Write comprehensive Vitest tests for the function "${args.functionName}" in ${args.path}. Cover the happy path, edge cases, and error conditions.` },
    }],
  },
};
```

- [ ] **Step 4: Create GitHub scenario**

Create `src/lib/simulation/mcp/scenarios/github.ts`:

```typescript
import type { MCPScenario } from '../types';

const MOCK_PRS = [
  { number: 42, title: 'feat: add dark mode toggle', author: 'alice', state: 'open', labels: ['enhancement'], comments: 3 },
  { number: 41, title: 'fix: memory leak in event listener', author: 'bob', state: 'open', labels: ['bug'], comments: 1 },
  { number: 40, title: 'refactor: extract auth middleware', author: 'carol', state: 'merged', labels: ['refactor'], comments: 5 },
];

const MOCK_ISSUES = {
  '101': { number: 101, title: 'Dark mode text contrast is too low', body: 'In dark mode, the secondary text (#999) fails WCAG AA contrast on the dark background (#1a1a1a). Needs to be at least #aaa.', author: 'dave', labels: ['accessibility', 'bug'], state: 'open' },
  '102': { number: 102, title: 'Add keyboard shortcut for scenario switching', body: 'Would love Ctrl+K to open scenario selector. Consistent with VS Code and Linear conventions.', author: 'eve', labels: ['enhancement'], state: 'open' },
};

export const githubScenario: MCPScenario = {
  id: 'github',
  name: 'GitHub Server',
  description: 'Simulates a GitHub MCP server — lists PRs, reads issues, and posts comments.',
  serverInfo: { name: 'github-server', version: '1.0.0' },
  capabilities: {
    tools: { listChanged: false },
    resources: { subscribe: false, listChanged: false },
    prompts: { listChanged: false },
  },
  tools: [
    {
      name: 'list_prs',
      description: 'List open pull requests in the repository.',
      inputSchema: {
        type: 'object',
        properties: {
          state: { type: 'string', description: 'PR state: open, closed, or all (default: open)' },
        },
      },
    },
    {
      name: 'get_issue',
      description: 'Get details of a GitHub issue by number.',
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'number', description: 'Issue number' },
        },
        required: ['number'],
      },
    },
    {
      name: 'comment',
      description: 'Post a comment on a PR or issue.',
      inputSchema: {
        type: 'object',
        properties: {
          number: { type: 'number', description: 'PR or issue number' },
          body: { type: 'string', description: 'Comment body (markdown supported)' },
        },
        required: ['number', 'body'],
      },
    },
  ],
  resources: [
    { uri: 'github://repo/info', name: 'Repository Info', description: 'Repo metadata and stats', mimeType: 'application/json' },
    { uri: 'github://repo/contributors', name: 'Contributors', description: 'Contributor list', mimeType: 'application/json' },
  ],
  prompts: [
    {
      name: 'pr_review',
      description: 'Generate a prompt to review a pull request',
      arguments: [{ name: 'number', description: 'PR number to review', required: true }],
    },
    {
      name: 'triage_issue',
      description: 'Generate a prompt to triage and respond to an issue',
      arguments: [{ name: 'number', description: 'Issue number to triage', required: true }],
    },
  ],
  toolHandlers: {
    list_prs: (params) => {
      const state = (params.state as string) ?? 'open';
      const prs = state === 'all' ? MOCK_PRS : MOCK_PRS.filter((pr) => pr.state === state);
      return { content: [{ type: 'text', text: JSON.stringify(prs, null, 2) }] };
    },
    get_issue: (params) => {
      const issue = MOCK_ISSUES[String(params.number)];
      if (!issue) {
        return { content: [{ type: 'text', text: `Issue #${params.number} not found` }], isError: true };
      }
      return { content: [{ type: 'text', text: JSON.stringify(issue, null, 2) }] };
    },
    comment: (params) => ({
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          commentId: Math.floor(Math.random() * 9000) + 1000,
          on: `#${params.number}`,
          body: params.body,
          createdAt: new Date().toISOString(),
        }, null, 2),
      }],
    }),
  },
  resourceHandlers: {
    'github://repo/info': () => ({
      contents: [{
        uri: 'github://repo/info',
        mimeType: 'application/json',
        text: JSON.stringify({ name: 'ai-learning-playground', stars: 1204, forks: 87, openIssues: 14, language: 'TypeScript' }, null, 2),
      }],
    }),
    'github://repo/contributors': () => ({
      contents: [{
        uri: 'github://repo/contributors',
        mimeType: 'application/json',
        text: JSON.stringify([
          { login: 'alice', contributions: 342 },
          { login: 'bob', contributions: 187 },
          { login: 'carol', contributions: 95 },
        ], null, 2),
      }],
    }),
  },
  promptHandlers: {
    pr_review: (args) => [{
      role: 'user',
      content: { type: 'text', text: `Review PR #${args.number}. List the files changed, assess the code quality, and write a constructive review comment. Use list_prs to get PR details first.` },
    }],
    triage_issue: (args) => [{
      role: 'user',
      content: { type: 'text', text: `Triage issue #${args.number}. Use get_issue to read it, then classify its priority (P0-P3), suggest an assignee, and draft a polite acknowledgment comment.` },
    }],
  },
};
```

- [ ] **Step 5: Create scenarios index**

Create `src/lib/simulation/mcp/scenarios/index.ts`:

```typescript
export { filesystemScenario } from './filesystem';
export { weatherScenario } from './weather';
export { knowledgeBaseScenario } from './knowledgeBase';
export { codeAssistantScenario } from './codeAssistant';
export { githubScenario } from './github';

import { filesystemScenario } from './filesystem';
import { weatherScenario } from './weather';
import { knowledgeBaseScenario } from './knowledgeBase';
import { codeAssistantScenario } from './codeAssistant';
import { githubScenario } from './github';
import type { MCPScenario } from '../types';

export const ALL_SCENARIOS: MCPScenario[] = [
  filesystemScenario,
  weatherScenario,
  knowledgeBaseScenario,
  codeAssistantScenario,
  githubScenario,
];
```

- [ ] **Step 6: Run full simulation test suite**

```bash
npx vitest run src/lib/simulation/
```

Expected: All tests pass (MessageBus, MCPServer, MCPClient).

- [ ] **Step 7: Commit**

```bash
git add src/lib/simulation/mcp/scenarios/
git commit -m "feat: add 5 pre-built MCP scenarios (filesystem, weather, kb, code, github)"
```

---

## Task 8: ScenarioLoader

**Files:**
- Create: `src/lib/simulation/core/ScenarioLoader.ts`

No separate test — ScenarioLoader is a thin wrapper over the scenarios index and localStorage. Covered in integration when the cockpit uses it.

- [ ] **Step 1: Implement ScenarioLoader**

Create `src/lib/simulation/core/ScenarioLoader.ts`:

```typescript
import { ALL_SCENARIOS } from '../mcp/scenarios';
import type { MCPScenario } from '../mcp/types';

const CUSTOM_SCENARIOS_KEY = 'mcp-inspector:custom-scenarios';

export const ScenarioLoader = {
  listBuiltIn(): MCPScenario[] {
    return ALL_SCENARIOS;
  },

  listCustom(): MCPScenario[] {
    try {
      const raw = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
      return raw ? (JSON.parse(raw) as MCPScenario[]) : [];
    } catch {
      return [];
    }
  },

  listAll(): MCPScenario[] {
    return [...this.listBuiltIn(), ...this.listCustom()];
  },

  findById(id: string): MCPScenario | undefined {
    return this.listAll().find((s) => s.id === id);
  },

  saveCustom(scenario: MCPScenario): void {
    const existing = this.listCustom().filter((s) => s.id !== scenario.id);
    localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify([...existing, scenario]));
  },

  deleteCustom(id: string): void {
    const remaining = this.listCustom().filter((s) => s.id !== id);
    localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(remaining));
  },
};
```

- [ ] **Step 2: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/simulation/core/ScenarioLoader.ts
git commit -m "feat: add ScenarioLoader — built-in and localStorage-persisted scenario registry"
```

---

## Task 9: Zustand MCP Store Slice

**Files:**
- Modify: `src/lib/store.ts`

- [ ] **Step 1: Add types for the store at the top of the relevant section**

Open `src/lib/store.ts`. Add the import at the top alongside existing imports:

```typescript
import type { MCPScenario, MCPMessage, MCPConnectionState, MCPTool, MCPResource, MCPPrompt } from './simulation/mcp/types';
```

- [ ] **Step 2: Add the store interface and create call**

After the last existing store definition in `src/lib/store.ts`, add:

```typescript
interface MCPStoreState {
  activeScenario: MCPScenario | null;
  connectionState: MCPConnectionState;
  messageLog: MCPMessage[];
  activeTab: 'explorer' | 'walkthrough' | 'inspector';
  selectedTreeItem: { type: 'tool' | 'resource' | 'prompt'; name: string } | null;
  walkthroughStep: number;
  customTools: MCPTool[];
  customResources: MCPResource[];
  customPrompts: MCPPrompt[];
  setActiveScenario: (scenario: MCPScenario) => void;
  setConnectionState: (state: MCPConnectionState) => void;
  appendMessage: (message: MCPMessage) => void;
  clearMessages: () => void;
  setActiveTab: (tab: 'explorer' | 'walkthrough' | 'inspector') => void;
  setSelectedTreeItem: (item: { type: 'tool' | 'resource' | 'prompt'; name: string } | null) => void;
  setWalkthroughStep: (step: number) => void;
  addCustomTool: (tool: MCPTool) => void;
  addCustomResource: (resource: MCPResource) => void;
  addCustomPrompt: (prompt: MCPPrompt) => void;
  resetSession: () => void;
}

export const useMCPStore = create<MCPStoreState>()(
  devtools(
    (set) => ({
      activeScenario: null,
      connectionState: 'disconnected',
      messageLog: [],
      activeTab: 'explorer',
      selectedTreeItem: null,
      walkthroughStep: 0,
      customTools: [],
      customResources: [],
      customPrompts: [],
      setActiveScenario: (scenario) => set({ activeScenario: scenario, connectionState: 'disconnected', messageLog: [] }),
      setConnectionState: (connectionState) => set({ connectionState }),
      appendMessage: (message) => set((s) => ({ messageLog: [...s.messageLog, message] })),
      clearMessages: () => set({ messageLog: [] }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setSelectedTreeItem: (selectedTreeItem) => set({ selectedTreeItem }),
      setWalkthroughStep: (walkthroughStep) => set({ walkthroughStep }),
      addCustomTool: (tool) => set((s) => ({ customTools: [...s.customTools, tool] })),
      addCustomResource: (resource) => set((s) => ({ customResources: [...s.customResources, resource] })),
      addCustomPrompt: (prompt) => set((s) => ({ customPrompts: [...s.customPrompts, prompt] })),
      resetSession: () => set({ connectionState: 'disconnected', messageLog: [], walkthroughStep: 0, selectedTreeItem: null }),
    }),
    { name: 'mcp-store' }
  )
);
```

- [ ] **Step 3: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/store.ts
git commit -m "feat: add useMCPStore Zustand slice for MCP Inspector cockpit state"
```

---

## End of Part 1

**Part 2** covers all UI components, tabs, the HyperFrames walkthrough animation, cockpit assembly, and the CockpitSelectionPage card.

Continue with: `docs/superpowers/plans/2026-04-23-mcp-inspector-part2.md`
