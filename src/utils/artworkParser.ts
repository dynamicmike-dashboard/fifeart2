import { Artwork, ArtworkOrientation, ArtworkStatus } from '../types';

/**
 * Intelligent CSV / TSV / Semicolon tokenizer that handles:
 * - RFC 4180 quoted fields
 * - Escaped double quotes ("")
 * - Commas, tabs, and newlines within quotes
 */
export function parseDelimitedText(text: string): { headers: string[]; rows: string[][] } {
  const cleanText = text.replace(/^\uFEFF/, '').trim(); // Remove BOM if present
  if (!cleanText) {
    return { headers: [], rows: [] };
  }

  // Detect delimiter from first non-empty line
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped double quote
        currentCell += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (!inQuotes) {
      if (char === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      }
    }

    currentCell += char;
    i++;
  }

  // Push final cell and row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  return { headers, rows: dataRows };
}

/**
 * Extract a direct, usable image URL from various spreadsheet / Teable formats:
 * - Direct URL (https://...)
 * - Teable / Airtable JSON attachment array e.g. [{"url":"https://...","name":"Kirkcaldy.jpg"}]
 * - Teable relative API attachments e.g. /api/attachments/... or [{"path":"/api/attachments/..."}]
 * - Markdown image ![alt](url)
 * - Google Drive shareable links -> direct preview links
 * - Dropbox dl links
 */
export function extractImageUrl(raw: unknown): string {
  if (!raw) return '';
  const trimmed = typeof raw === 'string' ? raw.trim() : JSON.stringify(raw);
  if (!trimmed) return '';

  // 1. Try parsing as JSON attachment array or object (Teable & Airtable standard format)
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (typeof first === 'string') return resolveUrl(first);
        if (first && typeof first === 'object') {
          if ('url' in first && first.url) return resolveUrl(String(first.url));
          if ('path' in first && first.path) return resolveUrl(String(first.path));
        }
      } else if (parsed && typeof parsed === 'object') {
        if ('url' in parsed && parsed.url) return resolveUrl(String(parsed.url));
        if ('path' in parsed && parsed.path) return resolveUrl(String(parsed.path));
      }
    } catch {
      // Continue to regex
    }
  }

  // 2. Regex for "url":"https://..." or "path":"..."
  const jsonUrlMatch = trimmed.match(/"url"\s*:\s*"([^"]+)"/i);
  if (jsonUrlMatch && jsonUrlMatch[1]) {
    return resolveUrl(jsonUrlMatch[1]);
  }
  const jsonPathMatch = trimmed.match(/"path"\s*:\s*"([^"]+)"/i);
  if (jsonPathMatch && jsonPathMatch[1]) {
    return resolveUrl(jsonPathMatch[1]);
  }

  // 3. Regex for markdown ![alt](https://...)
  const mdMatch = trimmed.match(/\((https?:\/\/[^\s)]+)\)/i);
  if (mdMatch && mdMatch[1]) {
    return resolveUrl(mdMatch[1]);
  }

  // 4. Match any http/https URL
  const httpMatch = trimmed.match(/https?:\/\/[^\s,"'\])]+/i);
  if (httpMatch && httpMatch[0]) {
    return resolveUrl(httpMatch[0]);
  }

  // 5. Teable relative attachment paths like /api/attachments/... or api/attachments/...
  if (trimmed.startsWith('/api/attachments') || trimmed.startsWith('api/attachments')) {
    return resolveUrl(trimmed);
  }

  // 6. Data URLs
  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }

  return '';
}

/**
 * Normalizes and resolves URLs (e.g. converting relative Teable attachments or Google Drive links)
 */
function resolveUrl(url: string): string {
  let clean = url.trim();
  if (!clean) return '';

  // Teable relative path
  if (clean.startsWith('/api/attachments') || clean.startsWith('api/attachments')) {
    const normalizedPath = clean.startsWith('/') ? clean : `/${clean}`;
    return `https://app.teable.io${normalizedPath}`;
  }

  // Google Drive preview link conversion
  if (clean.includes('drive.google.com/file/d/')) {
    const idMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    }
  }

  // Dropbox direct link conversion
  if (clean.includes('dropbox.com') && clean.includes('dl=0')) {
    return clean.replace('dl=0', 'raw=1');
  }

  return clean;
}

/**
 * Generates an authentic canvas SVG placeholder using the actual painting's title and medium,
 * ensuring no third-party stock photos (like Unsplash) are shown when an image URL is missing.
 */
export function generateCanvasPlaceholder(title: string, medium = 'Original painting'): string {
  const cleanTitle = (title || 'Scottish Artwork').replace(/[<>&"]/g, '');
  const cleanMedium = (medium || 'Original painting').replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1c1917"/>
        <stop offset="50%" stop-color="#292524"/>
        <stop offset="100%" stop-color="#1c1917"/>
      </linearGradient>
      <pattern id="weave" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="none" stroke="#44403c" stroke-width="0.75" stroke-opacity="0.3"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#weave)"/>
    <rect x="28" y="28" width="744" height="544" fill="none" stroke="#78716c" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4"/>
    <g transform="translate(400, 260)" text-anchor="middle">
      <circle cx="0" cy="-60" r="28" fill="#44403c" stroke="#78716c" stroke-width="1"/>
      <path d="M-10 -60 L10 -60 M0 -70 L0 -50" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
      <text y="0" fill="#f5f5f4" font-family="serif" font-size="28" font-weight="600">${cleanTitle}</text>
      <text y="38" fill="#d6d3d1" font-family="sans-serif" font-size="14" letter-spacing="1.5">${cleanMedium}</text>
      <text y="85" fill="#f59e0b" font-family="serif" font-size="12" font-style="italic" letter-spacing="4">FIFE ART STUDIO • KIRKCALDY</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Parse price string to number, removing currency symbols, spaces and commas
 */
export function parsePrice(raw: unknown): number {
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  if (!raw) return 0;
  const str = String(raw).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Normalize status to allowed ArtworkStatus
 */
export function normalizeStatus(raw: string): ArtworkStatus {
  const str = (raw || '').toLowerCase().trim();
  if (str.includes('sold')) return 'Sold';
  if (str.includes('order')) return 'On Order';
  if (str.includes('two') || str.includes('size')) return 'Two Sizes';
  if (str.includes('disc') || str.includes('sale') || str.includes('reduced')) return 'Discounted';
  return 'Available';
}

/**
 * Parse tags from string or array
 */
export function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((t) => String(t).trim()).filter(Boolean);
        }
      } catch {
        // Fall back to splitting
      }
    }
    return trimmed
      .split(/[,;\n|]/)
      .map((t) => t.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return ['Original'];
}

export function normalizeOrientation(raw: unknown): ArtworkOrientation {
  if (!raw) return 'Landscape';
  const str = String(raw).toLowerCase().trim();
  if (str.includes('port') || str.includes('vert')) return 'Portrait';
  if (str.includes('sq')) return 'Square';
  return 'Landscape';
}

export interface ColumnMapping {
  titleCol: string;
  imageCol: string;
  priceCol: string;
  mediumCol: string;
  dimensionsCol: string;
  statusCol: string;
  tagsCol: string;
  skuCol: string;
  descCol: string;
  orientationCol?: string;
  subjectsCol?: string;
  dateCol?: string;
}

export interface ParseResult {
  success: boolean;
  artworks: Artwork[];
  formatDetected: 'CSV' | 'TSV' | 'JSON' | 'Unknown';
  errorMessage?: string;
  totalParsed: number;
  headers?: string[];
  rawRows?: string[][];
  detectedMapping?: ColumnMapping;
}

/**
 * Normalizes header names for flexible matching
 */
export function normalizeHeader(h: string): string {
  return (h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const TITLE_ALIASES = [
  'title',
  'name',
  'paintingtitle',
  'artworktitle',
  'painting',
  'artwork',
  'piecename',
  'worktitle',
  'subject',
  'itemname',
  'work',
  'piece',
  'item',
];

const IMAGE_ALIASES = [
  'image',
  'imageurl',
  'images',
  'photo',
  'photos',
  'picture',
  'pictures',
  'attachment',
  'attachments',
  'file',
  'files',
  'photourl',
  'thumbnail',
  'cover',
  'media',
  'upload',
  'uploads',
  'artworkimage',
  'paintingimage',
  'art',
  'scan',
  'link',
  'url',
  'pic',
  'pics',
  'asset',
  'assets',
];

const MEDIUM_ALIASES = [
  'medium',
  'material',
  'technique',
  'type',
  'format',
  'substrate',
  'paint',
  'style',
  'surface',
];

const DIMENSIONS_ALIASES = [
  'dimensions',
  'dimension',
  'size',
  'measurements',
  'widthheight',
  'canvassize',
  'framesize',
  'heightwidth',
];

const PRICE_ALIASES = [
  'price',
  'cost',
  'amount',
  'gbp',
  'value',
  'pricegbp',
  'saleprice',
  'sellingprice',
  'fee',
];

const STATUS_ALIASES = [
  'status',
  'availability',
  'state',
  'stockstatus',
  'stock',
  'available',
  'salestatus',
];

const TAGS_ALIASES = [
  'tags',
  'tag',
  'category',
  'categories',
  'subject',
  'subjects',
  'collection',
  'theme',
  'keywords',
  'genre',
];

const SKU_ALIASES = [
  'sku',
  'ordernumber',
  'order',
  'orderno',
  'order#',
  'itemnumber',
  'item#',
  'catalogid',
  'reference',
  'itemcode',
  'code',
  'id',
  'ref',
];

const ORIENTATION_ALIASES = [
  'orientation',
  'aspect',
  'aspectratio',
  'format',
  'shape',
  'layout',
];

const SUBJECTS_ALIASES = [
  'subjects',
  'subject',
  'topic',
  'topics',
  'theme',
  'themes',
  'motif',
  'subjectmatter',
  'genre',
];

const DATE_ALIASES = [
  'date',
  'createddate',
  'datecreated',
  'year',
  'painted',
  'creationdate',
  'dated',
  'period',
  'created',
];

const DESC_ALIASES = [
  'description',
  'desc',
  'details',
  'about',
  'notes',
  'caption',
  'story',
  'statement',
];

/**
 * Find best matching column name among headers
 */
function findMatchingHeader(headers: string[], aliases: string[]): string {
  for (const h of headers) {
    const norm = normalizeHeader(h);
    if (aliases.some((a) => normalizeHeader(a) === norm)) {
      return h;
    }
  }
  // Loose matching (contains)
  for (const h of headers) {
    const norm = normalizeHeader(h);
    if (aliases.some((a) => norm.includes(normalizeHeader(a)))) {
      return h;
    }
  }
  return '';
}

/**
 * Scan row cells to detect if any column looks like image URLs or attachments
 */
function detectImageColumnByContent(headers: string[], rows: string[][]): string {
  const sampleRows = rows.slice(0, 15);
  for (let colIdx = 0; colIdx < headers.length; colIdx++) {
    let matchCount = 0;
    for (const row of sampleRows) {
      const cell = (row[colIdx] || '').trim();
      if (!cell) continue;
      if (
        cell.includes('http://') ||
        cell.includes('https://') ||
        cell.includes('app.teable.io') ||
        cell.includes('/api/attachments') ||
        cell.includes('"url"') ||
        cell.includes('"path"') ||
        /\.(jpg|jpeg|png|webp|gif)/i.test(cell)
      ) {
        matchCount++;
      }
    }
    if (matchCount >= 1) {
      return headers[colIdx];
    }
  }
  return '';
}

/**
 * Master parser accepting either JSON array, JSON object, or CSV/TSV export data
 */
export function parseArtworksImport(rawInput: string, customMapping?: Partial<ColumnMapping>): ParseResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      success: false,
      artworks: [],
      formatDetected: 'Unknown',
      errorMessage: 'Input data is empty. Please upload a CSV/JSON file or paste your inventory.',
      totalParsed: 0,
    };
  }

  // 1. Try parsing as JSON first
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const items: Record<string, unknown>[] = Array.isArray(parsed)
        ? parsed
        : parsed.artworks || parsed.records || parsed.data || parsed.items || [parsed];

      if (Array.isArray(items) && items.length > 0) {
        const artworks = mapRecordsToArtworks(items);
        return {
          success: true,
          artworks,
          formatDetected: 'JSON',
          totalParsed: artworks.length,
        };
      }
    } catch {
      // If JSON parsing failed, try CSV fallback
    }
  }

  // 2. Parse as CSV / TSV
  try {
    const { headers, rows } = parseDelimitedText(trimmed);
    if (headers.length === 0 || rows.length === 0) {
      return {
        success: false,
        artworks: [],
        formatDetected: 'CSV',
        errorMessage: 'Could not find any valid headers or data rows in the file.',
        totalParsed: 0,
      };
    }

    const isTabDelimited = headers.some((h) => h.includes('\t')) || (trimmed.split('\n')[0] || '').includes('\t');
    const formatDetected = isTabDelimited ? 'TSV' : 'CSV';

    // Auto-detect column mapping
    const titleCol = customMapping?.titleCol || findMatchingHeader(headers, TITLE_ALIASES) || headers[0] || '';
    let imageCol = customMapping?.imageCol || findMatchingHeader(headers, IMAGE_ALIASES);
    if (!imageCol) {
      imageCol = detectImageColumnByContent(headers, rows);
    }
    const priceCol = customMapping?.priceCol || findMatchingHeader(headers, PRICE_ALIASES);
    const mediumCol = customMapping?.mediumCol || findMatchingHeader(headers, MEDIUM_ALIASES);
    const dimensionsCol = customMapping?.dimensionsCol || findMatchingHeader(headers, DIMENSIONS_ALIASES);
    const statusCol = customMapping?.statusCol || findMatchingHeader(headers, STATUS_ALIASES);
    const tagsCol = customMapping?.tagsCol || findMatchingHeader(headers, TAGS_ALIASES);
    const skuCol = customMapping?.skuCol || findMatchingHeader(headers, SKU_ALIASES);
    const descCol = customMapping?.descCol || findMatchingHeader(headers, DESC_ALIASES);
    const orientationCol = customMapping?.orientationCol || findMatchingHeader(headers, ORIENTATION_ALIASES);
    const subjectsCol = customMapping?.subjectsCol || findMatchingHeader(headers, SUBJECTS_ALIASES);
    const dateCol = customMapping?.dateCol || findMatchingHeader(headers, DATE_ALIASES);

    const mapping: ColumnMapping = {
      titleCol,
      imageCol: imageCol || '',
      priceCol: priceCol || '',
      mediumCol: mediumCol || '',
      dimensionsCol: dimensionsCol || '',
      statusCol: statusCol || '',
      tagsCol: tagsCol || '',
      skuCol: skuCol || '',
      descCol: descCol || '',
      orientationCol: orientationCol || '',
      subjectsCol: subjectsCol || '',
      dateCol: dateCol || '',
    };

    const headerIndexMap: { [h: string]: number } = {};
    headers.forEach((h, idx) => {
      headerIndexMap[h] = idx;
    });

    const getVal = (row: string[], colName?: string): string => {
      if (!colName || !(colName in headerIndexMap)) return '';
      const val = row[headerIndexMap[colName]];
      return val !== undefined && val !== null ? String(val).trim() : '';
    };

    const artworks: Artwork[] = rows.map((row, idx) => {
      const title = getVal(row, mapping.titleCol) || `Original Artwork #${idx + 1}`;
      const medium = getVal(row, mapping.mediumCol) || 'Original Painting';
      const dimensions = getVal(row, mapping.dimensionsCol) || 'Framed original';
      const priceRaw = getVal(row, mapping.priceCol);
      const price = parsePrice(priceRaw) || 240;

      // Extract image URL from designated image column
      let imageUrl = '';
      if (mapping.imageCol) {
        const rawImgCell = getVal(row, mapping.imageCol);
        imageUrl = extractImageUrl(rawImgCell);
      }

      // If still empty, scan ALL cells in the row for any image URL/attachment
      if (!imageUrl) {
        for (let c = 0; c < row.length; c++) {
          const candidate = extractImageUrl(row[c]);
          if (candidate) {
            imageUrl = candidate;
            break;
          }
        }
      }

      // Fallback: If no real photo was provided, create an authentic Fife Art studio canvas placeholder
      // (NEVER fall back to Unsplash stock photos, which triggers "placeholder data" warnings)
      if (!imageUrl) {
        imageUrl = generateCanvasPlaceholder(title, medium);
      }

      const statusRaw = getVal(row, mapping.statusCol);
      const status = normalizeStatus(statusRaw);

      const tagsRaw = getVal(row, mapping.tagsCol);
      const tags = parseTags(tagsRaw);
      if (tags.length === 0) tags.push('Original');

      const subjectsRaw = getVal(row, mapping.subjectsCol);
      const subjects = subjectsRaw ? parseTags(subjectsRaw) : [...tags];

      const orientationRaw = getVal(row, mapping.orientationCol);
      const orientation = normalizeOrientation(orientationRaw);

      const dateRaw = getVal(row, mapping.dateCol);
      const year = dateRaw ? dateRaw : new Date().getFullYear();

      const description =
        getVal(row, mapping.descCol) ||
        `Original hand-painted piece by Fife Art celebrating the authentic beauty of Fife, Kirkcaldy, and Scottish wildlife.`;

      const sku = getVal(row, mapping.skuCol) || `FAF-ART-${String(idx + 1).padStart(3, '0')}`;
      const orderNumber = sku;

      // Preserve unmapped columns into extraFields so no CSV data is lost
      const extraFields: Record<string, string> = {};
      headers.forEach((h, colIndex) => {
        const isCoreMapped = Object.values(mapping).some((mCol) => mCol === h);
        if (!isCoreMapped && row[colIndex] && row[colIndex].trim() !== '') {
          extraFields[h] = row[colIndex].trim();
        }
      });

      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `artwork-${idx + 1}`;

      return {
        id: `faf-art-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        sku,
        orderNumber,
        title,
        slug,
        medium,
        dimensions,
        orientation,
        price,
        tags,
        subjects,
        status,
        imageUrl,
        description,
        year,
        date: dateRaw || undefined,
        featured: idx % 10 === 0,
        createdAt: new Date().toISOString(),
        extraFields: Object.keys(extraFields).length > 0 ? extraFields : undefined,
      };
    });

    return {
      success: true,
      artworks,
      formatDetected,
      totalParsed: artworks.length,
      headers,
      rawRows: rows,
      detectedMapping: mapping,
    };
  } catch (err) {
    return {
      success: false,
      artworks: [],
      formatDetected: 'Unknown',
      errorMessage: `Failed to parse data: ${(err as Error).message}`,
      totalParsed: 0,
    };
  }
}

/**
 * Helper to map arbitrary JSON records to Artworks
 */
function mapRecordsToArtworks(items: Record<string, unknown>[]): Artwork[] {
  return items.map((raw, idx) => {
    const title =
      (raw.title ||
        raw.Title ||
        raw.name ||
        raw.Name ||
        raw['Painting Title'] ||
        raw['Artwork Title'] ||
        raw.Painting ||
        raw.Artwork ||
        `Artwork #${idx + 1}`) as string;

    const rawImg =
      raw.imageUrl ||
      raw.image_url ||
      raw.image ||
      raw.Image ||
      raw.Attachments ||
      raw.attachments ||
      raw.Photo ||
      raw.photo ||
      raw.Pictures ||
      raw.Picture ||
      raw.File ||
      raw.Files;

    const medium = (raw.medium || raw.Medium || raw.material || raw.Material || 'Original painting') as string;
    let imageUrl = extractImageUrl(rawImg);
    if (!imageUrl) {
      imageUrl = generateCanvasPlaceholder(String(title), medium);
    }

    const dimensions = (raw.dimensions || raw.Dimensions || raw.size || raw.Size || 'Studio size') as string;
    const price = parsePrice(raw.price || raw.Price || raw.cost || raw.Cost || 250);
    const originalPrice = raw.originalPrice ? parsePrice(raw.originalPrice) : undefined;
    const status = normalizeStatus(String(raw.status || raw.Status || 'Available'));
    const tags = parseTags(raw.tags || raw.Tags || raw.category || raw.Category);
    if (tags.length === 0) tags.push('Original');

    const description =
      (raw.description ||
        raw.Description ||
        raw.details ||
        raw.notes ||
        `Original artwork by Fife Art. Handcrafted in Kirkcaldy, Fife.`) as string;

    const sku =
      (raw.sku || raw.SKU || raw.id || raw.code || `FAF-IMP-${String(idx + 1).padStart(3, '0')}`) as string;

    const year = raw.year
      ? parseInt(String(raw.year).replace(/[^0-9]/g, ''), 10) || new Date().getFullYear()
      : new Date().getFullYear();

    const featured = Boolean(raw.featured || raw.Featured);

    const slug =
      String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `piece-${idx + 1}`;

    const orientation = normalizeOrientation(raw.orientation || raw.Orientation || raw.format || raw.aspect);
    const subjects = parseTags(raw.subjects || raw.Subjects || raw.subject || raw.Subject || raw.topic || raw.theme);
    const date = raw.date || raw.Date || raw.createdDate || raw['Created Date'] ? String(raw.date || raw.Date || raw.createdDate || raw['Created Date']) : undefined;
    const orderNumber = (raw.orderNumber || raw.order_number || raw['Order Number'] || raw.Order || raw.sku || raw.SKU || sku) as string;

    return {
      id: `faf-art-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      sku,
      orderNumber,
      title: String(title),
      slug,
      medium,
      dimensions,
      orientation,
      price,
      originalPrice,
      tags,
      subjects: subjects.length > 0 ? subjects : [...tags],
      status,
      imageUrl,
      description,
      year,
      date,
      featured,
      createdAt: new Date().toISOString(),
    };
  });
}
