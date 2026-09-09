import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Mail, Check, ShieldCheck, Truck, Frame, Share2 } from 'lucide-react';
import { Artwork, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';

interface ArtworkModalProps {
  artwork: Artwork | null;
  currency: CurrencyCode;
  onClose: () => void;
  onEnquireToBuy: (artwork: Artwork) => void;
  onOpenViewOnWall: (artwork: Artwork) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const ArtworkModal: React.FC<ArtworkModalProps> = ({
  artwork,
  currency,
  onClose,
  onEnquireToBuy,
  onOpenViewOnWall,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!artwork) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close & Nav controls */}
        <div className="absolute top-3 right-3 z-20 flex items-center space-x-2">
          <button
            onClick={handleShare}
            id="modal-share-btn"
            className="p-2 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white transition-colors"
            title="Copy share link"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            id="modal-close-btn"
            className="p-2 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white transition-colors"
            title="Close dialog (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[90vh] overflow-y-auto">
          {/* Left Column: Artwork Image & Zoom Stage */}
          <div className="lg:col-span-7 bg-stone-100 relative flex items-center justify-center min-h-[350px] lg:min-h-[550px] p-4 sm:p-8 select-none">
            {/* Image Viewer */}
            <div
              className={`relative overflow-hidden cursor-zoom-in transition-all duration-300 max-h-[70vh] flex items-center justify-center ${
                isZoomed ? 'scale-125 cursor-zoom-out z-10' : ''
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
              title={isZoomed ? 'Click to zoom out' : 'Click to inspect brushwork and texture'}
            >
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-sm shadow-md"
              />
            </div>

            {/* Bottom Actions Overlay: Zoom, Wall View & SKU */}
            <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-900 text-stone-100 text-xs font-medium backdrop-blur-xs transition-colors"
              >
                {isZoomed ? (
                  <>
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>Reset View</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom Texture</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onOpenViewOnWall(artwork)}
                id="modal-view-on-wall-btn"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-900/90 hover:bg-amber-950 text-amber-100 text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer shadow-xs"
              >
                <Frame className="w-3.5 h-3.5 text-amber-300" />
                <span>View on Wall & Frames</span>
              </button>

              <span className="text-[11px] text-stone-500 font-mono hidden sm:inline">
                SKU: {artwork.sku}
              </span>
            </div>

            {/* Next / Previous quick nav buttons on image */}
            {hasPrev && onPrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md transition-transform hover:scale-105"
                title="Previous artwork"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {hasNext && onNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md transition-transform hover:scale-105"
                title="Next artwork"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Right Column: Information, Pricing, Specs & Buy CTA */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div className="space-y-6">
              {/* Tags & Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {artwork.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    artwork.status === 'Available'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : artwork.status === 'Sold'
                      ? 'bg-stone-200 text-stone-700 border-stone-300'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {artwork.status}
                </span>
              </div>

              {/* Title & Medium */}
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 tracking-tight leading-tight">
                  {artwork.title}
                </h2>
                <p className="text-sm font-medium text-amber-900 mt-1">
                  {artwork.medium}
                </p>
              </div>

              {/* Price & Dimensions Display */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
                    Original Price
                  </span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="font-serif text-3xl font-semibold text-stone-900">
                      {formatPrice(artwork.price, currency)}
                    </span>
                    {artwork.originalPrice && artwork.originalPrice > artwork.price && (
                      <span className="text-sm text-stone-400 line-through">
                        {formatPrice(artwork.originalPrice, currency)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
                    Dimensions
                  </span>
                  <span className="text-sm font-medium text-stone-800">
                    {artwork.dimensions}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-2">
                  Artist's Note & Composition
                </h4>
                <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
                  {artwork.description}
                </p>
              </div>

              {/* Specifications / Guarantee */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-stone-600 border-t border-stone-100">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Signed by artist</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Certificate of Authenticity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Insured UK & Global post</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0 ml-1 mr-1" />
                  <span>Fife studio collection</span>
                </div>
              </div>
            </div>

            {/* Action Bar (Enquire / Order) */}
            <div className="mt-8 pt-4 border-t border-stone-200">
              <button
                onClick={() => onEnquireToBuy(artwork)}
                id="modal-enquire-to-buy-btn"
                className={`w-full py-3.5 px-6 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer ${
                  artwork.status === 'Sold'
                    ? 'bg-stone-800 text-stone-200 hover:bg-stone-900'
                    : 'bg-stone-900 text-white hover:bg-amber-950 hover:shadow-lg'
                }`}
              >
                <Mail className="w-4 h-4 text-amber-300" />
                <span>
                  {artwork.status === 'Sold'
                    ? 'Enquire About Similar Commission'
                    : `Click to Order / Enquire (${formatPrice(artwork.price, currency)})`}
                </span>
              </button>
              <p className="text-center text-[11px] text-stone-500 mt-2">
                Direct inquiry securely sent to the artist • No payment taken immediately
              </p>
              {copied && (
                <p className="text-center text-xs text-emerald-600 font-medium mt-1">
                  Link copied to clipboard!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
