import type { SessionSnapshot } from './session';

const SHARE_VERSION = 1;
const SHARE_PREFIX = 'sim';

export interface ShareEnvelope<TSnapshot extends SessionSnapshot = SessionSnapshot> {
  version: number;
  kind: 'session-snapshot';
  createdAt: number;
  snapshot: TSnapshot;
  meta?: Record<string, unknown>;
}

export interface ShareCodecOptions {
  prefix?: string;
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const base64 = globalThis.btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const base64 = normalized + padding;
  const binary = globalThis.atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function parseJSON<TValue>(raw: string): TValue | null {
  try {
    return JSON.parse(raw) as TValue;
  } catch {
    return null;
  }
}

function isShareEnvelope(value: unknown): value is ShareEnvelope {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ShareEnvelope>;
  return candidate.kind === 'session-snapshot' && typeof candidate.version === 'number' && typeof candidate.createdAt === 'number';
}

export class ShareCodec {
  private readonly prefix: string;

  constructor(options: ShareCodecOptions = {}) {
    this.prefix = options.prefix ?? SHARE_PREFIX;
  }

  encodeSnapshot<TSnapshot extends SessionSnapshot>(snapshot: TSnapshot): string {
    return this.encodeEnvelope({
      version: SHARE_VERSION,
      kind: 'session-snapshot',
      createdAt: Date.now(),
      snapshot,
    });
  }

  decodeSnapshot<TSnapshot extends SessionSnapshot>(value: string): TSnapshot | null {
    const envelope = this.decodeEnvelope<TSnapshot>(value);
    return envelope?.snapshot ?? null;
  }

  encodeEnvelope<TSnapshot extends SessionSnapshot>(envelope: ShareEnvelope<TSnapshot>): string {
    const normalized = {
      ...envelope,
      version: envelope.version ?? SHARE_VERSION,
      kind: envelope.kind ?? 'session-snapshot',
      createdAt: envelope.createdAt ?? Date.now(),
    } satisfies ShareEnvelope<TSnapshot>;

    return `${this.prefix}.${toBase64Url(JSON.stringify(normalized))}`;
  }

  decodeEnvelope<TSnapshot extends SessionSnapshot>(value: string): ShareEnvelope<TSnapshot> | null {
    const payload = this.extractPayload(value);
    if (!payload) return null;

    const parsed = parseJSON<unknown>(fromBase64Url(payload));
    if (!isShareEnvelope(parsed)) return null;
    if (parsed.version !== SHARE_VERSION) return null;

    return parsed as ShareEnvelope<TSnapshot>;
  }

  canDecode(value: string): boolean {
    return this.extractPayload(value) !== null;
  }

  tryDecode<TSnapshot extends SessionSnapshot>(value: string): ShareEnvelope<TSnapshot> | null {
    return this.decodeEnvelope<TSnapshot>(value);
  }

  private extractPayload(value: string): string | null {
    if (typeof value !== 'string' || value.length === 0) return null;
    const prefix = `${this.prefix}.`;
    if (!value.startsWith(prefix)) return null;
    return value.slice(prefix.length);
  }
}

export const defaultShareCodec = new ShareCodec();

export function encodeSessionSnapshot<TSnapshot extends SessionSnapshot>(snapshot: TSnapshot): string {
  return defaultShareCodec.encodeSnapshot(snapshot);
}

export function decodeSessionSnapshot<TSnapshot extends SessionSnapshot>(value: string): TSnapshot | null {
  return defaultShareCodec.decodeSnapshot<TSnapshot>(value);
}

export function encodeShareEnvelope<TSnapshot extends SessionSnapshot>(envelope: ShareEnvelope<TSnapshot>): string {
  return defaultShareCodec.encodeEnvelope(envelope);
}

export function decodeShareEnvelope<TSnapshot extends SessionSnapshot>(
  value: string,
): ShareEnvelope<TSnapshot> | null {
  return defaultShareCodec.decodeEnvelope<TSnapshot>(value);
}
