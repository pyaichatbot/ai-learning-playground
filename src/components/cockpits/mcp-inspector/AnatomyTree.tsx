import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, MessageSquare, Plus, Wrench } from 'lucide-react';
import type { MCPPrompt, MCPResource, MCPTool } from '@/lib/simulation/mcp/types';
import { useMCPStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface AnatomyTreeProps {
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  onAddCustom?: () => void;
}

type TreeItemType = 'tool' | 'resource' | 'prompt';

interface SectionProps {
  type: TreeItemType;
  title: string;
  items: Array<{ name: string }>;
  icon: React.ReactNode;
}

function TreeSection({ type, title, items, icon }: SectionProps) {
  const [open, setOpen] = useState(true);
  const { selectedTreeItem, setSelectedTreeItem } = useMCPStore();

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.18em] text-content-muted"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {icon}
        <span>{title}</span>
        <span className="ml-auto rounded-full bg-surface-elevated px-2 py-0.5 text-2xs normal-case tracking-normal">
          {items.length}
        </span>
      </button>

      {open ? (
        <div className="space-y-1 pl-3">
          {items.map((item) => {
            const active =
              selectedTreeItem?.type === type && selectedTreeItem.name === item.name;

            return (
              <button
                key={`${type}-${item.name}`}
                type="button"
                onClick={() => setSelectedTreeItem({ type, name: item.name })}
                className={cn(
                  'block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors',
                  active
                    ? 'bg-brand-500/10 text-brand-300'
                    : 'text-content-muted hover:bg-surface-muted hover:text-content'
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AnatomyTree({ tools, resources, prompts, onAddCustom }: AnatomyTreeProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-content-subtle/20 px-4 py-3">
        <h2 className="font-medium text-content">Server anatomy</h2>
        <p className="text-xs text-content-muted">Browse the active server shape.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-3">
        <TreeSection
          type="tool"
          title="Tools"
          items={tools}
          icon={<Wrench size={14} className="text-brand-400" />}
        />
        <TreeSection
          type="resource"
          title="Resources"
          items={resources}
          icon={<FileText size={14} className="text-accent-cyan" />}
        />
        <TreeSection
          type="prompt"
          title="Prompts"
          items={prompts}
          icon={<MessageSquare size={14} className="text-accent-violet" />}
        />
      </div>

      {onAddCustom ? (
        <div className="border-t border-content-subtle/20 p-3">
          <button
            type="button"
            onClick={onAddCustom}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-content-subtle/30 px-3 py-3 text-sm text-content-muted transition-colors hover:border-brand-400/40 hover:text-content"
          >
            <Plus size={16} />
            Add custom tool / resource / prompt
          </button>
        </div>
      ) : null}
    </div>
  );
}
