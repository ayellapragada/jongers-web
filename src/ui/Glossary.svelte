<script lang="ts">
  let { open, onClose }: { open: boolean; onClose: () => void } = $props();
</script>

{#if open}
  <div class="overlay" onclick={onClose} role="presentation">
    <div class="sheet" onclick={(e) => e.stopPropagation()} role="dialog">
      <h2>Glossary</h2>
      <p>Wait shapes, hand states, and faan patterns will appear here as drill types are added.</p>
      <button type="button" onclick={onClose}>Close</button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
  }
  .sheet {
    background: white; padding: 1.5rem; border-radius: 8px;
    max-width: 90vw; max-height: 90vh; overflow: auto;
  }
</style>
