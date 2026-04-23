import type { MCPScenario } from '../types';

export const codeAssistantScenario: MCPScenario = {
  id: 'code-assistant',
  name: 'Code Assistant',
  description: 'Simulates a code quality MCP server - lint, format, and test execution.',
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
    {
      uri: 'code://config/eslint',
      name: '.eslintrc',
      description: 'Active ESLint configuration',
      mimeType: 'application/json',
    },
    {
      uri: 'code://config/prettier',
      name: '.prettierrc',
      description: 'Active Prettier configuration',
      mimeType: 'application/json',
    },
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
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              file: params.path,
              errors: [
                {
                  line: 12,
                  column: 5,
                  rule: 'no-unused-vars',
                  message: "'tempResult' is assigned a value but never used.",
                  severity: 'error',
                },
              ],
              warnings: [
                {
                  line: 8,
                  column: 1,
                  rule: 'no-console',
                  message: 'Unexpected console statement.',
                  severity: 'warn',
                },
              ],
              summary: '1 error, 1 warning',
            },
            null,
            2
          ),
        },
      ],
    }),
    format: (params) => ({
      content: [
        {
          type: 'text',
          text: `// Formatted with Prettier (${params.parser ?? 'typescript'})\nexport function main(): void {\n  console.log("formatted");\n}\n`,
        },
      ],
    }),
    run_tests: (params) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              pattern: params.pattern,
              passed: 14,
              failed: 1,
              skipped: 2,
              duration: '1.23s',
              failures: [
                {
                  test: 'formatCurrency handles negative values',
                  file: 'src/utils/currency.test.ts',
                  error: 'Expected "-$10.00" but received "($10.00)"',
                },
              ],
            },
            null,
            2
          ),
        },
      ],
    }),
  },
  resourceHandlers: {
    'code://config/eslint': () => ({
      contents: [
        {
          uri: 'code://config/eslint',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
              rules: { 'no-console': 'warn', 'no-unused-vars': 'error' },
            },
            null,
            2
          ),
        },
      ],
    }),
    'code://config/prettier': () => ({
      contents: [
        {
          uri: 'code://config/prettier',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              semi: true,
              singleQuote: true,
              tabWidth: 2,
              trailingComma: 'es5',
            },
            null,
            2
          ),
        },
      ],
    }),
  },
  promptHandlers: {
    code_review: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please review the code at ${args.path}. Run lint first, then provide feedback on quality, correctness, and style.`,
        },
      },
    ],
    fix_lint_errors: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Use run_lint on ${args.path}, then fix each error in the file. Preserve behavior - only fix style and lint issues.`,
        },
      },
    ],
    write_tests: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Write comprehensive Vitest tests for the function "${args.functionName}" in ${args.path}. Cover the happy path, edge cases, and error conditions.`,
        },
      },
    ],
  },
};
