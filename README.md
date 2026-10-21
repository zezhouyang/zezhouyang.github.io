# Zezhou Yang

Source code for [zezhouyang.github.io](https://zezhouyang.github.io/).

## Development

Requires Node.js 22.13 or later.

```sh
npm ci
npm run dev
```

## Project structure

- `app/`: profile, layout, and styles.
- `lib/profile.ts`: publication data.
- `components/`: theme controls and visitor map.
- `analytics/`: visitor statistics service and database schema.
- `scripts/`: service setup and statistics export.
- `.github/workflows/pages.yml`: GitHub Pages deployment.

## Deployment

The workflow publishes `main` to GitHub Pages and refreshes visitor statistics
on a six-hour schedule. Set the Pages source to **GitHub Actions**.

```sh
npm run build:pages
```

Static output is written to `dist/client/`. Visitor service configuration is
documented in [analytics/README.md](analytics/README.md).

## Checks

```sh
npm run lint
npx tsc --noEmit
npm run visitors:test
```

Map geography is based on [Natural Earth](https://www.naturalearthdata.com/)
public-domain land polygons.
