<script lang="ts">
  import type { Tile } from '../../engine/tile';
  import { formatTile } from '../../engine/mpsz';

  type TileState = 'normal' | 'selected' | 'dim' | 'highlighted' | 'incorrect-pick' | 'engine-best';

  let { tile, state = 'normal', onclick }: {
    tile: Tile;
    state?: TileState;
    onclick?: () => void;
  } = $props();

  // Vite glob: eager-load every tile SVG as a URL at build time.
  const svgs = import.meta.glob('./assets/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

  function srcFor(t: Tile): string {
    const name = formatTile(t);
    return svgs[`./assets/${name}.svg`] ?? '';
  }
</script>

<button
  type="button"
  class="tile state-{state}"
  onclick={onclick}
  disabled={!onclick}
  aria-label={`tile ${formatTile(tile)}`}
>
  <img src={srcFor(tile)} alt={formatTile(tile)} draggable="false" />
</button>

<style>
  .tile {
    width: 44px; height: 58px;
    padding: 2px;
    background: #fdfaf4;
    border: 1px solid #999;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    display: flex; align-items: center; justify-content: center;
  }
  /* Shrink on narrow screens so a full 14-tile hand still fits. */
  @media (max-width: 560px) {
    .tile { width: 36px; height: 48px; }
  }
  .tile img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
  .tile:disabled { cursor: default; }
  .tile:hover:not(:disabled) { background: #f7f2e6; }

  .state-selected   { background: #d8ecff; border-color: #2e6fb0; box-shadow: 0 0 0 2px #2e6fb088; }
  .state-dim        { opacity: 0.3; }
  .state-highlighted{ background: #fff5cc; border-color: #b88a00; }
  .state-incorrect-pick { background: #ffd6d6; border-color: #b03030; }
  .state-engine-best    { background: #d6ffdf; border-color: #2e9050; }
</style>
