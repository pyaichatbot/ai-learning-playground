import React, { useEffect } from 'react';
import { usePlatformStore } from '@/lib/store';
import { useCockpitPage } from '@/lib/cockpitPage';
import { A2AProtocolVisualizerCockpit } from '@/components/cockpits/a2a-protocol';

export const A2AProtocolVisualizerPage: React.FC = () => {
  useCockpitPage({ cockpit: 'a2a-protocol' });
  const { setCompletion } = usePlatformStore();

  useEffect(() => {
    setCompletion('a2a-protocol', 'explored');
  }, [setCompletion]);

  return (
    <div className="h-screen overflow-hidden bg-[#020810] text-[#e8f4ff]">
      <A2AProtocolVisualizerCockpit />
    </div>
  );
};
