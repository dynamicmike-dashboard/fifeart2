import React from 'react';
import { Palette, Lock, Mail, Info, Sparkles, Heart, Globe } from 'lucide-react';
import { CurrencyCode } from '../types';

interface HeaderProps {
  onOpenAbout: () => void;
  onOpenGeneralEnquiry: () => void;
  onOpenAdmin: () => void;
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
  totalArtworksCount,
  currency,
  onCurrencyChange,
  favoritesCount,
  onToggleFavoritesOnly,
  isFavoritesOnly,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand & Artist Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-stone-900 text-[#FAFAFA] flex items-center justify-center shadow-sm">
              <Palette className="w-5 h-5 text-amber-300/90" />
            </div>
            <div>
              <a href="#" className="group inline-block">
                <span className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 group-hover:text-amber-900 transition-colors">
                  Fife Art
                </span>
                <span className="block text-[10px] tracking-[0.25em] uppercase text-stone-500 font-sans font-medium">
                  Original Scottish Works • Kirkcaldy, Fife
                </span>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            {/* Currency Switcher */}
            <div className="flex items-center space-x-1 bg-stone-100 px-2 py-1 rounded-full border border-stone-200 text-xs text-stone-700">
              <Globe className="w-3 h-3 text-stone-400" />
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                className="bg-transparent text-stone-800 font-medium text-xs focus:outline-hidden cursor-pointer"
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
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isFavoritesOnly
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavoritesOnly ? 'fill-rose-600 text-rose-600' : 'text-stone-400'}`} />
              <span className="hidden sm:inline">Saved</span>
              {favoritesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-semibold">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenAbout}
              id="nav-about-btn"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-full text-xs font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden md:inline">About the Artist</span>
            </button>

            <button
              onClick={onOpenGeneralEnquiry}
              id="nav-enquire-btn"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Mail className="w-3.5 h-3.5 text-amber-200" />
              <span>Contact & Enquiries</span>
            </button>

            {/* Subtle Artist / Admin Login button */}
            <button
              onClick={onOpenAdmin}
              id="nav-admin-login-btn"
              title="Artist Studio / Admin Portal (Password Protected)"
              className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-full text-xs font-medium text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Studio Admin</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Subtle Notice Ribbon */}
      <div className="bg-stone-100/80 border-t border-stone-200/50 py-1 px-4 text-center">
        <p className="text-[11px] text-stone-600 flex items-center justify-center space-x-2">
          <Sparkles className="w-3 h-3 text-amber-700 inline" />
          <span>
            Direct studio collection in Fife or insured worldwide delivery • Hand-signed originals
          </span>
          <span className="hidden sm:inline text-stone-300">•</span>
          <span className="hidden sm:inline text-stone-500 font-medium">
            {totalArtworksCount} pieces catalogued
          </span>
        </p>
      </div>
    </header>
  );
};
