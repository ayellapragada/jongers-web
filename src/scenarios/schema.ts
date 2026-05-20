import type { MeldKind } from '../engine/hand';

export type Wind = 'east' | 'south' | 'west' | 'north';

export type WaitShape =
  | 'tanki'
  | 'shanpon'
  | 'ryanmen'
  | 'kanchan'
  | 'penchan'
  | 'nobetan';

export type FaanPatternId = string;

export type MeldJSON = {
  kind: MeldKind;
  tiles: string[];
};

export type Setup = {
  hand: string;
  melds?: MeldJSON[];
  yourSeat: Wind;
  dealer: Wind;
  roundWind: Wind;
  doraIndicators?: string[];
  opponents?: {
    seat: Wind;
    discards: string[];
    melds: MeldJSON[];
  }[];
  visibleTiles?: string[];
};

export type DrillType = 'discard' | 'claim' | 'wait' | 'faan-recognition';

export type ScenarioBase = {
  id: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  explanation?: string;
  setup: Setup;
};

export type DiscardScenario = ScenarioBase & {
  type: 'discard';
  drewTile: string;
  // Multiple tiles when several discards are equally engine-best.
  answer: { discards: string[] };
};

export type ClaimScenario = ScenarioBase & {
  type: 'claim';
  trigger: { discarder: Wind; tile: string };
  answer:
    | { action: 'pass' }
    | { action: 'pon' }
    | { action: 'chi'; using: [string, string] }
    | { action: 'wu' };
};

export type WaitScenario = ScenarioBase & {
  type: 'wait';
  answer: { winningTiles: string[]; shape?: WaitShape };
};

export type WinContext = {
  selfDraw: boolean;
  lastCatch?: boolean;
  robbingKong?: boolean;
  winByKong?: boolean;
  heavenly?: boolean;
  earthly?: boolean;
  discarder?: Wind;
};

export type FaanRecognitionScenario = ScenarioBase & {
  type: 'faan-recognition';
  winTile: string;
  winContext: WinContext;
  answer: { patterns: FaanPatternId[]; totalFaan: number };
};

export type Scenario =
  | DiscardScenario
  | ClaimScenario
  | WaitScenario
  | FaanRecognitionScenario;

export type ScenarioLibrary = {
  discard: DiscardScenario[];
  claim: ClaimScenario[];
  wait: WaitScenario[];
  'faan-recognition': FaanRecognitionScenario[];
};
