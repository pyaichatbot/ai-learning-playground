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
    if (!this.server) {
      throw new Error('Not connected - call connect(server) first');
    }

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
