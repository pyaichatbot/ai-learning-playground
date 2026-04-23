import React, { useEffect } from 'react';
import { usePlatformStore } from '@/lib/store';
import { SubagentDispatchCockpit } from '@/components/cockpits/subagent-dispatch';
import { useCockpitPage } from '@/lib/cockpitPage';

export const SubagentDispatchPage: React.FC = () => {
  useCockpitPage({ cockpit: 'subagent-dispatch' });
  const { setCompletion } = usePlatformStore();

  useEffect(() => {
    setCompletion('subagent-dispatch', 'explored');
  }, [setCompletion]);

  return (
    <div className="h-screen overflow-hidden bg-surface text-content">
      <SubagentDispatchCockpit />
    </div>
  );
};
