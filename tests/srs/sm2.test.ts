import { describe, it, expect } from 'vitest';
import { newCard, reviewCard } from '../../src/srs/sm2';

const DAY = 24 * 60 * 60 * 1000;

describe('newCard', () => {
  it('is due immediately with default ease', () => {
    const now = 1_000_000;
    const c = newCard('s1', now);
    expect(c.scenarioId).toBe('s1');
    expect(c.ease).toBeCloseTo(2.5, 5);
    expect(c.intervalDays).toBe(0);
    expect(c.reps).toBe(0);
    expect(c.dueAt).toBe(now);
  });
});

describe('reviewCard', () => {
  it('first correct → reps=1, interval=1, due tomorrow', () => {
    const now = 1_000_000;
    const c = reviewCard(newCard('s', 0), true, now);
    expect(c.reps).toBe(1);
    expect(c.intervalDays).toBe(1);
    expect(c.dueAt).toBe(now + DAY);
    expect(c.lastReviewedAt).toBe(now);
  });

  it('second correct → reps=2, interval=6', () => {
    const c1 = reviewCard(newCard('s', 0), true, 0);
    const c2 = reviewCard(c1, true, DAY);
    expect(c2.reps).toBe(2);
    expect(c2.intervalDays).toBe(6);
    expect(c2.dueAt).toBe(DAY + 6 * DAY);
  });

  it('third+ correct → interval *= ease', () => {
    let c = newCard('s', 0);
    c = reviewCard(c, true, 0);
    c = reviewCard(c, true, 0);
    const before = c.intervalDays;
    const ease = c.ease;
    c = reviewCard(c, true, 0);
    expect(c.intervalDays).toBe(Math.round(before * ease));
  });

  it('wrong resets reps to 0, interval to 1', () => {
    let c = newCard('s', 0);
    c = reviewCard(c, true, 0);
    c = reviewCard(c, true, 0);
    c = reviewCard(c, false, 0);
    expect(c.reps).toBe(0);
    expect(c.intervalDays).toBe(1);
    expect(c.dueAt).toBe(DAY);
  });

  it('ease never drops below 1.3', () => {
    let c = newCard('s', 0);
    for (let i = 0; i < 50; i++) c = reviewCard(c, false, 0);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('correct increases or holds ease', () => {
    let c = newCard('s', 0);
    const e0 = c.ease;
    c = reviewCard(c, true, 0);
    expect(c.ease).toBeGreaterThanOrEqual(e0);
  });
});
