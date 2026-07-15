# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The directive above is not boilerplate: this repo pins **Next.js 16.2.10 / React 19.2.4**, which postdate the training cutoff. Before writing framework code, read the relevant guide under `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`). Do not assume App Router APIs, config shapes, or caching semantics match older Next.js.

## Commands

- `bun dev` (or `npm run dev`) — start the dev server on http://localhost:3000
- `bun run build` — production build
- `bun start` — serve the production build
- `bun run lint` — ESLint (flat config)

There is **no test runner or typecheck script** configured. Type errors surface only during `build` (or via editor/`tsc --noEmit`). If you add tests, wire the script into `package.json` and note it here.

Dependencies are managed with **Bun** (`bun.lock` is the source of truth). `package.json` also lists `sharp` and `unrs-resolver` under `ignoreScripts` — their postinstall scripts are skipped.

## Architecture

Currently the default create-next-app scaffold; effectively no application code exists yet beyond the landing page.

- **App Router** — all routes live in `app/`. `app/layout.tsx` is the root layout (loads Geist fonts via `next/font/google`, exposes them as `--font-geist-sans` / `--font-geist-mono`); `app/page.tsx` is the home route.
- **Styling** — Tailwind CSS **v4**. Configured entirely in CSS: `app/globals.css` uses `@import "tailwindcss"` and an `@theme inline { ... }` block for design tokens. There is **no `tailwind.config.js`** — add theme values in the `@theme` block, not a JS config. PostCSS wiring lives in `postcss.config.mjs` (`@tailwindcss/postcss`).
- **TypeScript** — strict mode; import alias `@/*` maps to the repo root (e.g. `@/app/...`).
- `next.config.ts` is currently empty — add config there.

Static assets go in `public/` and are served from `/` (e.g. `public/next.svg` → `/next.svg`).
