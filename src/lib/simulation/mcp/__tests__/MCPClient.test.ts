import { beforeEach, describe, expect, it } from 'vitest';
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
    const response = await client.initialize();
    expect(response.error).toBeUndefined();
    expect((response.result as Record<string, unknown>).protocolVersion).toBe('2025-11-25');
  });

  it('listTools returns tool array after initialize', async () => {
    await client.initialize();
    const response = await client.listTools();
    const tools = (response.result as { tools: unknown[] }).tools;
    expect(tools.length).toBeGreaterThan(0);
  });

  it('callTool returns result', async () => {
    await client.initialize();
    const response = await client.callTool('list_dir', { path: '/project' });
    expect(response.error).toBeUndefined();
  });

  it('listResources returns resource array', async () => {
    await client.initialize();
    const response = await client.listResources();
    const resources = (response.result as { resources: unknown[] }).resources;
    expect(resources.length).toBeGreaterThan(0);
  });

  it('readResource returns content', async () => {
    await client.initialize();
    const response = await client.readResource('file:///project/README.md');
    expect(response.error).toBeUndefined();
  });

  it('listPrompts returns prompts', async () => {
    await client.initialize();
    const response = await client.listPrompts();
    const prompts = (response.result as { prompts: unknown[] }).prompts;
    expect(prompts.length).toBeGreaterThan(0);
  });

  it('getPrompt returns messages', async () => {
    await client.initialize();
    const response = await client.getPrompt('summarize_file', {
      path: '/project/README.md',
    });
    const messages = (response.result as { messages: unknown[] }).messages;
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
