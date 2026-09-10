/**
 * Seed the `about` singleton in Sanity from DEFAULT_ABOUT_CONTENT.
 * Safe to re-run (createOrReplace on fixed id `site-about`).
 *
 * Run from fifeart2-github:
 *   $env:SANITY_API_TOKEN='sk...'; npx tsx scripts/seed-about.ts
 */
import {DEFAULT_ABOUT_CONTENT} from '../src/data/contentDefaults';

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 's2an63e9';
const DATASET = process.env.SANITY_DATASET || 'production';
const TOKEN = process.env.SANITY_API_TOKEN || '';

if (!TOKEN) {
  console.error('Missing SANITY_API_TOKEN (needs Editor role).');
  process.exit(1);
}

async function main() {
  const res = await fetch(
    `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`,
    {
      method: 'POST',
      headers: {Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        mutations: [{createOrReplace: {_id: 'site-about', _type: 'about', ...DEFAULT_ABOUT_CONTENT}}],
      }),
    },
  );
  if (!res.ok) throw new Error(`Seed failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  console.log('About singleton seeded:', JSON.stringify(await res.json()).slice(0, 200));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
