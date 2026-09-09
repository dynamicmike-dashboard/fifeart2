import React, { useState, useEffect } from 'react';
import { X, Shield, FileText, AlertCircle, Sparkles, Check } from 'lucide-react';
import { LegalContent } from '../types';

export type LegalTab = 'privacy' | 'terms' | 'disclaimer';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  content: LegalContent;
  onClose: () => void;
  onOpenEnquiry?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  content,
  onClose,
  onOpenEnquiry,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/80 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-stone-900">
                Fife Art Studio • Collector Information
              </h3>
              <p className="text-[11px] text-stone-500">
                Policies, terms of purchase, and art representation disclaimer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-6 border-b border-stone-200 bg-stone-100/60 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'disclaimer'
                ? 'border-amber-600 text-amber-900 bg-white shadow-2xs'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>Art & Colour Disclaimer</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-stone-700" />
            <span>Privacy Policy (GDPR)</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'terms'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-stone-700" />
            <span>Terms & Conditions</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-stone-700 text-sm leading-relaxed">
          {/* TAB 1: ART & COLOUR DISCLAIMER */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-serif text-2xl font-semibold text-stone-900">
                  Artwork & Colour Representation Disclaimer
                </h4>
                <span className="text-[11px] font-mono text-stone-400">
                  Last updated: {content.disclaimer.lastUpdated}
                </span>
              </div>

              {/* Special Emphasis Callout */}
              <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 space-y-2.5">
                <div className="flex items-center space-x-2 font-semibold text-xs uppercase tracking-wider text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Important Collector Notice</span>
                </div>
                <p className="font-serif text-base sm:text-lg font-medium leading-snug text-stone-900">
                  {content.disclaimer.colourRepresentationNotice}
                </p>
              </div>

              <div className="space-y-4 text-stone-600">
                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    Authentic Handcrafted Mediums & Organic Variation
                  </h5>
                  <p className="text-xs sm:text-sm">
                    {content.disclaimer.handmadeCharacteristics}
                  </p>
                </div>

                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    Dimensions, Framing & Edges
                  </h5>
                  <p className="text-xs sm:text-sm">
                    {content.disclaimer.dimensionsFraming}
                  </p>
                </div>

                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    Care, Pigment Preservation & Lighting
                  </h5>
                  <p className="text-xs sm:text-sm">
                    {content.disclaimer.lightingDisplayAdvice}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-serif text-2xl font-semibold text-stone-900">
                  Privacy Policy
                </h4>
                <span className="text-[11px] font-mono text-stone-400">
                  Last updated: {content.privacyPolicy.lastUpdated}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-600">
                {content.privacyPolicy.introduction}
              </p>

              <div className="space-y-4 text-stone-600">
                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    1. Information We Collect
                  </h5>
                  <p className="text-xs sm:text-sm">{content.privacyPolicy.dataCollected}</p>
                </div>

                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    2. Purpose & Use of Personal Data
                  </h5>
                  <p className="text-xs sm:text-sm">{content.privacyPolicy.howWeUseData}</p>
                </div>

                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    3. Data Routing, Storage & No Third-Party Selling
                  </h5>
                  <p className="text-xs sm:text-sm">{content.privacyPolicy.dataStorageSecurity}</p>
                </div>

                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    4. Cookies & Privacy-First Browsing
                  </h5>
                  <p className="text-xs sm:text-sm">{content.privacyPolicy.cookiesAnalytics}</p>
                </div>

                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    5. Collector Rights & Studio Contact
                  </h5>
                  <p className="text-xs sm:text-sm">{content.privacyPolicy.contactInfo}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-serif text-2xl font-semibold text-stone-900">
                  Terms & Conditions of Sale
                </h4>
                <span className="text-[11px] font-mono text-stone-400">
                  Last updated: {content.termsConditions.lastUpdated}
                </span>
              </div>

              <div className="space-y-4 text-stone-600">
                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    1. Original Artworks & Ordering Process
                  </h5>
                  <p className="text-xs sm:text-sm">{content.termsConditions.orderingProcess}</p>
                </div>

                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    2. Pricing & Payment Terms
                  </h5>
                  <p className="text-xs sm:text-sm">{content.termsConditions.pricingPayment}</p>
                </div>

                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    3. Packaging, Courier Transit & Insurance
                  </h5>
                  <p className="text-xs sm:text-sm">{content.termsConditions.shippingPackaging}</p>
                </div>

                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    4. 14-Day Return Policy & Satisfaction Guarantee
                  </h5>
                  <p className="text-xs sm:text-sm">{content.termsConditions.cancellationsReturns}</p>
                </div>

                <div>
                  <h5 className="font-serif text-base font-semibold text-stone-900 mb-1">
                    5. Copyright & Reproduction Rights
                  </h5>
                  <p className="text-xs sm:text-sm">{content.termsConditions.copyrightIntellectualProperty}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500">
            Fife Art Studio • Kirkcaldy, Fife, Scotland
          </div>
          <div className="flex items-center space-x-3">
            {onOpenEnquiry && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEnquiry();
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Ask a Question
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              I Understand & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
