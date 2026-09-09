import { Artwork, ArtworkStatus, Enquiry, AboutContent, LegalContent } from '../types';
import { INITIAL_ARTWORKS } from '../data/sampleArtworks';
import { parseArtworksImport, ParseResult } from '../utils/artworkParser';
import { DEFAULT_ABOUT_CONTENT, DEFAULT_LEGAL_CONTENT } from '../data/contentDefaults';

const STORAGE_KEY_ARTWORKS = 'fifeart_catalog_v1';
const STORAGE_KEY_ENQUIRIES = 'fifeart_enquiries_v1';
const STORAGE_KEY_ADMIN_PASS = 'fifeart_admin_password';
const STORAGE_KEY_CLEARED_PLACEHOLDERS = 'fifeart_cleared_placeholders';
const STORAGE_KEY_ABOUT = 'fifeart_about_content_v1';
const STORAGE_KEY_LEGAL = 'fifeart_legal_content_v1';

export const DEFAULT_ADMIN_PASSWORD =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() || 'fifeart-studio';

export const IS_CUSTOM_ADMIN_PASSWORD_SET = Boolean(
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim()
);

export const StorageService = {
  isPlaceholderArtwork(artwork: Artwork): boolean {
    return (
      artwork.id.startsWith('faf-base-') ||
      artwork.id.startsWith('faf-sample-') ||
      artwork.id.startsWith('faf-gen-') ||
      artwork.imageUrl.includes('images.unsplash.com') ||
      artwork.imageUrl.includes('photo-1544816155-12df9643f363')
    );
  },

  getArtworks(): Artwork[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ARTWORKS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored artworks', e);
    }
    // Never auto-seed placeholder catalog: the server (Sanity) is the source
    // of truth. An empty array renders the empty-catalog state instead of
    // resurrecting demo Unsplash images on every fresh browser/device.
    return [];
  },

  saveArtworks(artworks: Artwork[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify(artworks));
      // If saving an empty or custom list, prevent default sample re-injection
      if (artworks.length === 0 || !artworks.some((a) => this.isPlaceholderArtwork(a))) {
        localStorage.setItem(STORAGE_KEY_CLEARED_PLACEHOLDERS, 'true');
      }
    } catch (e) {
      console.error('Storage full or error saving artworks', e);
    }
  },

  clearAllArtworks(): Artwork[] {
    try {
      localStorage.setItem(STORAGE_KEY_ARTWORKS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_CLEARED_PLACEHOLDERS, 'true');
    } catch (e) {
      console.error('Error clearing artworks catalog', e);
    }
    return [];
  },

  removePlaceholderArtworks(): Artwork[] {
    const current = this.getArtworks();
    const kept = current.filter((a) => !this.isPlaceholderArtwork(a));
    this.saveArtworks(kept);
    localStorage.setItem(STORAGE_KEY_CLEARED_PLACEHOLDERS, 'true');
    return kept;
  },

  deleteMultipleArtworks(ids: string[]): Artwork[] {
    const idSet = new Set(ids);
    const artworks = this.getArtworks();
    const filtered = artworks.filter((a) => !idSet.has(a.id));
    this.saveArtworks(filtered);
    return filtered;
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

  // Inquiries & Notification Emails
  getNotificationEmails(): string {
    const defaultEmails = 'nancyberrykdy@gmail.com, fifeart@dynamicmike.com';
    try {
      const stored = localStorage.getItem('fifeart_notification_emails');
      if (stored && stored.trim()) return stored;
    } catch (e) {
      console.warn('Failed to read notification emails', e);
    }
    return defaultEmails;
  },

  setNotificationEmails(emails: string): void {
    try {
      localStorage.setItem('fifeart_notification_emails', emails.trim());
    } catch (e) {
      console.error('Failed to save notification emails', e);
    }
  },

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
    const recipients = enquiry.recipientEmails || this.getNotificationEmails();
    const newEnquiry: Enquiry = {
      ...enquiry,
      id: `ENQ-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      status: 'new',
      recipientEmails: recipients,
    };
    const updated = [newEnquiry, ...enquiries];
    try {
      localStorage.setItem(STORAGE_KEY_ENQUIRIES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save enquiry', e);
    }
    return newEnquiry;
  },

  updateEnquiryStatus(id: string, status: 'new' | 'replied' | 'archived'): Enquiry[] {
    const enquiries = this.getEnquiries().map((enq) =>
      enq.id === id ? { ...enq, status } : enq
    );
    try {
      localStorage.setItem(STORAGE_KEY_ENQUIRIES, JSON.stringify(enquiries));
    } catch (e) {
      console.error('Failed to update enquiry status', e);
    }
    return enquiries;
  },

  deleteEnquiry(id: string): Enquiry[] {
    const enquiries = this.getEnquiries().filter((enq) => enq.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_ENQUIRIES, JSON.stringify(enquiries));
    } catch (e) {
      console.error('Failed to delete enquiry', e);
    }
    return enquiries;
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
  importParsedArtworks(
    newArtworks: Artwork[],
    replaceExisting = false
  ): { success: boolean; count: number; message: string; artworks: Artwork[] } {
    if (newArtworks.length === 0) {
      return {
        success: false,
        count: 0,
        message: 'No artworks to import.',
        artworks: this.getArtworks(),
      };
    }

    const currentArtworks = replaceExisting ? [] : this.getArtworks();
    const finalArtworks = replaceExisting ? newArtworks : [...newArtworks, ...currentArtworks];
    this.saveArtworks(finalArtworks);

    return {
      success: true,
      count: newArtworks.length,
      message: replaceExisting
        ? `Successfully replaced catalog with ${newArtworks.length} artworks.`
        : `Successfully added ${newArtworks.length} artworks to catalog.`,
      artworks: finalArtworks,
    };
  },

  importFromData(
    rawInput: string,
    replaceExisting = false
  ): { success: boolean; count: number; message: string; format?: string; artworks?: Artwork[] } {
    const parseResult: ParseResult = parseArtworksImport(rawInput);
    if (!parseResult.success || parseResult.artworks.length === 0) {
      return {
        success: false,
        count: 0,
        message: parseResult.errorMessage || 'Failed to parse artwork records.',
        format: parseResult.formatDetected,
      };
    }

    const result = this.importParsedArtworks(parseResult.artworks, replaceExisting);
    return {
      ...result,
      format: parseResult.formatDetected,
    };
  },

  // Backwards compatibility alias
  importFromJSON(
    dataString: string,
    replaceExisting = false
  ): { success: boolean; count: number; message: string } {
    return this.importFromData(dataString, replaceExisting);
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

  // About the Artist Content
  getAboutContent(): AboutContent {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ABOUT);
      if (stored) {
        return { ...DEFAULT_ABOUT_CONTENT, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load about content from storage', e);
    }
    return DEFAULT_ABOUT_CONTENT;
  },

  saveAboutContent(content: AboutContent): void {
    try {
      localStorage.setItem(STORAGE_KEY_ABOUT, JSON.stringify(content));
    } catch (e) {
      console.error('Failed to save about content', e);
    }
  },

  resetAboutContent(): AboutContent {
    try {
      localStorage.removeItem(STORAGE_KEY_ABOUT);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ABOUT_CONTENT;
  },

  // Legal, Terms & Conditions, and Disclaimer Content
  getLegalContent(): LegalContent {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LEGAL);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          privacyPolicy: { ...DEFAULT_LEGAL_CONTENT.privacyPolicy, ...(parsed.privacyPolicy || {}) },
          termsConditions: { ...DEFAULT_LEGAL_CONTENT.termsConditions, ...(parsed.termsConditions || {}) },
          disclaimer: { ...DEFAULT_LEGAL_CONTENT.disclaimer, ...(parsed.disclaimer || {}) },
        };
      }
    } catch (e) {
      console.warn('Failed to load legal content from storage', e);
    }
    return DEFAULT_LEGAL_CONTENT;
  },

  saveLegalContent(content: LegalContent): void {
    try {
      localStorage.setItem(STORAGE_KEY_LEGAL, JSON.stringify(content));
    } catch (e) {
      console.error('Failed to save legal content', e);
    }
  },

  resetLegalContent(): LegalContent {
    try {
      localStorage.removeItem(STORAGE_KEY_LEGAL);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LEGAL_CONTENT;
  },
};
