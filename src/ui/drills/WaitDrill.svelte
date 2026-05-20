<script lang="ts">
  import TileView from '../tiles/TileView.svelte';
  import type { WaitScenario } from '../../scenarios/schema';
  import { parseMPSZ, formatTile } from '../../engine/mpsz';
  import { parseHand } from '../../engine/hand';
  import { ALL_TILES, type Tile } from '../../engine/tile';
  import { waits } from '../../engine/waits';

  let { scenario, phase, onSubmit }: {
    scenario: WaitScenario;
    phase: 'answering' | 'revealed';
    onSubmit: (correct: boolean) => void;
  } = $props();

  let picked = $state<Set<Tile>>(new Set());
  $effect(() => { scenario.id; picked = new Set(); });

  const hand = $derived(parseHand(scenario.setup.hand));
  const handTiles = $derived(parseMPSZ(scenario.setup.hand));
  const truthSet = $derived(new Set(scenario.answer.winningTiles.flatMap(s => parseMPSZ(s))));
  const engineWaits = $derived(waits(hand));
  const engineSet = $derived(new Set(engineWaits.map(w => w.tile)));

  function toggle(t: Tile) {
    if (phase !== 'answering') return;
    const next = new Set(picked);
    if (next.has(t)) next.delete(t); else next.add(t);
    picked = next;
  }

  function commit() {
    // Correct if the picked set exactly equals the truth set.
    let correct = picked.size === truthSet.size;
    if (correct) for (const t of picked) if (!truthSet.has(t)) { correct = false; break; }
    onSubmit(correct);
  }

  function paletteState(t: Tile): 'normal' | 'selected' | 'engine-best' | 'incorrect-pick' | 'dim' {
    if (phase === 'answering') return picked.has(t) ? 'selected' : 'normal';
    // revealed
    if (engineSet.has(t)) return 'engine-best';
    if (picked.has(t)) return 'incorrect-pick';
    return 'dim';
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

<h4>Tap every tile this hand is waiting on</h4>
<div class="palette">
  {#each ALL_TILES as t}
    <TileView tile={t} state={paletteState(t)} onclick={() => toggle(t)} />
  {/each}
</div>

{#if phase === 'answering'}
  <button class="submit" type="button" onclick={commit} disabled={picked.size === 0}>
    Submit
  </button>
{:else}
  <div class="reveal">
    <h3>
      {#if picked.size === engineSet.size && [...picked].every(t => engineSet.has(t))}
        ✓ Correct
      {:else}
        ✗ Winning tiles: {[...engineSet].sort((a, b) => a - b).map(formatTile).join(', ')}
      {/if}
    </h3>
    {#if scenario.answer.shape}
      <p>Shape: <strong>{scenario.answer.shape}</strong></p>
    {/if}
    {#if engineWaits.length > 0}
      <details>
        <summary>Per-tile wait shapes</summary>
        <ul>
          {#each engineWaits as w}
            <li>{formatTile(w.tile)} — {[...w.shapes].join(', ')}</li>
          {/each}
        </ul>
      </details>
    {/if}
    {#if scenario.explanation}<p>{scenario.explanation}</p>{/if}
  </div>
{/if}

<style>
  .setup { margin-bottom: 1rem; }
  .meta { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem; color: #555; }
  .tags { margin-top: 0.5rem; }
  .tag { background: #eef; color: #335; padding: 1px 8px; border-radius: 999px; font-size: 0.8rem; margin-right: 4px; }
  h4 { margin: 1rem 0 0.5rem; font-size: 0.95rem; }
  .hand, .palette { display: flex; flex-wrap: wrap; gap: 4px; }
  .palette { margin-bottom: 1rem; }
  .submit { padding: 0.6rem 1.2rem; font-size: 1rem; cursor: pointer; }
  .submit:disabled { opacity: 0.4; cursor: default; }
  .reveal h3 { margin: 0 0 0.5rem 0; }
</style>
