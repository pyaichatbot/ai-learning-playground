import { ALL_SCENARIOS } from '../mcp/scenarios';
import type { MCPScenario } from '../mcp/types';

const CUSTOM_SCENARIOS_KEY = 'mcp-inspector:custom-scenarios';

export const ScenarioLoader = {
  listBuiltIn(): MCPScenario[] {
    return ALL_SCENARIOS;
  },

  listCustom(): MCPScenario[] {
    try {
      const raw = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
      return raw ? (JSON.parse(raw) as MCPScenario[]) : [];
    } catch {
      return [];
    }
  },

  listAll(): MCPScenario[] {
    return [...this.listBuiltIn(), ...this.listCustom()];
  },

  findById(id: string): MCPScenario | undefined {
    return this.listAll().find((scenario) => scenario.id === id);
  },

  saveCustom(scenario: MCPScenario): void {
    const existing = this.listCustom().filter((candidate) => candidate.id !== scenario.id);
    localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify([...existing, scenario]));
  },

  deleteCustom(id: string): void {
    const remaining = this.listCustom().filter((scenario) => scenario.id !== id);
    localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(remaining));
  },
};
