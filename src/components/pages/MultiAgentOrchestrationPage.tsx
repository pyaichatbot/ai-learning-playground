import React, { useEffect } from 'react';
import { usePlatformStore } from '@/lib/store';
import { MultiAgentOrchestrationCockpit } from '@/components/cockpits/multi-agent';
import { useCockpitPage } from '@/lib/cockpitPage';

export const MultiAgentOrchestrationPage: React.FC = () => {
  useCockpitPage({ cockpit: 'multi-agent' });
  const { setCompletion } = usePlatformStore();

  useEffect(() => {
    setCompletion('multi-agent', 'explored');
  }, [setCompletion]);

  return (
    <div className="h-screen overflow-hidden bg-surface text-content">
      <MultiAgentOrchestrationCockpit />
    </div>
  );
};
