<script lang="ts">
  import type { Snippet } from 'svelte';

  let { correct, heading, explanation, children }: {
    correct: boolean;
    heading: string;
    explanation?: string;
    children?: Snippet;
  } = $props();
</script>

<div class="reveal">
  <h3 class:ok={correct} class:bad={!correct}>{heading}</h3>
  {#if children}{@render children()}{/if}
  {#if explanation}<p>{explanation}</p>{/if}
</div>

<style>
  .reveal h3 { margin: 0 0 0.5rem 0; }
  .reveal h3.ok  { color: #2e7a3a; }
  .reveal h3.bad { color: #a72020; }
</style>
