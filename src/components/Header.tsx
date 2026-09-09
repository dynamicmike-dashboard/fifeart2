import React from 'react';
import { Palette, Lock, Mail, Info, Sparkles, Heart, Globe } from 'lucide-react';
import { CurrencyCode } from '../types';

interface HeaderProps {
  onOpenAbout: () => void;
  onOpenGeneralEnquiry: () => void;
  onOpenAdmin: () => void;
  hasPlaceholderData?: boolean;
  totalArtworksCount: number;
  currency: CurrencyCode;
  onCurrencyChange: (curr: CurrencyCode) => void;
  favoritesCount: number;
  onToggleFavoritesOnly: () => void;
  isFavoritesOnly: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAbout,
  onOpenGeneralEnquiry,
  onOpenAdmin,
  hasPlaceholderData,
  totalArtworksCount,
  currency,
  onCurrencyChange,
  favoritesCount,
  onToggleFavoritesOnly,
  isFavoritesOnly,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-stone-200/80 w-full max-w-full overflow-x-clip transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Brand & Artist Name */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-stone-900 text-[#FAFAFA] flex items-center justify-center shrink-0 shadow-xs">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300/90" />
            </div>
            <div className="shrink-0">
              <a href="#" className="group block">
                <span className="font-serif text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-stone-900 group-hover:text-amber-900 transition-colors leading-none whitespace-nowrap block">
                  Fife Art
                </span>
                <span className="text-[10px] sm:text-[11px] tracking-wider sm:tracking-[0.2em] uppercase text-stone-500 font-sans font-medium whitespace-nowrap block mt-0.5">
                  Scottish Works • Fife
                </span>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Currency Switcher */}
            <div className="flex items-center bg-stone-100 px-1.5 sm:px-2 py-1 rounded-full border border-stone-200 text-xs text-stone-700">
              <Globe className="w-3 h-3 text-stone-400 shrink-0 mr-1 hidden xs:inline" />
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                className="bg-transparent text-stone-800 font-medium text-[11px] sm:text-xs focus:outline-hidden cursor-pointer"
                title="Change display currency"
              >
                <option value="GBP">£ GBP</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>

            {/* Saved Wishlist Toggle */}
            <button
              onClick={onToggleFavoritesOnly}
              id="nav-favorites-btn"
              title="View your saved favourite paintings"
              className={`inline-flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isFavoritesOnly
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 shrink-0 ${isFavoritesOnly ? 'fill-rose-600 text-rose-600' : 'text-stone-400'}`} />
              <span className="hidden md:inline">Saved</span>
              {favoritesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-semibold">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* About the Artist (Desktop/Tablet) */}
            <button
              onClick={onOpenAbout}
              id="nav-about-btn"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-2 rounded-full text-xs font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span>About the Artist</span>
            </button>

            {/* Contact Button */}
            <button
              onClick={onOpenGeneralEnquiry}
              id="nav-enquire-btn"
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span className="hidden sm:inline">Contact & Enquiries</span>
              <span className="sm:hidden">Contact</span>
            </button>

            {/* Studio / Admin Login button */}
            <button
              onClick={onOpenAdmin}
              id="nav-admin-login-btn"
              title="Artist Studio / Admin Portal (Password Protected)"
              className="p-1.5 sm:px-2 py-1.5 rounded-full text-xs font-medium text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </div>

      {/* Notice Ribbon */}
      <div className="bg-stone-100/90 border-t border-stone-200/50 py-1 px-3 text-center w-full overflow-hidden">
        <p className="text-[10px] sm:text-[11px] text-stone-600 flex items-center justify-center flex-wrap gap-x-2 gap-y-0.5 leading-snug">
          <span className="inline-flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-700 inline shrink-0" />
            <span>Direct studio collection in Fife or insured worldwide delivery</span>
          </span>
          <span className="hidden sm:inline text-stone-300">•</span>
          <span className="text-stone-500 font-medium">
            {totalArtworksCount} pieces catalogued
          </span>
        </p>
      </div>
    </header>
  );
};

