# Roadmap

Living document. Spec at `docs/superpowers/specs/2026-05-17-jongers-web-design.md`.

## Done

- **Engine ported from MahjongKit (TS).** Tile, MPSZ, Hand/Meld, standard shanten (oracle-faithful port), ukeire, discard analysis, agari, wait shapes, hand decomposition, full 25-pattern faan catalog with subsumption.
- **Audit harness.** Every shipped scenario is engine-validated on every test run and `npm run build`. Refuses to deploy broken scenarios.
- **SRS.** SM-2 with binary input, no learning steps. localStorage persistence with version-aware backup. Export/import via Settings.
- **Four drill types working end-to-end:**
  - Discard — tap-to-preview shanten/ukeire, submit, ranked discard table on reveal.
  - Wait — 6-button shape multiple choice, reveal shows winning tiles.
  - Claim — pon/chi/wu/pass buttons against opponent's discard.
  - Faan-recognition — 5-choice "how many faan?" multiple choice, breakdown on reveal.
- **UI shell.** Svelte 5 + runes. Chrome bar, status strip, glossary stub, Settings panel, scenario filter, mobile-first responsive layout.
- **Tile art.** 34 Perth Mahjong Society SVGs (CC-BY-SA-4.0), URL-imported via Vite, hashed and cached.
- **Deploy.** GitHub Actions → GitHub Pages on push to `main`. `npm run build` runs audit + production build.
- **Tests.** 86 vitest tests across engine, SRS, audit. Library-audit test covers all shipped scenarios.

- **Shared drill components.** `DrillSetupHeader`, `DrillReveal`, `ChoiceGrid<T>` — the four drill bodies are now ~25% shorter; CSS bundle dropped to 4.8KB.
- **Engine hygiene.** Faan detectors share a per-decomposition cache (`Dctx`) for tiles/suits/no-chows/meld-heads instead of recomputing per detector. Shanten kernel uses `Int8Array`. Audit `dueCount` now reflects unseen + due.

Current state: 16 commits, 86 tests, 101KB JS / 4.8KB CSS bundle.

---

## Remaining work (priority order)

### Near-term (real product value)

**Scenario authoring throughput.** The biggest blocker to drilling being useful — 8 discard + 2 each of wait/claim/faan = 14 total. Target ~50 per drill type for SRS to feel like real practice.

- Author more scenarios by hand for each type. Slowest path. Hand-authoring an MPSZ string + verifying against the engine takes a few minutes per scenario.
- **Build a scenario-authoring view.** Click tiles into a hand, set seat/winds/dora, let the running engine compute the engine-best answer, export JSON. Cuts authoring time roughly 5x. Specifically:
  - Tile palette → click to build concealed/melds/drewTile/visibleTiles.
  - Live engine readout (shanten, ukeire, faan, etc. depending on drill type).
  - Auto-fill the `answer` field from engine output; require manual confirmation + tag/explanation.
  - Copy JSON to clipboard for paste into the library file.
- **Scenario tagging conventions.** Current tags are free-form. Establish a small vocabulary (`tanki`, `shanpon`, `honors`, `dora`, etc.) so the filter dropdown can become tag-driven.

### Medium-term

**Glossary content.** Currently a stub modal. Should include:
- Wait shapes with the engine's own description text (already in the WaitShape enum in Swift, port to TS).
- Faan patterns with displayName + faan value + a one-line description.
- Hand states (winning / tenpai / 1-shanten / ...).
- Make tappable from inside a drill (e.g. tag chip → glossary entry).

**Faan-potential drill** (v1.1 per spec). Greenfield engine work — enumerate reachable hand shapes within N tile swaps, run the faan catalog on each, return max. Risky / brute force; works fine for small hands. New drill type once that lands.

**Defensive-discard drill** (cut from v1, worth considering for v1.1). "Opponent looks tenpai. Which of your tiles is safest?" Needs an engine heuristic for "discarded-safe tile" — sou/pin/man genbutsu, suji, kabe. Real engine work.

**Better discard drill UX.**
- Show preview readout for every option simultaneously after first tile-tap (currently only shows the *selected* tile's analysis). Lets the user compare without committing.
- Optional: show melds visually distinct from concealed (left of the divider currently — clearer if styled differently).

### Long-term / v2

**Play mode.** Real bots, multi-hand sessions, dealer rotation, full faan-driven payouts. This was always v2; the engine has most of the prerequisites (table state and action model are NOT ported yet — would still be a sizable port from Swift's `Game/` directory). Roughly:
- Port `TableState`, `PlayerState`, `Turn`, `ActionLog`, `replay()` from Swift.
- Port claim resolution (priority: wu > pong/openKong > chi).
- Wire up a basic shanten-greedy bot.
- Single-hand Play view first (the Swift app's Phase 6.5 "v0"), then multi-hand sessions.

**Cross-device sync.** Currently only export/import via clipboard. Could add a "sync code" mechanism that POSTs storage to a tiny serverless function — but breaks the local-first principle. Probably never worth it.

**SRS analytics.** Per-tag accuracy, weakness dashboard, "tiles I get wrong" list. All derivable from the existing attempt log; just no UI for it.

**Keyboard shortcuts.** Numbers 1–9 to pick discards, letters for claim actions, arrow keys to navigate. Not in v1 because mobile-first; useful on desktop.

### Engineering hygiene (do anytime)

- **`discardOptions` engine efficiency.** Each candidate rebuilds the count array and calls `ukeire`, which rebuilds it again. Hoist `handCounts` and mutate in place. Probably 3–5x speedup on large hands; not user-visible today but matters once scenarios get bigger.
- **Storage schema validation.** `loadStorage` currently trusts the parsed JSON shape past the version check. A schema validator (zod) or hand-rolled check would prevent broken imports.
- **a11y on modal dialogs.** Settings + Glossary modals have a11y warnings on Svelte's a11y linter — `role="dialog"` without `tabindex`, click-without-keyboard. Cosmetic but worth fixing.

### Out of scope

- Multi-player / online play.
- Telemetry / analytics.
- Accounts / login.
- Tournament scoring, rule-variants beyond HK.
