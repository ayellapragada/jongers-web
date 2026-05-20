<script lang="ts">
  import discardLib from '../scenarios/library/discard.json';
  import claimLib from '../scenarios/library/claim.json';
  import waitLib from '../scenarios/library/wait.json';
  import faanLib from '../scenarios/library/faan-recognition.json';
  import StatusStrip from './StatusStrip.svelte';
  import DiscardDrill from './drills/DiscardDrill.svelte';
  import WaitDrill from './drills/WaitDrill.svelte';
  import ClaimDrill from './drills/ClaimDrill.svelte';
  import FaanRecognitionDrill from './drills/FaanRecognitionDrill.svelte';
  import type {
    Scenario, DrillType,
    DiscardScenario, WaitScenario, ClaimScenario, FaanRecognitionScenario,
  } from '../scenarios/schema';
  import { loadStorage, saveStorage, recordAttempt, getNextScenario } from '../srs/store';

  const library: Scenario[] = [
    ...(discardLib as Scenario[]),
    ...(claimLib as Scenario[]),
    ...(waitLib as Scenario[]),
    ...(faanLib as Scenario[]),
  ];

  let storage = $state(loadStorage());
  let filter = $state<DrillType | 'all'>('all');
  let phase = $state<'answering' | 'revealed'>('answering');
  let sessionCorrect = $state(0);
  let sessionAttempted = $state(0);
  let cursor = $state(0);

  let now = $state(Date.now());
  setInterval(() => { now = Date.now(); }, 60_000);

  const current = $derived.by(() => {
    cursor;
    return getNextScenario(library, storage, filter, now);
  });

  const dueCount = $derived(
    Object.values(storage.srs).filter(c => c.dueAt <= now).length
  );

  function handleSubmit(correct: boolean) {
    if (!current) return;
    recordAttempt(storage, current, correct, Date.now());
    saveStorage(storage);
    sessionAttempted += 1;
    if (correct) sessionCorrect += 1;
    phase = 'revealed';
  }

  function next() {
    phase = 'answering';
    cursor += 1;
  }
</script>

<StatusStrip
  dueCount={dueCount}
  totalCount={library.length}
  sessionCorrect={sessionCorrect}
  sessionAttempted={sessionAttempted}
/>

<main>
  <label class="filter">
    Filter:
    <select bind:value={filter} onchange={next}>
      <option value="all">all</option>
      <option value="discard">discard</option>
      <option value="claim">claim</option>
      <option value="wait">wait</option>
      <option value="faan-recognition">faan-recognition</option>
    </select>
  </label>

  {#if current === null}
    <p class="empty">No scenarios available for this filter.</p>
  {:else}
    {#key current.id + phase}
      {#if current.type === 'discard'}
        <DiscardDrill scenario={current as DiscardScenario} phase={phase}
          onSubmit={(c, _p) => handleSubmit(c)} />
      {:else if current.type === 'wait'}
        <WaitDrill scenario={current as WaitScenario} phase={phase}
          onSubmit={handleSubmit} />
      {:else if current.type === 'claim'}
        <ClaimDrill scenario={current as ClaimScenario} phase={phase}
          onSubmit={handleSubmit} />
      {:else if current.type === 'faan-recognition'}
        <FaanRecognitionDrill scenario={current as FaanRecognitionScenario} phase={phase}
          onSubmit={handleSubmit} />
      {/if}
    {/key}
    {#if phase === 'revealed'}
      <button class="next" type="button" onclick={next}>Next →</button>
    {/if}
  {/if}
</main>

<style>
  main { padding: 1rem; max-width: 960px; margin: 0 auto; }
  .empty { color: #777; font-style: italic; }
  .filter { display: block; margin: 0.5rem 0 1rem; }
  .next { margin-top: 1rem; padding: 0.6rem 1.2rem; font-size: 1rem; cursor: pointer; }
</style>
