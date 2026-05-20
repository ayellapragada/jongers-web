// HK faan catalog + detectors. Port of MahjongKit/Scoring/{FaanPattern,Detectors}.swift.

import { Tile, Suit, tileSuit, tileNumber, isHonor, isTerminal, isTerminalOrHonor,
         east, south, west, north, red, green, white } from './tile';
import type { WinningDecomposition } from './decompose';
import type { Wind, WinContext } from '../scenarios/schema';

const DRAGONS = new Set<Tile>([red, green, white]);
const WINDS = new Set<Tile>([east, south, west, north]);

// Ordered by faan value ascending; see FAAN_VALUE for the canonical number.
export const FAAN_PATTERNS = [
  'commonHand', 'seatWind', 'prevailingWind',
  'dragonRed', 'dragonGreen', 'dragonWhite',
  'selfPick', 'robbingKong', 'winByLastCatch',
  'winByKong',
  'allInTriplets', 'mixedOneSuit',
  'mixedOrphans', 'sevenPairs',
  'smallDragons',
  'smallWinds',
  'allOneSuit',
  'greatDragons',
  'winByDoubleKong',
  'allHonorTiles', 'selfTriplets', 'orphans', 'nineGates',
  'greatWinds', 'thirteenOrphans', 'allKongs', 'heavenlyHand', 'earthlyHand',
] as const;
export type FaanPattern = typeof FAAN_PATTERNS[number];

export const FAAN_BONUSES: ReadonlySet<FaanPattern> = new Set([
  'selfPick', 'robbingKong', 'winByLastCatch', 'winByKong',
  'winByDoubleKong', 'heavenlyHand', 'earthlyHand',
]);

export const FAAN_VALUE: Record<FaanPattern, number> = {
  commonHand: 1, seatWind: 1, prevailingWind: 1,
  dragonRed: 1, dragonGreen: 1, dragonWhite: 1,
  selfPick: 1, robbingKong: 1, winByLastCatch: 1,
  winByKong: 2,
  allInTriplets: 3, mixedOneSuit: 3,
  mixedOrphans: 4, sevenPairs: 4,
  smallDragons: 5,
  smallWinds: 6,
  allOneSuit: 7,
  greatDragons: 8,
  winByDoubleKong: 9,
  allHonorTiles: 10, selfTriplets: 10, orphans: 10, nineGates: 10,
  greatWinds: 13, thirteenOrphans: 13, allKongs: 13,
  heavenlyHand: 13, earthlyHand: 13,
};

export const FAAN_NAME: Record<FaanPattern, string> = {
  commonHand: 'Common Hand', seatWind: 'Seat Wind', prevailingWind: 'Prevailing Wind',
  dragonRed: 'Pong of Reds', dragonGreen: 'Pong of Greens', dragonWhite: 'Pong of Whites',
  selfPick: 'Self-Pick', robbingKong: 'Robbing Kong', winByLastCatch: 'Win by Last Catch',
  winByKong: 'Win by Kong',
  allInTriplets: 'All in Triplets', mixedOneSuit: 'Mixed One Suit',
  mixedOrphans: 'Mixed Orphans', sevenPairs: 'Seven Pairs',
  smallDragons: 'Small Dragons',
  smallWinds: 'Small Winds',
  allOneSuit: 'All One Suit',
  greatDragons: 'Great Dragons',
  winByDoubleKong: 'Win by Double Kong',
  allHonorTiles: 'All Honor Tiles', selfTriplets: 'Self Triplets', orphans: 'Orphans', nineGates: 'Nine Gates',
  greatWinds: 'Great Winds', thirteenOrphans: 'Thirteen Orphans', allKongs: 'All Kongs',
  heavenlyHand: 'Heavenly Hand', earthlyHand: 'Earthly Hand',
};

const SUPERSEDES: Partial<Record<FaanPattern, FaanPattern[]>> = {
  greatDragons:  ['smallDragons', 'dragonRed', 'dragonGreen', 'dragonWhite'],
  greatWinds:    ['smallWinds', 'seatWind', 'prevailingWind'],
  selfTriplets:  ['allInTriplets'],
  orphans:       ['mixedOrphans', 'allInTriplets'],
  nineGates:     ['allOneSuit'],
  allHonorTiles: ['mixedOneSuit', 'allInTriplets',
                  'seatWind', 'prevailingWind',
                  'dragonRed', 'dragonGreen', 'dragonWhite'],
  allKongs:      ['allInTriplets'],
};

export type FaanItem = { pattern: FaanPattern; faan: number };

export type FaanRuleSet = {
  sevenPairsAllowed: boolean;
  kokushiAllowed: boolean;
};

export const HK_OFFICIAL_RULES: FaanRuleSet = {
  sevenPairsAllowed: false,
  kokushiAllowed: true,
};

export function detectFaan(
  decompositions: WinningDecomposition[],
  _winTile: Tile,
  ctx: WinContext,
  rules: FaanRuleSet = HK_OFFICIAL_RULES,
): FaanItem[] {
  if (ctx.heavenly) return [{ pattern: 'heavenlyHand', faan: 13 }];
  if (ctx.earthly)  return [{ pattern: 'earthlyHand',  faan: 13 }];
  if (decompositions.length === 0) return [];

  const candidates = decompositions.map(d => detectOne(d, ctx, rules));
  let best = candidates[0]!;
  let bestSum = sum(best);
  for (const c of candidates.slice(1)) {
    const s = sum(c);
    if (s > bestSum) { best = c; bestSum = s; }
  }
  return best;
}

function sum(items: FaanItem[]): number {
  return items.reduce((a, b) => a + b.faan, 0);
}

// Per-decomposition cache so detectors share `tiles`, `suits`, and structural
// checks instead of each recomputing them.
type Dctx = {
  d: WinningDecomposition;
  isStandard: boolean;
  tiles: Tile[];
  suits: Set<Suit>;
  noChows: boolean;
  meldHeads: Tile[];   // first tile of each meld (the pong/kong/chow leader)
};

function makeDctx(d: WinningDecomposition): Dctx {
  const tiles: Tile[] = [];
  for (const m of d.melds) tiles.push(...m.tiles);
  if (d.kind === 'standard' || d.kind === 'thirteenOrphans') {
    tiles.push(d.pair, d.pair);
  } else if (d.kind === 'sevenPairs') {
    for (const t of d.pairs) { tiles.push(t); tiles.push(t); }
  }
  const suits = new Set<Suit>();
  for (const t of tiles) suits.add(tileSuit(t));
  return {
    d,
    isStandard: d.kind === 'standard',
    tiles,
    suits,
    noChows: d.melds.every(m => m.shape !== 'chow'),
    meldHeads: d.melds.map(m => m.tiles[0]!),
  };
}

function detectOne(d: WinningDecomposition, ctx: WinContext, rules: FaanRuleSet): FaanItem[] {
  const dctx = makeDctx(d);
  const matched: FaanPattern[] = [];
  for (const p of FAAN_PATTERNS) {
    if (FAAN_BONUSES.has(p)) continue;
    if (matchesPattern(p, dctx, ctx, rules)) matched.push(p);
  }
  for (const p of FAAN_PATTERNS) {
    if (!FAAN_BONUSES.has(p)) continue;
    if (matchesBonus(p, ctx)) matched.push(p);
  }
  const superseded = new Set<FaanPattern>();
  for (const p of matched) {
    for (const sub of SUPERSEDES[p] ?? []) superseded.add(sub);
  }
  return matched.filter(p => !superseded.has(p))
    .map(p => ({ pattern: p, faan: FAAN_VALUE[p] }));
}

function matchesPattern(
  p: FaanPattern, dctx: Dctx, ctx: WinContext, rules: FaanRuleSet,
): boolean {
  const d = dctx.d;
  switch (p) {
    case 'commonHand':       return dctx.isStandard && d.melds.every(m => m.shape === 'chow');
    case 'seatWind':         return dctx.isStandard && hasWindGroup(dctx, ctx.seatWind);
    case 'prevailingWind':   return dctx.isStandard && hasWindGroup(dctx, ctx.prevailingWind);
    case 'dragonRed':        return dctx.isStandard && hasNonChowOf(d, red);
    case 'dragonGreen':      return dctx.isStandard && hasNonChowOf(d, green);
    case 'dragonWhite':      return dctx.isStandard && hasNonChowOf(d, white);
    case 'allInTriplets':    return dctx.isStandard && dctx.noChows;
    case 'mixedOneSuit':     return isMixedOneSuit(dctx);
    case 'sevenPairs':       return rules.sevenPairsAllowed && d.kind === 'sevenPairs';
    case 'mixedOrphans':     return isMixedOrphans(dctx);
    case 'smallDragons':     return isSmallDragons(dctx);
    case 'smallWinds':       return isSmallWinds(dctx);
    case 'allOneSuit':       return isAllOneSuit(dctx);
    case 'greatDragons':     return isGreatDragons(dctx);
    case 'allHonorTiles':    return isAllHonors(dctx);
    case 'selfTriplets':     return dctx.isStandard && dctx.noChows && d.melds.every(m => m.isConcealed);
    case 'orphans':          return isOrphans(dctx);
    case 'nineGates':        return isNineGates(dctx);
    case 'greatWinds':       return isGreatWinds(dctx);
    case 'thirteenOrphans':  return rules.kokushiAllowed && d.kind === 'thirteenOrphans';
    case 'allKongs':         return dctx.isStandard && d.melds.every(m => m.shape === 'kong');
    default: return false;
  }
}

function matchesBonus(p: FaanPattern, ctx: WinContext): boolean {
  switch (p) {
    case 'selfPick':         return ctx.selfDraw;
    case 'robbingKong':      return !!ctx.robbingKong;
    case 'winByLastCatch':   return !!ctx.lastCatch;
    case 'winByKong':        return !!ctx.winByKong;
    case 'winByDoubleKong':  return false; // not modeled in scenario schema yet
    default: return false;
  }
}

const WIND_TILE: Record<Wind, Tile> = {
  east, south, west, north,
};

function hasWindGroup(dctx: Dctx, wind: Wind): boolean {
  const target = WIND_TILE[wind];
  return dctx.d.melds.some(m => m.shape !== 'chow' && m.tiles[0] === target);
}

function hasNonChowOf(d: WinningDecomposition, tile: Tile): boolean {
  return d.melds.some(m => m.shape !== 'chow' && m.tiles[0] === tile);
}

function isMixedOneSuit(dctx: Dctx): boolean {
  if (!dctx.isStandard) return false;
  const hasHonor = dctx.suits.has('wind') || dctx.suits.has('dragon');
  let nonHonor = 0;
  for (const s of dctx.suits) if (s !== 'wind' && s !== 'dragon') nonHonor++;
  return nonHonor === 1 && hasHonor;
}

function isAllOneSuit(dctx: Dctx): boolean {
  if (!dctx.isStandard) return false;
  return dctx.suits.size === 1 && !dctx.suits.has('wind') && !dctx.suits.has('dragon');
}

function isAllHonors(dctx: Dctx): boolean {
  if (!dctx.isStandard) return false;
  for (const t of dctx.tiles) if (!isHonor(t)) return false;
  return true;
}

function isMixedOrphans(dctx: Dctx): boolean {
  if (!dctx.isStandard || !dctx.noChows) return false;
  let hasH = false, hasT = false;
  for (const t of dctx.tiles) {
    if (!isTerminalOrHonor(t)) return false;
    if (isHonor(t)) hasH = true; else hasT = true;
  }
  return hasH && hasT;
}

function isOrphans(dctx: Dctx): boolean {
  if (!dctx.isStandard || !dctx.noChows) return false;
  for (const t of dctx.tiles) if (!isTerminal(t)) return false;
  return true;
}

function isSmallDragons(dctx: Dctx): boolean {
  if (!dctx.isStandard) return false;
  const d = dctx.d as Extract<WinningDecomposition, { kind: 'standard' }>;
  let dragonGroups = 0;
  for (const m of d.melds) if (DRAGONS.has(m.tiles[0]!)) dragonGroups++;
  return dragonGroups === 2 && DRAGONS.has(d.pair);
}

function isGreatDragons(dctx: Dctx): boolean {
  if (!dctx.isStandard) return false;
  const heads = new Set<Tile>();
  for (const h of dctx.meldHeads) if (DRAGONS.has(h)) heads.add(h);
  return heads.size === 3;
}

function isSmallWinds(dctx: Dctx): boolean {
  if (!dctx.isStandard) return false;
  const d = dctx.d as Extract<WinningDecomposition, { kind: 'standard' }>;
  let windGroups = 0;
  for (const m of d.melds) if (WINDS.has(m.tiles[0]!)) windGroups++;
  return windGroups === 3 && WINDS.has(d.pair);
}

function isGreatWinds(dctx: Dctx): boolean {
  if (!dctx.isStandard) return false;
  const heads = new Set<Tile>();
  for (const h of dctx.meldHeads) if (WINDS.has(h)) heads.add(h);
  return heads.size === 4;
}

function isNineGates(dctx: Dctx): boolean {
  if (!dctx.isStandard) return false;
  const d = dctx.d as Extract<WinningDecomposition, { kind: 'standard' }>;
  if (!d.melds.every(m => m.isConcealed)) return false;
  if (!isAllOneSuit(dctx)) return false;
  const counts = new Array(9).fill(0);
  for (const t of dctx.tiles) counts[tileNumber(t) - 1]++;
  const base = [3, 1, 1, 1, 1, 1, 1, 1, 3];
  let diffs = 0;
  for (let i = 0; i < 9; i++) {
    if (counts[i]! < base[i]!) return false;
    diffs += counts[i]! - base[i]!;
  }
  return diffs === 1;
}
