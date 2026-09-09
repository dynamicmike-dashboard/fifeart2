import { Artwork, ArtworkStatus, Enquiry } from '../types';
import { INITIAL_ARTWORKS } from '../data/sampleArtworks';

const STORAGE_KEY_ARTWORKS = 'fifeart_catalog_v1';
const STORAGE_KEY_ENQUIRIES = 'fifeart_enquiries_v1';
const STORAGE_KEY_ADMIN_PASS = 'fifeart_admin_password';

export const DEFAULT_ADMIN_PASSWORD =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() || 'fifeart-studio';

export const IS_CUSTOM_ADMIN_PASSWORD_SET = Boolean(
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim()
);

export const StorageService = {
  getArtworks(): Artwork[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ARTWORKS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((a: Artwork) => a.id));
          const missingDefaults = INITIAL_ARTWORKS.filter((a) => !existingIds.has(a.id));
          if (missingDefaults.length > 0) {
            const merged = [...parsed, ...missingDefaults];
            localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored artworks, using defaults', e);
    }
    // Initialize with default catalog if nothing in storage
    localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(INITIAL_ARTWORKS));
    return INITIAL_ARTWORKS;
  },

  saveArtworks(artworks: Artwork[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(artworks));
    } catch (e) {
      console.error('Storage full or error saving artworks', e);
    }
  },

  addArtwork(artwork: Omit<Artwork, 'id' | 'createdAt'>): Artwork {
    const artworks = this.getArtworks();
    const newId = `faf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newArtwork: Artwork = {
      ...artwork,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    const updated = [newArtwork, ...artworks];
    this.saveArtworks(updated);
    return newArtwork;
  },

  updateArtwork(id: string, updates: Partial<Artwork>): Artwork | null {
    const artworks = this.getArtworks();
    const index = artworks.findIndex((a) => a.id === id);
    if (index === -1) return null;

    artworks[index] = { ...artworks[index], ...updates };
    this.saveArtworks(artworks);
    return artworks[index];
  },

  deleteArtwork(id: string): boolean {
    const artworks = this.getArtworks();
    const filtered = artworks.filter((a) => a.id !== id);
    if (filtered.length === artworks.length) return false;
    this.saveArtworks(filtered);
    return true;
  },

  updateStatus(id: string, status: ArtworkStatus): void {
    this.updateArtwork(id, { status });
  },

  resetCatalog(): Artwork[] {
    localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(INITIAL_ARTWORKS));
    return INITIAL_ARTWORKS;
  },

  // Generate 226 realistic items for Fife Art inventory demonstration
  populateFull226Inventory(): Artwork[] {
    const baseArtworks = [...INITIAL_ARTWORKS];
    const subjects = [
      { prefix: 'WLD', tag: 'Wildlife', medium: 'Acrylic on canvas', basePrice: 320, titles: ['Puffin Nesting at Anstruther', 'Barn Owl in Sunset', 'Gannet over Bass Rock', 'Red Squirrel in Pine Needle', 'Highland Cow in Evening Sun', 'Curlew on St Andrews Sands', 'Otter Playing in Fife Rockpools', 'Harbour Seal in Firth Mist', 'Eider Duck with Ducklings', 'Mountain Hare in Heather', 'Robin on Crail Garden Gate', 'Roe Deer Fawn in Forest Glade'] },
      { prefix: 'LND', tag: 'Landscapes', medium: 'Oil on linen', basePrice: 460, titles: ['Crail Cobblestones and Creels', 'St Andrews Old Course Sea Mist', 'Falkland Palace Garden Shadows', 'Lomond Hills Frosty Morning', 'Elie Ness Lighthouse Beacon', 'St Monans Slipway in Gale', 'Pittenweem Painted Houses', 'Aberdour Silver Sands Calm', 'Anstruther Smokery Chimneys', 'Tay Rail Bridge Silhouetted', 'Isle of May Cliffs in Storm', 'Culross Townhouse Twilight'] },
      { prefix: 'FLR', tag: 'Florals', medium: 'Oil on canvas board', basePrice: 240, titles: ['Thistle and Sea Pink Study', 'Heather Carpet at West Lomond', 'Wild Coastal Poppies in Breeze', 'Fife Hedgerow Rosehips', 'Bluebell Hollow in Spring', 'Gorse Blossom on Coastal Path', 'Scottish Peonies in Clay Pitcher', 'Dry Flower Seedheads in Frost', 'Rowan Berries and Lichen', 'Meadowsweet by the Burn'] },
      { prefix: 'WTR', tag: 'Watercolour', medium: 'Watercolour on Arches paper', basePrice: 75, titles: ['Kirkcaldy Shoreline Wash', 'Robin on Bramble Study', 'Puffin Vignette in Watercolour', 'Fife Harbor Low Tide Sketch', 'Bluebells at Ravenscraig', 'Gannet Diving in Forth Wash'] },
      { prefix: 'SKT', tag: 'Sketches', medium: 'Graphite & ink field sketch', basePrice: 60, titles: ['Highland Stag Field Sketch', 'Kirkcaldy Seafront Line Study', 'Fishermans Bothy Pencil Drawing', 'Seabird Flight Quick Study', 'Creel Boat Ink Study', 'Scottish Hare Graphite Sketch'] },
    ];
    
    const statuses: ArtworkStatus[] = ['Available', 'Available', 'Available', 'Sold', 'Two Sizes', 'Discounted', 'On Order'];
    const dimensionsList = [
      '40 x 30 cm (15.7 x 11.8 in)',
      '50 x 40 cm (19.7 x 15.7 in)',
      '60 x 50 cm (23.6 x 19.7 in)',
      '75 x 60 cm (29.5 x 23.6 in)',
      '30 x 30 cm (11.8 x 11.8 in)',
      '90 x 60 cm (35.4 x 23.6 in)',
    ];

    const generated: Artwork[] = [...baseArtworks];
    let counter = baseArtworks.length + 1;

    while (generated.length < 226) {
      const subjectGroup = subjects[Math.floor(Math.random() * subjects.length)];
      const titleTemplate = subjectGroup.titles[Math.floor(Math.random() * subjectGroup.titles.length)];
      const title = `${titleTemplate} No. ${Math.floor(counter / subjects.length) + 1}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const dimensions = dimensionsList[Math.floor(Math.random() * dimensionsList.length)];
      const priceVariation = Math.floor(Math.random() * 8) * 25 - 50;
      const price = Math.max(45, subjectGroup.basePrice + priceVariation);
      const originalPrice = status === 'Discounted' ? price + 60 : undefined;
      const baseArtworkRef = baseArtworks[Math.floor(Math.random() * baseArtworks.length)];
      
      const sku = `FAF-${subjectGroup.prefix}-${String(counter).padStart(3, '0')}`;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      generated.push({
        id: `faf-gen-${counter}`,
        sku,
        title,
        slug,
        medium: subjectGroup.medium,
        dimensions,
        price,
        originalPrice,
        tags: [subjectGroup.tag, ...(subjectGroup.prefix === 'WLD' ? ['Birds', 'Coastal'] : ['Coastal', 'Scottish Heritage'])],
        status,
        imageUrl: baseArtworkRef.imageUrl,
        description: `Original hand-painted piece by Fife Art celebrating the authentic beauty of Fife and Scottish wildlife. Finished with UV-protective satin artist varnish.`,
        year: 2023 + (counter % 2),
        featured: counter % 15 === 0,
        createdAt: new Date(Date.now() - counter * 86400000).toISOString(),
      });
      counter++;
    }

    this.saveArtworks(generated);
    return generated;
  },

  // Convert uploaded image to WebP with canvas compression
  async convertImageToWebP(file: File, maxWidth = 1600, quality = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first; fallback to JPEG if browser doesn't support WebP export
          try {
            const webpDataUrl = canvas.toDataURL('image/webp', quality);
            if (webpDataUrl.startsWith('data:image/webp')) {
              resolve(webpDataUrl);
              return;
            }
          } catch (e) {
            console.warn('WebP export not supported, falling back to jpeg', e);
          }

          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Failed to load image file'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  // Inquiries
  getEnquiries(): Enquiry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ENQUIRIES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse inquiries', e);
    }
    return [];
  },

  saveEnquiry(enquiry: Omit<Enquiry, 'id' | 'date' | 'status'>): Enquiry {
    const enquiries = this.getEnquiries();
    const newEnquiry: Enquiry = {
      ...enquiry,
      id: `ENQ-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      status: 'new',
    };
    const updated = [newEnquiry, ...enquiries];
    try {
      localStorage.setItem(STORAGE_KEY_ENQUIRIES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save enquiry', e);
    }
    return newEnquiry;
  },

  // Password Verification
  verifyAdminPassword(password: string): boolean {
    if (IS_CUSTOM_ADMIN_PASSWORD_SET) {
      // If configured via Vercel env var, verify directly against the env var
      return password.trim() === DEFAULT_ADMIN_PASSWORD;
    }
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN_PASS) || DEFAULT_ADMIN_PASSWORD;
    return password.trim() === saved;
  },

  setAdminPassword(newPassword: string): void {
    localStorage.setItem(STORAGE_KEY_ADMIN_PASS, newPassword);
  },

  // Bulk Catalog JSON and CSV Import / Export
  importFromJSON(jsonString: string): { success: boolean; count: number; message: string } {
    try {
      const data = JSON.parse(jsonString);
      const items = Array.isArray(data) ? data : data.records || data.artworks || [data];
      if (!Array.isArray(items) || items.length === 0) {
        return { success: false, count: 0, message: 'No valid artworks array found in JSON.' };
      }

      const currentArtworks = this.getArtworks();
      let importedCount = 0;

      const newItems: Artwork[] = items.map((raw: Record<string, unknown>, idx: number) => {
        importedCount++;
        const title = (raw.title || raw.Title || raw.name || raw['Painting Title'] || `Untitled Piece ${idx + 1}`) as string;
        const medium = (raw.medium || raw.Medium || raw.format || raw.Format || 'Acrylic on canvas') as string;
        const dimensions = (raw.dimensions || raw.Dimensions || raw.size || '50 x 40 cm') as string;
        const price = Number(raw.price || raw.Price || raw.cost || 300);
        const tags = Array.isArray(raw.tags)
          ? raw.tags
          : typeof raw.tags === 'string'
          ? (raw.tags as string).split(',').map((t) => t.trim()).filter(Boolean)
          : ['Landscapes'];
        
        let status: ArtworkStatus = 'Available';
        const rawStatus = String(raw.status || raw.Status || '').toLowerCase();
        if (rawStatus.includes('sold')) status = 'Sold';
        else if (rawStatus.includes('order')) status = 'On Order';
        else if (rawStatus.includes('two')) status = 'Two Sizes';
        else if (rawStatus.includes('discount')) status = 'Discounted';

        const sku = (raw.sku || raw.SKU || `FAF-IMP-${Date.now().toString(36).slice(-3)}-${idx + 1}`) as string;
        const imageUrl = (raw.image_url || raw.imageUrl || raw.image || raw.Image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80') as string;
        const description = (raw.description || raw.Description || `Original artwork by Fife Art.`) as string;

        return {
          id: `faf-imp-${Date.now()}-${idx}`,
          sku,
          title,
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          medium,
          dimensions,
          price: isNaN(price) ? 250 : price,
          originalPrice: raw.originalPrice ? Number(raw.originalPrice) : undefined,
          tags,
          status,
          imageUrl,
          description,
          year: raw.year ? Number(raw.year) : new Date().getFullYear(),
          featured: Boolean(raw.featured),
          createdAt: new Date().toISOString(),
        };
      });

      this.saveArtworks([...newItems, ...currentArtworks]);
      return { success: true, count: importedCount, message: `Successfully imported ${importedCount} artworks.` };
    } catch (e) {
      return { success: false, count: 0, message: (e as Error).message };
    }
  },

  exportToJSON(): string {
    const artworks = this.getArtworks();
    return JSON.stringify(artworks, null, 2);
  },

  exportToCSV(): string {
    const artworks = this.getArtworks();
    const headers = ['sku', 'title', 'medium', 'dimensions', 'price', 'status', 'tags', 'description', 'imageUrl'];
    const rows = artworks.map((a) => [
      `"${a.sku}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.medium.replace(/"/g, '""')}"`,
      `"${a.dimensions.replace(/"/g, '""')}"`,
      a.price,
      `"${a.status}"`,
      `"${a.tags.join(', ')}"`,
      `"${a.description.replace(/"/g, '""')}"`,
      `"${a.imageUrl}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
