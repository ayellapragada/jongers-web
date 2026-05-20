<script lang="ts">
  import TileView from '../tiles/TileView.svelte';
  import type { WaitScenario, WaitShape } from '../../scenarios/schema';
  import { parseMPSZ, makeHand, waits } from '../../engine';
  import DrillSetupHeader from './DrillSetupHeader.svelte';
  import DrillReveal from './DrillReveal.svelte';
  import ChoiceGrid from './ChoiceGrid.svelte';

  let { scenario, phase, onSubmit }: {
    scenario: WaitScenario;
    phase: 'answering' | 'revealed';
    onSubmit: (correct: boolean) => void;
  } = $props();

  const SHAPES: readonly WaitShape[] = ['tanki', 'shanpon', 'ryanmen', 'kanchan', 'penchan', 'nobetan'];

  let picked = $state<WaitShape | null>(null);

  const handTiles = $derived(parseMPSZ(scenario.setup.hand));
  const engineWaits = $derived(waits(makeHand(handTiles)));
  const truthShape = $derived(scenario.answer.shape);

  function pick(s: WaitShape) {
    if (phase !== 'answering') return;
    picked = s;
    onSubmit(s === truthShape);
  }
</script>

<DrillSetupHeader {scenario} />

<h4>Hand (tenpai)</h4>
<div class="hand">
  {#each handTiles as t}
    <TileView tile={t} state="normal" />
  {/each}
</div>

<h4>What shape is the wait?</h4>
<ChoiceGrid
  choices={SHAPES}
  isCorrect={(s) => s === truthShape}
  picked={picked}
  phase={phase}
  onpick={pick}
  label={(s) => s}
/>

{#if phase === 'revealed'}
  <DrillReveal
    correct={picked === truthShape}
    heading={picked === truthShape ? `✓ Correct — ${truthShape}` : `✗ ${truthShape} (you said ${picked})`}
    explanation={scenario.explanation}
  >
    <div class="winning">
      <span>Winning tiles:</span>
      {#each engineWaits as w}
        <TileView tile={w.tile} state="engine-best" />
      {/each}
    </div>
  </DrillReveal>
{/if}

<style>
  h4 { margin: 1rem 0 0.5rem; font-size: 0.95rem; }
  .hand {
    display: flex; flex-wrap: nowrap; gap: 4px;
    overflow-x: auto; padding-bottom: 4px;
  }
  .winning { display: flex; align-items: center; gap: 6px; margin: 0.5rem 0; }
</style>
