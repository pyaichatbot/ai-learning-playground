import type { MCPScenario } from '../types';

const MOCK_PRS = [
  {
    number: 42,
    title: 'feat: add dark mode toggle',
    author: 'alice',
    state: 'open',
    labels: ['enhancement'],
    comments: 3,
  },
  {
    number: 41,
    title: 'fix: memory leak in event listener',
    author: 'bob',
    state: 'open',
    labels: ['bug'],
    comments: 1,
  },
  {
    number: 40,
    title: 'refactor: extract auth middleware',
    author: 'carol',
    state: 'merged',
    labels: ['refactor'],
    comments: 5,
  },
];

const MOCK_ISSUES: Record<
  string,
  {
    number: number;
    title: string;
    body: string;
    author: string;
    labels: string[];
    state: string;
  }
> = {
  '101': {
    number: 101,
    title: 'Dark mode text contrast is too low',
    body: 'In dark mode, the secondary text (#999) fails WCAG AA contrast on the dark background (#1a1a1a). Needs to be at least #aaa.',
    author: 'dave',
    labels: ['accessibility', 'bug'],
    state: 'open',
  },
  '102': {
    number: 102,
    title: 'Add keyboard shortcut for scenario switching',
    body: 'Would love Ctrl+K to open scenario selector. Consistent with VS Code and Linear conventions.',
    author: 'eve',
    labels: ['enhancement'],
    state: 'open',
  },
};

export const githubScenario: MCPScenario = {
  id: 'github',
  name: 'GitHub Server',
  description: 'Simulates a GitHub MCP server - lists PRs, reads issues, and posts comments.',
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
    {
      uri: 'github://repo/info',
      name: 'Repository Info',
      description: 'Repo metadata and stats',
      mimeType: 'application/json',
    },
    {
      uri: 'github://repo/contributors',
      name: 'Contributors',
      description: 'Contributor list',
      mimeType: 'application/json',
    },
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
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              commentId: Math.floor(Math.random() * 9000) + 1000,
              on: `#${params.number}`,
              body: params.body,
              createdAt: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    }),
  },
  resourceHandlers: {
    'github://repo/info': () => ({
      contents: [
        {
          uri: 'github://repo/info',
          mimeType: 'application/json',
          text: JSON.stringify(
            { name: 'ai-learning-playground', stars: 1204, forks: 87, openIssues: 14, language: 'TypeScript' },
            null,
            2
          ),
        },
      ],
    }),
    'github://repo/contributors': () => ({
      contents: [
        {
          uri: 'github://repo/contributors',
          mimeType: 'application/json',
          text: JSON.stringify(
            [
              { login: 'alice', contributions: 342 },
              { login: 'bob', contributions: 187 },
              { login: 'carol', contributions: 95 },
            ],
            null,
            2
          ),
        },
      ],
    }),
  },
  promptHandlers: {
    pr_review: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Review PR #${args.number}. List the files changed, assess the code quality, and write a constructive review comment. Use list_prs to get PR details first.`,
        },
      },
    ],
    triage_issue: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Triage issue #${args.number}. Use get_issue to read it, then classify its priority (P0-P3), suggest an assignee, and draft a polite acknowledgment comment.`,
        },
      },
    ],
  },
};
