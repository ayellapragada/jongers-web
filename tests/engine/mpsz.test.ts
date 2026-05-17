import { describe, it, expect } from 'vitest';
import { parseMPSZ, formatTile, formatTiles, MPSZParseError } from '../../src/engine/mpsz';
import { man, pin, sou, east, north, white, red } from '../../src/engine/tile';

describe('parseMPSZ', () => {
  it('parses single suit run', () => {
    expect(parseMPSZ('123m')).toEqual([man(1), man(2), man(3)]);
  });
  it('parses multi-suit', () => {
    expect(parseMPSZ('123m456p789s')).toEqual([
      man(1), man(2), man(3),
      pin(4), pin(5), pin(6),
      sou(7), sou(8), sou(9),
    ]);
  });
  it('parses honors via z', () => {
    expect(parseMPSZ('11223344z')).toEqual([
      east, east, 28, 28, 29, 29, north, north,
    ]);
  });
  it('parses dragons 5z..7z', () => {
    expect(parseMPSZ('567z')).toEqual([white, 32, red]);
  });
  it('ignores whitespace', () => {
    expect(parseMPSZ(' 1m  9m ')).toEqual([man(1), man(9)]);
  });
  it('throws on empty run', () => {
    expect(() => parseMPSZ('m')).toThrow(MPSZParseError);
  });
  it('throws on honor out of range', () => {
    expect(() => parseMPSZ('8z')).toThrow(MPSZParseError);
    expect(() => parseMPSZ('0z')).toThrow(MPSZParseError);
  });
  it('throws on bad suit letter', () => {
    expect(() => parseMPSZ('1x')).toThrow(MPSZParseError);
  });
  it('throws on trailing digits', () => {
    expect(() => parseMPSZ('123')).toThrow(MPSZParseError);
  });
  it('empty string parses to empty tiles', () => {
    expect(parseMPSZ('')).toEqual([]);
  });
});

describe('formatTile / formatTiles', () => {
  it('formats man/pin/sou with suit letter', () => {
    expect(formatTile(man(5))).toBe('5m');
    expect(formatTile(pin(1))).toBe('1p');
    expect(formatTile(sou(9))).toBe('9s');
  });
  it('formats winds as 1z..4z', () => {
    expect(formatTile(east)).toBe('1z');
    expect(formatTile(north)).toBe('4z');
  });
  it('formats dragons as 5z..7z', () => {
    expect(formatTile(white)).toBe('5z');
    expect(formatTile(red)).toBe('7z');
  });
  it('formatTiles groups by suit in input order', () => {
    expect(formatTiles([man(1), man(2), pin(3)])).toBe('12m3p');
  });
  it('round-trips', () => {
    const input = '123m456p789s11z';
    expect(formatTiles(parseMPSZ(input))).toBe(input);
  });
});
