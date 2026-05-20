<script lang="ts">
  import TileView from '../tiles/TileView.svelte';
  import type { DiscardScenario } from '../../scenarios/schema';
  import { parseMPSZ, formatTile } from '../../engine/mpsz';
  import { makeHand } from '../../engine/hand';
  import type { Tile } from '../../engine/tile';
  import { discardOptions, bestDiscards } from '../../engine/discard';
  import { shantenLabel } from '../../engine/shanten';

  let { scenario, phase, onSubmit }: {
    scenario: DiscardScenario;
    phase: 'answering' | 'revealed';
    onSubmit: (correct: boolean, picked: Tile) => void;
  } = $props();

  // Reset selection when the scenario changes.
  let selected = $state<Tile | null>(null);
  $effect(() => { scenario.id; selected = null; });

  const concealed: Tile[] = $derived(parseMPSZ(scenario.setup.hand));
  const drew: Tile = $derived(parseMPSZ(scenario.drewTile)[0]!);
  const fullHand = $derived([...concealed, drew]);
  const melds = $derived((scenario.setup.melds ?? []).map(m => ({
    kind: m.kind, tiles: m.tiles.flatMap(parseMPSZ),
  })));
  const visible = $derived((() => {
    const m = new Map<Tile, number>();
    for (const tStr of scenario.setup.visibleTiles ?? []) {
      for (const t of parseMPSZ(tStr)) m.set(t, (m.get(t) ?? 0) + 1);
    }
    return m;
  })());

  const allOptions = $derived(discardOptions(makeHand(fullHand, melds), visible));
  const bestSet = $derived(new Set(bestDiscards(allOptions).map(o => o.tile)));
  const acceptedTiles = $derived(new Set(scenario.answer.discards.flatMap(s => parseMPSZ(s))));

  const previewOption = $derived(
    selected !== null ? allOptions.find(o => o.tile === selected) : null
  );

  function tileState(t: Tile, posIdx: number): 'normal' | 'selected' | 'engine-best' | 'incorrect-pick' {
    if (phase === 'answering') {
      return selected === t && firstIndexInHand(t) === posIdx ? 'selected' : 'normal';
    }
    // revealed
    if (bestSet.has(t) && firstIndexInHand(t) === posIdx) return 'engine-best';
    if (selected === t && !acceptedTiles.has(t) && firstIndexInHand(t) === posIdx) return 'incorrect-pick';
    return 'normal';
  }

  function firstIndexInHand(t: Tile): number {
    return fullHand.indexOf(t);
  }

  function pick(t: Tile) {
    if (phase !== 'answering') return;
    selected = t;
  }

  function commit() {
    if (selected === null) return;
    const correct = acceptedTiles.has(selected);
    onSubmit(correct, selected);
  }
</script>

<section class="setup">
  <div class="meta">
    <span>Seat: <strong>{scenario.setup.yourSeat}</strong></span>
    <span>Dealer: <strong>{scenario.setup.dealer}</strong></span>
    <span>Round: <strong>{scenario.setup.roundWind}</strong></span>
    {#if scenario.setup.doraIndicators?.length}
      <span>Dora indicator: <strong>{scenario.setup.doraIndicators.join(' ')}</strong></span>
    {/if}
  </div>
  {#if scenario.tags.length}
    <div class="tags">
      {#each scenario.tags as tag}<span class="tag">{tag}</span>{/each}
    </div>
  {/if}
</section>

<div class="hand">
  {#each fullHand as t, i}
    <span class="slot" class:drew={i === fullHand.length - 1}>
      <TileView tile={t} state={tileState(t, i)} onclick={() => pick(t)} />
    </span>
  {/each}
</div>

<p class="hint">Tap the tile you would discard, then submit.</p>

{#if previewOption}
  <div class="preview">
    Cutting <strong>{formatTile(previewOption.tile)}</strong>:
    {shantenLabel(previewOption.resultingShanten)},
    ukeire {previewOption.resultingUkeire.totalRemaining}
    ({previewOption.resultingUkeire.kindCount} kinds)
  </div>
{/if}

{#if phase === 'answering'}
  <button class="submit" type="button" onclick={commit} disabled={selected === null}>
    Submit
  </button>
{:else}
  <div class="reveal">
    <h3>
      {#if acceptedTiles.has(selected!)}
        ✓ Correct
      {:else}
        ✗ Best discards: {[...bestSet].map(formatTile).join(', ')}
      {/if}
    </h3>
    {#if scenario.explanation}
      <p>{scenario.explanation}</p>
    {/if}
    <details>
      <summary>All discard options ranked</summary>
      <table>
        <thead><tr><th>tile</th><th>shanten</th><th>ukeire</th></tr></thead>
        <tbody>
          {#each allOptions as o}
            <tr class:best={bestSet.has(o.tile)}>
              <td>{formatTile(o.tile)}</td>
              <td>{shantenLabel(o.resultingShanten)}</td>
              <td>{o.resultingUkeire.totalRemaining} ({o.resultingUkeire.kindCount} kinds)</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </details>
  </div>
{/if}

<style>
  .setup { margin-bottom: 1rem; }
  .meta { display: flex; flex-wrap: wrap; gap: 0.75rem 1rem; font-size: 0.9rem; color: #555; }
  .tags { margin-top: 0.5rem; }
  .tag { background: #eef; color: #335; padding: 1px 8px; border-radius: 999px; font-size: 0.8rem; margin-right: 4px; }

  .hand {
    display: flex; flex-wrap: nowrap; gap: 4px; margin: 1rem 0;
    overflow-x: auto; padding-bottom: 4px;
  }
  .slot { flex: 0 0 auto; }
  .slot.drew { margin-left: 12px; border-left: 2px dashed #aaa; padding-left: 12px; }

  .hint { color: #666; font-size: 0.9rem; margin: 0.5rem 0; }
  .preview { background: #f7faff; padding: 0.5rem 0.75rem; border-radius: 6px; margin: 0.5rem 0; font-size: 0.95rem; }
  .submit { padding: 0.6rem 1.2rem; font-size: 1rem; cursor: pointer; }
  .submit:disabled { opacity: 0.4; cursor: default; }

  .reveal h3 { margin: 0 0 0.5rem 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.9rem; }
  th, td { padding: 4px 8px; border-bottom: 1px solid #eee; text-align: left; }
  tr.best td { background: #e0ffe5; }
</style>
