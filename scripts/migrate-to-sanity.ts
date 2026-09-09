/**
 * One-time migration: Teable CSV export -> Sanity artworks.
 *
 * Reads the Teable CSV (default: ../teablepaintings09sep26.csv relative to
 * the app folder), downloads each row's image bytes, uploads them as Sanity
 * image assets (permanent CDN URLs), and creates `artwork` documents.
 * Re-runnable: skips docs whose teableId already exists.
 *
 * Run from fifeart2-github:
 *   $env:SANITY_API_TOKEN='sk...'; $env:CSV_PATH='../teablepaintings09sep26.csv'; npx tsx scripts/migrate-to-sanity.ts
 * Optional chunking for long runs:
 *   $env:LIMIT='50'; $env:OFFSET='0'; npx tsx scripts/migrate-to-sanity.ts
 */
import {readFileSync} from 'node:fs';
import {resolve, basename} from 'node:path';
import {parseArtworksImport} from '../src/utils/artworkParser';

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 's2an63e9';
const DATASET = process.env.SANITY_DATASET || 'production';
const TOKEN = process.env.SANITY_API_TOKEN || '';
const CSV_PATH = resolve(process.cwd(), process.env.CSV_PATH || '../teablepaintings09sep26.csv');
const LIMIT = Number(process.env.LIMIT || '0');
const OFFSET = Number(process.env.OFFSET || '0');
const API_VERSION = 'v2024-01-01';

if (!TOKEN) {
  console.error('Missing SANITY_API_TOKEN (needs Editor role on the fifeart project).');
  process.exit(1);
}

const authHeaders = {Authorization: `Bearer ${TOKEN}`};

function mapStatus(raw: string): string {
  const s = (raw || '').toLowerCase();
  if (s === 'sold') return 'Sold';
  if (s === 'not_for_sale' || s.includes('not for sale')) return 'Not for Sale';
  if (s === 'discounted') return 'Discounted';
  if (s === 'on order' || s === 'on_order') return 'On Order';
  if (s === 'two sizes' || s === 'two_sizes') return 'Two Sizes';
  return 'Available';
}

function mapOrientation(raw: unknown): string | undefined {
  const s = String(raw || '').toLowerCase();
  if (s.startsWith('portrait')) return 'Portrait';
  if (s.startsWith('square')) return 'Square';
  if (s.startsWith('landscape')) return 'Landscape';
  return undefined;
}

async function getExistingTeableIds(): Promise<Set<string>> {
  const q = encodeURIComponent('*[_type == "artwork" && defined(teableId)].teableId');
  const res = await fetch(
    `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${q}`,
    {headers: authHeaders},
  );
  if (!res.ok) throw new Error(`Failed to list existing docs: ${res.status}`);
  const data = await res.json();
  return new Set((data.result || []) as string[]);
}

async function uploadImageAsset(bytes: ArrayBuffer, filename: string, contentType: string): Promise<string> {
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/assets/images/${DATASET}?filename=${encodeURIComponent(filename)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {...authHeaders, 'Content-Type': contentType},
    body: bytes,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Asset upload failed ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.document._id as string; // e.g. image-<hash>-<WxH>-<format>
}

async function createDoc(doc: Record<string, unknown>): Promise<string> {
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/mutate/${DATASET}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {...authHeaders, 'Content-Type': 'application/json'},
    body: JSON.stringify({mutations: [{create: doc}]}),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Doc create failed ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.results?.[0]?.id as string;
}

async function main() {
  const csv = readFileSync(CSV_PATH, 'utf8');
  const parsed = parseArtworksImport(csv);
  if (!parsed.success || parsed.artworks.length === 0) {
    throw new Error(parsed.errorMessage || 'No artworks parsed from CSV');
  }
  let list = parsed.artworks;
  console.log(`Parsed ${list.length} artworks from ${basename(CSV_PATH)}`);
  if (OFFSET) list = list.slice(OFFSET);
  if (LIMIT) list = list.slice(0, LIMIT);
  console.log(`Migrating ${list.length} rows (offset ${OFFSET})...`);

  const existing = await getExistingTeableIds();
  console.log(`Skipping ${existing.size} teableIds already in Sanity`);

  let created = 0;
  let skipped = 0;
  let failed = 0;
  for (const [i, art] of list.entries()) {
    const teableId = art.orderNumber || art.sku;
    try {
      if (existing.has(teableId)) {
        skipped++;
        continue;
      }
      let imageField: Record<string, unknown> | undefined;
      if (art.imageUrl && !art.imageUrl.startsWith('data:')) {
        const imgRes = await fetch(art.imageUrl);
        if (!imgRes.ok) throw new Error(`Image download failed ${imgRes.status}`);
        const ct = imgRes.headers.get('content-type') || 'image/jpeg';
        const buf = await imgRes.arrayBuffer();
        const filename = `${art.sku || teableId}.${ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg'}`;
        const assetId = await uploadImageAsset(buf, filename, ct);
        imageField = {_type: 'image', asset: {_type: 'reference', _ref: assetId}};
      }
      const doc: Record<string, unknown> = {
        _type: 'artwork',
        title: art.title,
        slug: {_type: 'slug', current: `${art.slug}-${teableId}`},
        sku: art.sku,
        teableId,
        medium: art.medium,
        dimensions: art.dimensions,
        orientation: mapOrientation((art as unknown as Record<string, unknown>).orientation),
        price: art.price,
        originalPrice: art.originalPrice,
        tags: art.tags,
        subjects: art.subjects,
        status: mapStatus(art.status),
        description: art.description,
        year: art.year ? String(art.year) : undefined,
        featured: art.featured,
      };
      if (imageField) doc.image = imageField;
      const id = await createDoc(doc);
      existing.add(teableId);
      created++;
      if (created % 10 === 0) console.log(`... ${created} created (${i + 1}/${list.length})`);
      void id;
    } catch (e) {
      failed++;
      console.error(`FAILED [${teableId}] ${art.title}:`, (e as Error).message);
    }
  }
  console.log(`Done: ${created} created, ${skipped} skipped (already migrated), ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
