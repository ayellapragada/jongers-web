<script lang="ts">
  import discardLib from '../scenarios/library/discard.json';
  import claimLib from '../scenarios/library/claim.json';
  import waitLib from '../scenarios/library/wait.json';
  import faanLib from '../scenarios/library/faan-recognition.json';
  import StatusStrip from './StatusStrip.svelte';
  import type { Scenario, DrillType } from '../scenarios/schema';
  import { loadStorage, getNextScenario } from '../srs/store';

  const library: Scenario[] = [
    ...(discardLib as Scenario[]),
    ...(claimLib as Scenario[]),
    ...(waitLib as Scenario[]),
    ...(faanLib as Scenario[]),
  ];

  let storage = $state(loadStorage());
  let filter = $state<DrillType | 'all'>('all');
  let now = $derived(Date.now());

  const current = $derived(getNextScenario(library, storage, filter, now));
  const dueCount = $derived(
    Object.values(storage.srs).filter(c => c.dueAt <= now).length
  );
</script>

<StatusStrip
  dueCount={dueCount}
  totalCount={library.length}
  sessionCorrect={0}
  sessionAttempted={0}
/>

<main>
  <label>
    Filter:
    <select bind:value={filter}>
      <option value="all">all</option>
      <option value="discard">discard</option>
      <option value="claim">claim</option>
      <option value="wait">wait</option>
      <option value="faan-recognition">faan-recognition</option>
    </select>
  </label>

  {#if current === null}
    <p class="empty">No scenarios yet. Authoring + drill UIs land in subsequent plans.</p>
  {:else}
    <p>Loaded scenario {current.id} ({current.type}). Drill UI for {current.type} arrives in its plan.</p>
  {/if}
</main>

<style>
  main { padding: 1rem; max-width: 720px; margin: 0 auto; }
  .empty { color: #777; font-style: italic; }
  label { display: block; margin: 1rem 0; }
</style>
