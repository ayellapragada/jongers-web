<script lang="ts">
  import TileView from '../tiles/TileView.svelte';
  import type { FaanRecognitionScenario } from '../../scenarios/schema';
  import { parseMPSZ } from '../../engine/mpsz';
  import { FAAN_NAME, FAAN_VALUE, type FaanPattern } from '../../engine/faan';

  let { scenario, phase, onSubmit }: {
    scenario: FaanRecognitionScenario;
    phase: 'answering' | 'revealed';
    onSubmit: (correct: boolean) => void;
  } = $props();

  let picked = $state<number | null>(null);
  $effect(() => { scenario.id; picked = null; });

  const handTiles = $derived(parseMPSZ(scenario.setup.hand));
  const winTile = $derived(parseMPSZ(scenario.winTile)[0]!);
  const truthTotal = $derived(scenario.answer.totalFaan);
  const truthPatterns = $derived(scenario.answer.patterns as FaanPattern[]);

  // 5 choices including the truth. Cluster nearby values with one outlier.
  const choices = $derived.by(() => {
    const t = truthTotal;
    const candidates = new Set<number>([t]);
    for (const d of [-1, 1, -2, 2, 3, -3]) {
      const v = t + d;
      if (v >= 0 && v <= 13) candidates.add(v);
      if (candidates.size >= 5) break;
    }
    // pad if still short (e.g. truth near 0 or 13)
    for (let v = 0; v <= 13 && candidates.size < 5; v++) candidates.add(v);
    return [...candidates].sort((a, b) => a - b).slice(0, 5);
  });

  function pick(n: number) {
    if (phase !== 'answering') return;
    picked = n;
    onSubmit(n === truthTotal);
  }
</script>

<section class="setup">
  <div class="meta">
    <span>Seat: <strong>{scenario.setup.yourSeat}</strong></span>
    <span>Round: <strong>{scenario.setup.roundWind}</strong></span>
    <span>{scenario.winContext.selfDraw ? 'Self-draw' : 'Ron'}</span>
    {#if scenario.winContext.lastCatch}<span>Last catch</span>{/if}
    {#if scenario.winContext.robbingKong}<span>Robbing kong</span>{/if}
    {#if scenario.winContext.winByKong}<span>Win by kong</span>{/if}
  </div>
  {#if scenario.tags.length}
    <div class="tags">
      {#each scenario.tags as tag}<span class="tag">{tag}</span>{/each}
    </div>
  {/if}
</section>

<h4>Winning hand</h4>
<div class="hand">
  {#each handTiles as t}
    <TileView tile={t} state="normal" />
  {/each}
  <span class="sep"></span>
  <TileView tile={winTile} state="highlighted" />
</div>

<h4>How many faan?</h4>
<div class="choices">
  {#each choices as n}
    <button
      type="button"
      class="choice"
      class:correct={phase === 'revealed' && n === truthTotal}
      class:incorrect={phase === 'revealed' && picked === n && n !== truthTotal}
      disabled={phase === 'revealed'}
      onclick={() => pick(n)}
    >
      {n}
    </button>
  {/each}
</div>

{#if phase === 'revealed'}
  <div class="reveal">
    <h3>
      {#if picked === truthTotal}
        ✓ Correct — {truthTotal} faan
      {:else}
        ✗ {truthTotal} faan (you said {picked})
      {/if}
    </h3>
    <ul class="breakdown">
      {#each truthPatterns as p}
        <li>{FAAN_NAME[p]} — {FAAN_VALUE[p]}</li>
      {/each}
    </ul>
    {#if scenario.explanation}<p>{scenario.explanation}</p>{/if}
  </div>
{/if}

<style>
  .setup { margin-bottom: 1rem; }
  .meta { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem; color: #555; }
  .tags { margin-top: 0.5rem; }
  .tag { background: #eef; color: #335; padding: 1px 8px; border-radius: 999px; font-size: 0.8rem; margin-right: 4px; }
  h4 { margin: 1rem 0 0.5rem; font-size: 0.95rem; }
  .hand { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
  .sep { margin: 0 8px; border-left: 2px dashed #aaa; height: 32px; }

  .choices { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
  .choice {
    min-width: 56px; padding: 0.75rem 1rem;
    font-size: 1.2rem; font-weight: 600;
    background: #fafafa; border: 1px solid #ccc; border-radius: 8px;
    cursor: pointer;
  }
  .choice:hover:not(:disabled) { background: #f0f0f0; }
  .choice:disabled { cursor: default; }
  .choice.correct   { background: #e0ffe5; border-color: #4ad66a; }
  .choice.incorrect { background: #ffe0e0; border-color: #d64a4a; }

  .reveal h3 { margin: 0 0 0.5rem 0; }
  .breakdown { padding-left: 1.2rem; color: #444; }
  .breakdown li { margin: 2px 0; }
</style>
