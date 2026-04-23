import { useMemo, useState } from 'react';
import { Button, Card, Input, Textarea } from '@/components/shared';
import { useMCPStore } from '@/lib/store';
import { slugify } from '@/lib/utils';

interface SchemaBuilderProps {
  onClose: () => void;
}

type BuilderKind = 'tool' | 'resource' | 'prompt';

export function SchemaBuilder({ onClose }: SchemaBuilderProps) {
  const { addCustomPrompt, addCustomResource, addCustomTool, setSelectedTreeItem } = useMCPStore();
  const [kind, setKind] = useState<BuilderKind>('tool');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const canSave = useMemo(() => name.trim().length > 0, [name]);

  const register = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (kind === 'tool') {
      addCustomTool({
        name: slugify(trimmedName).replace(/-/g, '_'),
        description: description.trim() || 'Custom tool added in the playground.',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'Custom input value' },
          },
        },
      });
      setSelectedTreeItem({
        type: 'tool',
        name: slugify(trimmedName).replace(/-/g, '_'),
      });
    } else if (kind === 'resource') {
      addCustomResource({
        name: trimmedName,
        uri: `custom://${slugify(trimmedName)}`,
        description: description.trim() || 'Custom resource added in the playground.',
        mimeType: 'text/plain',
      });
      setSelectedTreeItem({ type: 'resource', name: trimmedName });
    } else {
      addCustomPrompt({
        name: slugify(trimmedName).replace(/-/g, '_'),
        description: description.trim() || 'Custom prompt added in the playground.',
        arguments: [{ name: 'input', description: 'Custom prompt input', required: false }],
      });
      setSelectedTreeItem({
        type: 'prompt',
        name: slugify(trimmedName).replace(/-/g, '_'),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <Card className="w-full max-w-lg p-6">
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-content">Schema Builder</h2>
            <p className="text-sm text-content-muted">
              Create a lightweight custom entity and register it into the active simulator.
            </p>
          </div>

          <div className="flex gap-2">
            {(['tool', 'resource', 'prompt'] as BuilderKind[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={`rounded-full px-3 py-2 text-sm ${
                  kind === value
                    ? 'bg-brand-500/10 text-brand-300'
                    : 'bg-surface-muted text-content-muted'
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <Textarea
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={register} disabled={!canSave}>
              Register in Simulator
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
