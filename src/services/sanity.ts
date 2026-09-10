import { Artwork, AboutContent } from '../types';

// Server-backed catalog via Sanity (permanent memory).
// Uses the plain HTTP Data API so no extra npm dependencies are needed.

// Project ID / dataset are public, client-safe values: hardcode them as
// defaults so the gallery works even if Vercel env vars were added after
// the build or only to the wrong environment. Env vars still override.
const PROJECT_ID = (import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined)?.trim() || 's2an63e9';
const DATASET = (import.meta.env.VITE_SANITY_DATASET as string | undefined)?.trim() || 'production';
const API_TOKEN = (import.meta.env.VITE_SANITY_API_TOKEN as string | undefined)?.trim() || '';
// Optional write token for admin saves from the browser (About page, etc.).
// NOTE: anything in a VITE_ variable ships in public JS — treat this token
// as semi-public and rotate it if it is ever abused.
const WRITE_TOKEN =
  (import.meta.env.VITE_SANITY_WRITE_TOKEN as string | undefined)?.trim() || '';
const API_VERSION = 'v2024-01-01';

export function isSanityWriteConfigured(): boolean {
  return isSanityConfigured() && WRITE_TOKEN.length > 0;
}

const ABOUT_DOC_ID = 'site-about';

export async function fetchAboutFromSanity(): Promise<Partial<AboutContent> | null> {
  if (!isSanityConfigured()) return null;
  const q = encodeURIComponent(
    `*[_type == "about"][0]{artistName, headline, location, photoUrl, bioParagraph1, bioParagraph2, mediumsApproach, protectionNote, commissionPromptTitle, commissionPromptSubtitle}`,
  );
  const headers: Record<string, string> = {};
  if (API_TOKEN) headers.Authorization = `Bearer ${API_TOKEN}`;
  const res = await fetch(
    `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${q}`,
  );
  if (!res.ok) throw new Error(`Sanity about query failed ${res.status}`);
  const data = await res.json();
  return (data.result as Partial<AboutContent> | null) || null;
}

export async function saveAboutToSanity(content: AboutContent): Promise<void> {
  if (!isSanityWriteConfigured()) {
    throw new Error('Sanity write token is not configured');
  }
  const res = await fetch(
    `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/mutate/${DATASET}`,
    {
      method: 'POST',
      headers: {Authorization: `Bearer ${WRITE_TOKEN}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        mutations: [{createOrReplace: {_id: ABOUT_DOC_ID, _type: 'about', ...content}}],
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity about save failed ${res.status}: ${text.slice(0, 200)}`);
  }
}

// Upload a portrait file to Sanity assets and return its permanent CDN URL.
export async function uploadAboutPhoto(file: File): Promise<string> {
  if (!isSanityWriteConfigured()) {
    throw new Error('Sanity write token is not configured');
  }
  const res = await fetch(
    `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/assets/images/${DATASET}?filename=${encodeURIComponent(file.name)}`,
    {method: 'POST', headers: {Authorization: `Bearer ${WRITE_TOKEN}`, 'Content-Type': file.type || 'image/jpeg'}, body: file},
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Photo upload failed ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const url: string | undefined = data.document?.url;
  if (!url) throw new Error('Photo upload returned no URL');
  return url;
}

export function isSanityConfigured(): boolean {
  return PROJECT_ID.length > 0;
}

interface SanityImageAsset {
  _ref?: string;
  url?: string;
}

interface SanityArtworkDoc {
  _id: string;
  _createdAt: string;
  title?: string;
  slug?: string | {current?: string};
  sku?: string;
  teableId?: string;
  medium?: string;
  dimensions?: string;
  orientation?: Artwork['orientation'];
  price?: number;
  originalPrice?: number;
  tags?: string[];
  subjects?: string[];
  status?: Artwork['status'];
  image?: {asset?: SanityImageAsset};
  description?: string;
  year?: string | number;
  featured?: boolean;
  orderNumber?: string;
}

// asset._ref looks like "image-<hash>-<WxH>-<format>"
function buildImageUrl(ref: string | undefined, fallback: string | undefined): string {
  if (ref) {
    const match = ref.match(/^image-([A-Za-z0-9]+)-(\d+x\d+)-([a-z]+)$/);
    if (match) {
      return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${match[1]}-${match[2]}.${match[3]}?w=1200&q=80&auto=format`;
    }
  }
  return fallback || '';
}

function mapDoc(doc: SanityArtworkDoc): Artwork {
  const slug = typeof doc.slug === 'string' ? doc.slug : doc.slug?.current || doc._id;
  const imageUrl = buildImageUrl(doc.image?.asset?._ref, doc.image?.asset?.url);
  return {
    id: doc._id,
    sku: doc.sku || doc._id,
    orderNumber: doc.orderNumber,
    title: doc.title || 'Untitled',
    slug,
    medium: doc.medium || '',
    dimensions: doc.dimensions || '',
    orientation: doc.orientation,
    price: doc.price ?? 0,
    originalPrice: doc.originalPrice,
    tags: doc.tags || [],
    subjects: doc.subjects,
    status: doc.status || 'Available',
    imageUrl,
    description: doc.description || '',
    year: doc.year,
    featured: doc.featured,
    createdAt: doc._createdAt,
  };
}

const QUERY = encodeURIComponent(`*[_type == "artwork"] | order(_createdAt desc) {
  _id, _createdAt, title, slug, sku, teableId, medium, dimensions, orientation,
  price, originalPrice, tags, subjects, status, description, year, featured, orderNumber,
  image { asset -> { _ref, url } }
}`);

export async function fetchArtworksFromSanity(): Promise<Artwork[]> {
  if (!isSanityConfigured()) {
    throw new Error('Sanity is not configured (VITE_SANITY_PROJECT_ID missing)');
  }
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${QUERY}`;
  const headers: Record<string, string> = {};
  if (API_TOKEN) headers.Authorization = `Bearer ${API_TOKEN}`;
  const res = await fetch(url, {headers});
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity query failed ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const docs = (data.result || []) as SanityArtworkDoc[];
  // Only keep docs that resolved to a usable image URL
  return docs.map(mapDoc).filter((a) => a.imageUrl.length > 0);
}
