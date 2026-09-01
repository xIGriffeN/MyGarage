# JIGGY.

**Your car. Your story.**

JIGGY is a desktop garage and vehicle-history app for Windows.

## Current version

**1.9.4**

## JIGGY Cloud

Public profiles use the self-hosted JIGGY Cloud API:

`https://api.jiggy-cloud.org`

The public profile frontend is deployed from `public-profile/` through GitHub Pages.

## Development

```bash
npm install
npm start
```

## Windows build

```bash
npm run dist
```

GitHub tag releases matching `v*` are built by `.github/workflows/release.yml`.
