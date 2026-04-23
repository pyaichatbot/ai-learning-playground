import { describe, expect, it } from 'vitest';
import { decodeSessionSnapshot, encodeSessionSnapshot } from '../ShareCodec';
import { createReplayState, createSessionSnapshot } from '../session';

describe('ShareCodec', () => {
  it('round-trips a session snapshot', () => {
    const snapshot = createSessionSnapshot({
      id: 'snapshot-1',
      scenario: {
        id: 'content-team',
        name: 'Content Team',
        kind: 'multiagent',
      },
      events: [],
      replay: createReplayState(),
    });

    const encoded = encodeSessionSnapshot(snapshot);
    const decoded = decodeSessionSnapshot(encoded);

    expect(encoded.startsWith('sim.')).toBe(true);
    expect(decoded?.id).toBe(snapshot.id);
    expect(decoded?.scenario.id).toBe('content-team');
  });
});
