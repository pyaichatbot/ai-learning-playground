import { SimulatedProtocol } from '../core/SimulatedProtocol';
import type { JSONRPCRequest, JSONRPCResponse, MCPScenario, MCPToolResult } from './types';

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
    } catch (error) {
      response = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: String(error),
        },
      };
    }

    this.emit('response', response);
    return response;
  }

  private async dispatch(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    if (!this.scenario) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32603, message: 'No scenario loaded' },
      };
    }

    if (request.method !== 'initialize' && this.state === 'idle') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32600,
          message: 'Not initialized - call initialize first',
        },
      };
    }

    switch (request.method) {
      case 'initialize':
        return this.handleInitialize(request);
      case 'tools/list':
        return this.handleToolsList(request);
      case 'tools/call':
        return this.handleToolsCall(request);
      case 'resources/list':
        return this.handleResourcesList(request);
      case 'resources/read':
        return this.handleResourcesRead(request);
      case 'prompts/list':
        return this.handlePromptsList(request);
      case 'prompts/get':
        return this.handlePromptsGet(request);
      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32601, message: `Method not found: ${request.method}` },
        };
    }
  }

  private handleInitialize(request: JSONRPCRequest): JSONRPCResponse {
    this.state = 'initialized';
    this.emit('state-change', 'initialized');

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2025-11-25',
        serverInfo: this.scenario!.serverInfo,
        capabilities: this.scenario!.capabilities,
      },
    };
  }

  private handleToolsList(request: JSONRPCRequest): JSONRPCResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools: this.scenario!.tools },
    };
  }

  private handleToolsCall(request: JSONRPCRequest): JSONRPCResponse {
    const params = (request.params ?? {}) as {
      name?: string;
      arguments?: Record<string, unknown>;
    };
    const handler = params.name ? this.scenario!.toolHandlers[params.name] : undefined;

    if (!handler || !params.name) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32601, message: `Unknown tool: ${params.name ?? 'undefined'}` },
      };
    }

    const result: MCPToolResult = handler(params.arguments ?? {});
    return { jsonrpc: '2.0', id: request.id, result };
  }

  private handleResourcesList(request: JSONRPCRequest): JSONRPCResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { resources: this.scenario!.resources },
    };
  }

  private handleResourcesRead(request: JSONRPCRequest): JSONRPCResponse {
    const params = (request.params ?? {}) as { uri?: string };
    const handler = params.uri ? this.scenario!.resourceHandlers[params.uri] : undefined;

    if (!handler || !params.uri) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32602, message: `Resource not found: ${params.uri ?? 'undefined'}` },
      };
    }

    return { jsonrpc: '2.0', id: request.id, result: handler() };
  }

  private handlePromptsList(request: JSONRPCRequest): JSONRPCResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { prompts: this.scenario!.prompts },
    };
  }

  private handlePromptsGet(request: JSONRPCRequest): JSONRPCResponse {
    const params = (request.params ?? {}) as {
      name?: string;
      arguments?: Record<string, string>;
    };
    const handler = params.name ? this.scenario!.promptHandlers[params.name] : undefined;

    if (!handler || !params.name) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32601, message: `Unknown prompt: ${params.name ?? 'undefined'}` },
      };
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { messages: handler(params.arguments ?? {}) },
    };
  }

  reset(): void {
    this.state = 'idle';
    this.clearLog();
  }
}
