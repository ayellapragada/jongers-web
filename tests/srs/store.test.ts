import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadStorage, saveStorage, recordAttempt, getNextScenario,
  STORAGE_KEY,
} from '../../src/srs/store';
import type { DiscardScenario } from '../../src/scenarios/schema';

const baseSetup = {
  hand: '1m', yourSeat: 'east' as const, dealer: 'east' as const, roundWind: 'east' as const,
};
const scenario = (id: string): DiscardScenario => ({
  id, type: 'discard', difficulty: 1, tags: [], setup: baseSetup,
  drewTile: '1m', answer: { discard: '1m' },
});

beforeEach(() => { localStorage.clear(); });

describe('loadStorage', () => {
  it('returns fresh storage when empty', () => {
    const s = loadStorage();
    expect(s.version).toBe(1);
    expect(s.attempts).toEqual([]);
    expect(s.srs).toEqual({});
  });

  it('persists and reloads', () => {
    const s = loadStorage();
    s.attempts.push({ scenarioId: 'x', timestamp: 1, correct: true, answer: {} });
    saveStorage(s);
    const reloaded = loadStorage();
    expect(reloaded.attempts.length).toBe(1);
  });

  it('backs up and resets on incompatible version', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999 }));
    const s = loadStorage();
    expect(s.version).toBe(1);
    const backupKey = Object.keys(localStorage).find(k => k.startsWith(`${STORAGE_KEY}.backup-`));
    expect(backupKey).toBeDefined();
  });

  it('backs up and resets on unparseable blob', () => {
    localStorage.setItem(STORAGE_KEY, 'not json');
    const s = loadStorage();
    expect(s.version).toBe(1);
  });
});

describe('recordAttempt', () => {
  it('appends attempt and updates srs card', () => {
    const s = loadStorage();
    recordAttempt(s, scenario('a'), true, 1_000);
    expect(s.attempts.length).toBe(1);
    expect(s.srs['a']).toBeDefined();
    expect(s.srs['a']!.reps).toBe(1);
  });
});

describe('getNextScenario', () => {
  const lib = [scenario('a'), scenario('b'), scenario('c')];

  it('returns an unseen scenario when nothing is due', () => {
    const s = loadStorage();
    const next = getNextScenario(lib, s, 'all', 0);
    expect(['a', 'b', 'c']).toContain(next!.id);
  });

  it('prefers due-overdue oldest first', () => {
    const s = loadStorage();
    recordAttempt(s, scenario('a'), true, 0);
    recordAttempt(s, scenario('b'), true, 100);
    const now = 2 * 24 * 60 * 60 * 1000;
    const next = getNextScenario(lib, s, 'all', now);
    expect(next!.id).toBe('a');
  });

  it('filters by drill type', () => {
    const s = loadStorage();
    const next = getNextScenario(lib, s, 'claim', 0);
    expect(next).toBeNull();
  });

  it('returns null on empty library', () => {
    const s = loadStorage();
    expect(getNextScenario([], s, 'all', 0)).toBeNull();
  });
});
