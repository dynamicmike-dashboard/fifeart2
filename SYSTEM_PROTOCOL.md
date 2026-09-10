# SYSTEM PROTOCOL — FifeArt2 (React + Vite + Sanity)

## SCOPE RESTRICTION
- Only operate within `...\FifeArt website 26jul26\fifeart2-github`. Sibling `studio-fifeart` only when explicitly approved. No new GitHub/Vercel projects. No browser automation.

## STACK
- App: React 19 + Vite 6 + TS + Tailwind. Static hosting (Vercel). No backend.
- CMS: Sanity project `s2an63e9`, dataset `production`. Studio: sibling `studio-fifeart` (artwork + about schemas).

## ENV (Vite, baked at build → redeploy after changes)
- `VITE_SANITY_PROJECT_ID=s2an63e9`, `VITE_SANITY_DATASET=production` (hardcoded as defaults in `src/services/sanity.ts`)
- `VITE_SANITY_API_TOKEN` optional (private datasets only)
- `VITE_SANITY_WRITE_TOKEN` optional (admin About saves/uploads; ships in public JS — rotate if abused)
- `VITE_ADMIN_PASSWORD` for admin portal

## CONVENTIONS
- Sanity is source of truth. localStorage (`fifeart_catalog_v1`) is offline cache only.
- NEVER auto-seed `INITIAL_ARTWORKS` placeholders (`storage.ts` returns `[]` when empty).
- Migration dedupe key: `teable-<CSV id column>` (NOT the `order` column — it repeats). Script: `scripts/migrate-to-sanity.ts` (`CSV_PATH`, `LIMIT`/`OFFSET`, `WIPE_EXISTING=true` to rebuild).
- About page: Sanity singleton `_id=site-about`; admin edits + portrait upload via write token; seed: `scripts/seed-about.ts`.
- Sanity image URLs are permanent CDN links. Teable presigned URLs expire in ~6 days.

## PENDING
- User runs `npm run deploy` in studio-fifeart (CLI hangs in agent env).
- CORS origins in sanity.io/manage: fifeart.com, www, localhost:3000 (credentials ON).
- Vercel redeploy so live site picks up Sanity fetch + admin tools.
- Rotate exposed tokens (Teable PAT + Sanity write token pasted in chat).
