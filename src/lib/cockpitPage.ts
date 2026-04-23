import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCockpitStore, useModeStore, usePlatformStore } from '@/lib/store';
import type { CockpitType } from '@/types';

interface UseCockpitPageOptions {
  cockpit: CockpitType;
}

export function useCockpitPage({ cockpit }: UseCockpitPageOptions): void {
  const location = useLocation();
  const { setMode } = useModeStore();
  const { setActiveCockpit } = useCockpitStore();
  const { setFocusTarget, setLastVisitedCockpit, setPlaybackSnapshotId } = usePlatformStore();

  useEffect(() => {
    setMode('advanced');
    setActiveCockpit(cockpit);
    setLastVisitedCockpit(cockpit);
  }, [cockpit, setActiveCockpit, setLastVisitedCockpit, setMode]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusCockpit = params.get('focusCockpit');
    const focusTarget = params.get('focusTarget');
    const snapshotId = params.get('snapshotId');

    if (focusCockpit === cockpit && focusTarget) {
      setFocusTarget({
        cockpit,
        targetId: focusTarget,
        targetType: params.get('focusType') ?? 'entity',
      });
    }

    if (snapshotId) {
      setPlaybackSnapshotId(snapshotId);
    }
  }, [cockpit, location.search, setFocusTarget, setPlaybackSnapshotId]);
}
