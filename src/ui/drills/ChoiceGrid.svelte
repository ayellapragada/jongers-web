<script lang="ts" generics="T">
  let { choices, isCorrect, picked, phase, onpick, label }: {
    choices: readonly T[];
    isCorrect: (c: T) => boolean;
    picked: T | null;
    phase: 'answering' | 'revealed';
    onpick: (c: T) => void;
    label: (c: T) => string;
  } = $props();
</script>

<div class="choices">
  {#each choices as c}
    <button
      type="button"
      class="choice"
      class:correct={phase === 'revealed' && isCorrect(c)}
      class:incorrect={phase === 'revealed' && picked === c && !isCorrect(c)}
      disabled={phase === 'revealed'}
      onclick={() => onpick(c)}
    >
      {label(c)}
    </button>
  {/each}
</div>

<style>
  .choices { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
  .choice {
    min-width: 56px; padding: 0.75rem 1rem;
    font-size: 1.1rem; font-weight: 600;
    background: #fafafa; border: 1px solid #ccc; border-radius: 8px;
    cursor: pointer;
  }
  .choice:hover:not(:disabled) { background: #f0f0f0; }
  .choice:disabled { cursor: default; }
  .choice.correct   { background: #e0ffe5; border-color: #4ad66a; }
  .choice.incorrect { background: #ffe0e0; border-color: #d64a4a; }
</style>
