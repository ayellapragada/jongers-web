import { describe, it, expect } from 'vitest';
import { isWinning, canWinOnTile } from '../../src/engine/agari';
import { parseHand, makeHand, makeMeld } from '../../src/engine/hand';
import { east, south, west, north, white, green, red, man, pin, sou } from '../../src/engine/tile';

describe('isWinning — standard form', () => {
  it('123m456p789s11122z is a win (4 melds + pair)', () => {
    expect(isWinning(parseHand('123m456p789s11122z'))).toBe(true);
  });
  it('234m234m234m11s55z (all-pongs + chow combos) wins', () => {
    expect(isWinning(parseHand('11122233344455m'))).toBe(true);
  });
  it('13-tile hand is not winning', () => {
    expect(isWinning(parseHand('123m456p789s1122z'))).toBe(false);
  });
  it('14-tile near-miss is not winning', () => {
    expect(isWinning(parseHand('123m456p789s11223z'))).toBe(false);
  });
});

describe('isWinning — special forms', () => {
  it('seven pairs detected', () => {
    expect(isWinning(parseHand('11m22m33p44p55s66s77z'))).toBe(true);
  });
  it('thirteen orphans detected', () => {
    // 19m 19p 19s + 7 honors + pair on east
    expect(isWinning(parseHand('19m19p19s1234567z1z'))).toBe(true);
  });
});

describe('canWinOnTile', () => {
  it('completes the pair', () => {
    const h = parseHand('123m456p789s1112z');  // 13-tile tanki on 2z
    expect(canWinOnTile(h, south)).toBe(true);
  });
});

describe('isWinning with declared melds', () => {
  it('open pong + concealed standard', () => {
    const h = makeHand(
      [man(1), man(2), man(3), pin(4), pin(5), pin(6), sou(7), sou(8), sou(9), white, white],
      [makeMeld('pong', [east, east, east])],
    );
    expect(isWinning(h)).toBe(true);
  });
});
