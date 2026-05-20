<script lang="ts">
  import TileView from '../tiles/TileView.svelte';
  import type { WaitScenario, WaitShape } from '../../scenarios/schema';
  import { parseMPSZ, formatTile } from '../../engine/mpsz';
  import { parseHand } from '../../engine/hand';
  import { waits } from '../../engine/waits';

  let { scenario, phase, onSubmit }: {
    scenario: WaitScenario;
    phase: 'answering' | 'revealed';
    onSubmit: (correct: boolean) => void;
  } = $props();

  const SHAPES: WaitShape[] = ['tanki', 'shanpon', 'ryanmen', 'kanchan', 'penchan', 'nobetan'];

  let picked = $state<WaitShape | null>(null);
  $effect(() => { scenario.id; picked = null; });

  const handTiles = $derived(parseMPSZ(scenario.setup.hand));
  const engineWaits = $derived(waits(parseHand(scenario.setup.hand)));
  const truthShape = $derived(scenario.answer.shape);

  function pick(s: WaitShape) {
    if (phase !== 'answering') return;
    picked = s;
    onSubmit(s === truthShape);
  }
</script>

<section class="setup">
  <div class="meta">
    <span>Seat: <strong>{scenario.setup.yourSeat}</strong></span>
    <span>Round: <strong>{scenario.setup.roundWind}</strong></span>
  </div>
  {#if scenario.tags.length}
    <div class="tags">
      {#each scenario.tags as tag}<span class="tag">{tag}</span>{/each}
    </div>
  {/if}
</section>

<h4>Hand (tenpai)</h4>
<div class="hand">
  {#each handTiles as t}
    <TileView tile={t} state="normal" />
  {/each}
</div>

<h4>What shape is the wait?</h4>
<div class="choices">
  {#each SHAPES as s}
    <button
      type="button"
      class="choice"
      class:correct={phase === 'revealed' && s === truthShape}
      class:incorrect={phase === 'revealed' && picked === s && s !== truthShape}
      disabled={phase === 'revealed'}
      onclick={() => pick(s)}
    >
      {s}
    </button>
  {/each}
</div>

{#if phase === 'revealed'}
  <div class="reveal">
    <h3>
      {#if picked === truthShape}
        ✓ Correct — {truthShape}
      {:else}
        ✗ {truthShape} (you said {picked})
      {/if}
    </h3>
    <div class="winning">
      <span>Winning tiles:</span>
      {#each engineWaits as w}
        <TileView tile={w.tile} state="engine-best" />
      {/each}
    </div>
    {#if scenario.explanation}<p>{scenario.explanation}</p>{/if}
  </div>
{/if}

<style>
  .setup { margin-bottom: 1rem; }
  .meta { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem; color: #555; }
  .tags { margin-top: 0.5rem; }
  .tag { background: #eef; color: #335; padding: 1px 8px; border-radius: 999px; font-size: 0.8rem; margin-right: 4px; }
  h4 { margin: 1rem 0 0.5rem; font-size: 0.95rem; }
  .hand {
    display: flex; flex-wrap: nowrap; gap: 4px;
    overflow-x: auto; padding-bottom: 4px;
  }
  .choices { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
  .choice {
    min-width: 96px; padding: 0.75rem 1rem;
    font-size: 1rem; font-weight: 600;
    background: #fafafa; border: 1px solid #ccc; border-radius: 8px;
    cursor: pointer;
  }
  .choice:hover:not(:disabled) { background: #f0f0f0; }
  .choice:disabled { cursor: default; }
  .choice.correct   { background: #e0ffe5; border-color: #4ad66a; }
  .choice.incorrect { background: #ffe0e0; border-color: #d64a4a; }
  .reveal h3 { margin: 0 0 0.5rem 0; }
  .winning { display: flex; align-items: center; gap: 6px; margin: 0.5rem 0; }
</style>
