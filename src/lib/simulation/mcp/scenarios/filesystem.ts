import type { MCPScenario } from '../types';

const FILES: Record<string, string> = {
  '/project/README.md':
    '# My Project\n\nA demonstration project for the MCP Inspector.\n\n## Features\n- Tool calling\n- Resource reading\n- Prompt generation',
  '/project/src/index.ts':
    'export function main(): void {\n  console.log("Hello from simulated filesystem");\n}\nmain();',
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
    'Simulates a filesystem MCP server - lists directories, reads files, and generates summarization prompts.',
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
