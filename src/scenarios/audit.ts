import { parseMPSZ } from '../engine/mpsz';
import type {
  Scenario, ScenarioLibrary, DiscardScenario, ClaimScenario,
  WaitScenario, FaanRecognitionScenario,
} from './schema';

export type AuditResult = {
  id: string;
  type: Scenario['type'];
  status: 'ok' | 'fail';
  reason?: string;
};

type Check<S extends Scenario> = (s: S) => string | null;

const checkDiscard: Check<DiscardScenario> = (_s) => null;
const checkClaim: Check<ClaimScenario> = (_s) => null;
const checkWait: Check<WaitScenario> = (_s) => null;
const checkFaanRecognition: Check<FaanRecognitionScenario> = (_s) => null;

function structuralCheck(s: Scenario): string | null {
  try {
    parseMPSZ(s.setup.hand);
  } catch (e) {
    return `invalid setup.hand: ${(e as Error).message}`;
  }
  for (const tStr of s.setup.doraIndicators ?? []) {
    try { parseMPSZ(tStr); } catch (e) {
      return `invalid doraIndicator '${tStr}': ${(e as Error).message}`;
    }
  }
  for (const m of s.setup.melds ?? []) {
    for (const tStr of m.tiles) {
      try { parseMPSZ(tStr); } catch (e) {
        return `invalid meld tile '${tStr}': ${(e as Error).message}`;
      }
    }
  }
  return null;
}

function runPerType(s: Scenario): string | null {
  switch (s.type) {
    case 'discard':          return checkDiscard(s);
    case 'claim':            return checkClaim(s);
    case 'wait':             return checkWait(s);
    case 'faan-recognition': return checkFaanRecognition(s);
  }
}

export function auditScenarios(lib: ScenarioLibrary): AuditResult[] {
  const all: Scenario[] = [
    ...lib.discard, ...lib.claim, ...lib.wait, ...lib['faan-recognition'],
  ];
  const seen = new Map<string, number>();
  for (const s of all) seen.set(s.id, (seen.get(s.id) ?? 0) + 1);

  return all.map((s) => {
    if ((seen.get(s.id) ?? 0) > 1) {
      return { id: s.id, type: s.type, status: 'fail', reason: `duplicate id '${s.id}'` };
    }
    const structural = structuralCheck(s);
    if (structural) return { id: s.id, type: s.type, status: 'fail', reason: structural };
    const typed = runPerType(s);
    if (typed) return { id: s.id, type: s.type, status: 'fail', reason: typed };
    return { id: s.id, type: s.type, status: 'ok' };
  });
}
