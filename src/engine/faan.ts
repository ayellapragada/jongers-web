// HK faan catalog + detectors. Port of MahjongKit/Scoring/{FaanPattern,Detectors}.swift.

import { Tile, tileSuit, tileNumber, isHonor, isTerminal, isTerminalOrHonor,
         east, south, west, north, red, green, white } from './tile';
import type { WinningDecomposition, DecomposedMeld } from './decompose';
import type { Wind, WinContext } from '../scenarios/schema';

export const FAAN_PATTERNS = [
  // 1 faan
  'commonHand', 'seatWind', 'prevailingWind',
  'dragonRed', 'dragonGreen', 'dragonWhite',
  'selfPick', 'robbingKong', 'winByLastCatch',
  // 2 faan
  'winByKong',
  // 3 faan
  'allInTriplets', 'mixedOneSuit',
  // 4 faan
  'mixedOrphans', 'sevenPairs',
  // 5 faan
  'smallDragons',
  // 6 faan
  'smallWinds',
  // 7 faan
  'allOneSuit',
  // 8 faan
  'greatDragons',
  // 9 faan (bonus)
  'winByDoubleKong',
  // 10 faan
  'allHonorTiles', 'selfTriplets', 'orphans', 'nineGates',
  // 13 faan
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

function detectOne(d: WinningDecomposition, ctx: WinContext, rules: FaanRuleSet): FaanItem[] {
  const matched: FaanPattern[] = [];
  for (const p of FAAN_PATTERNS) {
    if (FAAN_BONUSES.has(p)) continue;
    if (matchesPattern(p, d, ctx, rules)) matched.push(p);
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
  p: FaanPattern, d: WinningDecomposition, ctx: WinContext, rules: FaanRuleSet,
): boolean {
  switch (p) {
    case 'commonHand':       return isCommonHand(d);
    case 'seatWind':         return d.kind === 'standard' && hasWindGroup(d, ctx.discarder === undefined ? defaultSeatWind(ctx) : defaultSeatWind(ctx));
    case 'prevailingWind':   return d.kind === 'standard' && hasWindGroup(d, prevailingWindFromCtx(ctx));
    case 'dragonRed':        return d.kind === 'standard' && hasNonChowOf(d, red);
    case 'dragonGreen':      return d.kind === 'standard' && hasNonChowOf(d, green);
    case 'dragonWhite':      return d.kind === 'standard' && hasNonChowOf(d, white);
    case 'allInTriplets':    return isAllInTriplets(d);
    case 'mixedOneSuit':     return isMixedOneSuit(d);
    case 'sevenPairs':       return rules.sevenPairsAllowed && d.kind === 'sevenPairs';
    case 'mixedOrphans':     return isMixedOrphans(d);
    case 'smallDragons':     return isSmallDragons(d);
    case 'smallWinds':       return isSmallWinds(d);
    case 'allOneSuit':       return isAllOneSuit(d);
    case 'greatDragons':     return isGreatDragons(d);
    case 'allHonorTiles':    return isAllHonors(d);
    case 'selfTriplets':     return isSelfTriplets(d);
    case 'orphans':          return isOrphans(d);
    case 'nineGates':        return isNineGates(d);
    case 'greatWinds':       return isGreatWinds(d);
    case 'thirteenOrphans':  return rules.kokushiAllowed && d.kind === 'thirteenOrphans';
    case 'allKongs':         return isAllKongs(d);
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

// Wind helpers — scenarios pass yourSeat + roundWind in setup; we wire them into WinContext at scoring time.
// For audit-time scoring of authored faan-recognition scenarios, the scenario carries the WinContext.
// Seat-wind and prevailing-wind translation:
function defaultSeatWind(_ctx: WinContext): Wind {
  // Scenario-bound: caller must populate from scenario.setup.yourSeat.
  // Used directly via the wrapper in scenarios/audit.ts.
  return _ctxSeatWind;
}
function prevailingWindFromCtx(_ctx: WinContext): Wind {
  return _ctxPrevailingWind;
}
// Set per-scenario via setScoringContext before calling detectFaan.
// (Avoids threading two more args through every detector.)
let _ctxSeatWind: Wind = 'east';
let _ctxPrevailingWind: Wind = 'east';
export function setScoringContext(seat: Wind, prevailing: Wind): void {
  _ctxSeatWind = seat;
  _ctxPrevailingWind = prevailing;
}

const WIND_TILE: Record<Wind, Tile> = {
  east, south, west, north,
};

function hasWindGroup(d: WinningDecomposition, wind: Wind): boolean {
  if (d.kind !== 'standard') return false;
  const target = WIND_TILE[wind];
  return d.melds.some(m => m.shape !== 'chow' && m.tiles[0] === target);
}

function hasNonChowOf(d: WinningDecomposition, tile: Tile): boolean {
  if (d.kind !== 'standard') return false;
  return d.melds.some(m => m.shape !== 'chow' && m.tiles[0] === tile);
}

function isCommonHand(d: WinningDecomposition): boolean {
  return d.kind === 'standard' && d.melds.every(m => m.shape === 'chow');
}

function isAllInTriplets(d: WinningDecomposition): boolean {
  return d.kind === 'standard' && d.melds.every(m => m.shape !== 'chow');
}

function isSelfTriplets(d: WinningDecomposition): boolean {
  return isAllInTriplets(d) && d.kind === 'standard' && d.melds.every(m => m.isConcealed);
}

function allTilesOf(d: WinningDecomposition): Tile[] {
  const out: Tile[] = [];
  for (const m of d.melds) out.push(...m.tiles);
  if (d.kind === 'standard' || d.kind === 'thirteenOrphans') {
    out.push(d.pair, d.pair);
  }
  if (d.kind === 'sevenPairs') {
    for (const t of d.pairs) { out.push(t); out.push(t); }
  }
  return out;
}

function isMixedOneSuit(d: WinningDecomposition): boolean {
  if (d.kind !== 'standard') return false;
  const tiles = allTilesOf(d);
  const suits = new Set(tiles.map(tileSuit));
  const hasHonor = suits.has('wind') || suits.has('dragon');
  const nonHonor = new Set([...suits].filter(s => s !== 'wind' && s !== 'dragon'));
  return nonHonor.size === 1 && hasHonor;
}

function isAllOneSuit(d: WinningDecomposition): boolean {
  if (d.kind !== 'standard') return false;
  const tiles = allTilesOf(d);
  const suits = new Set(tiles.map(tileSuit));
  return suits.size === 1 && !suits.has('wind') && !suits.has('dragon');
}

function isAllHonors(d: WinningDecomposition): boolean {
  if (d.kind !== 'standard') return false;
  return allTilesOf(d).every(isHonor);
}

function isMixedOrphans(d: WinningDecomposition): boolean {
  if (d.kind !== 'standard') return false;
  if (!d.melds.every(m => m.shape !== 'chow')) return false;
  const tiles = allTilesOf(d);
  const allTH = tiles.every(isTerminalOrHonor);
  const hasH = tiles.some(isHonor);
  const hasT = tiles.some(t => !isHonor(t));
  return allTH && hasH && hasT;
}

function isOrphans(d: WinningDecomposition): boolean {
  if (d.kind !== 'standard') return false;
  if (!d.melds.every(m => m.shape !== 'chow')) return false;
  return allTilesOf(d).every(isTerminal);
}

function isSmallDragons(d: WinningDecomposition): boolean {
  if (d.kind !== 'standard') return false;
  const dragons = new Set<Tile>([red, green, white]);
  const dragonGroups = d.melds.filter(m => dragons.has(m.tiles[0]!));
  const pairIsDragon = dragons.has(d.pair);
  return dragonGroups.length === 2 && pairIsDragon;
}

function isGreatDragons(d: WinningDecomposition): boolean {
  if (d.kind !== 'standard') return false;
  const dragons = new Set<Tile>([red, green, white]);
  const groupHeads = new Set(d.melds.map(m => m.tiles[0]!).filter(t => dragons.has(t)));
  return groupHeads.size === 3;
}

function isSmallWinds(d: WinningDecomposition): boolean {
  if (d.kind !== 'standard') return false;
  const winds = new Set<Tile>([east, south, west, north]);
  const windGroups = d.melds.filter(m => winds.has(m.tiles[0]!));
  const pairIsWind = winds.has(d.pair);
  return windGroups.length === 3 && pairIsWind;
}

function isGreatWinds(d: WinningDecomposition): boolean {
  if (d.kind !== 'standard') return false;
  const winds = new Set<Tile>([east, south, west, north]);
  const groupHeads = new Set(d.melds.map(m => m.tiles[0]!).filter(t => winds.has(t)));
  return groupHeads.size === 4;
}

function isNineGates(d: WinningDecomposition): boolean {
  if (d.kind !== 'standard') return false;
  if (!d.melds.every(m => m.isConcealed)) return false;
  if (!isAllOneSuit(d)) return false;
  const counts = new Array(9).fill(0);
  for (const t of allTilesOf(d)) counts[tileNumber(t) - 1]++;
  const base = [3, 1, 1, 1, 1, 1, 1, 1, 3];
  let diffs = 0;
  for (let i = 0; i < 9; i++) {
    if (counts[i] < base[i]!) return false;
    diffs += counts[i] - base[i]!;
  }
  return diffs === 1;
}

function isAllKongs(d: WinningDecomposition): boolean {
  return d.kind === 'standard' && d.melds.every(m => m.shape === 'kong');
}
