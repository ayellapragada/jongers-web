<script lang="ts">
  import type { Tile } from '../../engine/tile';
  import { tileSuit, tileNumber } from '../../engine/tile';

  type TileState = 'normal' | 'selected' | 'dim' | 'highlighted' | 'incorrect-pick' | 'engine-best';

  let { tile, state = 'normal', onclick }: {
    tile: Tile;
    state?: TileState;
    onclick?: () => void;
  } = $props();

  function tileChar(t: Tile): string {
    const s = tileSuit(t);
    const n = tileNumber(t);
    if (s === 'man')    return String.fromCodePoint(0x1F007 + (n - 1));
    if (s === 'sou')    return String.fromCodePoint(0x1F010 + (n - 1));
    if (s === 'pin')    return String.fromCodePoint(0x1F019 + (n - 1));
    if (s === 'wind')   return String.fromCodePoint(0x1F000 + (n - 1));
    return String.fromCodePoint([0x1F006, 0x1F005, 0x1F004][n - 1]!);
  }
</script>

<button
  type="button"
  class="tile state-{state}"
  onclick={onclick}
  disabled={!onclick}
  aria-label="tile {tile}"
>
  {tileChar(tile)}
</button>

<style>
  .tile {
    font-size: 2.5rem;
    line-height: 1;
    min-width: 44px; min-height: 44px;
    padding: 4px 6px;
    background: #fafafa;
    border: 1px solid #ccc;
    border-radius: 6px;
    cursor: pointer;
  }
  .tile:disabled { cursor: default; }
  .state-selected   { background: #e0f0ff; border-color: #4a8fd6; }
  .state-dim        { opacity: 0.4; }
  .state-highlighted{ background: #fff5cc; border-color: #d6b34a; }
  .state-incorrect-pick { background: #ffe0e0; border-color: #d64a4a; }
  .state-engine-best    { background: #e0ffe5; border-color: #4ad66a; }
</style>
