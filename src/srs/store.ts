import type { Scenario, DrillType } from '../scenarios/schema';
import { newCard, reviewCard, SRSCard } from './sm2';

export const STORAGE_KEY = 'jongers/v1';

export type Attempt = {
  scenarioId: string;
  timestamp: number;
  correct: boolean;
  answer: unknown;
};

export type Storage = {
  version: 1;
  attempts: Attempt[];
  srs: Record<string, SRSCard>;
  prefs: { lastDrillTypeFilter?: DrillType | 'all' };
};

function freshStorage(): Storage {
  return { version: 1, attempts: [], srs: {}, prefs: {} };
}

export function loadStorage(): Storage {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return freshStorage();
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch {
    backup(raw);
    return freshStorage();
  }
  if (!parsed || typeof parsed !== 'object' || (parsed as { version?: unknown }).version !== 1) {
    backup(raw);
    return freshStorage();
  }
  return parsed as Storage;
}

function backup(raw: string): void {
  localStorage.setItem(`${STORAGE_KEY}.backup-${Date.now()}`, raw);
}

export function saveStorage(s: Storage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function recordAttempt(s: Storage, scenario: Scenario, correct: boolean, now: number): void {
  s.attempts.push({
    scenarioId: scenario.id, timestamp: now, correct, answer: {},
  });
  const existing = s.srs[scenario.id] ?? newCard(scenario.id, now);
  s.srs[scenario.id] = reviewCard(existing, correct, now);
}

export function getNextScenario(
  library: readonly Scenario[],
  s: Storage,
  filter: DrillType | 'all',
  now: number,
): Scenario | null {
  const pool = filter === 'all' ? library : library.filter(x => x.type === filter);
  if (pool.length === 0) return null;

  const due = pool
    .filter(x => s.srs[x.id] !== undefined && s.srs[x.id]!.dueAt <= now)
    .sort((a, b) => (s.srs[a.id]!.dueAt - s.srs[b.id]!.dueAt));
  if (due.length > 0) return due[0]!;

  const unseen = pool.filter(x => s.srs[x.id] === undefined);
  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)]!;
  }

  const all = [...pool].sort((a, b) => s.srs[a.id]!.dueAt - s.srs[b.id]!.dueAt);
  return all[0]!;
}
