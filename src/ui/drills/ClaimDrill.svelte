<script lang="ts">
  import TileView from '../tiles/TileView.svelte';
  import type { ClaimScenario } from '../../scenarios/schema';
  import { parseMPSZ, formatTile } from '../../engine/mpsz';
  import { parseHand } from '../../engine/hand';

  let { scenario, phase, onSubmit }: {
    scenario: ClaimScenario;
    phase: 'answering' | 'revealed';
    onSubmit: (correct: boolean) => void;
  } = $props();

  type Action = 'pon' | 'chi' | 'wu' | 'pass';
  let picked = $state<Action | null>(null);
  $effect(() => { scenario.id; picked = null; });

  const handTiles = $derived(parseMPSZ(scenario.setup.hand));
  const triggerTile = $derived(parseMPSZ(scenario.trigger.tile)[0]!);

  function isCorrect(a: Action): boolean {
    return a === scenario.answer.action;
  }

  function commit() {
    if (picked === null) return;
    onSubmit(isCorrect(picked));
  }
</script>

<section class="setup">
  <div class="meta">
    <span>Seat: <strong>{scenario.setup.yourSeat}</strong></span>
    <span>Round: <strong>{scenario.setup.roundWind}</strong></span>
    <span>Discarder: <strong>{scenario.trigger.discarder}</strong></span>
  </div>
  {#if scenario.tags.length}
    <div class="tags">
      {#each scenario.tags as tag}<span class="tag">{tag}</span>{/each}
    </div>
  {/if}
</section>

<div class="trigger">
  <div>Opponent's discard:</div>
  <TileView tile={triggerTile} state="highlighted" />
</div>

<h4>Your hand</h4>
<div class="hand">
  {#each handTiles as t}
    <TileView tile={t} state="normal" />
  {/each}
</div>

<h4>What do you do?</h4>
<div class="actions">
  {#each ['pon', 'chi', 'wu', 'pass'] as const as a}
    <button
      type="button"
      class="action"
      class:selected={picked === a}
      onclick={() => picked = a}
      disabled={phase === 'revealed'}
    >
      {a}
    </button>
  {/each}
</div>

{#if phase === 'answering'}
  <button class="submit" type="button" onclick={commit} disabled={picked === null}>
    Submit
  </button>
{:else}
  <div class="reveal">
    <h3>
      {#if picked && isCorrect(picked)}
        ✓ Correct
      {:else}
        ✗ Correct answer: {scenario.answer.action}
      {/if}
    </h3>
    {#if scenario.explanation}<p>{scenario.explanation}</p>{/if}
  </div>
{/if}

<style>
  .setup { margin-bottom: 1rem; }
  .meta { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem; color: #555; }
  .tags { margin-top: 0.5rem; }
  .tag { background: #eef; color: #335; padding: 1px 8px; border-radius: 999px; font-size: 0.8rem; margin-right: 4px; }
  .trigger { display: flex; align-items: center; gap: 0.75rem; margin: 1rem 0; }
  h4 { margin: 1rem 0 0.5rem; font-size: 0.95rem; }
  .hand { display: flex; flex-wrap: wrap; gap: 4px; }
  .actions { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .action {
    padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer;
    background: #fafafa; border: 1px solid #ccc; border-radius: 6px;
  }
  .action.selected { background: #e0f0ff; border-color: #4a8fd6; }
  .action:disabled { cursor: default; }
  .submit { padding: 0.6rem 1.2rem; font-size: 1rem; cursor: pointer; }
  .submit:disabled { opacity: 0.4; cursor: default; }
  .reveal h3 { margin: 0 0 0.5rem 0; }
</style>
