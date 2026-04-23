import { useEffect, useMemo } from 'react';
import { useMCPStore } from '@/lib/store';
import { ScenarioLoader } from '@/lib/simulation/core/ScenarioLoader';
import { cn } from '@/lib/utils';

export function ScenarioSelector() {
  const { activeScenario, setActiveScenario, setSelectedTreeItem, customTools, customResources, customPrompts } =
    useMCPStore();
  const scenarios = useMemo(() => ScenarioLoader.listAll(), []);

  useEffect(() => {
    if (!activeScenario && scenarios.length > 0) {
      setActiveScenario(scenarios[0]);
      const first = scenarios[0];
      if (first.tools[0]) {
        setSelectedTreeItem({ type: 'tool', name: first.tools[0].name });
      } else if (first.resources[0]) {
        setSelectedTreeItem({ type: 'resource', name: first.resources[0].name });
      } else if (first.prompts[0]) {
        setSelectedTreeItem({ type: 'prompt', name: first.prompts[0].name });
      }
    }
  }, [activeScenario, scenarios, setActiveScenario, setSelectedTreeItem]);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {scenarios.map((scenario) => {
        const active = scenario.id === activeScenario?.id;
        const toolCount = scenario.tools.length + (active ? customTools.length : 0);
        const resourceCount = scenario.resources.length + (active ? customResources.length : 0);
        const promptCount = scenario.prompts.length + (active ? customPrompts.length : 0);

        return (
          <button
            type="button"
            key={scenario.id}
            className={cn(
              'hud-panel cursor-pointer p-4 text-left transition-colors',
              active
                ? 'border-[rgba(0,212,255,0.46)] bg-[rgba(0,212,255,0.08)]'
                : 'hover:border-[rgba(0,212,255,0.28)]'
            )}
            onClick={() => {
              setActiveScenario(scenario);
              if (scenario.tools[0]) {
                setSelectedTreeItem({ type: 'tool', name: scenario.tools[0].name });
              } else if (scenario.resources[0]) {
                setSelectedTreeItem({ type: 'resource', name: scenario.resources[0].name });
              } else if (scenario.prompts[0]) {
                setSelectedTreeItem({ type: 'prompt', name: scenario.prompts[0].name });
              } else {
                setSelectedTreeItem(null);
              }
            }}
          >
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">{scenario.name}</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{scenario.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="method-badge">{toolCount} tools</span>
                <span className="method-badge">
                  {resourceCount} resources
                </span>
                <span className="method-badge">{promptCount} prompts</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
