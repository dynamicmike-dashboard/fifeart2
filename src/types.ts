export type ArtworkStatus = 'Available' | 'Sold' | 'On Order' | 'Two Sizes' | 'Discounted';

export type CurrencyCode = 'GBP' | 'USD' | 'EUR';

export type FrameType = 'none' | 'oak' | 'black' | 'white' | 'gold';

export type ArtworkOrientation = 'Landscape' | 'Portrait' | 'Square';

export interface Artwork {
  id: string;
  sku: string;
  orderNumber?: string;
  title: string;
  slug: string;
  medium: string;
  dimensions: string;
  orientation?: ArtworkOrientation;
  price: number;
  originalPrice?: number;
  tags: string[];
  subjects?: string[];
  status: ArtworkStatus;
  imageUrl: string;
  thumbnailUrl?: string;
  description: string;
  year?: number | string;
  date?: string;
  featured?: boolean;
  createdAt: string;
  extraFields?: Record<string, string>;
}

export type EnquiryType = 'buy' | 'viewing' | 'commission' | 'general';
export type ShippingPreference = 'uk_courier' | 'international' | 'studio_collection';

export interface Enquiry {
  id: string;
  date: string;
  artworkId?: string;
  artworkTitle?: string;
  artworkSku?: string;
  artworkPrice?: number;
  artworkImage?: string;
  artworkMedium?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingPreference: ShippingPreference;
  message: string;
  status: 'new' | 'replied' | 'archived';
  recipientEmails?: string;
}

export type SortOption = 'recent' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc';

export interface GalleryFilter {
  searchQuery: string;
  selectedTag: string;
  selectedStatus: string;
  priceRange: 'all' | 'under100' | '100to250' | '250to450' | 'over450';
  sortBy: SortOption;
  currentPage: number;
  itemsPerPage: number;
}

export interface StudioSettings {
  artistName: string;
  studioEmail: string;
  notificationEmails: string;
  web3FormsKey: string;
  location: string;
  currency: CurrencyCode;
}

export interface SeoSettings {
  siteTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogImageUrl: string;
  siteName: string;
  // GEO & Local Business Knowledge Graph (Kirkcaldy / Fife, Scotland)
  artistName: string;
  businessName: string;
  contactEmails: string; // 'nancyberrykdy@gmail.com, fifeart@dynamicmike.com'
  telephone: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
  geoLatitude: string;
  geoLongitude: string;
  areaServed: string[];
  priceRange: string;
  openingHours: string;
  // Schema Graph Toggles
  enableLdJson: boolean;
  enableArtGallerySchema: boolean;
  enableArtistSchema: boolean;
  enableFaqSchema: boolean;
  enableProductCatalogSchema: boolean;
}

export type FaqCategory = 'purchasing' | 'location' | 'commissions' | 'shipping' | 'authenticity';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
}

export interface AboutContent {
  artistName: string;
  headline: string;
  location: string;
  photoUrl: string;
  bioParagraph1: string;
  bioParagraph2: string;
  mediumsApproach: string;
  protectionNote: string;
  commissionPromptTitle: string;
  commissionPromptSubtitle: string;
}

export interface LegalContent {
  privacyPolicy: {
    lastUpdated: string;
    introduction: string;
    dataCollected: string;
    howWeUseData: string;
    dataStorageSecurity: string;
    cookiesAnalytics: string;
    contactInfo: string;
  };
  termsConditions: {
    lastUpdated: string;
    orderingProcess: string;
    pricingPayment: string;
    shippingPackaging: string;
    cancellationsReturns: string;
    copyrightIntellectualProperty: string;
  };
  disclaimer: {
    lastUpdated: string;
    colourRepresentationNotice: string;
    handmadeCharacteristics: string;
    dimensionsFraming: string;
    lightingDisplayAdvice: string;
  };
}

