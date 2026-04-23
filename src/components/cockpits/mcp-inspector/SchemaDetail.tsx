import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Textarea } from '@/components/shared';
import { useMCPStore } from '@/lib/store';
import type {
  JSONRPCRequest,
  JSONRPCResponse,
  MCPPrompt,
  MCPResource,
  MCPScenario,
  MCPTool,
} from '@/lib/simulation/mcp/types';
import { generateId } from '@/lib/utils';
import { PayloadAnnotator } from './PayloadAnnotator';
import { MCPClient } from '@/lib/simulation/mcp/MCPClient';

interface SchemaDetailProps {
  scenario: MCPScenario;
  client: MCPClient;
}

function getDefaultInput(entity: MCPTool | MCPPrompt | MCPResource, type: 'tool' | 'prompt' | 'resource') {
  if (type === 'resource') {
    const resource = entity as MCPResource;
    return JSON.stringify({ uri: resource.uri }, null, 2);
  }

  if (type === 'prompt') {
    const prompt = entity as MCPPrompt;
    const args = Object.fromEntries(
      (prompt.arguments ?? []).map((arg) => [arg.name, `example_${arg.name}`])
    );
    return JSON.stringify(args, null, 2);
  }

  const tool = entity as MCPTool;
  const args = Object.fromEntries(
    Object.keys(tool.inputSchema.properties).map((key) => {
      if (key.includes('path')) return [key, '/project/README.md'];
      if (key.includes('uri')) return [key, 'file:///project/README.md'];
      if (key.includes('city')) return [key, 'Berlin'];
      return [key, `example_${key}`];
    })
  );
  return JSON.stringify(args, null, 2);
}

export function SchemaDetail({ scenario, client }: SchemaDetailProps) {
  const {
    selectedTreeItem,
    appendMessage,
    setConnectionState,
    connectionState,
  } = useMCPStore();
  const [draftInput, setDraftInput] = useState('{}');
  const [responsePayload, setResponsePayload] = useState<unknown>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [injectError, setInjectError] = useState(false);
  const clientLogIndex = useRef(0);

  const selectedEntity = useMemo(() => {
    if (!selectedTreeItem) return null;
    if (selectedTreeItem.type === 'tool') {
      return scenario.tools.find((tool) => tool.name === selectedTreeItem.name) ?? null;
    }
    if (selectedTreeItem.type === 'resource') {
      return scenario.resources.find((resource) => resource.name === selectedTreeItem.name) ?? null;
    }
    return scenario.prompts.find((prompt) => prompt.name === selectedTreeItem.name) ?? null;
  }, [scenario, selectedTreeItem]);

  useEffect(() => {
    if (!selectedTreeItem || !selectedEntity) {
      setDraftInput('{}');
      return;
    }
    setDraftInput(getDefaultInput(selectedEntity, selectedTreeItem.type));
    setResponsePayload(null);
    setErrorText(null);
  }, [selectedEntity, selectedTreeItem]);

  if (!selectedTreeItem || !selectedEntity) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="max-w-lg p-8 text-center">
          <h3 className="font-display text-2xl font-semibold text-content">Select an entity</h3>
          <p className="mt-2 text-sm text-content-muted">
            Choose a tool, resource, or prompt from the anatomy tree to inspect its schema and run it.
          </p>
        </Card>
      </div>
    );
  }

  const pushClientEvents = () => {
    const newEvents = client.getEventLog().slice(clientLogIndex.current);
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

  const runSelectedEntity = async () => {
    setErrorText(null);
    setConnectionState('connecting');

    let parsedInput: Record<string, unknown>;
    try {
      parsedInput = draftInput.trim() ? (JSON.parse(draftInput) as Record<string, unknown>) : {};
    } catch {
      setErrorText('Input must be valid JSON.');
      setConnectionState('error');
      return;
    }

    try {
      const before = client.getEventLog().length;
      await client.initialize();
      let response: JSONRPCResponse;

      if (selectedTreeItem.type === 'tool') {
        response = await client.callTool(
          injectError ? 'nonexistent_tool' : (selectedEntity as MCPTool).name,
          parsedInput
        );
      } else if (selectedTreeItem.type === 'resource') {
        const resource = selectedEntity as MCPResource;
        response = await client.readResource(
          injectError ? 'file:///does/not/exist' : String(parsedInput.uri ?? resource.uri)
        );
      } else {
        response = await client.getPrompt(
          injectError ? 'nonexistent_prompt' : (selectedEntity as MCPPrompt).name,
          parsedInput as Record<string, string>
        );
      }

      clientLogIndex.current = before;
      pushClientEvents();
      setResponsePayload(response);
      setConnectionState(response.error ? 'error' : 'connected');
      setInjectError(false);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Call failed');
      setConnectionState('error');
    }
  };

  return (
    <div className="grid h-full gap-4 overflow-auto p-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface-muted px-2 py-1 text-2xs uppercase tracking-[0.18em] text-content-muted">
              {selectedTreeItem.type}
            </span>
            <h2 className="font-display text-2xl font-semibold text-content">
              {selectedTreeItem.name}
            </h2>
            <span className="ml-auto rounded-full bg-surface-muted px-2 py-1 text-2xs text-content-subtle">
              {connectionState}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-medium text-content">Schema</h3>
              <pre className="overflow-auto rounded-2xl border border-content-subtle/20 bg-surface-muted p-4 text-xs text-content">
                {JSON.stringify(selectedEntity, null, 2)}
              </pre>
            </div>

            <Textarea
              label="Editable input"
              value={draftInput}
              onChange={(event) => setDraftInput(event.target.value)}
              className="min-h-[220px] font-mono text-xs"
            />

            {errorText ? (
              <div className="rounded-2xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
                {errorText}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void runSelectedEntity()}>Call</Button>
              <Button variant="secondary" onClick={() => setInjectError((current) => !current)}>
                {injectError ? 'Error Injection Armed' : 'Inject Error'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {responsePayload ? (
          <PayloadAnnotator payload={responsePayload} title="Response" />
        ) : (
          <Card className="p-5">
            <h3 className="font-medium text-content">Response panel</h3>
            <p className="mt-2 text-sm text-content-muted">
              Run the selected entity to inspect the annotated response payload here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
