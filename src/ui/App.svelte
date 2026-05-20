<script lang="ts">
  import Chrome from './Chrome.svelte';
  import Drill from './Drill.svelte';
  import Glossary from './Glossary.svelte';
  import Settings from './Settings.svelte';

  let glossaryOpen = $state(false);
  let settingsOpen = $state(false);
</script>

<Chrome
  onShowGlossary={() => glossaryOpen = true}
  onShowSettings={() => settingsOpen = true}
/>
<Drill />
<Glossary open={glossaryOpen} onClose={() => glossaryOpen = false} />
<Settings open={settingsOpen} onClose={() => settingsOpen = false} />

<footer>
  <small>
    Tile art: TBD (Unicode fallback for now).
  </small>
</footer>

<style>
  :global(body) { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
  footer { padding: 1rem; text-align: center; color: #888; }
</style>
