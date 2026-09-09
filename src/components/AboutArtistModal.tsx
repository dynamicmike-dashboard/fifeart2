import React from 'react';
import { X, MapPin, Heart, Sparkles, Mail } from 'lucide-react';

interface AboutArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEnquiry: () => void;
}

export const AboutArtistModal: React.FC<AboutArtistModalProps> = ({
  isOpen,
  onClose,
  onOpenEnquiry,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/70">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-900">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fife Art Studio • Scotland</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <img
              src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80"
              alt="Artist in Fife Studio"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-md border-2 border-stone-200 shrink-0"
            />
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 leading-tight">
                About the Artist
              </h3>
              <div className="flex items-center space-x-1.5 text-xs text-stone-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                <span>Based in Kirkcaldy, Fife, Scotland</span>
              </div>
              <p className="text-stone-700 text-sm leading-relaxed mt-3">
                Working from an independent home studio in Kirkcaldy overlooking the tidal waters of the Firth of Forth, my art captures the extraordinary natural heritage of Scotland—from our beloved puffin colonies on the Isle of May to windswept Fife coastal paths, historic harbour shores, and wild highland fauna.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-4">
            <h4 className="font-serif text-base font-semibold text-stone-900">
              Mediums & Approach
            </h4>
            <p>
              Every artwork is an authentic original painted using fine artist-grade acrylics and oils on heavy stretched linen or primed boards. Layered textures and confident brushwork allow light to dance across the canvas, celebrating the raw, atmospheric weather shifts unique to the Scottish coast.
            </p>
            <p>
              Original works are finished with museum-quality UV varnish to safeguard pigments against fading. Each canvas is signed by hand and shipped with a Certificate of Authenticity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-stone-900">
                Interested in a custom painting or commission?
              </div>
              <div className="text-[11px] text-stone-600 mt-0.5">
                Pet portraits, favourite Scottish landscapes, or specific canvas sizes welcome.
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenEnquiry();
              }}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shrink-0 transition-colors shadow-2xs"
            >
              Send Enquiry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
