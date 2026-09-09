import React, { useState } from 'react';
import { X, Frame, Sliders, Palette, Check, Mail } from 'lucide-react';
import { Artwork, FrameType, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';

interface ViewOnWallModalProps {
  artwork: Artwork | null;
  currency: CurrencyCode;
  isOpen: boolean;
  onClose: () => void;
  onEnquireToBuy: (artwork: Artwork) => void;
}

export const ViewOnWallModal: React.FC<ViewOnWallModalProps> = ({
  artwork,
  currency,
  isOpen,
  onClose,
  onEnquireToBuy,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<'living' | 'study' | 'gallery'>('living');
  const [wallColor, setWallColor] = useState<string>('#F4F1EA'); // Default warm alabaster
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('oak');
  const [frameScale, setFrameScale] = useState<number>(100);

  if (!isOpen || !artwork) return null;

  const wallColors = [
    { name: 'Warm Alabaster', hex: '#F4F1EA' },
    { name: 'Scottish Heather', hex: '#EDE8F0' },
    { name: 'Kirkcaldy Coastal Sage', hex: '#E2E8E0' },
    { name: 'Slate Dusk', hex: '#3C454B' },
    { name: 'Midnight Forth', hex: '#1C242C' },
  ];

  const frameStyles: Record<FrameType, { label: string; border: string; shadow: string; extra: string }> = {
    none: {
      label: 'Raw Canvas Edge',
      border: 'border-2 border-stone-300',
      shadow: 'shadow-2xl',
      extra: 'ring-1 ring-stone-900/10',
    },
    oak: {
      label: 'Natural Scottish Oak',
      border: 'border-12 border-[#C29B62]',
      shadow: 'shadow-2xl',
      extra: 'ring-2 ring-stone-800/20',
    },
    black: {
      label: 'Contemporary Matte Black',
      border: 'border-12 border-[#1C1917]',
      shadow: 'shadow-2xl',
      extra: 'ring-1 ring-stone-900/40',
    },
    white: {
      label: 'White Float Frame',
      border: 'border-12 border-[#FAFAFA]',
      shadow: 'shadow-2xl',
      extra: 'ring-2 ring-stone-200',
    },
    gold: {
      label: 'Fine Gold Leaf Accent',
      border: 'border-10 border-[#B8860B]',
      shadow: 'shadow-2xl',
      extra: 'ring-2 ring-[#705206]/30',
    },
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-300 flex items-center justify-center">
              <Frame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-stone-900">
                View on Wall & Framing Preview
              </h3>
              <p className="text-[11px] text-stone-500">
                Visualize "{artwork.title}" in real room scales and curated frames
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Stage Area */}
        <div
          className="relative flex-1 min-h-[380px] sm:min-h-[460px] flex flex-col items-center justify-center transition-colors duration-500 p-6 overflow-hidden select-none"
          style={{ backgroundColor: wallColor }}
        >
          {/* Room Environment Decor */}
          {selectedRoom === 'living' && (
            <div className="absolute bottom-0 inset-x-0 flex flex-col items-center pointer-events-none opacity-85">
              {/* Modern Minimalist Sofa Silhouette */}
              <div className="w-[85%] max-w-2xl h-24 sm:h-28 bg-[#2F3034] rounded-t-3xl shadow-2xl border-t border-stone-700/30 flex items-center justify-around px-8">
                <div className="w-20 h-10 bg-amber-800/60 rounded-t-lg -translate-y-4 shadow-sm" />
                <div className="w-20 h-10 bg-stone-600/60 rounded-t-lg -translate-y-4 shadow-sm" />
              </div>
              {/* Floor */}
              <div className="w-full h-8 bg-gradient-to-b from-[#9C7F60] to-[#7D6448] border-t border-stone-800/40" />
            </div>
          )}

          {selectedRoom === 'study' && (
            <div className="absolute bottom-0 inset-x-0 flex flex-col items-center pointer-events-none opacity-85">
              {/* Wooden Console Table */}
              <div className="w-[75%] max-w-xl h-20 bg-[#4A3B32] rounded-t-md shadow-2xl border-t border-[#635043] flex items-end justify-between px-12 pb-2">
                <div className="w-8 h-12 bg-stone-300/30 rounded-t-sm border border-stone-300/20" />
                <div className="w-6 h-10 bg-amber-400/40 rounded-full" />
              </div>
              {/* Floor */}
              <div className="w-full h-8 bg-gradient-to-b from-[#8C765C] to-[#6E5B45]" />
            </div>
          )}

          {selectedRoom === 'gallery' && (
            <div className="absolute bottom-0 inset-x-0 flex flex-col items-center pointer-events-none">
              <div className="w-full h-6 bg-stone-200 border-t border-stone-300" />
            </div>
          )}

          {/* The Artwork Hanging with Frame Simulation */}
          <div
            className="relative z-10 -translate-y-6 sm:-translate-y-10 transition-all duration-300 flex items-center justify-center"
            style={{ transform: `translateY(-2rem) scale(${frameScale / 100})` }}
          >
            <div
              className={`transition-all duration-300 max-w-[260px] sm:max-w-[340px] md:max-w-[400px] overflow-hidden ${
                frameStyles[selectedFrame].border
              } ${frameStyles[selectedFrame].shadow} ${frameStyles[selectedFrame].extra}`}
            >
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-auto object-cover block"
              />
            </div>
          </div>

          {/* Dimension Tag Floating Near Art */}
          <div className="absolute top-4 right-4 z-20 bg-stone-900/80 text-white text-[11px] px-3 py-1.5 rounded-full backdrop-blur-xs font-mono">
            Scale: {artwork.dimensions}
          </div>
        </div>

        {/* Customization Toolbar at Bottom */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* 1. Frame Style Selector */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-500 mb-1.5">
              Frame Choice
            </label>
            <select
              value={selectedFrame}
              onChange={(e) => setSelectedFrame(e.target.value as FrameType)}
              className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-hidden"
            >
              <option value="none">Raw Canvas Edge (Unframed)</option>
              <option value="oak">Natural Scottish Oak Frame</option>
              <option value="black">Contemporary Matte Black</option>
              <option value="white">White Float Frame</option>
              <option value="gold">Fine Gold Leaf Accent</option>
            </select>
          </div>

          {/* 2. Room Scene Preset */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-500 mb-1.5">
              Room Interior
            </label>
            <div className="flex rounded-lg border border-stone-200 bg-white p-0.5 text-xs">
              <button
                onClick={() => setSelectedRoom('living')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${
                  selectedRoom === 'living' ? 'bg-stone-900 text-white font-medium' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Living Room
              </button>
              <button
                onClick={() => setSelectedRoom('study')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${
                  selectedRoom === 'study' ? 'bg-stone-900 text-white font-medium' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Study
              </button>
              <button
                onClick={() => setSelectedRoom('gallery')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${
                  selectedRoom === 'gallery' ? 'bg-stone-900 text-white font-medium' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Gallery
              </button>
            </div>
          </div>

          {/* 3. Wall Paint Color Picker */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-stone-500 mb-1.5">
              Wall Paint Color
            </label>
            <div className="flex items-center space-x-1.5">
              {wallColors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setWallColor(c.hex)}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    wallColor === c.hex ? 'scale-110 border-stone-900 shadow-xs' : 'border-stone-300'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* 4. Action Enquire to Buy */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onEnquireToBuy(artwork);
              }}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-amber-300" />
              <span>Enquire to Buy ({formatPrice(artwork.price, currency)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
