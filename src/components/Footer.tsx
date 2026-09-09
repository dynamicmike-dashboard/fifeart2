import React from 'react';
import { Lock, Heart, ShieldCheck, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenEnquiry: () => void;
  onOpenAbout: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenEnquiry,
  onOpenAbout,
}) => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Story */}
          <div className="md:col-span-2 space-y-3">
            <span className="font-serif text-2xl font-medium tracking-tight text-white block">
              Fife Art
            </span>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              Original hand-painted Scottish wildlife, coastal seascapes, and heritage landscapes by an independent artist based in the Kingdom of Fife, Scotland.
            </p>
            <div className="flex items-center space-x-2 text-xs text-stone-400 pt-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Kirkcaldy, Fife, Scotland</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-200">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Original Artworks Gallery
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenAbout}
                  className="hover:text-white transition-colors text-left"
                >
                  About the Artist
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenEnquiry}
                  className="hover:text-white transition-colors text-left"
                >
                  Enquire / Custom Commissions
                </button>
              </li>
            </ul>
          </div>

          {/* Collector Assurance */}
          <div className="space-y-2.5">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-200">
              Collector Assurance
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Certificate of Authenticity with every piece</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span>Insured worldwide art packaging</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span>No automated card charges until confirmed</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with discreet Admin portal link */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} Fife Art. All rights reserved. Handcrafted original Scottish art.</p>

          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenAdmin}
              id="footer-admin-link"
              className="inline-flex items-center space-x-1 text-stone-500 hover:text-stone-300 transition-colors text-[11px]"
            >
              <Lock className="w-3 h-3" />
              <span>Artist Login</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
