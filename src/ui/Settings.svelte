<script lang="ts">
  import { loadStorage, saveStorage, STORAGE_KEY } from '../srs/store';

  let { open, onClose }: { open: boolean; onClose: () => void } = $props();
  let pasteBuffer = $state('');
  let status = $state('');

  function copyToClipboard() {
    const raw = localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(loadStorage());
    navigator.clipboard.writeText(raw).then(
      () => { status = 'copied'; },
      () => { status = 'copy failed'; },
    );
  }

  function importFromPaste() {
    try {
      const parsed = JSON.parse(pasteBuffer);
      if (!parsed || parsed.version !== 1) throw new Error('not a v1 storage blob');
      saveStorage(parsed);
      status = 'imported';
    } catch (e) {
      status = `import failed: ${(e as Error).message}`;
    }
  }
</script>

{#if open}
  <div class="overlay" onclick={onClose} role="presentation">
    <div class="sheet" onclick={(e) => e.stopPropagation()} role="dialog">
      <h2>Settings</h2>
      <section>
        <h3>Export</h3>
        <button type="button" onclick={copyToClipboard}>Copy storage to clipboard</button>
      </section>
      <section>
        <h3>Import</h3>
        <textarea bind:value={pasteBuffer} rows="4" placeholder="paste exported storage JSON"></textarea>
        <button type="button" onclick={importFromPaste}>Import</button>
      </section>
      {#if status}<p class="status">{status}</p>{/if}
      <button type="button" onclick={onClose}>Close</button>
    </div>
  </div>
{/if}

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center; }
  .sheet { background: white; padding: 1.5rem; border-radius: 8px;
    max-width: 90vw; max-height: 90vh; overflow: auto; min-width: 300px; }
  textarea { width: 100%; font-family: monospace; }
  .status { color: #555; font-size: 0.9rem; }
  section { margin-bottom: 1rem; }
</style>
