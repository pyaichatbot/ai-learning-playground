type MessageHandler = (message: unknown) => void;

export class MessageBus {
  private handlers = new Map<string, MessageHandler[]>();

  subscribe(channel: string, handler: MessageHandler): () => void {
    const existing = this.handlers.get(channel) ?? [];
    this.handlers.set(channel, [...existing, handler]);

    return () => {
      const current = this.handlers.get(channel) ?? [];
      this.handlers.set(
        channel,
        current.filter((candidate) => candidate !== handler)
      );
    };
  }

  publish(channel: string, message: unknown): void {
    const handlers = this.handlers.get(channel) ?? [];
    handlers.forEach((handler) => handler(message));
  }

  clear(): void {
    this.handlers.clear();
  }
}
