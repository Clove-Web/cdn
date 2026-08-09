<div align="center">
  <img src="https://m.doughmination.gay/img/avatars/favicon.png" alt="Clove logo" width="150" />

  <h1>CDN</h1>

  <p>Clove's personal static asset host — images, 3D models, fonts-adjacent bits, and sound effects — with a tiny client-side directory browser. Served from Cloudflare Pages at <a href="https://m.doughmination.gay">m.doughmination.gay</a>.</p>

  <p>
    <img src="https://img.shields.io/badge/Cloudflare-Pages-F38020?style=plastic&logo=cloudflare&logoColor=white" alt="Cloudflare Pages" />
    <img src="https://img.shields.io/badge/runtime-Node%2022-339933?style=plastic&logo=nodedotjs&logoColor=white" alt="Node 22" />
    <img src="https://img.shields.io/badge/licence-DASL--1.0-blue?style=plastic" alt="Licence" />
  </p>
</div>

## What this is

A dependency-free static site that does two jobs:

1. **Serves assets** for every other Doughmination site — avatars, icons, `.glb` models, sound effects, and general files. Other apps hotlink these (e.g. `https://m.doughmination.gay/img/avatars/favicon.png`).
2. **Browses itself.** Because a static host can't list directories at runtime, `index.html` reads a build-time `manifest.json` and renders folder navigation entirely client-side via the URL hash (e.g. `#/f/Comic-Code`).

There is no login, no database, and no server — just files, a manifest, and two small Cloudflare Pages Functions.

## Layout

```
cdn/
├── index.html         Directory browser (reads manifest.json)
├── licence.html       Rendered licence page
├── 404.html           Not-found page
├── style.css          Shared theme (see "Styling" below)
├── script.js          Client-side folder browser + filter + copy/zip links
├── manifest.json      Generated at build — flat list of every asset {path,size}
├── _headers           Cloudflare Pages cache + content-type rules
├── _redirects         Cloudflare Pages redirects (.well-known/change-password)
├── functions/
│   ├── _middleware.ts CORS allowlist (echoes an allowed Origin back)
│   └── zip.ts         GET /zip?path=… streams a folder as a .zip on demand
├── scripts/
│   └── gen-manifest.ts Walks the asset dirs and writes manifest.json
├── f/                 General files
├── glb/               3D models
├── img/               Images / avatars / icons
├── sfx/               UI + background sound effects
├── shells/            Misc
└── .well-known/       security.txt, ssh.txt, change-password, etc.
```

The asset directories indexed into the manifest are: `f`, `glb`, `img`, `sfx` (see `ASSET_DIRS` in `scripts/gen-manifest.ts`).

## How the pieces fit

- **manifest.json** is the source of truth for the browser. It's regenerated every deploy — never edit it by hand (it's committed as `{"files":[]}` and filled at build).
- **Zippable folders:** a folder is downloadable as a `.zip` only if it contains an empty marker file named `zippable`. `functions/zip.ts` streams it one file at a time (Workers runtime memory limits — huge folders are intentionally left non-zippable).
- **CORS:** `Access-Control-Allow-Origin` can only be one origin, so `functions/_middleware.ts` keeps an allowlist of the Doughmination domains and echoes back the request's `Origin` when it matches.
- **Caching (`_headers`):** assets (`/f`, `/glb`, `/img`, `/sfx`) cache for a day; `manifest.json` caches for 5 minutes so the listing refreshes soon after a deploy. URLs may change at any time — nothing is cached longer.

## Build & deploy

Cloudflare Pages, deployed automatically on push (no GitHub Action). Node 22 (`.node-version`).

- **Build command:** `node --experimental-strip-types scripts/gen-manifest.ts`
- **Output directory:** repository root (`/`) — this is a plain static site.

`gen-manifest.ts` has zero dependencies (native TS type-stripping, Node ≥ 22.6). Run it locally the same way to preview the listing.

## Styling

The CDN uses the **same look as every other Doughmination site** (see the monorepo `AGENTS.md` → "Uniform styling"):

- Dark trans-pink palette tokens (`--accent: #f5a9b8`, `--bg: #0a0b10`, …).
- The animated trans-flag gradient title (`.trans-title`).
- **Comic Code** font, loaded via `@font-face` from `fonts.doughmination.co.uk`.

The one deliberate exception: **no UI sounds here.** The `sfx/` files are hosted for the *other* sites to use; the CDN itself stays silent.

## Please don't hotlink

These URLs can change at any time without warning. Anything pointing here may break — mirror what you need instead.

## Licence

Licensed under the **Doughmination Authorised Source Licence (DASL-1.0)**. See [LICENCE.md](./LICENCE.md).
