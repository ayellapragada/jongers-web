// Standard-form shanten (4 melds + 1 pair).
// Direct port of MahjongRepository/mahjong shanten.py, mirrored from
// MahjongKit/Shanten.swift. Convention: -1 winning, 0 tenpai, >0 away, 8 = start.

import { Hand, concealedCounts } from './hand';

export function standardShanten(h: Hand): number {
  return regularShanten(concealedCounts(h));
}

export function regularShanten(tiles34: number[]): number {
  if (tiles34.length !== 34) throw new Error(`tiles34 must be length 34, got ${tiles34.length}`);
  const calc = new RegularShanten(Int8Array.from(tiles34));
  return calc.calculate();
}

const AGARI = -1;

// Int8Array gives signed slots for transient negatives during recursive
// mutate-restore. Values stay within [-3, 4] in practice.
class RegularShanten {
  tiles: Int8Array;
  numberMelds = 0;
  numberTatsu = 0;
  numberPairs = 0;
  numberJidahai = 0;
  flagFourCopies = 0n;
  flagIsolatedTiles = 0n;
  minShanten = 8;

  constructor(tiles: Int8Array) {
    this.tiles = tiles;
  }

  calculate(): number {
    const countOfTiles = this.tiles.reduce((a, b) => a + b, 0);
    if (countOfTiles > 14) throw new Error(`too many tiles: ${countOfTiles}`);

    this.removeCharacterTiles(countOfTiles);
    const initMentsu = Math.floor((14 - countOfTiles) / 3);
    this.scan(initMentsu);
    return this.minShanten;
  }

  scan(initMentsu: number): void {
    for (let i = 0; i < 27; i++) {
      if (this.tiles[i] === 4) this.flagFourCopies |= 1n << BigInt(i);
    }
    this.numberMelds += initMentsu;
    this.run(0);
  }

  run(depth: number): void {
    if (this.minShanten === AGARI) return;

    while (depth < 27 && this.tiles[depth] === 0) depth++;
    if (depth >= 27) { this.updateResult(); return; }

    let i = depth;
    if (i > 8) i -= 9;
    if (i > 8) i -= 9;

    const t = this.tiles;

    if (t[depth] === 4) {
      this.increaseSet(depth);
      if (i < 7 && t[depth + 2]! > 0) {
        if (t[depth + 1]! > 0) {
          this.increaseSyuntsu(depth); this.run(depth + 1); this.decreaseSyuntsu(depth);
        }
        this.increaseTatsuSecond(depth); this.run(depth + 1); this.decreaseTatsuSecond(depth);
      }
      if (i < 8 && t[depth + 1]! > 0) {
        this.increaseTatsuFirst(depth); this.run(depth + 1); this.decreaseTatsuFirst(depth);
      }
      this.increaseIsolatedTile(depth); this.run(depth + 1); this.decreaseIsolatedTile(depth);
      this.decreaseSet(depth);
      this.increasePair(depth);
      if (i < 7 && t[depth + 2]! > 0) {
        if (t[depth + 1]! > 0) {
          this.increaseSyuntsu(depth); this.run(depth); this.decreaseSyuntsu(depth);
        }
        this.increaseTatsuSecond(depth); this.run(depth + 1); this.decreaseTatsuSecond(depth);
      }
      if (i < 8 && t[depth + 1]! > 0) {
        this.increaseTatsuFirst(depth); this.run(depth + 1); this.decreaseTatsuFirst(depth);
      }
      this.decreasePair(depth);
    }

    if (t[depth] === 3) {
      this.increaseSet(depth); this.run(depth + 1); this.decreaseSet(depth);
      this.increasePair(depth);
      if (i < 7 && t[depth + 1]! > 0 && t[depth + 2]! > 0) {
        this.increaseSyuntsu(depth); this.run(depth + 1); this.decreaseSyuntsu(depth);
      } else {
        if (i < 7 && t[depth + 2]! > 0) {
          this.increaseTatsuSecond(depth); this.run(depth + 1); this.decreaseTatsuSecond(depth);
        }
        if (i < 8 && t[depth + 1]! > 0) {
          this.increaseTatsuFirst(depth); this.run(depth + 1); this.decreaseTatsuFirst(depth);
        }
      }
      this.decreasePair(depth);

      if (i < 7 && t[depth + 2]! >= 2 && t[depth + 1]! >= 2) {
        this.increaseSyuntsu(depth);
        this.increaseSyuntsu(depth);
        this.run(depth);
        this.decreaseSyuntsu(depth);
        this.decreaseSyuntsu(depth);
      }
    }

    if (t[depth] === 2) {
      this.increasePair(depth); this.run(depth + 1); this.decreasePair(depth);
      if (i < 7 && t[depth + 2]! > 0 && t[depth + 1]! > 0) {
        this.increaseSyuntsu(depth); this.run(depth); this.decreaseSyuntsu(depth);
      }
    }

    if (t[depth] === 1) {
      if (i < 6 && t[depth + 1] === 1 && t[depth + 2]! > 0 && t[depth + 3] !== 4) {
        this.increaseSyuntsu(depth); this.run(depth + 2); this.decreaseSyuntsu(depth);
      } else {
        this.increaseIsolatedTile(depth); this.run(depth + 1); this.decreaseIsolatedTile(depth);
        if (i < 7 && t[depth + 2]! > 0) {
          if (t[depth + 1]! > 0) {
            this.increaseSyuntsu(depth); this.run(depth + 1); this.decreaseSyuntsu(depth);
          }
          this.increaseTatsuSecond(depth); this.run(depth + 1); this.decreaseTatsuSecond(depth);
        }
        if (i < 8 && t[depth + 1]! > 0) {
          this.increaseTatsuFirst(depth); this.run(depth + 1); this.decreaseTatsuFirst(depth);
        }
      }
    }
  }

  updateResult(): void {
    let retShanten = 8 - this.numberMelds * 2 - this.numberTatsu - this.numberPairs;
    let nMentsuKouho = this.numberMelds + this.numberTatsu;

    if (this.numberPairs > 0) {
      nMentsuKouho += this.numberPairs - 1;
    } else if (this.flagFourCopies !== 0n
        && this.flagIsolatedTiles !== 0n
        && (this.flagFourCopies | this.flagIsolatedTiles) === this.flagFourCopies) {
      retShanten += 1;
    }

    if (nMentsuKouho > 4) retShanten += nMentsuKouho - 4;

    if (retShanten !== AGARI && retShanten < this.numberJidahai) {
      retShanten = this.numberJidahai;
    }

    if (retShanten < this.minShanten) this.minShanten = retShanten;
  }

  // Int8Array indexed access is typed as `number | undefined` under
  // noUncheckedIndexedAccess, but every call site here passes an index the
  // kernel has already bounds-checked, so we read via the helper.
  private t(k: number): number { return this.tiles[k]!; }

  increaseSet(k: number)    { this.tiles[k] = this.t(k) - 3; this.numberMelds += 1; }
  decreaseSet(k: number)    { this.tiles[k] = this.t(k) + 3; this.numberMelds -= 1; }
  increasePair(k: number)   { this.tiles[k] = this.t(k) - 2; this.numberPairs += 1; }
  decreasePair(k: number)   { this.tiles[k] = this.t(k) + 2; this.numberPairs -= 1; }
  increaseSyuntsu(k: number){ this.tiles[k] = this.t(k) - 1; this.tiles[k+1] = this.t(k+1) - 1; this.tiles[k+2] = this.t(k+2) - 1; this.numberMelds++; }
  decreaseSyuntsu(k: number){ this.tiles[k] = this.t(k) + 1; this.tiles[k+1] = this.t(k+1) + 1; this.tiles[k+2] = this.t(k+2) + 1; this.numberMelds--; }
  increaseTatsuFirst(k: number){ this.tiles[k] = this.t(k) - 1; this.tiles[k+1] = this.t(k+1) - 1; this.numberTatsu++; }
  decreaseTatsuFirst(k: number){ this.tiles[k] = this.t(k) + 1; this.tiles[k+1] = this.t(k+1) + 1; this.numberTatsu--; }
  increaseTatsuSecond(k: number){ this.tiles[k] = this.t(k) - 1; this.tiles[k+2] = this.t(k+2) - 1; this.numberTatsu++; }
  decreaseTatsuSecond(k: number){ this.tiles[k] = this.t(k) + 1; this.tiles[k+2] = this.t(k+2) + 1; this.numberTatsu--; }
  increaseIsolatedTile(k: number){ this.tiles[k] = this.t(k) - 1; this.flagIsolatedTiles |= 1n << BigInt(k); }
  decreaseIsolatedTile(k: number){ this.tiles[k] = this.t(k) + 1; this.flagIsolatedTiles &= ~(1n << BigInt(k)); }

  removeCharacterTiles(nc: number): void {
    let fourCopies = 0n;
    let isolated = 0n;

    for (let i = 27; i < 34; i++) {
      const c = this.tiles[i]!;
      if (c === 4) {
        this.numberMelds += 1;
        this.numberJidahai += 1;
        fourCopies |= 1n << BigInt(i - 27);
        isolated  |= 1n << BigInt(i - 27);
      }
      if (c === 3) this.numberMelds += 1;
      if (c === 2) this.numberPairs += 1;
      if (c === 1) isolated |= 1n << BigInt(i - 27);
    }

    if (this.numberJidahai > 0 && (nc % 3) === 2) this.numberJidahai -= 1;

    if (isolated !== 0n) {
      this.flagIsolatedTiles |= 1n << 27n;
      if ((fourCopies | isolated) === fourCopies) {
        this.flagFourCopies |= 1n << 27n;
      }
    }
  }
}

export function shantenLabel(s: number): string {
  if (s === -1) return 'Winning (-1)';
  if (s === 0)  return 'Tenpai (0)';
  return `${s}-shanten`;
}
