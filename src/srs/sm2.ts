const DAY_MS = 24 * 60 * 60 * 1000;

export type SRSCard = {
  scenarioId: string;
  ease: number;
  intervalDays: number;
  reps: number;
  dueAt: number;
  lastReviewedAt: number;
};

export function newCard(scenarioId: string, now: number): SRSCard {
  return {
    scenarioId,
    ease: 2.5,
    intervalDays: 0,
    reps: 0,
    dueAt: now,
    lastReviewedAt: 0,
  };
}

export function reviewCard(card: SRSCard, correct: boolean, now: number): SRSCard {
  const q = correct ? 4 : 1;
  let { ease, intervalDays, reps } = card;

  if (q < 3) {
    reps = 0;
    intervalDays = 1;
  } else {
    reps += 1;
    if (reps === 1)      intervalDays = 1;
    else if (reps === 2) intervalDays = 6;
    else                 intervalDays = Math.round(intervalDays * ease);

    const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    ease = Math.max(1.3, ease + delta);
  }

  return {
    ...card,
    ease,
    intervalDays,
    reps,
    dueAt: now + intervalDays * DAY_MS,
    lastReviewedAt: now,
  };
}
