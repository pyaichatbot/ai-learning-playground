import React, { useEffect } from 'react';
import { AgentRuntimeCockpit } from '@/components/cockpits/agent-runtime';
import { useCockpitPage } from '@/lib/cockpitPage';
import { usePlatformStore } from '@/lib/store';

export const AgentRuntimePage: React.FC = () => {
  useCockpitPage({ cockpit: 'agent-runtime' });
  const { setCompletion } = usePlatformStore();

  useEffect(() => {
    setCompletion('agent-runtime', 'explored');
  }, [setCompletion]);

  return (
    <div className="h-screen overflow-hidden bg-surface text-content">
      <AgentRuntimeCockpit />
    </div>
  );
};
