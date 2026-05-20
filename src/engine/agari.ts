// Agari (winning-hand) detection. Port of MahjongRepository/mahjong agari.py
// via MahjongKit/Agari.swift. Validates structure only (4 melds + pair,
// seven pairs, or thirteen orphans) — no yaku/faan.

import { Hand, concealedCounts, isKong } from './hand';
import { Tile } from './tile';

export function isWinning(h: Hand): boolean {
  const tiles = concealedCounts(h);
  for (const m of h.melds) {
    for (const t of m.tiles) tiles[t]++;
    // A kong uses 4 tiles but occupies one meld slot; the kernel expects
    // 3-tile-per-meld footprint, so peel one off per kong.
    if (isKong(m)) tiles[m.tiles[0] as Tile]--;
  }
  return agariIsAgari(tiles);
}

export function canWinOnTile(h: Hand, t: Tile): boolean {
  return isWinning({ concealed: [...h.concealed, t], melds: h.melds });
}

export function agariIsAgari(t: number[]): boolean {
  if (t.length !== 34) throw new Error(`tiles34 must be length 34, got ${t.length}`);

  const j = (1 << t[27]!) | (1 << t[28]!) | (1 << t[29]!) | (1 << t[30]!)
          | (1 << t[31]!) | (1 << t[32]!) | (1 << t[33]!);
  if (j >= 0x10) return false;

  // Thirteen orphans
  if ((j & 3) === 2 &&
      t[0]! * t[8]! * t[9]! * t[17]! * t[18]! * t[26]! *
      t[27]! * t[28]! * t[29]! * t[30]! * t[31]! * t[32]! * t[33]! === 2) {
    return true;
  }

  // Seven pairs
  if ((j & 10) === 0) {
    let pairs = 0;
    for (let i = 0; i < 34; i++) if (t[i] === 2) pairs++;
    if (pairs === 7) return true;
  }

  if ((j & 2) !== 0) return false;

  const n00 = t[0]! + t[3]! + t[6]!;
  const n01 = t[1]! + t[4]! + t[7]!;
  const n02 = t[2]! + t[5]! + t[8]!;
  const n10 = t[9]!  + t[12]! + t[15]!;
  const n11 = t[10]! + t[13]! + t[16]!;
  const n12 = t[11]! + t[14]! + t[17]!;
  const n20 = t[18]! + t[21]! + t[24]!;
  const n21 = t[19]! + t[22]! + t[25]!;
  const n22 = t[20]! + t[23]! + t[26]!;

  const n0 = (n00 + n01 + n02) % 3; if (n0 === 1) return false;
  const n1 = (n10 + n11 + n12) % 3; if (n1 === 1) return false;
  const n2 = (n20 + n21 + n22) % 3; if (n2 === 1) return false;

  let pairFlag = (n0 === 2 ? 1 : 0) + (n1 === 2 ? 1 : 0) + (n2 === 2 ? 1 : 0);
  for (let i = 27; i < 34; i++) if (t[i] === 2) pairFlag++;
  if (pairFlag !== 1) return false;

  const nn0 = (n00 * 1 + n01 * 2) % 3;
  const m0  = toMeld(t, 0);
  const nn1 = (n10 * 1 + n11 * 2) % 3;
  const m1  = toMeld(t, 9);
  const nn2 = (n20 * 1 + n21 * 2) % 3;
  const m2  = toMeld(t, 18);

  if ((j & 4) !== 0) {
    return (n0 | nn0 | n1 | nn1 | n2 | nn2) === 0
      && isMentsu(m0) && isMentsu(m1) && isMentsu(m2);
  }
  if (n0 === 2) {
    return (n1 | nn1 | n2 | nn2) === 0
      && isMentsu(m1) && isMentsu(m2) && isAtamaMentsu(nn0, m0);
  }
  if (n1 === 2) {
    return (n2 | nn2 | n0 | nn0) === 0
      && isMentsu(m2) && isMentsu(m0) && isAtamaMentsu(nn1, m1);
  }
  return (n0 | nn0 | n1 | nn1) === 0
    && isMentsu(m0) && isMentsu(m1) && isAtamaMentsu(nn2, m2);
}

function toMeld(t: number[], d: number): number {
  return t[d]!
    | (t[d+1]! << 3)  | (t[d+2]! << 6)  | (t[d+3]! << 9)
    | (t[d+4]! << 12) | (t[d+5]! << 15) | (t[d+6]! << 18)
    | (t[d+7]! << 21) | (t[d+8]! << 24);
}

function isMentsu(mInput: number): boolean {
  let m = mInput;
  let a = m & 7;
  let b = 0, c = 0;
  if (a === 1 || a === 4) { b = 1; c = 1; }
  else if (a === 2)       { b = 2; c = 2; }

  m >>>= 3;
  a = (m & 7) - b;
  if (a < 0) return false;

  for (let i = 0; i < 6; i++) {
    b = c; c = 0;
    if (a === 1 || a === 4) { b += 1; c += 1; }
    else if (a === 2)       { b += 2; c += 2; }
    m >>>= 3;
    a = (m & 7) - b;
    if (a < 0) return false;
  }
  m >>>= 3;
  a = (m & 7) - c;
  return a === 0 || a === 3;
}

function isAtamaMentsu(nn: number, m: number): boolean {
  if (nn === 0) {
    if ((m & (7 << 6))  >= (2 << 6)  && isMentsu(m - (2 << 6)))  return true;
    if ((m & (7 << 15)) >= (2 << 15) && isMentsu(m - (2 << 15))) return true;
    if ((m & (7 << 24)) >= (2 << 24) && isMentsu(m - (2 << 24))) return true;
  } else if (nn === 1) {
    if ((m & (7 << 3))  >= (2 << 3)  && isMentsu(m - (2 << 3)))  return true;
    if ((m & (7 << 12)) >= (2 << 12) && isMentsu(m - (2 << 12))) return true;
    if ((m & (7 << 21)) >= (2 << 21) && isMentsu(m - (2 << 21))) return true;
  } else if (nn === 2) {
    if ((m & 7) >= 2 && isMentsu(m - 2)) return true;
    if ((m & (7 << 9))  >= (2 << 9)  && isMentsu(m - (2 << 9)))  return true;
    if ((m & (7 << 18)) >= (2 << 18) && isMentsu(m - (2 << 18))) return true;
  }
  return false;
}
