<script lang="ts">
  import type { ScenarioBase } from '../../scenarios/schema';
  import type { Snippet } from 'svelte';

  let { scenario, meta }: {
    scenario: ScenarioBase;
    meta?: Snippet;
  } = $props();
</script>

<section class="setup">
  <div class="meta">
    <span>Seat: <strong>{scenario.setup.yourSeat}</strong></span>
    <span>Round: <strong>{scenario.setup.roundWind}</strong></span>
    {#if meta}{@render meta()}{/if}
  </div>
  {#if scenario.tags.length}
    <div class="tags">
      {#each scenario.tags as tag}<span class="tag">{tag}</span>{/each}
    </div>
  {/if}
</section>

<style>
  .setup { margin-bottom: 1rem; }
  .meta { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem; color: #555; }
  .tags { margin-top: 0.5rem; }
  .tag {
    background: #eef; color: #335; padding: 1px 8px; border-radius: 999px;
    font-size: 0.8rem; margin-right: 4px;
  }
</style>
