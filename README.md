# jongers-web

Mobile-first web app for drilling Hong Kong Old Style mahjong decisions.
Drill-only v1. Scenarios authored as JSON; engine validates them on build.

## Develop

```bash
npm install
npm run dev       # vite dev server
npm test          # vitest
npm run build     # audit + production build → dist/
```

## Deploy

Push to `main` → GitHub Actions builds and deploys to GitHub Pages.

## Spec & plans

See `docs/superpowers/specs/` and `docs/superpowers/plans/`.
