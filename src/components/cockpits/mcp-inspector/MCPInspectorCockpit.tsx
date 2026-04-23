import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMCPStore } from '@/lib/store';
import { ScenarioLoader } from '@/lib/simulation/core/ScenarioLoader';
import { MCPClient } from '@/lib/simulation/mcp/MCPClient';
import { MCPServer } from '@/lib/simulation/mcp/MCPServer';
import type {
  JSONRPCRequest,
  JSONRPCResponse,
  MCPMessage,
  MCPPrompt,
  MCPResource,
  MCPTool,
} from '@/lib/simulation/mcp/types';
import { generateId, cn } from '@/lib/utils';

type MCPMode = 'guided' | 'inspect' | 'fault';
type SelectedEntityType = 'tool' | 'resource' | 'prompt';
type ProtocolPacket = {
  id: string;
  storyStep: number;
  label: string;
  method: string;
  direction:
    | 'app→registry'
    | 'registry→app'
    | 'app→gateway'
    | 'gateway→server'
    | 'server→gateway'
    | 'gateway→app';
  summary: string;
  metadata: Array<[string, string]>;
  payload: unknown;
};

const STORY_STEPS = [
  { id: 0, label: 'APP', method: 'user intent', caption: 'An AI app needs an outside capability' },
  { id: 1, label: 'REGISTRY', method: 'registry lookup', caption: 'The app finds eligible MCP servers' },
  { id: 2, label: 'GATEWAY', method: 'gateway route', caption: 'The gateway selects and authorizes a route' },
  { id: 3, label: 'HELLO', method: 'initialize', caption: 'Client and server agree on protocol' },
  { id: 4, label: 'TOOLS', method: 'tools/list', caption: 'The server exposes callable capability metadata' },
  { id: 5, label: 'CALL', method: 'tools/call', caption: 'The app calls a tool and receives structured data' },
];

const MODES: Array<{ id: MCPMode; label: string }> = [
  { id: 'guided', label: 'GUIDED' },
  { id: 'inspect', label: 'INSPECT' },
  { id: 'fault', label: 'FAULT' },
];

const FLOW_PATHS: Record<string, { path: string; tone: 'cyan' | 'amber' }> = {
  'registry-query': {
    path: 'M 154 156 C 242 156 262 206 318 238 C 356 210 372 150 380 94',
    tone: 'cyan',
  },
  'registry-result': {
    path: 'M 380 94 C 372 150 356 210 318 238 C 262 206 242 156 154 156',
    tone: 'amber',
  },
  'gateway-route': {
    path: 'M 154 268 C 232 268 264 258 318 258',
    tone: 'cyan',
  },
  'init-request': {
    path: 'M 318 238 C 410 218 506 184 606 156',
    tone: 'cyan',
  },
  'init-response': {
    path: 'M 606 156 C 506 184 410 218 318 238',
    tone: 'amber',
  },
  'tools-list-request': {
    path: 'M 318 258 C 410 258 518 258 606 268',
    tone: 'cyan',
  },
  'tools-list-response': {
    path: 'M 606 268 C 518 258 410 258 318 258',
    tone: 'amber',
  },
  'tool-call-request': {
    path: 'M 318 278 C 410 310 518 350 606 380',
    tone: 'cyan',
  },
  'tool-call-response': {
    path: 'M 606 406 C 530 494 240 494 154 406',
    tone: 'amber',
  },
};

function getDefaultInput(entity: MCPTool | MCPPrompt | MCPResource, type: SelectedEntityType) {
  if (type === 'resource') {
    return { uri: (entity as MCPResource).uri };
  }

  if (type === 'prompt') {
    return Object.fromEntries(
      ((entity as MCPPrompt).arguments ?? []).map((arg) => [arg.name, `example_${arg.name}`])
    );
  }

  return Object.fromEntries(
    Object.keys((entity as MCPTool).inputSchema.properties).map((key) => {
      if (key.includes('path')) return [key, '/project/README.md'];
      if (key.includes('uri')) return [key, 'file:///project/README.md'];
      if (key.includes('city')) return [key, 'Berlin'];
      return [key, `example_${key}`];
    })
  );
}

function compactJson(value: unknown) {
  if (!value) return 'NO PACKET';
  return JSON.stringify(value, null, 2).slice(0, 760);
}

export function MCPInspectorCockpit() {
  const {
    activeScenario,
    messageLog,
    walkthroughStep,
    setWalkthroughStep,
    selectedTreeItem,
    setSelectedTreeItem,
    customTools,
    customResources,
    customPrompts,
    appendMessage,
    clearMessages,
    setConnectionState,
    setActiveScenario,
  } = useMCPStore();

  const [mode, setMode] = useState<MCPMode>('guided');
  const [responsePayload, setResponsePayload] = useState<unknown>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [hoveredPacketId, setHoveredPacketId] = useState<string | null>(null);
  const [activePacketId, setActivePacketId] = useState<string | null>(null);
  const [isRunningLesson, setIsRunningLesson] = useState(false);
  const clientLogIndex = useRef(0);
  const lessonRunId = useRef(0);

  const scenarios = useMemo(() => ScenarioLoader.listAll(), []);

  useEffect(() => {
    if (activeScenario || scenarios.length === 0) return;
    setActiveScenario(scenarios[0]);
  }, [activeScenario, scenarios, setActiveScenario]);

  const client = useMemo(() => {
    const server = new MCPServer();
    const nextClient = new MCPClient();
    if (activeScenario) {
      server.loadScenario(activeScenario);
      nextClient.connect(server);
    }
    return nextClient;
  }, [activeScenario]);

  const mergedScenario = useMemo(() => {
    if (!activeScenario) return null;
    return {
      ...activeScenario,
      tools: [...activeScenario.tools, ...customTools],
      resources: [...activeScenario.resources, ...customResources],
      prompts: [...activeScenario.prompts, ...customPrompts],
    };
  }, [activeScenario, customPrompts, customResources, customTools]);

  const selectedEntity = useMemo(() => {
    if (!mergedScenario || !selectedTreeItem) return null;
    if (selectedTreeItem.type === 'tool') {
      return mergedScenario.tools.find((tool) => tool.name === selectedTreeItem.name) ?? null;
    }
    if (selectedTreeItem.type === 'resource') {
      return mergedScenario.resources.find((resource) => resource.name === selectedTreeItem.name) ?? null;
    }
    return mergedScenario.prompts.find((prompt) => prompt.name === selectedTreeItem.name) ?? null;
  }, [mergedScenario, selectedTreeItem]);

  useEffect(() => {
    if (!mergedScenario || selectedTreeItem) return;
    if (mergedScenario.tools[0]) {
      setSelectedTreeItem({ type: 'tool', name: mergedScenario.tools[0].name });
    } else if (mergedScenario.resources[0]) {
      setSelectedTreeItem({ type: 'resource', name: mergedScenario.resources[0].name });
    } else if (mergedScenario.prompts[0]) {
      setSelectedTreeItem({ type: 'prompt', name: mergedScenario.prompts[0].name });
    }
  }, [mergedScenario, selectedTreeItem, setSelectedTreeItem]);

  const pushClientEvents = (fromIndex = clientLogIndex.current) => {
    const newEvents = client.getEventLog().slice(fromIndex);
    clientLogIndex.current = client.getEventLog().length;

    newEvents.forEach((event) => {
      if (event.type !== 'request' && event.type !== 'response') return;
      const payload = event.payload as JSONRPCRequest | JSONRPCResponse;
      appendMessage({
        id: generateId('mcp-msg'),
        direction: event.type === 'request' ? 'client→server' : 'server→client',
        method: 'method' in payload ? payload.method : undefined,
        payload,
        timestamp: event.timestamp,
      });
    });
  };

  const resetProtocolRun = () => {
    lessonRunId.current += 1;
    clearMessages();
    client.reset();
    clientLogIndex.current = 0;
    setConnectionState('disconnected');
    setResponsePayload(null);
    setErrorText(null);
    setActivePacketId(null);
    setIsRunningLesson(false);
    setWalkthroughStep(0);
  };

  const executeSelectedEntity = async (forceError = false) => {
    if (!selectedTreeItem || !selectedEntity) {
      setErrorText('NO CAPABILITY SELECTED');
      return null;
    }

    const before = client.getEventLog().length;
    const input = getDefaultInput(selectedEntity, selectedTreeItem.type);
    let response: JSONRPCResponse;

    if (selectedTreeItem.type === 'tool') {
      response = await client.callTool(
        forceError ? 'nonexistent_tool' : (selectedEntity as MCPTool).name,
        input
      );
    } else if (selectedTreeItem.type === 'resource') {
      const resource = selectedEntity as MCPResource;
      response = await client.readResource(forceError ? 'file:///void' : String(input.uri ?? resource.uri));
    } else {
      response = await client.getPrompt(
        forceError ? 'nonexistent_prompt' : (selectedEntity as MCPPrompt).name,
        input as Record<string, string>
      );
    }

    pushClientEvents(before);
    setResponsePayload(response);
    setConnectionState(response.error ? 'error' : 'connected');
    setWalkthroughStep(5);
    return response;
  };

  const runEndToEndStory = async (forceError = mode === 'fault') => {
    if (!mergedScenario) return;

    const runId = lessonRunId.current + 1;
    lessonRunId.current = runId;
    clearMessages();
    client.reset();
    clientLogIndex.current = 0;
    setResponsePayload(null);
    setErrorText(null);
    setHoveredPacketId(null);
    setActivePacketId(null);
    setWalkthroughStep(0);
    setConnectionState('connecting');
    setIsRunningLesson(true);

    const assertActiveRun = () => {
      if (lessonRunId.current !== runId) {
        throw new Error('LESSON CANCELLED');
      }
    };
    const pause = (duration = 1550) =>
      new Promise<void>((resolve, reject) => {
        window.setTimeout(() => {
          if (lessonRunId.current !== runId) {
            reject(new Error('LESSON CANCELLED'));
            return;
          }
          resolve();
        }, duration);
      });
    const reveal = async (packetId: string, stepIndex: number, duration = 1550) => {
      assertActiveRun();
      setActivePacketId(packetId);
      setWalkthroughStep(stepIndex);
      await pause(duration);
    };
    const runStep = async (action: () => Promise<unknown>) => {
      assertActiveRun();
      const before = client.getEventLog().length;
      const result = await action();
      pushClientEvents(before);
      return result;
    };

    try {
      await reveal('registry-query', 1, 1500);
      await reveal('registry-result', 1, 1650);
      await reveal('gateway-route', 2, 1650);

      await reveal('init-request', 3);
      await runStep(() => client.initialize());
      setConnectionState('connected');
      await reveal('init-response', 3, 1750);

      await reveal('tools-list-request', 4);
      await runStep(async () => {
        await client.listTools();
        await client.listResources();
        await client.listPrompts();
      });
      await reveal('tools-list-response', 4, 1900);

      await reveal('tool-call-request', 5);
      const response = await executeSelectedEntity(forceError);
      setResponsePayload(response);
      setActivePacketId('tool-call-response');
      setWalkthroughStep(5);
      await pause(1900);
      setConnectionState(forceError ? 'error' : 'connected');
      setIsRunningLesson(false);
    } catch (error) {
      if (error instanceof Error && error.message === 'LESSON CANCELLED') {
        setIsRunningLesson(false);
        return;
      }
      setErrorText(error instanceof Error ? error.message.toUpperCase() : 'MCP RUN FAILED');
      setConnectionState('error');
      setWalkthroughStep(5);
      setIsRunningLesson(false);
    }
  };

  const selectFirstCapability = (type: SelectedEntityType) => {
    const collection =
      type === 'tool' ? mergedScenario?.tools : type === 'resource' ? mergedScenario?.resources : mergedScenario?.prompts;
    const first = collection?.[0];
    if (!first) return;
    setSelectedTreeItem({ type, name: first.name });
    setMode('inspect');
    setWalkthroughStep(3);
  };

  const latestMessage = messageLog[messageLog.length - 1] as MCPMessage | undefined;
  const currentStep = STORY_STEPS[walkthroughStep] ?? STORY_STEPS[0];
  const toolCount = mergedScenario?.tools.length ?? 0;
  const resourceCount = mergedScenario?.resources.length ?? 0;
  const promptCount = mergedScenario?.prompts.length ?? 0;
  const selectedTool =
    selectedTreeItem?.type === 'tool'
      ? mergedScenario?.tools.find((tool) => tool.name === selectedTreeItem.name)
      : mergedScenario?.tools[0];
  const selectedToolInput = selectedTool ? getDefaultInput(selectedTool, 'tool') : {};
  const protocolPackets: ProtocolPacket[] = [
    {
      id: 'registry-query',
      storyStep: 1,
      label: '01 FIND',
      method: 'registry.lookup',
      direction: 'app→registry',
      summary: 'The AI app asks the MCP registry which servers can satisfy the user request.',
      metadata: [
        ['actor', 'AI application'],
        ['target', 'MCP Registry'],
        ['expert', 'discovery + policy'],
      ],
      payload: {
        intent: 'read project documentation',
        requiredCapabilities: ['filesystem.read', 'markdown'],
        constraints: { localOnly: true, auth: 'user-approved' },
      },
    },
    {
      id: 'registry-result',
      storyStep: 1,
      label: '02 MATCH',
      method: 'registry.result',
      direction: 'registry→app',
      summary: 'The registry returns compatible MCP servers, trust metadata, and connection descriptors.',
      metadata: [
        ['matches', '3 servers'],
        ['selected', mergedScenario?.name ?? 'Filesystem Server'],
        ['expert', 'server catalog'],
      ],
      payload: {
        servers: [
          { name: mergedScenario?.name ?? 'Filesystem Server', transport: 'stdio', scopes: ['read_file', 'list_dir'] },
          { name: 'GitHub Server', transport: 'http+sse', scopes: ['issues', 'pull_requests'] },
          { name: 'Browser Tools', transport: 'http+sse', scopes: ['navigate', 'screenshot'] },
        ],
      },
    },
    {
      id: 'gateway-route',
      storyStep: 2,
      label: '03 ROUTE',
      method: 'gateway.route',
      direction: 'app→gateway',
      summary: 'The gateway becomes the controlled entry point: it applies auth, policy, logging, and routes traffic to the selected MCP server.',
      metadata: [
        ['gateway', 'policy + routing'],
        ['transport', 'stdio / http+sse'],
        ['expert', 'audit boundary'],
      ],
      payload: {
        route: {
          from: 'AI application',
          via: 'MCP Gateway',
          to: mergedScenario?.name ?? 'Filesystem Server',
          policies: ['user consent', 'tool allowlist', 'payload audit'],
        },
      },
    },
    {
      id: 'init-request',
      storyStep: 3,
      label: '04 INIT',
      method: 'initialize',
      direction: 'gateway→server',
      summary: 'Client opens a shared MCP session and declares its protocol version/capabilities.',
      metadata: [
        ['sender', 'MCP Gateway'],
        ['receiver', 'MCP Server'],
        ['phase', 'handshake'],
      ],
      payload: {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          clientInfo: { name: 'AI Learning Playground', version: '1.0.0' },
          capabilities: { roots: {}, sampling: {} },
        },
      },
    },
    {
      id: 'init-response',
      storyStep: 3,
      label: '05 READY',
      method: 'initialize/result',
      direction: 'server→gateway',
      summary: 'Server accepts the session and returns its own capability contract.',
      metadata: [
        ['sender', 'MCP Server'],
        ['receiver', 'MCP Gateway'],
        ['phase', 'handshake ack'],
      ],
      payload: {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: mergedScenario?.name ?? 'MCP Server' },
          capabilities: { tools: {}, resources: {}, prompts: {} },
        },
      },
    },
    {
      id: 'tools-list-request',
      storyStep: 4,
      label: '06 LIST',
      method: 'tools/list',
      direction: 'gateway→server',
      summary: 'Client asks the server what executable tools are available before choosing one.',
      metadata: [
        ['sender', 'MCP Gateway'],
        ['receiver', 'MCP Server'],
        ['phase', 'discovery'],
      ],
      payload: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    },
    {
      id: 'tools-list-response',
      storyStep: 4,
      label: '07 CATALOG',
      method: 'tools/list/result',
      direction: 'server→gateway',
      summary: 'Server returns tool metadata: names, descriptions, and JSON schemas for valid arguments.',
      metadata: [
        ['tools', String(toolCount)],
        ['resources', String(resourceCount)],
        ['prompts', String(promptCount)],
      ],
      payload: {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: (mergedScenario?.tools ?? []).map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          })),
        },
      },
    },
    {
      id: 'tool-call-request',
      storyStep: 5,
      label: '08 CALL',
      method: 'tools/call',
      direction: 'gateway→server',
      summary: 'Client calls one selected tool with validated arguments from the tool schema.',
      metadata: [
        ['tool', selectedTool?.name ?? 'none'],
        ['args', String(Object.keys(selectedToolInput).length)],
        ['phase', 'execution'],
      ],
      payload: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: selectedTool?.name ?? 'read_file',
          arguments: selectedToolInput,
        },
      },
    },
    {
      id: 'tool-call-response',
      storyStep: 5,
      label: '09 RESULT',
      method: 'tools/call/result',
      direction: 'gateway→app',
      summary: 'Server returns structured result content. The app decides how to render it for the user.',
      metadata: [
        ['sender', 'MCP Server'],
        ['receiver', 'AI application'],
        ['phase', 'result'],
      ],
      payload: responsePayload ?? {
        jsonrpc: '2.0',
        id: 3,
        result: {
          content: [{ type: 'text', text: 'Simulated tool result returned to the client.' }],
        },
      },
    },
  ];
  const hoveredPacket = protocolPackets.find((packet) => packet.id === hoveredPacketId) ?? null;
  const runningPacket = protocolPackets.find((packet) => packet.id === activePacketId) ?? null;
  const activePacket: ProtocolPacket =
    hoveredPacket ??
    runningPacket ??
    [...protocolPackets].reverse().find((packet: ProtocolPacket) => packet.storyStep <= walkthroughStep) ??
    protocolPackets[0];
  const activeFlowPath = FLOW_PATHS[activePacket.id];
  return (
    <div className="deep-space-void relative h-full min-h-[820px] overflow-hidden text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-1/2 top-1/2 h-[72vw] max-h-[980px] w-[72vw] max-w-[980px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,212,255,0.045)]" />
        <div className="absolute left-[18%] top-[20%] h-1 w-1 rounded-full bg-[var(--signal)] shadow-[0_0_18px_var(--signal)]" />
        <div className="absolute right-[24%] top-[14%] h-1 w-1 rounded-full bg-[var(--telemetry)] shadow-[0_0_18px_var(--telemetry)]" />
        <div className="absolute bottom-[18%] left-[45%] h-1 w-1 rounded-full bg-[rgba(255,255,255,0.6)]" />
      </div>

      <header className="pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2 text-center">
        <div className="hud-label text-[var(--signal)]">MCP INSPECTOR</div>
        <h1 className="mt-1 font-mono text-[13px] uppercase tracking-[0.42em] text-[rgba(226,240,255,0.86)]">
          JSON-RPC Free-Flow Visualizer
        </h1>
      </header>
      <Link to="/advanced/cockpits" className="mcp-hud-button absolute left-6 top-5 z-30" aria-label="Back to cockpit map">
        <ArrowLeft size={13} />
        COCKPITS
      </Link>

      <section className="absolute left-[300px] right-[370px] top-[92px] z-10 h-[600px] max-xl:left-[286px] max-xl:right-[330px] max-lg:inset-x-4 max-lg:top-[250px]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 760 600" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="mcpArrowCyan" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(0,212,255,0.78)" />
            </marker>
            <marker id="mcpArrowAmber" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(240,192,96,0.78)" />
            </marker>
            <filter id="mcpLineGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d="M 154 156 C 242 156 262 206 318 238" fill="none" stroke="rgba(0,212,255,0.42)" strokeWidth="1.5" markerEnd="url(#mcpArrowCyan)" filter="url(#mcpLineGlow)" />
          <path d="M 154 268 C 232 268 264 258 318 258" fill="none" stroke="rgba(0,212,255,0.46)" strokeWidth="1.5" markerEnd="url(#mcpArrowCyan)" filter="url(#mcpLineGlow)" />
          <path d="M 154 380 C 238 380 266 312 318 278" fill="none" stroke="rgba(0,212,255,0.38)" strokeWidth="1.5" markerEnd="url(#mcpArrowCyan)" filter="url(#mcpLineGlow)" />
          <path d="M 380 205 C 380 158 380 124 380 94" fill="none" stroke="rgba(240,192,96,0.45)" strokeWidth="1.4" markerEnd="url(#mcpArrowAmber)" />
          <path d="M 442 238 C 516 206 548 156 606 156" fill="none" stroke="rgba(0,212,255,0.42)" strokeWidth="1.5" markerEnd="url(#mcpArrowCyan)" />
          <path d="M 442 258 C 522 258 548 268 606 268" fill="none" stroke="rgba(0,212,255,0.45)" strokeWidth="1.5" markerEnd="url(#mcpArrowCyan)" />
          <path d="M 442 278 C 518 320 548 380 606 380" fill="none" stroke="rgba(0,212,255,0.38)" strokeWidth="1.5" markerEnd="url(#mcpArrowCyan)" />
          <path d="M 606 406 C 530 494 240 494 154 406" fill="none" stroke="rgba(240,192,96,0.34)" strokeWidth="1.35" strokeDasharray="5 10" markerEnd="url(#mcpArrowAmber)" />
          {activeFlowPath ? (
            <>
              <path
                d={activeFlowPath.path}
                fill="none"
                stroke={activeFlowPath.tone === 'cyan' ? 'rgba(0,212,255,0.95)' : 'rgba(240,192,96,0.95)'}
                strokeDasharray="12 10"
                strokeWidth="3"
                filter="url(#mcpLineGlow)"
                className="mcp-flow-route"
              />
              {[0, 0.33, 0.66].map((delay) => (
                <circle
                  key={delay}
                  r={delay === 0 ? 5 : 3.8}
                  fill={activeFlowPath.tone === 'cyan' ? 'var(--signal)' : 'var(--telemetry)'}
                  filter="url(#mcpLineGlow)"
                >
                  <animateMotion dur="1.9s" begin={`${delay}s`} repeatCount="indefinite" path={activeFlowPath.path} />
                </circle>
              ))}
            </>
          ) : null}
        </svg>

        <div className="absolute left-0 top-[100px] z-10 w-[168px] space-y-4">
          <div className="hud-label text-center">AI APPLICATIONS</div>
          <EcosystemNode active={walkthroughStep === 0} label="Chat interface" detail="Claude Desktop · LibreChat" />
          <EcosystemNode active={walkthroughStep === 0} label="IDEs / editors" detail="Claude Code · Goose" />
          <EcosystemNode active={walkthroughStep === 0} label="Other AI apps" detail="Agents · internal tools" />
        </div>

        <div className="absolute right-0 top-[100px] z-10 w-[168px] space-y-4">
          <div className="hud-label text-center">SERVERS / TOOLS</div>
          <EcosystemNode active={activePacket.method.includes('tools') || activePacket.method.includes('initialize')} label={mergedScenario?.name ?? 'Data + files'} detail={`${toolCount} tools · ${resourceCount} resources`} tone="amber" />
          <EcosystemNode active={activePacket.method.includes('tools')} label="Dev tools" detail="Git · Sentry · CI" tone="amber" />
          <EcosystemNode active={activePacket.method.includes('tools/call')} label={selectedTool?.name ?? 'Selected tool'} detail="called through gateway" tone="amber" />
        </div>

        <div className={cn('absolute left-1/2 top-8 z-20 w-[230px] -translate-x-1/2 border px-4 py-3 text-center transition-all', activePacket.method.includes('registry') ? 'border-[rgba(240,192,96,0.7)] bg-[rgba(240,192,96,0.12)] shadow-[0_0_30px_rgba(240,192,96,0.13)]' : 'border-[rgba(240,192,96,0.2)] bg-[rgba(2,8,16,0.64)]')}>
          <div className="hud-label text-[var(--telemetry)]">MCP REGISTRY</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.13em] text-[rgba(226,240,255,0.7)]">{mergedScenario?.name ?? 'catalog · trust · descriptors'}</div>
        </div>

        <div className={cn('absolute left-1/2 top-[196px] z-20 w-[250px] -translate-x-1/2 rounded-2xl border px-5 py-5 text-center transition-all', activePacket.direction.includes('gateway') || activePacket.method.includes('gateway') ? 'border-[rgba(0,212,255,0.72)] bg-[rgba(0,212,255,0.12)] shadow-[0_0_42px_rgba(0,212,255,0.18)]' : 'border-[rgba(0,212,255,0.24)] bg-[rgba(2,8,16,0.72)]')}>
          <div className="hud-label text-[var(--signal)]">MCP GATEWAY</div>
          <div className="mt-2 font-mono text-[18px] uppercase tracking-[0.2em] text-[rgba(226,240,255,0.88)]">Protocol Core</div>
          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[8px] uppercase tracking-[0.08em] text-[rgba(122,164,204,0.86)]">
            <span className="border border-[rgba(0,212,255,0.12)] py-1">Auth</span>
            <span className="border border-[rgba(0,212,255,0.12)] py-1">Route</span>
            <span className="border border-[rgba(0,212,255,0.12)] py-1">Audit</span>
          </div>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--telemetry)]">{currentStep.method}</div>
        </div>

        <div className="absolute bottom-[104px] left-1/2 z-30 grid w-[min(720px,96%)] -translate-x-1/2 grid-cols-9 gap-2">
          {protocolPackets.map((packet) => {
            const active = packet.id === activePacket.id;
            const isReturn = packet.direction.includes('server') || packet.direction.includes('registry→') || packet.direction.includes('gateway→app');
            return (
              <button
                key={packet.id}
                type="button"
                onMouseEnter={() => setHoveredPacketId(packet.id)}
                onMouseLeave={() => setHoveredPacketId(null)}
                onFocus={() => setHoveredPacketId(packet.id)}
                onBlur={() => setHoveredPacketId(null)}
                onClick={() => {
                  setActivePacketId(packet.id);
                  setWalkthroughStep(packet.storyStep);
                }}
                className={cn(
                  'min-h-[62px] border px-2 py-2 text-left font-mono transition-all',
                  active
                    ? 'border-[rgba(0,212,255,0.74)] bg-[rgba(0,212,255,0.14)] text-[var(--signal)] shadow-[0_0_28px_rgba(0,212,255,0.16)]'
                    : isReturn
                      ? 'border-[rgba(240,192,96,0.2)] bg-[rgba(2,8,16,0.62)] text-[rgba(240,192,96,0.7)] hover:border-[rgba(240,192,96,0.55)]'
                      : 'border-[rgba(0,212,255,0.16)] bg-[rgba(2,8,16,0.62)] text-[rgba(226,240,255,0.58)] hover:border-[rgba(0,212,255,0.55)]'
                )}
              >
                <div className="text-[8px] uppercase tracking-[0.13em] text-[var(--telemetry)]">{packet.label}</div>
                <div className="mt-1 truncate text-[10px] uppercase tracking-[0.11em]">{packet.method}</div>
                <div className="mt-1 truncate text-[7px] uppercase tracking-[0.08em] opacity-70">{packet.direction}</div>
              </button>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-1/2 w-[min(680px,92%)] -translate-x-1/2 border border-[rgba(0,212,255,0.12)] bg-[rgba(2,8,16,0.5)] px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="hud-label">PROTOCOL READ</div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[rgba(226,240,255,0.78)]">{activePacket.summary}</div>
            </div>
            <div className="hidden min-w-[150px] border-l border-[rgba(0,212,255,0.12)] pl-4 font-mono text-[8px] uppercase leading-5 tracking-[0.1em] text-[rgba(122,164,204,0.8)] xl:block">
              beginner: map<br />
              expert: packets + policy
            </div>
          </div>
        </div>
      </section>

      <aside className="hud-panel absolute left-6 top-24 z-20 w-[250px] p-4 max-lg:left-4 max-lg:top-20 max-sm:w-[calc(100%-2rem)]">
        <div className="hud-label text-[var(--signal)]">LEARN MCP BY WATCHING</div>
        <div className="mt-3 font-mono text-[15px] uppercase tracking-[0.14em] text-[rgba(226,240,255,0.9)]">
          {activePacket.method}
        </div>
        <div className="mt-3 text-sm leading-6 text-[rgba(226,240,255,0.68)]">
          {activePacket.summary}
        </div>
        <div className="mt-4 border-t border-[rgba(0,212,255,0.12)] pt-3 font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-[rgba(122,164,204,0.78)]">
          Press Run, then follow one highlighted packet at a time. Hover any packet to inspect its metadata and JSON.
        </div>
        {errorText ? <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--critical)]">{errorText}</div> : null}
      </aside>

      <aside className="hud-panel absolute left-6 top-[405px] z-20 w-[260px] p-4 max-lg:hidden">
        <div className="hud-label">CAPABILITY TRIAD</div>
        <div className="mt-4 space-y-2">
          <CapabilityButton active={selectedTreeItem?.type === 'tool'} label="TOOLS" count={toolCount} onClick={() => selectFirstCapability('tool')} />
          <CapabilityButton active={selectedTreeItem?.type === 'resource'} label="RESOURCES" count={resourceCount} onClick={() => selectFirstCapability('resource')} />
          <CapabilityButton active={selectedTreeItem?.type === 'prompt'} label="PROMPTS" count={promptCount} onClick={() => selectFirstCapability('prompt')} />
        </div>
      </aside>

      <aside className="hud-panel absolute right-6 top-24 z-20 w-[340px] p-4 max-xl:w-[300px] max-lg:right-4 max-lg:top-[236px] max-sm:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="hud-label">PACKET INSPECTOR</div>
            <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--telemetry)]">
              {activePacket.method}
            </div>
          </div>
          <div className="rounded-full border border-[rgba(240,192,96,0.28)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--telemetry)]">
            {activePacket.direction}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {activePacket.metadata.map((entry) => {
            const [label, value] = entry;
            return (
              <div key={label} className="border border-[rgba(0,212,255,0.1)] bg-[rgba(2,8,16,0.38)] px-2 py-2">
                <div className="hud-label text-[8px]">{label}</div>
                <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--telemetry)]">{value}</div>
              </div>
            );
          })}
        </div>
        <pre className="mt-4 max-h-[300px] overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-4 text-[rgba(226,240,255,0.68)]">
          {compactJson(activePacket.payload ?? latestMessage?.payload ?? responsePayload)}
        </pre>
      </aside>

      <nav className="hud-panel absolute bottom-5 left-1/2 z-30 flex w-[min(1180px,calc(100%-2rem))] -translate-x-1/2 items-center justify-between gap-4 px-4 py-3 max-lg:flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <button className="mcp-hud-button" type="button" onClick={() => void runEndToEndStory(false)} disabled={isRunningLesson}>
            {isRunningLesson ? <Pause size={13} /> : <Play size={13} />}
            {isRunningLesson ? 'PLAYING' : 'RUN LESSON'}
          </button>
          <button className="mcp-hud-button" type="button" onClick={resetProtocolRun}>
            <RotateCcw size={13} />
            RESET
          </button>
        </div>

        <div className="flex flex-1 flex-wrap justify-center gap-2">
          {STORY_STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setWalkthroughStep(step.id)}
              className={cn(
                'min-w-[68px] border px-2 py-2 text-left font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
                step.id === walkthroughStep
                  ? 'border-[rgba(0,212,255,0.62)] bg-[rgba(0,212,255,0.12)] text-[var(--signal)]'
                  : 'border-[rgba(0,212,255,0.12)] bg-[rgba(2,8,16,0.44)] text-[rgba(226,240,255,0.48)] hover:text-[var(--text-primary)]'
              )}
            >
              <span className="block text-[8px] text-[var(--telemetry)]">0{step.id + 1}</span>
              {step.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="MCP scenario"
            value={activeScenario?.id ?? ''}
            onChange={(event) => {
              const nextScenario = ScenarioLoader.findById(event.target.value);
              if (!nextScenario) return;
              setActiveScenario(nextScenario);
              setSelectedTreeItem(null);
              setResponsePayload(null);
            }}
            className="h-9 max-w-[190px] border border-[rgba(0,212,255,0.18)] bg-[rgba(2,8,16,0.82)] px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--telemetry)] outline-none"
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={cn(
                'border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]',
                mode === item.id
                  ? 'border-[rgba(240,192,96,0.54)] bg-[rgba(240,192,96,0.1)] text-[var(--telemetry)]'
                  : 'border-[rgba(240,192,96,0.14)] bg-transparent text-[rgba(240,192,96,0.42)]'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function EcosystemNode({
  active,
  label,
  detail,
  tone = 'cyan',
}: {
  active: boolean;
  label: string;
  detail: string;
  tone?: 'cyan' | 'amber';
}) {
  return (
    <div
      className={cn(
        'border px-3 py-3 text-center transition-all',
        active
          ? tone === 'amber'
            ? 'border-[rgba(240,192,96,0.62)] bg-[rgba(240,192,96,0.1)] shadow-[0_0_26px_rgba(240,192,96,0.12)]'
            : 'border-[rgba(0,212,255,0.62)] bg-[rgba(0,212,255,0.1)] shadow-[0_0_26px_rgba(0,212,255,0.12)]'
          : 'border-[rgba(0,212,255,0.12)] bg-[rgba(2,8,16,0.56)]'
      )}
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.13em] text-[rgba(226,240,255,0.86)]">{label}</div>
      <div className="mt-1 font-mono text-[8px] uppercase leading-4 tracking-[0.08em] text-[rgba(122,164,204,0.75)]">{detail}</div>
    </div>
  );
}

function CapabilityButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors',
        active
          ? 'border-[rgba(0,212,255,0.55)] bg-[rgba(0,212,255,0.1)] text-[var(--signal)]'
          : 'border-[rgba(0,212,255,0.12)] bg-transparent text-[rgba(226,240,255,0.5)] hover:text-[var(--text-primary)]'
      )}
    >
      <span>{label}</span>
      <span className="text-[var(--telemetry)]">{String(count).padStart(2, '0')}</span>
    </button>
  );
}
