# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The directive above is not boilerplate: this repo pins **Next.js 16.2.10 / React 19.2.4**, which postdate the training cutoff. Before writing framework code, read the relevant guide under `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`). Do not assume App Router APIs, config shapes, or caching semantics match older Next.js. In particular: Next 16 renamed the `middleware` convention to **`proxy`** (`proxy.ts` at the repo root) and it now defaults to the **Node.js runtime**, not Edge — that's why it can use `node:crypto` and the Drizzle/Neon client directly.

## Commands

- `bun dev` (or `npm run dev`) — start the dev server on http://localhost:3000 (Turbopack)
- `bun run build` — production build
- `bun start` — serve the production build
- `bun run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)
- `bun run db:generate` — generate a Drizzle migration from `src/db/schema.ts` changes
- `bun run db:push` — push schema changes straight to the database (no migration file)

There is **no test runner or typecheck script** configured. Type errors surface only during `build` (or via editor/`tsc --noEmit`). If you add tests, wire the script into `package.json` and note it here.

Dependencies are managed with **Bun** (`bun.lock` is the source of truth). `package.json` also lists `sharp` and `unrs-resolver` under `ignoreScripts` — their postinstall scripts are skipped.

## Architecture

An AI-agent-fed, ad-monetized SEO blog. Content arrives from an external agent as JSON, passes through an automated quality gate, and is either auto-published or queued for human review in a small admin panel.

### Route structure (`app/`, App Router)

- `app/(public)/` — the public site: home, `/blog` index + `/blog/[slug]`, `/blog/category/[category]`, `/blog/tag/[tag]`, `/authors`, `/author/[slug]`, `/search`, `/about`, `/contact`, `/privacy-policy`. Its `layout.tsx` wraps children with `SiteHeader`/`SiteFooter`, `AdScript`, and `ConsentBanner` — this chrome does **not** wrap `/admin`.
- `app/admin/` — session-gated review UI (`/admin`, `/admin/login`, `/admin/review/[id]`) for approving/rejecting/editing flagged posts.
- `app/api/blogs/route.ts` — `POST` ingestion endpoint for the content agent (see pipeline below).
- `app/api/admin/*` — login/logout and post approve/reject/edit endpoints, used by the admin UI.
- `app/[key]/route.ts` — single dynamic root segment that serves the IndexNow key-verification file at `/<INDEXNOW_KEY>.txt` (App Router can't do a partial segment like `[key].txt`); every other value 404s.
- `app/robots.ts`, `app/sitemap.ts`, `app/llms.txt/route.ts`, `app/ads.txt/route.ts` — generated SEO/crawler endpoints, all driven by published posts from `src/lib/posts.ts`.
- `proxy.ts` (root) — Next 16's `proxy` convention (ex-middleware), matched against `/admin*`, `/api/admin*`, `/blog*`. Does two unrelated things in one file: (1) admin session gate via `verifySessionToken`, redirecting unauthenticated page requests to `/admin/login` and 401-ing unauthenticated `/api/admin/*` calls; (2) for `/blog/[slug]`, a pre-render DB check that 301s soft-deleted/renamed slugs to their `redirects` target or returns 410 Gone, so dead posts don't serve stale pages or silently 404.

### Content pipeline

1. Agent `POST`s a payload to `/api/blogs`, authenticated via `x-api-key` or `Authorization: Bearer` matched against `INGEST_API_KEY` (fails closed if unset).
2. Payload is validated against `blogPayloadSchema` in `src/lib/validation.ts` (Zod) — strict on identity/routing/content fields, lenient (optional) on supplemental SEO enrichment; unknown keys are stripped.
3. `src/lib/quality-gate.ts::runQualityGate` runs checks against the payload + existing posts (title/meta length, primary-keyword placement, word count ≥ 800, slug/title uniqueness, FAQ + key-takeaways presence for AEO extractability, a keyword-difficulty guard). `decideStatus` maps a clean report (and a non-`draft` requested status) to `published`; anything else becomes `flagged` for admin review.
4. The row is inserted into `posts` (`src/db/schema.ts`) with the decided status and the quality report attached.
5. If the resulting status is `published` (either auto-publish here, or later via admin approve), `src/lib/publish-hooks.ts::onPublish` runs: synchronous `revalidatePath` for the post/index/category/tag/sitemap/llms.txt, then (via `after()`, non-blocking, failure-isolated) pings IndexNow and the Google Search Console Indexing API.

### Data layer

- `src/db/index.ts` — Drizzle over Neon serverless HTTP (`drizzle-orm/neon-http`), throws at import time if `DATABASE_URL` is unset.
- `src/db/schema.ts` — tables: `authors`, `posts` (the core content table — SEO/AEO metadata, `status` enum `draft|flagged|published`, `deletedAt` soft-delete kept as a nullable column rather than a status value so deletion stays independent of editorial state), `trend_reference`, `revenue_analytics`, `redirects`.
- `src/lib/posts.ts` — all public-facing reads. Every query composes the shared `publicPost()` predicate (`status = 'published' AND deletedAt IS NULL`) so unpublished/deleted posts never leak; list-heavy pages share one `getPublishedPostsLite()` call (wrapped in React `cache`) rather than issuing separate queries per section.
- `src/lib/redirects.ts` — `createRedirect` (upsert on `fromSlug`) and `resolveRedirect` (follows redirect chains up to 10 hops with cycle detection); consumed by `proxy.ts`.
- `src/db/seed.ts` — seed script (run manually, not wired into `package.json` scripts).

### Auth

- `src/lib/admin-auth.ts` — stateless signed session tokens (`<expiryMs>.<hmac>`), HMAC-SHA256 keyed by `ADMIN_SESSION_SECRET` (falls back to `ADMIN_PASSWORD`), constant-time comparisons throughout. Pure `node:crypto`, no framework imports, so it's usable from both `proxy.ts` and Route Handlers.
- `src/lib/admin-guard.ts::requireAdminPage()` — server-component-side redirect-to-login guard, deliberately layered *in addition to* the `proxy.ts` gate (the Next docs warn against relying on proxy/middleware alone for auth).

### Styling

Tailwind CSS **v4**, configured entirely in CSS: `app/globals.css` uses `@import "tailwindcss"`, a `:root` block of design tokens (colors, radius, container width — light-mode only, no dark mode), and an `@theme inline { ... }` block mapping those tokens to Tailwind color utilities (`bg-card`, `text-muted-foreground`, etc.). There is **no `tailwind.config.js`** — add theme values in the `@theme` block. PostCSS wiring lives in `postcss.config.mjs` (`@tailwindcss/postcss`). Shared non-utility classes (`.btn*`, `.field`, `.card`, `.post-card*`, `.article-content`, `.ad-slot`) also live in `globals.css` rather than as component abstractions.

- **TypeScript** — strict mode; import alias `@/*` maps to the repo root (e.g. `@/src/db`, `@/app/...`).

### Ads

`src/components/ads/` (AdScript, AdSlot, ConsentBanner, provider registry) + `src/lib/ads/` (config, placement logic) implement a swappable ad-provider integration (currently AdSense via `NEXT_PUBLIC_AD_PROVIDER` / `NEXT_PUBLIC_ADSENSE_CLIENT_ID`) with a consent-gate banner and CLS-safe ad slots (reserved min-height per breakpoint, see `.ad-slot` in `globals.css`).

### Environment variables

`DATABASE_URL`, `INGEST_API_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `INDEXNOW_KEY`, `GSC_SERVICE_ACCOUNT_JSON`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_AD_PROVIDER`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID` — see `.env.local` (not committed).

Static assets go in `public/` and are served from `/` (e.g. `public/logo.png` → `/logo.png`).
