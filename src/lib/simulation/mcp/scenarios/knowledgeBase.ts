import type { MCPScenario } from '../types';

const KB_ARTICLES: Record<string, string> = {
  'kb://articles/mcp-overview':
    '# MCP Overview\n\nThe Model Context Protocol (MCP) is a JSON-RPC 2.0-based standard for connecting AI models to external tools, resources, and prompts. It defines three capability types: Tools (callable functions), Resources (readable content), and Prompts (templated messages).',
  'kb://articles/tool-calling':
    "# Tool Calling\n\nTools in MCP are callable functions. The server declares them via tools/list. The client invokes them via tools/call with a name and arguments object matching the tool's inputSchema.",
  'kb://articles/resources':
    '# Resources\n\nResources are readable content addressed by URI. Use resources/list to discover them and resources/read to retrieve their content. Resources can be files, database records, API responses, or any addressable content.',
  'kb://articles/prompts':
    '# Prompts\n\nPrompts are templates that the server provides. Use prompts/list to discover them and prompts/get to instantiate with arguments. They return structured message arrays ready to send to an LLM.',
  'kb://articles/error-codes':
    '# MCP Error Codes\n\n-32700: Parse error\n-32600: Invalid request\n-32601: Method not found\n-32602: Invalid params\n-32603: Internal error',
};

export const knowledgeBaseScenario: MCPScenario = {
  id: 'knowledge-base',
  name: 'Knowledge Base',
  description:
    'Simulates a documentation knowledge base - full-text search and article retrieval.',
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
    {
      uri: 'kb://articles/mcp-overview',
      name: 'MCP Overview',
      description: 'What MCP is and how it works',
      mimeType: 'text/markdown',
    },
    {
      uri: 'kb://articles/tool-calling',
      name: 'Tool Calling',
      description: 'How tools/list and tools/call work',
      mimeType: 'text/markdown',
    },
    {
      uri: 'kb://articles/resources',
      name: 'Resources',
      description: 'Resource listing and reading',
      mimeType: 'text/markdown',
    },
    {
      uri: 'kb://articles/prompts',
      name: 'Prompts',
      description: 'Prompt discovery and instantiation',
      mimeType: 'text/markdown',
    },
    {
      uri: 'kb://articles/error-codes',
      name: 'Error Codes',
      description: 'JSON-RPC error code reference',
      mimeType: 'text/markdown',
    },
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
