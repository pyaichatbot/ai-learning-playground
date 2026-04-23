import { MessageBus } from './MessageBus';

export interface ProtocolEvent {
  type: string;
  payload: unknown;
  timestamp: number;
}

export abstract class SimulatedProtocol {
  protected bus: MessageBus;
  protected eventLog: ProtocolEvent[] = [];

  constructor() {
    this.bus = new MessageBus();
  }

  protected emit(type: string, payload: unknown): void {
    const event: ProtocolEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };

    this.eventLog.push(event);
    this.bus.publish(type, event);
  }

  on(eventType: string, handler: (event: ProtocolEvent) => void): () => void {
    return this.bus.subscribe(eventType, handler as (message: unknown) => void);
  }

  getEventLog(): ProtocolEvent[] {
    return [...this.eventLog];
  }

  clearLog(): void {
    this.eventLog = [];
    this.bus.clear();
  }

  abstract reset(): void;
}
