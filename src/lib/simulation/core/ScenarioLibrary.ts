import type { ScenarioDefinition } from './session';

const DEFAULT_STORAGE_KEY = 'ai-playground:scenario-library';
const CURRENT_LIBRARY_VERSION = 1;

export interface ScenarioLibraryEnvelope<TScenario extends ScenarioDefinition = ScenarioDefinition> {
  version: number;
  updatedAt: number;
  builtins: TScenario[];
  customs: TScenario[];
}

export interface ScenarioLibraryOptions {
  storageKey?: string;
}

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function cloneScenario<TScenario extends ScenarioDefinition>(scenario: TScenario): TScenario {
  return JSON.parse(JSON.stringify(scenario)) as TScenario;
}

function readJSON<TValue>(raw: string | null): TValue | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TValue;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!hasStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export class ScenarioLibrary<TScenario extends ScenarioDefinition = ScenarioDefinition> {
  private readonly storageKey: string;
  private builtins: TScenario[];
  private customs: TScenario[];
  private updatedAt: number;

  constructor(builtins: TScenario[] = [], options: ScenarioLibraryOptions = {}) {
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.builtins = builtins.map(cloneScenario);
    this.customs = [];
    this.updatedAt = Date.now();
    this.load();
  }

  static fromBuiltins<TScenario extends ScenarioDefinition>(
    builtins: TScenario[],
    options: ScenarioLibraryOptions = {},
  ): ScenarioLibrary<TScenario> {
    return new ScenarioLibrary(builtins, options);
  }

  getBuiltins(): TScenario[] {
    return this.builtins.map(cloneScenario);
  }

  getCustoms(): TScenario[] {
    return this.customs.map(cloneScenario);
  }

  list(): TScenario[] {
    return [...this.getBuiltins(), ...this.getCustoms()];
  }

  getById(id: string): TScenario | undefined {
    return this.list().find((scenario) => scenario.id === id);
  }

  has(id: string): boolean {
    return this.getById(id) !== undefined;
  }

  registerBuiltin(scenario: TScenario): void {
    this.builtins = this.upsert(this.builtins, scenario);
  }

  registerCustom(scenario: TScenario): void {
    this.customs = this.upsert(this.customs, scenario);
    this.persist();
  }

  removeCustom(id: string): boolean {
    const next = this.customs.filter((scenario) => scenario.id !== id);
    const removed = next.length !== this.customs.length;
    if (!removed) return false;

    this.customs = next;
    this.persist();
    return true;
  }

  clearCustoms(): void {
    this.customs = [];
    this.persist();
  }

  reset(builtins: TScenario[] = this.builtins): void {
    this.builtins = builtins.map(cloneScenario);
    this.customs = [];
    this.updatedAt = Date.now();
    this.persist();
  }

  export(): ScenarioLibraryEnvelope<TScenario> {
    return {
      version: CURRENT_LIBRARY_VERSION,
      updatedAt: this.updatedAt,
      builtins: this.getBuiltins(),
      customs: this.getCustoms(),
    };
  }

  importEnvelope(envelope: ScenarioLibraryEnvelope<TScenario> | unknown, options: { merge?: boolean } = {}): void {
    const parsed = this.normalizeEnvelope(envelope);
    if (!parsed) return;

    if (options.merge) {
      this.builtins = this.mergeUnique(this.builtins, parsed.builtins);
      this.customs = this.mergeUnique(this.customs, parsed.customs);
    } else {
      this.builtins = parsed.builtins;
      this.customs = parsed.customs;
    }

    this.updatedAt = Date.now();
    this.persist();
  }

  toJSON(): ScenarioLibraryEnvelope<TScenario> {
    return this.export();
  }

  private load(): void {
    if (!hasStorage()) return;

    const stored = readJSON<ScenarioLibraryEnvelope<TScenario> | TScenario[]>(localStorage.getItem(this.storageKey));
    const normalized = this.normalizeEnvelope(stored);
    if (!normalized) return;

    this.customs = normalized.customs;
    this.updatedAt = normalized.updatedAt;
  }

  private persist(): void {
    if (!hasStorage()) return;
    this.updatedAt = Date.now();
    writeJSON(this.storageKey, {
      version: CURRENT_LIBRARY_VERSION,
      updatedAt: this.updatedAt,
      builtins: [],
      customs: this.getCustoms(),
    } satisfies ScenarioLibraryEnvelope<TScenario>);
  }

  private upsert(items: TScenario[], scenario: TScenario): TScenario[] {
    const next = items.filter((candidate) => candidate.id !== scenario.id);
    next.push(cloneScenario(scenario));
    return next;
  }

  private mergeUnique(existing: TScenario[], incoming: TScenario[]): TScenario[] {
    const merged = new Map<string, TScenario>();
    for (const scenario of existing) merged.set(scenario.id, cloneScenario(scenario));
    for (const scenario of incoming) merged.set(scenario.id, cloneScenario(scenario));
    return Array.from(merged.values());
  }

  private normalizeEnvelope(
    envelope: ScenarioLibraryEnvelope<TScenario> | TScenario[] | unknown,
  ): ScenarioLibraryEnvelope<TScenario> | null {
    if (!envelope) return null;

    if (Array.isArray(envelope)) {
      return {
        version: CURRENT_LIBRARY_VERSION,
        updatedAt: Date.now(),
        builtins: [],
        customs: envelope.map(cloneScenario),
      };
    }

    if (typeof envelope !== 'object') return null;

    const candidate = envelope as Partial<ScenarioLibraryEnvelope<TScenario>> & {
      scenarios?: TScenario[];
    };
    const builtins = Array.isArray(candidate.builtins) ? candidate.builtins.map(cloneScenario) : [];
    const customs = Array.isArray(candidate.customs)
      ? candidate.customs.map(cloneScenario)
      : Array.isArray(candidate.scenarios)
        ? candidate.scenarios.map(cloneScenario)
        : [];

    if (!Array.isArray(candidate.builtins) && !Array.isArray(candidate.customs) && !Array.isArray(candidate.scenarios)) {
      return null;
    }

    return {
      version: typeof candidate.version === 'number' ? candidate.version : CURRENT_LIBRARY_VERSION,
      updatedAt: typeof candidate.updatedAt === 'number' ? candidate.updatedAt : Date.now(),
      builtins,
      customs,
    };
  }
}

export function createScenarioLibrary<TScenario extends ScenarioDefinition>(
  builtins: TScenario[] = [],
  options: ScenarioLibraryOptions = {},
): ScenarioLibrary<TScenario> {
  return new ScenarioLibrary(builtins, options);
}
