import { describe, it, expect } from 'vitest';
import discard from '../../src/scenarios/library/discard.json';
import claim from '../../src/scenarios/library/claim.json';
import wait from '../../src/scenarios/library/wait.json';
import faan from '../../src/scenarios/library/faan-recognition.json';
import { auditScenarios } from '../../src/scenarios/audit';
import type {
  DiscardScenario, ClaimScenario, WaitScenario, FaanRecognitionScenario,
} from '../../src/scenarios/schema';

describe('scenario library audit', () => {
  it('every shipped scenario passes the engine audit', () => {
    const lib = {
      discard: discard as DiscardScenario[],
      claim: claim as ClaimScenario[],
      wait: wait as WaitScenario[],
      'faan-recognition': faan as FaanRecognitionScenario[],
    };
    const results = auditScenarios(lib);
    const failures = results.filter(r => r.status === 'fail');
    if (failures.length > 0) {
      console.error('Audit failures:', failures);
    }
    expect(failures).toEqual([]);
  });
});
