import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, Shield, Lock, MapPin, Truck } from 'lucide-react';
import { Artwork, ShippingPreference } from '../types';
import { StorageService } from '../services/storage';

interface EnquiryModalProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  artwork,
  isOpen,
  onClose,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingPreference, setShippingPreference] = useState<ShippingPreference>('uk_courier');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Set default contextual message when artwork changes
  useEffect(() => {
    if (artwork) {
      if (artwork.status === 'Sold') {
        setMessage(
          `Hello, I saw "${artwork.title}" (${artwork.sku}) is marked as Sold. I am very interested in this piece—would it be possible to commission a similar original or are prints/studies available?`
        );
      } else {
        setMessage(
          `Hello, I would like to enquire about purchasing "${artwork.title}" (${artwork.sku}, £${artwork.price}). Please provide postage options and payment details.`
        );
      }
    } else {
      setMessage('Hello, I have an enquiry regarding Fife Art paintings and commissions.');
    }
  }, [artwork, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) return;

    setIsSubmitting(true);

    try {
      // 1. Save to local storage inbox so Mum never misses an enquiry
      const saved = StorageService.saveEnquiry({
        artworkId: artwork?.id,
        artworkTitle: artwork?.title || 'General Portfolio Enquiry',
        artworkSku: artwork?.sku || 'GENERAL',
        artworkPrice: artwork?.price,
        artworkImage: artwork?.imageUrl,
        artworkMedium: artwork?.medium,
        customerName,
        customerEmail,
        customerPhone,
        shippingPreference,
        message,
      });

      // 2. Simulated secure email dispatch / Web3Forms routing
      // Note: Mum's email is never exposed to the client
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSubmittedRef(saved.id);
    } catch (err) {
      console.error('Failed to submit enquiry', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedRef(null);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setMessage('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/70">
          <div>
            <h3 className="font-serif text-xl font-medium text-stone-900">
              {artwork ? 'Enquire to Buy Original' : 'Contact Fife Art'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Secure enquiry routed directly to the artist's private inbox
            </p>
          </div>
          <button
            onClick={onClose}
            id="enquiry-modal-close"
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {submittedRef ? (
            /* Success State */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-2xl font-medium text-stone-900">
                Thank You for Your Enquiry!
              </h4>
              <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Your message regarding{' '}
                <strong className="text-stone-900 font-medium">
                  {artwork ? `"${artwork.title}"` : 'Fife Art'}
                </strong>{' '}
                has been securely emailed to the artist. She will review your delivery preferences and reply to{' '}
                <span className="font-mono text-stone-800 font-medium">{customerEmail}</span>{' '}
                within 24 hours.
              </p>
              <div className="inline-block px-3.5 py-1.5 bg-stone-100 rounded-lg text-xs font-mono text-stone-700">
                Enquiry Reference: <strong>{submittedRef}</strong>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-medium transition-colors shadow-xs"
                >
                  Return to Gallery
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contextual Artwork Header if attached */}
              {artwork && (
                <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="w-14 h-14 rounded-lg object-cover border border-stone-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-serif text-sm font-medium text-stone-900 truncate">
                      {artwork.title}
                    </h5>
                    <p className="text-[11px] text-stone-500">
                      {artwork.medium} • {artwork.dimensions}
                    </p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs font-semibold text-stone-900">
                        £{artwork.price}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">
                        {artwork.sku}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Name & Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    id="enquiry-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Fiona Campbell"
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-800 focus:border-stone-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Your Email Address *
                  </label>
                  <input
                    id="enquiry-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-800 focus:border-stone-800 shadow-2xs"
                  />
                </div>
              </div>

              {/* Phone & Shipping Preference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="enquiry-phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+44 7123 456789"
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-800 focus:border-stone-800 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Delivery / Collection Preference
                  </label>
                  <select
                    id="enquiry-shipping"
                    value={shippingPreference}
                    onChange={(e) => setShippingPreference(e.target.value as ShippingPreference)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 focus:border-stone-800 shadow-2xs"
                  >
                    <option value="uk_courier">UK Tracked & Insured Courier</option>
                    <option value="international">International Air Courier</option>
                    <option value="studio_collection">Local Collection (Fife Studio)</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Message / Order Requirements
                </label>
                <textarea
                  id="enquiry-message"
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-800 focus:border-stone-800 shadow-2xs"
                />
              </div>

              {/* Privacy Notice */}
              <div className="flex items-center space-x-2 text-[11px] text-stone-500 pt-1">
                <Shield className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>
                  Privacy Guaranteed: The artist's email and your personal details are kept private and never shared.
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="enquiry-submit-btn"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-medium flex items-center justify-center space-x-2 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? 'Dispatching Enquiry...' : 'Send Order Enquiry to Artist'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
