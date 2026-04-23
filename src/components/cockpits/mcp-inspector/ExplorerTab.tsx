import { useMemo, useState } from 'react';
import { AnatomyTree } from './AnatomyTree';
import { ScenarioSelector } from './ScenarioSelector';
import { SchemaBuilder } from './SchemaBuilder';
import { SchemaDetail } from './SchemaDetail';
import { useMCPStore } from '@/lib/store';
import { MCPClient } from '@/lib/simulation/mcp/MCPClient';
import { MCPServer } from '@/lib/simulation/mcp/MCPServer';

export function ExplorerTab() {
  const { activeScenario, customPrompts, customResources, customTools } = useMCPStore();
  const [showBuilder, setShowBuilder] = useState(false);

  const client = useMemo(() => {
    const server = new MCPServer();
    const nextClient = new MCPClient();

    if (activeScenario) {
      server.loadScenario(activeScenario);
      nextClient.connect(server);
    }

    return nextClient;
  }, [activeScenario]);

  const mergedScenario = useMemo(() => {
    if (!activeScenario) return null;
    return {
      ...activeScenario,
      tools: [...activeScenario.tools, ...customTools],
      resources: [...activeScenario.resources, ...customResources],
      prompts: [...activeScenario.prompts, ...customPrompts],
    };
  }, [activeScenario, customPrompts, customResources, customTools]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-content-subtle/20 px-4 py-4">
        <div className="space-y-2">
          <h2 className="font-medium text-content">Explorer</h2>
          <p className="text-sm text-content-muted">
            Select a server, inspect its anatomy, and make calls into the simulation.
          </p>
        </div>
        <div className="mt-4">
          <ScenarioSelector />
        </div>
      </div>

      {mergedScenario ? (
        <div className="min-h-0 flex-1 md:flex">
          <div className="border-b border-content-subtle/20 md:w-72 md:border-b-0 md:border-r">
            <AnatomyTree
              tools={mergedScenario.tools}
              resources={mergedScenario.resources}
              prompts={mergedScenario.prompts}
              onAddCustom={() => setShowBuilder(true)}
            />
          </div>

          <div className="min-w-0 flex-1">
            <SchemaDetail scenario={mergedScenario} client={client} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-content-muted">
          Select a scenario to begin.
        </div>
      )}

      {showBuilder ? <SchemaBuilder onClose={() => setShowBuilder(false)} /> : null}
    </div>
  );
}
