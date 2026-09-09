export type ArtworkStatus = 'Available' | 'Sold' | 'On Order' | 'Two Sizes' | 'Discounted';

export type CurrencyCode = 'GBP' | 'USD' | 'EUR';

export type FrameType = 'none' | 'oak' | 'black' | 'white' | 'gold';

export interface Artwork {
  id: string;
  sku: string;
  title: string;
  slug: string;
  medium: string;
  dimensions: string;
  price: number;
  originalPrice?: number;
  tags: string[];
  status: ArtworkStatus;
  imageUrl: string;
  thumbnailUrl?: string;
  description: string;
  year?: number | string;
  featured?: boolean;
  createdAt: string;
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
  web3FormsKey: string;
  location: string;
  currency: CurrencyCode;
}

