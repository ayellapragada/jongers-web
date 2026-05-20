import { describe, it, expect } from 'vitest';
import { auditScenarios, AuditResult } from '../../src/scenarios/audit';
import type { Scenario } from '../../src/scenarios/schema';

const baseSetup = {
  hand: '123m456p789s11z',
  yourSeat: 'east' as const,
  dealer: 'east' as const,
  roundWind: 'east' as const,
};

describe('auditScenarios', () => {
  it('passes well-formed empty library', () => {
    const lib = { discard: [], claim: [], wait: [], 'faan-recognition': [] };
    const results = auditScenarios(lib);
    expect(results.every((r: AuditResult) => r.status === 'ok')).toBe(true);
    expect(results.length).toBe(0);
  });

  it('reports duplicate ids', () => {
    const s: Scenario = {
      id: 'dup', type: 'discard', difficulty: 1, tags: [], setup: baseSetup,
      drewTile: '1m', answer: { discard: '1z' },
    };
    const lib = { discard: [s, s], claim: [], wait: [], 'faan-recognition': [] };
    const results = auditScenarios(lib);
    const fails = results.filter(r => r.status === 'fail');
    expect(fails.length).toBeGreaterThan(0);
    expect(fails[0]!.reason).toMatch(/duplicate id/i);
  });

  it('reports unparseable hand', () => {
    const s: Scenario = {
      id: 'bad-hand', type: 'discard', difficulty: 1, tags: [],
      setup: { ...baseSetup, hand: 'not-mpsz' },
      drewTile: '1m', answer: { discard: '1z' },
    };
    const lib = { discard: [s], claim: [], wait: [], 'faan-recognition': [] };
    const results = auditScenarios(lib);
    expect(results[0]!.status).toBe('fail');
    expect(results[0]!.reason).toMatch(/hand/i);
  });

  it('passes a structurally-valid discard scenario', () => {
    const s: Scenario = {
      id: 'ok-1', type: 'discard', difficulty: 1, tags: [], setup: baseSetup,
      drewTile: '1m', answer: { discard: '1z' },
    };
    const lib = { discard: [s], claim: [], wait: [], 'faan-recognition': [] };
    const results = auditScenarios(lib);
    expect(results[0]!.status).toBe('ok');
  });
});
