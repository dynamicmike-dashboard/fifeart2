import { Artwork, FaqItem, SeoSettings } from '../types';
import { DEFAULT_FAQS, DEFAULT_STUDIO_NOTIFICATION_EMAILS } from '../data/faqData';

const STORAGE_KEY_SEO = 'fifeart_seo_settings_v1';
const STORAGE_KEY_CUSTOM_FAQS = 'fifeart_faqs_v1';

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  siteTitle: 'Fife Art | Original Scottish Paintings & Wildlife Art',
  metaDescription:
    'Original hand-painted Scottish wildlife, coastal seascapes, and heritage landscapes by Nancy Berry in Kirkcaldy, Kingdom of Fife, Scotland. Enquire to buy direct from the artist.',
  keywords:
    'Scottish art, Fife Art, Nancy Berry, Kirkcaldy artist, Scottish paintings for sale, Scottish wildlife art, puffin paintings, Isle of May art, Bass Rock art, Scottish landscapes, original oil paintings Scotland, coastal art Scotland, buy original Scottish art',
  canonicalUrl: typeof window !== 'undefined' ? window.location.origin : 'https://fifeart.co.uk',
  ogImageUrl:
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
  siteName: 'Fife Art',
  artistName: 'Nancy Berry',
  businessName: 'Fife Art Studio',
  contactEmails: DEFAULT_STUDIO_NOTIFICATION_EMAILS,
  telephone: '+44 7123 456789',
  streetAddress: 'Studio by the Forth, Kirkcaldy',
  addressLocality: 'Kirkcaldy',
  addressRegion: 'Fife, Scotland',
  postalCode: 'KY1 1EH',
  addressCountry: 'GB',
  geoLatitude: '56.1107',
  geoLongitude: '-3.1674',
  areaServed: [
    'Fife',
    'Kirkcaldy',
    'St Andrews',
    'East Neuk of Fife',
    'Edinburgh',
    'Dundee',
    'Scotland',
    'United Kingdom',
    'Worldwide',
  ],
  priceRange: '£45 - £650',
  openingHours: 'Mo-Sa 09:00-18:00 (Online Gallery 24/7, Studio Visits by Appointment)',
  enableLdJson: true,
  enableArtGallerySchema: true,
  enableArtistSchema: true,
  enableFaqSchema: true,
  enableProductCatalogSchema: true,
};

export const SeoService = {
  getSeoSettings(): SeoSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SEO);
      if (stored) {
        return { ...DEFAULT_SEO_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load SEO settings from storage', e);
    }
    return DEFAULT_SEO_SETTINGS;
  },

  saveSeoSettings(settings: SeoSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SEO, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save SEO settings', e);
    }
  },

  getFaqs(): FaqItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_FAQS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load FAQs from storage', e);
    }
    return DEFAULT_FAQS;
  },

  saveFaqs(faqs: FaqItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_FAQS, JSON.stringify(faqs));
    } catch (e) {
      console.error('Failed to save FAQs', e);
    }
  },

  /**
   * Generates Schema.org JSON-LD structured data graph for search engine crawlers and AI answer engines.
   */
  generateLdJsonSchema(
    settings: SeoSettings,
    artworks: Artwork[],
    faqs: FaqItem[] = DEFAULT_FAQS
  ): object {
    const siteUrl = settings.canonicalUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fifeart.co.uk');
    const emailsList = settings.contactEmails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const graph: any[] = [];

    // 1. ArtGallery / LocalBusiness Schema (Kirkcaldy, Fife, Scotland)
    if (settings.enableArtGallerySchema) {
      graph.push({
        '@type': 'ArtGallery',
        '@id': `${siteUrl}/#artgallery`,
        name: settings.businessName,
        alternateName: ['Fife Art', 'Fife Art Studio Scotland'],
        url: siteUrl,
        logo: settings.ogImageUrl,
        image: settings.ogImageUrl,
        description: settings.metaDescription,
        telephone: settings.telephone,
        email: emailsList,
        priceRange: settings.priceRange,
        currenciesAccepted: 'GBP',
        paymentAccepted: 'Direct Bank Transfer, Invoice, Card',
        openingHours: settings.openingHours,
        address: {
          '@type': 'PostalAddress',
          streetAddress: settings.streetAddress,
          addressLocality: settings.addressLocality,
          addressRegion: settings.addressRegion,
          postalCode: settings.postalCode,
          addressCountry: settings.addressCountry,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: parseFloat(settings.geoLatitude) || 56.1107,
          longitude: parseFloat(settings.geoLongitude) || -3.1674,
        },
        areaServed: settings.areaServed.map((area) => ({
          '@type': 'Place',
          name: area,
        })),
        founder: {
          '@id': `${siteUrl}/#artist`,
        },
      });
    }

    // 2. VisualArtist / Person Schema
    if (settings.enableArtistSchema) {
      graph.push({
        '@type': ['Person', 'VisualArtist'],
        '@id': `${siteUrl}/#artist`,
        name: settings.artistName,
        jobTitle: 'Scottish Wildlife & Landscape Artist',
        description: `Scottish landscape and wildlife painter based in Kirkcaldy, Fife. Specialising in original coastal seascapes, Isle of May puffins, and authentic Scottish scenes.`,
        homeLocation: {
          '@type': 'Place',
          name: 'Kirkcaldy, Fife, Scotland',
        },
        nationality: 'Scottish',
        worksFor: {
          '@id': `${siteUrl}/#artgallery`,
        },
        email: emailsList[0] || 'nancyberrykdy@gmail.com',
      });
    }

    // 3. FAQPage Schema for AEO (Answer Engine Optimization) & GEO
    if (settings.enableFaqSchema && faqs.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        '@id': `${siteUrl}/#faq`,
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      });
    }

    // 4. Product Catalog / ItemList Schema of Curated Artworks
    if (settings.enableProductCatalogSchema && artworks.length > 0) {
      // Index up to 25 primary artworks for Google Rich Snippets / Google Image Search
      const featuredList = artworks.slice(0, 25);
      graph.push({
        '@type': 'ItemList',
        '@id': `${siteUrl}/#catalog`,
        name: 'Original Scottish Artworks by Fife Art',
        description: 'Curated collection of original Scottish paintings and wildlife studies.',
        numberOfItems: artworks.length,
        itemListElement: featuredList.map((art, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': ['VisualArtwork', 'Product'],
            '@id': `${siteUrl}/artwork/${art.slug || art.sku}`,
            name: art.title,
            image: art.imageUrl,
            description: art.description || `Original Scottish painting: ${art.title} by Nancy Berry.`,
            artMedium: art.medium,
            artform: 'Painting',
            artworkSurface: 'Canvas or Linen',
            width: art.dimensions,
            creator: {
              '@id': `${siteUrl}/#artist`,
            },
            offers: {
              '@type': 'Offer',
              price: art.price,
              priceCurrency: 'GBP',
              priceValidUntil: '2028-12-31',
              availability:
                art.status === 'Sold'
                  ? 'https://schema.org/SoldOut'
                  : 'https://schema.org/InStock',
              seller: {
                '@id': `${siteUrl}/#artgallery`,
              },
            },
          },
        })),
      });
    }

    return {
      '@context': 'https://schema.org',
      '@graph': graph,
    };
  },

  /**
   * Applies SEO settings to the real browser DOM: updates title, meta tags, and injects Schema.org JSON-LD script tag.
   */
  applySeoToDom(settings: SeoSettings, artworks: Artwork[], faqs: FaqItem[] = DEFAULT_FAQS): void {
    if (typeof document === 'undefined') return;

    // 1. Update Document Title
    if (settings.siteTitle) {
      document.title = settings.siteTitle;
    }

    // 2. Helper to set or create meta tags
    const setMetaTag = (attribute: string, key: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard Meta
    setMetaTag('name', 'description', settings.metaDescription);
    setMetaTag('name', 'keywords', settings.keywords);
    setMetaTag('name', 'author', settings.artistName);
    setMetaTag('name', 'geo.region', 'GB-FIF');
    setMetaTag('name', 'geo.placename', `${settings.addressLocality}, Fife`);
    setMetaTag('name', 'geo.position', `${settings.geoLatitude};${settings.geoLongitude}`);
    setMetaTag('name', 'ICBM', `${settings.geoLatitude}, ${settings.geoLongitude}`);

    // OpenGraph
    setMetaTag('property', 'og:title', settings.siteTitle);
    setMetaTag('property', 'og:description', settings.metaDescription);
    setMetaTag('property', 'og:site_name', settings.siteName);
    setMetaTag('property', 'og:type', 'website');
    if (settings.canonicalUrl) {
      setMetaTag('property', 'og:url', settings.canonicalUrl);
    }
    if (settings.ogImageUrl) {
      setMetaTag('property', 'og:image', settings.ogImageUrl);
    }

    // Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', settings.siteTitle);
    setMetaTag('name', 'twitter:description', settings.metaDescription);
    if (settings.ogImageUrl) {
      setMetaTag('name', 'twitter:image', settings.ogImageUrl);
    }

    // Canonical link tag
    if (settings.canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', settings.canonicalUrl);
    }

    // 3. Inject / Update JSON-LD Script tag in head
    const SCRIPT_ID = 'fifeart-schema-jsonld';
    let scriptTag = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (settings.enableLdJson) {
      const schemaObject = this.generateLdJsonSchema(settings, artworks, faqs);
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = SCRIPT_ID;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schemaObject, null, 2);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  },
};
