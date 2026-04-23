import { beforeEach, describe, expect, it } from 'vitest';
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
      const response = await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 'test', version: '1.0' },
          capabilities: {},
        },
      });

      expect(response.error).toBeUndefined();
      expect((response.result as Record<string, unknown>).protocolVersion).toBe('2025-11-25');
      expect((response.result as Record<string, unknown>).serverInfo).toEqual(
        filesystemScenario.serverInfo
      );
    });

    it('returns not initialized error if tools/list called before initialize', async () => {
      const response = await server.handle({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      });

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32600);
    });
  });

  describe('tools/list', () => {
    it('returns all tools after initialization', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      const response = await server.handle({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      });

      expect(response.error).toBeUndefined();
      const tools = (response.result as { tools: unknown[] }).tools;
      expect(tools).toHaveLength(filesystemScenario.tools.length);
      expect(tools[0]).toMatchObject({ name: 'read_file' });
    });
  });

  describe('tools/call', () => {
    it('returns tool result for a valid call', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      const response = await server.handle({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'list_dir', arguments: { path: '/project' } },
      });

      expect(response.error).toBeUndefined();
      const content = (response.result as {
        content: Array<{ type: string; text: string }>;
      }).content;
      expect(content[0].type).toBe('text');
      expect(content[0].text).toContain('README.md');
    });

    it('returns method-not-found for unknown tool', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      const response = await server.handle({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      });

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32601);
    });
  });

  describe('resources/list', () => {
    it('returns all resources', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      const response = await server.handle({
        jsonrpc: '2.0',
        id: 5,
        method: 'resources/list',
      });

      const resources = (response.result as { resources: unknown[] }).resources;
      expect(resources).toHaveLength(filesystemScenario.resources.length);
    });
  });

  describe('resources/read', () => {
    it('returns resource content by URI', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      const response = await server.handle({
        jsonrpc: '2.0',
        id: 6,
        method: 'resources/read',
        params: { uri: 'file:///project/README.md' },
      });

      expect(response.error).toBeUndefined();
      const contents = (response.result as { contents: Array<{ text: string }> }).contents;
      expect(contents[0].text).toContain('My Project');
    });

    it('returns error for unknown URI', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      const response = await server.handle({
        jsonrpc: '2.0',
        id: 7,
        method: 'resources/read',
        params: { uri: 'file:///not/found' },
      });

      expect(response.error).toBeDefined();
    });
  });

  describe('prompts/list + prompts/get', () => {
    it('lists prompts', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      const response = await server.handle({
        jsonrpc: '2.0',
        id: 8,
        method: 'prompts/list',
      });

      const prompts = (response.result as { prompts: unknown[] }).prompts;
      expect(prompts).toHaveLength(filesystemScenario.prompts.length);
    });

    it('returns prompt messages on get', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      const response = await server.handle({
        jsonrpc: '2.0',
        id: 9,
        method: 'prompts/get',
        params: {
          name: 'summarize_file',
          arguments: { path: '/project/README.md' },
        },
      });

      expect(response.error).toBeUndefined();
      const messages = (response.result as { messages: unknown[] }).messages;
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('unknown method', () => {
    it('returns -32601 for unknown method after init', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      const response = await server.handle({
        jsonrpc: '2.0',
        id: 10,
        method: 'not/a/method',
      });

      expect(response.error?.code).toBe(-32601);
    });
  });

  describe('event log', () => {
    it('logs request and response events for each call', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      const log = server.getEventLog();
      expect(log.some((event) => event.type === 'request')).toBe(true);
      expect(log.some((event) => event.type === 'response')).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears state so tools/list fails before re-initialize', async () => {
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          clientInfo: { name: 't', version: '1' },
          capabilities: {},
        },
      });

      server.reset();

      const response = await server.handle({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      });

      expect(response.error).toBeDefined();
    });
  });
});
