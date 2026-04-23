import { beforeEach, describe, expect, it } from 'vitest';
import { usePlatformStore } from '../store';
import { createReplayState, createSessionSnapshot } from '../simulation/core/session';

describe('Platform Store', () => {
  beforeEach(() => {
    usePlatformStore.setState({
      pathway: 'beginner',
      completion: {},
      activeSessionId: null,
      playbackSnapshotId: null,
      snapshots: [],
      focusTarget: null,
      lastVisitedCockpit: null,
      glossaryOpen: false,
    });
  });

  it('stores cockpit completion', () => {
    usePlatformStore.getState().setCompletion('multi-agent', 'explored');
    expect(usePlatformStore.getState().completion['multi-agent']).toBe('explored');
  });

  it('stores snapshots and active session id', () => {
    const snapshot = createSessionSnapshot({
      id: 'snap-1',
      scenario: { id: 'content-team', name: 'Content Team' },
      events: [],
      replay: createReplayState(),
    });

    usePlatformStore.getState().storeSnapshot(snapshot);

    expect(usePlatformStore.getState().activeSessionId).toBe(snapshot.sessionId);
    expect(usePlatformStore.getState().snapshots[0].id).toBe('snap-1');
  });
});
