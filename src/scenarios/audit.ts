import { parseMPSZ, formatTile } from '../engine/mpsz';
import { makeHand, makeMeld } from '../engine/hand';
import { Tile } from '../engine/tile';
import { discardOptions, bestDiscards } from '../engine/discard';
import { isWinning, canWinOnTile } from '../engine/agari';
import { standardShanten } from '../engine/shanten';
import { waits } from '../engine/waits';
import { decomposeWinningHand } from '../engine/decompose';
import { detectFaan, setScoringContext, HK_OFFICIAL_RULES } from '../engine/faan';
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

const checkDiscard: Check<DiscardScenario> = (s) => {
  let concealed: Tile[];
  let drew: Tile;
  try {
    concealed = parseMPSZ(s.setup.hand);
    const drewTiles = parseMPSZ(s.drewTile);
    if (drewTiles.length !== 1) return `drewTile must be a single tile, got '${s.drewTile}'`;
    drew = drewTiles[0]!;
  } catch (e) {
    return `tile parse failed: ${(e as Error).message}`;
  }

  // Build 14-tile hand: concealed + drewTile + declared melds from setup.
  const handTiles = [...concealed, drew];
  const melds = (s.setup.melds ?? []).map(m => ({
    kind: m.kind,
    tiles: m.tiles.flatMap(parseMPSZ),
  }));
  const totalConcealedPlusMelds = handTiles.length + melds.reduce((n, m) => n + m.tiles.length, 0);
  if (totalConcealedPlusMelds !== 14) {
    return `discard scenario must total 14 tiles (concealed + drew + melds); got ${totalConcealedPlusMelds}`;
  }
  const hand = makeHand(handTiles, melds);

  if (s.answer.discards.length === 0) return `answer.discards must be non-empty`;
  const answerTiles: Tile[] = [];
  for (const ds of s.answer.discards) {
    try {
      const at = parseMPSZ(ds);
      if (at.length !== 1) return `each answer.discards entry must be a single tile, got '${ds}'`;
      answerTiles.push(at[0]!);
    } catch (e) {
      return `answer parse failed: ${(e as Error).message}`;
    }
  }
  for (const at of answerTiles) {
    if (!handTiles.includes(at)) {
      return `answer tile '${formatTile(at)}' is not in the concealed hand`;
    }
  }

  const visible = new Map<Tile, number>();
  for (const tStr of s.setup.visibleTiles ?? []) {
    for (const t of parseMPSZ(tStr)) visible.set(t, (visible.get(t) ?? 0) + 1);
  }
  const opts = discardOptions(hand, visible);
  const best = bestDiscards(opts);
  const bestSet = new Set(best.map(o => o.tile));
  for (const at of answerTiles) {
    if (!bestSet.has(at)) {
      const bestStrs = best.map(o => formatTile(o.tile)).join(', ');
      return `answer '${formatTile(at)}' is not engine-best; best=[${bestStrs}]`;
    }
  }
  // Also flag if engine knows of MORE best options than authored — author may want to extend.
  // Not a fail; just don't enforce reverse-completeness.
  return null;
};
function parseMelds(s: { melds?: { kind: string; tiles: string[] }[] }) {
  return (s.melds ?? []).map(m => makeMeld(m.kind as any, m.tiles.flatMap(parseMPSZ)));
}

const checkClaim: Check<ClaimScenario> = (s) => {
  let concealed: Tile[], trigger: Tile;
  try {
    concealed = parseMPSZ(s.setup.hand);
    trigger = parseMPSZ(s.trigger.tile)[0]!;
  } catch (e) { return `parse failed: ${(e as Error).message}`; }

  const melds = parseMelds(s.setup);
  const a = s.answer;

  // Legality checks per action:
  if (a.action === 'pon') {
    const inHand = concealed.filter(t => t === trigger).length;
    if (inHand < 2) return `pon needs 2 copies of ${formatTile(trigger)} in hand, got ${inHand}`;
  } else if (a.action === 'chi') {
    const using = a.using.map(s => parseMPSZ(s)[0]!);
    for (const t of using) {
      if (!concealed.includes(t)) return `chi using-tile ${formatTile(t)} not in hand`;
    }
    // Must form a sequence with trigger.
    const seq = [...using, trigger].sort((a, b) => a - b);
    if (!(seq[1]! - seq[0]! === 1 && seq[2]! - seq[1]! === 1)) return `chi tiles don't form a sequence`;
  } else if (a.action === 'wu') {
    if (!canWinOnTile(makeHand(concealed, melds), trigger)) {
      return `wu is not legal — trigger does not complete a winning hand`;
    }
  }
  // 'pass' is always legal; the audit just trusts the author here.
  return null;
};

const checkWait: Check<WaitScenario> = (s) => {
  let concealed: Tile[];
  try {
    concealed = parseMPSZ(s.setup.hand);
  } catch (e) { return `parse failed: ${(e as Error).message}`; }
  const melds = parseMelds(s.setup);
  const hand = makeHand(concealed, melds);
  if (standardShanten(hand) !== 0) {
    return `wait scenario requires a tenpai hand (shanten=0); got shanten=${standardShanten(hand)}`;
  }
  const engineWaits = new Set(waits(hand).map(w => w.tile));
  const authored = new Set(s.answer.winningTiles.flatMap(parseMPSZ));
  // Audit: authored must equal engine waits.
  if (engineWaits.size !== authored.size) {
    const eStr = [...engineWaits].map(formatTile).join(',');
    return `authored winning tiles don't match engine; engine=[${eStr}]`;
  }
  for (const t of authored) {
    if (!engineWaits.has(t)) {
      const eStr = [...engineWaits].map(formatTile).join(',');
      return `authored tile ${formatTile(t)} not in engine waits=[${eStr}]`;
    }
  }
  return null;
};

const checkFaanRecognition: Check<FaanRecognitionScenario> = (s) => {
  let concealed: Tile[], winTile: Tile;
  try {
    concealed = parseMPSZ(s.setup.hand);
    winTile = parseMPSZ(s.winTile)[0]!;
  } catch (e) { return `parse failed: ${(e as Error).message}`; }
  const melds = parseMelds(s.setup);
  if (!canWinOnTile(makeHand(concealed, melds), winTile)) {
    return `hand + winTile is not a winning shape`;
  }
  setScoringContext(s.setup.yourSeat, s.setup.roundWind);
  const decs = decomposeWinningHand(makeHand(concealed, melds), winTile);
  const items = detectFaan(decs, winTile, s.winContext, HK_OFFICIAL_RULES);
  const enginePatterns = new Set(items.map(i => i.pattern));
  const engineTotal = items.reduce((a, b) => a + b.faan, 0);
  const authored = new Set(s.answer.patterns);

  if (enginePatterns.size !== authored.size) {
    const eStr = [...enginePatterns].join(', ');
    return `authored patterns differ from engine; engine=[${eStr}], total=${engineTotal}`;
  }
  for (const p of authored) {
    if (!enginePatterns.has(p as any)) {
      const eStr = [...enginePatterns].join(', ');
      return `authored pattern '${p}' not in engine=[${eStr}]`;
    }
  }
  if (s.answer.totalFaan !== engineTotal) {
    return `authored totalFaan=${s.answer.totalFaan} differs from engine=${engineTotal}`;
  }
  return null;
};

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
