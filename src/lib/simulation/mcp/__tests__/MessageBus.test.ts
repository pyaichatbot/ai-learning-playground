import { describe, expect, it, vi } from 'vitest';
import { MessageBus } from '../../core/MessageBus';

describe('MessageBus', () => {
  it('calls subscribed handler when a message is published', () => {
    const bus = new MessageBus();
    const handler = vi.fn();

    bus.subscribe('test', handler);
    bus.publish('test', { value: 42 });

    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('does not call handler for a different channel', () => {
    const bus = new MessageBus();
    const handler = vi.fn();

    bus.subscribe('alpha', handler);
    bus.publish('beta', { value: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('calls multiple handlers on the same channel', () => {
    const bus = new MessageBus();
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    bus.subscribe('channel', firstHandler);
    bus.subscribe('channel', secondHandler);
    bus.publish('channel', 'msg');

    expect(firstHandler).toHaveBeenCalledWith('msg');
    expect(secondHandler).toHaveBeenCalledWith('msg');
  });

  it('unsubscribes cleanly', () => {
    const bus = new MessageBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('channel', handler);

    unsubscribe();
    bus.publish('channel', 'msg');

    expect(handler).not.toHaveBeenCalled();
  });

  it('clear() stops all handlers', () => {
    const bus = new MessageBus();
    const handler = vi.fn();

    bus.subscribe('channel', handler);
    bus.clear();
    bus.publish('channel', 'msg');

    expect(handler).not.toHaveBeenCalled();
  });
});
