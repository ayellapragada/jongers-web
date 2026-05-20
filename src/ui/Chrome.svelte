<script lang="ts">
  let { onShowGlossary, onShowSettings }: {
    onShowGlossary: () => void;
    onShowSettings: () => void;
  } = $props();
</script>

<header>
  <strong>jongers</strong>
  <span class="sep">·</span>
  <span>Drill</span>
  <span class="spacer"></span>
  <button type="button" onclick={onShowGlossary} aria-label="glossary">?</button>
  <button type="button" onclick={onShowSettings} aria-label="settings">⚙</button>
</header>

<style>
  header {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 1rem; border-bottom: 1px solid #ddd;
  }
  .sep { color: #999; }
  .spacer { flex: 1; }
  button { font: inherit; padding: 4px 10px; cursor: pointer; }
</style>
