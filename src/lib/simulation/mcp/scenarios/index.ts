export type {
  MCPPrompt,
  MCPPromptMessage,
  MCPResource,
  MCPResourceContent,
  MCPScenario,
  MCPServerCapabilities,
  MCPTool,
  MCPToolResult,
} from '../types';

export { filesystemScenario } from './filesystem';
export { weatherScenario } from './weather';
export { knowledgeBaseScenario } from './knowledgeBase';
export { codeAssistantScenario } from './codeAssistant';
export { githubScenario } from './github';

import type { MCPScenario } from '../types';
import { filesystemScenario } from './filesystem';
import { weatherScenario } from './weather';
import { knowledgeBaseScenario } from './knowledgeBase';
import { codeAssistantScenario } from './codeAssistant';
import { githubScenario } from './github';

export const ALL_SCENARIOS: MCPScenario[] = [
  filesystemScenario,
  weatherScenario,
  knowledgeBaseScenario,
  codeAssistantScenario,
  githubScenario,
];
