import React, { useEffect } from 'react';
import { usePlatformStore } from '@/lib/store';
import { useCockpitPage } from '@/lib/cockpitPage';
import { AGUIEventStreamCockpit } from '@/components/cockpits/agui-stream';

export const AGUIEventStreamPage: React.FC = () => {
  useCockpitPage({ cockpit: 'agui-stream' });
  const { setCompletion } = usePlatformStore();

  useEffect(() => {
    setCompletion('agui-stream', 'explored');
  }, [setCompletion]);

  return (
    <div className="h-screen overflow-hidden bg-surface text-content">
      <AGUIEventStreamCockpit />
    </div>
  );
};
