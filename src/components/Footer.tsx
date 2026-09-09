import React from 'react';
import { Lock, Heart, ShieldCheck, Mail, MapPin, AlertCircle, FileText, Shield } from 'lucide-react';
import { LegalTab } from './LegalModal';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenEnquiry: () => void;
  onOpenAbout: () => void;
  onOpenLegal: (tab: LegalTab) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenEnquiry,
  onOpenAbout,
  onOpenLegal,
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
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  About the Artist
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenEnquiry}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Enquire / Custom Commissions
                </button>
              </li>
              <li>
                <a href="#fifeart-faqs" className="hover:text-white transition-colors">
                  Collector FAQs & Studio Info
                </a>
              </li>
            </ul>
          </div>

          {/* Collector Assurance & Legal */}
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
              <li className="pt-1.5 border-t border-stone-800/80 flex flex-col space-y-1.5">
                <button
                  onClick={() => onOpenLegal('disclaimer')}
                  className="text-amber-400 hover:text-amber-300 text-left transition-colors inline-flex items-center space-x-1 cursor-pointer"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Art & Colour Disclaimer</span>
                </button>
                <div className="flex items-center space-x-2.5 text-[11px] text-stone-400">
                  <button
                    onClick={() => onOpenLegal('privacy')}
                    className="hover:text-stone-200 transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => onOpenLegal('terms')}
                    className="hover:text-stone-200 transition-colors cursor-pointer"
                  >
                    Terms & Conditions
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with discreet Admin portal link */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p>© {new Date().getFullYear()} Fife Art. All rights reserved. Handcrafted original Scottish art.</p>
            <span className="hidden sm:inline text-stone-700">•</span>
            <button
              onClick={() => onOpenLegal('disclaimer')}
              className="text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
            >
              Art & Colour Disclaimer
            </button>
            <span className="text-stone-700">•</span>
            <button
              onClick={() => onOpenLegal('privacy')}
              className="text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-stone-700">•</span>
            <button
              onClick={() => onOpenLegal('terms')}
              className="text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenAdmin}
              id="footer-admin-link"
              className="inline-flex items-center space-x-1 text-stone-500 hover:text-stone-300 transition-colors text-[11px] cursor-pointer"
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

