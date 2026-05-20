<script lang="ts">
  import TileView from '../tiles/TileView.svelte';
  import type { ClaimScenario } from '../../scenarios/schema';
  import { parseMPSZ, parseTile } from '../../engine';
  import DrillSetupHeader from './DrillSetupHeader.svelte';
  import DrillReveal from './DrillReveal.svelte';
  import ChoiceGrid from './ChoiceGrid.svelte';

  let { scenario, phase, onSubmit }: {
    scenario: ClaimScenario;
    phase: 'answering' | 'revealed';
    onSubmit: (correct: boolean) => void;
  } = $props();

  type Action = ClaimScenario['answer']['action'];
  const ACTIONS: readonly Action[] = ['pon', 'chi', 'wu', 'pass'];

  let picked = $state<Action | null>(null);

  const handTiles = $derived(parseMPSZ(scenario.setup.hand));
  const triggerTile = $derived(parseTile(scenario.trigger.tile));

  function pick(a: Action) {
    if (phase !== 'answering') return;
    picked = a;
    onSubmit(a === scenario.answer.action);
  }
</script>

{#snippet meta()}
  <span>Discarder: <strong>{scenario.trigger.discarder}</strong></span>
{/snippet}

<DrillSetupHeader {scenario} {meta} />

<div class="trigger">
  Opponent's discard:
  <TileView tile={triggerTile} state="highlighted" />
</div>

<h4>Your hand</h4>
<div class="hand">
  {#each handTiles as t}
    <TileView tile={t} state="normal" />
  {/each}
</div>

<h4>What do you do?</h4>
<ChoiceGrid
  choices={ACTIONS}
  isCorrect={(a) => a === scenario.answer.action}
  picked={picked}
  phase={phase}
  onpick={pick}
  label={(a) => a}
/>

{#if phase === 'revealed'}
  <DrillReveal
    correct={picked === scenario.answer.action}
    heading={picked === scenario.answer.action ? '✓ Correct' : `✗ Correct answer: ${scenario.answer.action}`}
    explanation={scenario.explanation}
  />
{/if}

<style>
  .trigger { display: flex; align-items: center; gap: 0.75rem; margin: 1rem 0; }
  h4 { margin: 1rem 0 0.5rem; font-size: 0.95rem; }
  .hand { display: flex; flex-wrap: wrap; gap: 4px; }
</style>
