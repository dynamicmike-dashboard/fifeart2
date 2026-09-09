import React from 'react';
import { X, Printer, Award, ShieldCheck, Download } from 'lucide-react';
import { Artwork } from '../types';

interface CertificateModalProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
  artistName?: string;
  location?: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  artwork,
  isOpen,
  onClose,
  artistName = 'Fife Art Studio',
  location = 'Kingdom of Fife, Scotland',
}) => {
  if (!isOpen || !artwork) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto print:m-0 print:border-0 print:shadow-none print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50 print:hidden">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-700" />
            <span className="font-serif text-sm font-medium text-stone-900">
              Certificate of Authenticity Generator
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              id="print-certificate-btn"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Certificate Area */}
        <div className="p-8 sm:p-12 bg-[#FDFCF7] border-8 border-double border-stone-300 m-4 rounded-lg relative text-center space-y-6">
          {/* Subtle Watermark seal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <ShieldCheck className="w-72 h-72 text-stone-900" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-amber-900 font-semibold block">
              Original Fine Art
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-stone-900">
              Certificate of Authenticity
            </h2>
            <p className="text-[11px] text-stone-500 italic">
              This document certifies that the artwork detailed below is a unique, genuine original creation.
            </p>
          </div>

          <div className="w-16 h-0.5 bg-amber-800/40 mx-auto" />

          {/* Artwork details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto bg-white/70 p-4 rounded-xl border border-stone-200/60 text-xs">
            <div>
              <span className="text-[10px] uppercase text-stone-400 font-semibold block">Title</span>
              <strong className="font-serif text-sm text-stone-900">{artwork.title}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 font-semibold block">Catalog SKU</span>
              <span className="font-mono text-stone-800 font-medium">{artwork.sku}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 font-semibold block">Medium</span>
              <span className="text-stone-800">{artwork.medium}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 font-semibold block">Dimensions</span>
              <span className="text-stone-800">{artwork.dimensions}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 font-semibold block">Year of Creation</span>
              <span className="text-stone-800">{artwork.year || new Date().getFullYear()}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 font-semibold block">Studio Origin</span>
              <span className="text-stone-800">{location}</span>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="pt-6 flex items-end justify-between max-w-lg mx-auto border-t border-stone-200">
            <div className="text-left">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Artist Signature</span>
              <div className="font-serif text-xl italic text-stone-800 mt-1 font-medium">
                Fife Art
              </div>
              <span className="text-[10px] text-stone-500 block">{location}</span>
            </div>

            <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-800/40 flex flex-col items-center justify-center text-[9px] font-serif uppercase tracking-widest text-amber-900 bg-amber-50/50">
              <span>Studio</span>
              <span className="font-semibold">Seal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
