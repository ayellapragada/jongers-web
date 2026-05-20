import { describe, it, expect } from 'vitest';
import { decomposeWinningHand } from '../../src/engine/decompose';
import { detectFaan, setScoringContext, HK_OFFICIAL_RULES } from '../../src/engine/faan';
import { parseHand } from '../../src/engine/hand';
import { parseMPSZ } from '../../src/engine/mpsz';
import type { WinContext } from '../../src/scenarios/schema';

const baseCtx: WinContext = { selfDraw: false, discarder: 'south' };

function score(handStr: string, winStr: string, ctx: WinContext, seat: 'east'|'south'|'west'|'north' = 'east', prevailing: 'east'|'south'|'west'|'north' = 'east') {
  setScoringContext(seat, prevailing);
  const winTile = parseMPSZ(winStr)[0]!;
  const hand = parseHand(handStr);
  const decs = decomposeWinningHand(hand, winTile);
  return detectFaan(decs, winTile, ctx, HK_OFFICIAL_RULES);
}

describe('detectFaan — basic patterns', () => {
  // score() takes the 13-tile pre-win hand + the win tile separately.
  it('common hand: all chows + non-yaku pair', () => {
    // 13 tiles: 123m 456p 789s 234m + 2z; win on 2z
    const items = score('123m456p789s234m2z', '2z', baseCtx, 'east', 'east');
    expect(items.map(i => i.pattern)).toEqual(expect.arrayContaining(['commonHand']));
  });

  it('all concealed triplets → selfTriplets (which supersedes allInTriplets)', () => {
    // 13-tile pre-win: 111m 222p 333s 444m 5s; win on 5s (no declared melds = concealed)
    const items = score('111m222p333s444m5s', '5s', baseCtx);
    const patterns = items.map(i => i.pattern);
    expect(patterns).toContain('selfTriplets');
    expect(patterns).not.toContain('allInTriplets');
  });

  it('great dragons supersedes small dragons + dragon pongs', () => {
    // 13-tile pre-win: 555z 666z 777z 234m 1p; win on 1p (pair)
    const items = score('555z666z777z234m1p', '1p', baseCtx);
    const patterns = items.map(i => i.pattern);
    expect(patterns).toContain('greatDragons');
    expect(patterns).not.toContain('smallDragons');
    expect(patterns).not.toContain('dragonRed');
  });

  it('self-pick bonus when selfDraw=true', () => {
    const items = score('123m456p789s234m2z', '2z', { selfDraw: true }, 'east', 'east');
    expect(items.map(i => i.pattern)).toContain('selfPick');
  });

  it('heavenly hand returns only heavenlyHand', () => {
    const items = score('123m456p789s234m2z', '2z',
      { selfDraw: true, heavenly: true }, 'east', 'east');
    expect(items).toEqual([{ pattern: 'heavenlyHand', faan: 13 }]);
  });
});
