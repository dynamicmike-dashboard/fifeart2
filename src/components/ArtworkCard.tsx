import React, { useState } from 'react';
import { Eye, ArrowUpRight, Heart, Frame } from 'lucide-react';
import { Artwork, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';

interface ArtworkCardProps {
  artwork: Artwork;
  currency: CurrencyCode;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelect: (artwork: Artwork) => void;
  onQuickEnquire: (artwork: Artwork, e: React.MouseEvent) => void;
  onOpenViewOnWall: (artwork: Artwork, e: React.MouseEvent) => void;
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({
  artwork,
  currency,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onQuickEnquire,
  onOpenViewOnWall,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Status badge styling
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      case 'Sold':
        return 'bg-stone-200 text-stone-700 border-stone-300';
      case 'On Order':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'Two Sizes':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200/80';
      case 'Discounted':
        return 'bg-rose-50 text-rose-800 border-rose-200/80';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <article
      id={`artwork-card-${artwork.id}`}
      onClick={() => onSelect(artwork)}
      className="group relative flex flex-col bg-white rounded-xl border border-stone-200/70 overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-300 transition-all duration-300 cursor-pointer"
    >
      {/* Thumbnail Aspect Box */}
      <div className="relative aspect-4/3 sm:aspect-square overflow-hidden bg-stone-100">
        {/* Placeholder / Blur skeleton while loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-stone-200 animate-pulse flex items-center justify-center">
            <span className="font-serif text-stone-400 text-sm italic">Loading art...</span>
          </div>
        )}

        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${artwork.status === 'Sold' ? 'grayscale-[35%]' : ''}`}
        />

        {/* Fallback image if broken */}
        {imageError && (
          <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center p-4 text-center">
            <span className="font-serif text-stone-500 font-medium">{artwork.title}</span>
            <span className="text-[11px] text-stone-400 mt-1">{artwork.medium}</span>
          </div>
        )}

        {/* Status Badge top right */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center space-x-1.5">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase border backdrop-blur-xs shadow-2xs ${getBadgeStyle(
              artwork.status
            )}`}
          >
            {artwork.status}
          </span>
        </div>

        {/* Favorite & SKU top left */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center space-x-1.5">
          <span className="inline-block px-2 py-0.5 rounded bg-black/50 text-white/90 text-[9px] font-mono tracking-wider backdrop-blur-xs">
            {artwork.sku}
          </span>
          <button
            onClick={(e) => onToggleFavorite(artwork.id, e)}
            title={isFavorite ? 'Remove from saved collection' : 'Save to favourites'}
            className="p-1 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-rose-600 backdrop-blur-xs shadow-2xs transition-colors"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>
        </div>

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-stone-900/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
          <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/95 text-stone-900 text-xs font-medium shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </span>
          <button
            onClick={(e) => onOpenViewOnWall(artwork, e)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-stone-900/90 text-white text-xs font-medium shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-transform hover:bg-stone-900"
            title="Preview on living room wall"
          >
            <Frame className="w-3.5 h-3.5" />
            <span>Wall View</span>
          </button>
        </div>
      </div>

      {/* Card Metadata (Immediately Visible: Title, Format/Medium, Dimensions, Price) */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg font-medium text-stone-900 leading-snug group-hover:text-amber-900 transition-colors line-clamp-1">
              {artwork.title}
            </h3>
          </div>

          {/* Medium / Format immediately visible */}
          <p className="text-xs font-medium text-stone-600 mt-1 tracking-wide">
            {artwork.medium}
          </p>

          {/* Dimensions */}
          <p className="text-[11px] text-stone-400 mt-0.5 font-sans">
            {artwork.dimensions}
          </p>
        </div>

        {/* Price & Buy Action Bar */}
        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-baseline space-x-1.5">
            <span className="font-serif text-base font-semibold text-stone-900">
              {formatPrice(artwork.price, currency)}
            </span>
            {artwork.originalPrice && artwork.originalPrice > artwork.price && (
              <span className="text-xs text-stone-400 line-through">
                {formatPrice(artwork.originalPrice, currency)}
              </span>
            )}
          </div>

          <button
            onClick={(e) => onQuickEnquire(artwork, e)}
            id={`quick-enquire-${artwork.id}`}
            title="Enquire about this artwork"
            className="inline-flex items-center space-x-1 text-xs font-medium text-stone-700 hover:text-amber-900 hover:underline transition-colors"
          >
            <span>Enquire</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
