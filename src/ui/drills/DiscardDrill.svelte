<script lang="ts">
  import TileView from '../tiles/TileView.svelte';
  import type { DiscardScenario } from '../../scenarios/schema';
  import {
    parseMPSZ, parseTile, formatTile,
    makeHand, makeMeld,
    type Tile,
    discardOptions, bestDiscards,
    shantenLabel,
  } from '../../engine';
  import DrillSetupHeader from './DrillSetupHeader.svelte';
  import DrillReveal from './DrillReveal.svelte';

  let { scenario, phase, onSubmit }: {
    scenario: DiscardScenario;
    phase: 'answering' | 'revealed';
    onSubmit: (correct: boolean, picked: Tile) => void;
  } = $props();

  let selected = $state<Tile | null>(null);

  const concealed = $derived(parseMPSZ(scenario.setup.hand));
  const drew = $derived(parseTile(scenario.drewTile));
  const fullHand = $derived([...concealed, drew]);
  const melds = $derived(
    (scenario.setup.melds ?? []).map(m => makeMeld(m.kind, m.tiles.flatMap(parseMPSZ)))
  );
  const visible = $derived.by(() => {
    const m = new Map<Tile, number>();
    for (const tStr of scenario.setup.visibleTiles ?? []) {
      for (const t of parseMPSZ(tStr)) m.set(t, (m.get(t) ?? 0) + 1);
    }
    return m;
  });

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
    onSubmit(acceptedTiles.has(selected), selected);
  }
</script>

<DrillSetupHeader {scenario} />

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
  <DrillReveal
    correct={selected !== null && acceptedTiles.has(selected)}
    heading={selected !== null && acceptedTiles.has(selected)
      ? '✓ Correct'
      : `✗ Best discards: ${[...bestSet].map(formatTile).join(', ')}`}
    explanation={scenario.explanation}
  >
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
  </DrillReveal>
{/if}

<style>
  .hand {
    display: flex; flex-wrap: nowrap; gap: 4px; margin: 1rem 0;
    overflow-x: auto; padding-bottom: 4px;
  }
  .slot { flex: 0 0 auto; }
  .slot.drew { margin-left: 12px; border-left: 2px dashed #aaa; padding-left: 12px; }

  .hint { color: #666; font-size: 0.9rem; margin: 0.5rem 0; }
  .preview {
    background: #f7faff; padding: 0.5rem 0.75rem; border-radius: 6px;
    margin: 0.5rem 0; font-size: 0.95rem;
  }
  .submit { padding: 0.6rem 1.2rem; font-size: 1rem; cursor: pointer; }
  .submit:disabled { opacity: 0.4; cursor: default; }

  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.9rem; }
  th, td { padding: 4px 8px; border-bottom: 1px solid #eee; text-align: left; }
  tr.best td { background: #e0ffe5; }
</style>
