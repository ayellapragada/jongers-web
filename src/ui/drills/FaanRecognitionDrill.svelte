<script lang="ts">
  import TileView from '../tiles/TileView.svelte';
  import type { FaanRecognitionScenario } from '../../scenarios/schema';
  import { parseMPSZ, parseTile, FAAN_NAME, FAAN_VALUE } from '../../engine';
  import DrillSetupHeader from './DrillSetupHeader.svelte';
  import DrillReveal from './DrillReveal.svelte';
  import ChoiceGrid from './ChoiceGrid.svelte';

  let { scenario, phase, onSubmit }: {
    scenario: FaanRecognitionScenario;
    phase: 'answering' | 'revealed';
    onSubmit: (correct: boolean) => void;
  } = $props();

  let picked = $state<number | null>(null);

  const handTiles = $derived(parseMPSZ(scenario.setup.hand));
  const winTile = $derived(parseTile(scenario.winTile));
  const truthTotal = $derived(scenario.answer.totalFaan);
  const truthPatterns = $derived(scenario.answer.patterns);

  const choices = $derived.by(() => {
    const t = truthTotal;
    const cs = new Set<number>([t]);
    for (const d of [-1, 1, -2, 2, 3, -3]) {
      const v = t + d;
      if (v >= 0 && v <= 13) cs.add(v);
      if (cs.size >= 5) break;
    }
    for (let v = 0; v <= 13 && cs.size < 5; v++) cs.add(v);
    return [...cs].sort((a, b) => a - b).slice(0, 5);
  });

  function pick(n: number) {
    if (phase !== 'answering') return;
    picked = n;
    onSubmit(n === truthTotal);
  }
</script>

{#snippet meta()}
  <span>{scenario.winContext.selfDraw ? 'Self-draw' : 'Ron'}</span>
  {#if scenario.winContext.lastCatch}<span>Last catch</span>{/if}
  {#if scenario.winContext.robbingKong}<span>Robbing kong</span>{/if}
  {#if scenario.winContext.winByKong}<span>Win by kong</span>{/if}
{/snippet}

<DrillSetupHeader {scenario} {meta} />

<h4>Winning hand</h4>
<div class="hand">
  {#each handTiles as t}
    <TileView tile={t} state="normal" />
  {/each}
  <span class="sep"></span>
  <TileView tile={winTile} state="highlighted" />
</div>

<h4>How many faan?</h4>
<ChoiceGrid
  choices={choices}
  isCorrect={(n) => n === truthTotal}
  picked={picked}
  phase={phase}
  onpick={pick}
  label={(n) => String(n)}
/>

{#if phase === 'revealed'}
  <DrillReveal
    correct={picked === truthTotal}
    heading={picked === truthTotal ? `✓ Correct — ${truthTotal} faan` : `✗ ${truthTotal} faan (you said ${picked})`}
    explanation={scenario.explanation}
  >
    <ul class="breakdown">
      {#each truthPatterns as p}
        <li>{FAAN_NAME[p]} — {FAAN_VALUE[p]}</li>
      {/each}
    </ul>
  </DrillReveal>
{/if}

<style>
  h4 { margin: 1rem 0 0.5rem; font-size: 0.95rem; }
  .hand { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
  .sep { margin: 0 8px; border-left: 2px dashed #aaa; height: 32px; }
  .breakdown { padding-left: 1.2rem; color: #444; }
  .breakdown li { margin: 2px 0; }
</style>
