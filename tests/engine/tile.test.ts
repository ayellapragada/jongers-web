import { describe, it, expect } from 'vitest';
import {
  tileFromIndex,
  tileSuit,
  tileNumber,
  isHonor,
  isTerminal,
  isTerminalOrHonor,
  man, pin, sou, east, south, west, north, white, green, red,
} from '../../src/engine/tile';

describe('tile suit/number', () => {
  it('man 1 has suit=man number=1', () => {
    const t = man(1);
    expect(tileSuit(t)).toBe('man');
    expect(tileNumber(t)).toBe(1);
  });

  it('pin 5 is index 13', () => {
    expect(pin(5)).toBe(13);
  });

  it('sou 9 is index 26', () => {
    expect(sou(9)).toBe(26);
    expect(tileSuit(sou(9))).toBe('sou');
    expect(tileNumber(sou(9))).toBe(9);
  });

  it('east is index 27, north is 30', () => {
    expect(east).toBe(27);
    expect(north).toBe(30);
    expect(tileSuit(east)).toBe('wind');
    expect(tileNumber(east)).toBe(1);
    expect(tileNumber(north)).toBe(4);
  });

  it('white/green/red dragons are 31/32/33', () => {
    expect(white).toBe(31);
    expect(green).toBe(32);
    expect(red).toBe(33);
    expect(tileSuit(red)).toBe('dragon');
    expect(tileNumber(red)).toBe(3);
  });
});

describe('tile categories', () => {
  it('honors are >= 27', () => {
    expect(isHonor(east)).toBe(true);
    expect(isHonor(red)).toBe(true);
    expect(isHonor(man(9))).toBe(false);
  });

  it('terminals are 1 or 9 of a suit; honors are not terminals', () => {
    expect(isTerminal(man(1))).toBe(true);
    expect(isTerminal(man(9))).toBe(true);
    expect(isTerminal(man(5))).toBe(false);
    expect(isTerminal(east)).toBe(false);
  });

  it('isTerminalOrHonor matches both', () => {
    expect(isTerminalOrHonor(man(1))).toBe(true);
    expect(isTerminalOrHonor(east)).toBe(true);
    expect(isTerminalOrHonor(man(5))).toBe(false);
  });
});

describe('tileFromIndex', () => {
  it('rejects out-of-range', () => {
    expect(() => tileFromIndex(34)).toThrow();
    expect(() => tileFromIndex(-1)).toThrow();
  });
  it('round-trips 0..33', () => {
    for (let i = 0; i < 34; i++) {
      expect(tileFromIndex(i)).toBe(i);
    }
  });
});
