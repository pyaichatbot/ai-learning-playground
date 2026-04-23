import React, { useEffect } from 'react';
import { MCPInspectorCockpit } from '@/components/cockpits/mcp-inspector/MCPInspectorCockpit';
import { usePlatformStore } from '@/lib/store';
import { useCockpitPage } from '@/lib/cockpitPage';

export const MCPInspectorPage: React.FC = () => {
  useCockpitPage({ cockpit: 'mcp-inspector' });
  const { setCompletion } = usePlatformStore();

  useEffect(() => {
    setCompletion('mcp-inspector', 'explored');
  }, [setCompletion]);

  return (
    <div className="h-screen overflow-hidden bg-surface text-content">
      <MCPInspectorCockpit />
    </div>
  );
};
