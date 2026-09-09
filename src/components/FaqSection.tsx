import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  Search,
  MapPin,
  ShieldCheck,
  Truck,
  CreditCard,
  Sparkles,
  Mail,
  Compass,
} from 'lucide-react';
import { FaqItem } from '../types';

interface FaqSectionProps {
  faqs: FaqItem[];
  onOpenEnquiry: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ faqs, onOpenEnquiry }) => {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Questions', icon: HelpCircle },
    { id: 'purchasing', label: 'Purchasing & Payment', icon: CreditCard },
    { id: 'location', label: 'Kirkcaldy Studio & Fife', icon: MapPin },
    { id: 'commissions', label: 'Bespoke Commissions', icon: Sparkles },
    { id: 'shipping', label: 'Packaging & Shipping', icon: Truck },
    { id: 'authenticity', label: 'Certificates & Provenance', icon: ShieldCheck },
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [faqs, activeCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="frequently-asked-questions"
      aria-label="Frequently Asked Questions about Fife Art and Original Scottish Paintings"
      className="py-16 sm:py-20 border-t border-stone-200/80 bg-linear-to-b from-stone-50/50 to-stone-100/30"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with AEO & GEO metadata cues */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-semibold border border-amber-200/60 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-amber-700" />
            <span>Collector Knowledge & Scottish Studio FAQ</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-stone-900">
            Frequently Asked Questions
          </h2>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Everything you need to know about purchasing original Scottish art, studio collection in
            Kirkcaldy, bespoke wildlife commissions, and archival delivery across the UK & worldwide.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-4 mb-8">
          {/* Quick Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. shipping, Kirkcaldy, puffins, payment)..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-white text-stone-600 hover:bg-stone-200/70 border border-stone-200/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion Questions List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-stone-200 text-stone-500 space-y-2">
              <p className="text-sm font-medium">No answers match your search term.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="text-xs text-amber-900 hover:underline font-semibold"
              >
                Reset FAQ filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-white border-stone-400/80 shadow-xs'
                      : 'bg-white/90 border-stone-200/90 hover:border-stone-300 hover:bg-white'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 text-left flex items-start justify-between gap-3 cursor-pointer select-none"
                  >
                    <span className="font-serif text-base sm:text-lg font-medium text-stone-900 leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className={`p-1 rounded-full text-stone-500 transition-transform duration-200 shrink-0 mt-0.5 ${
                        isOpen ? 'rotate-180 bg-stone-100 text-stone-900' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 animate-in fade-in slide-in-from-top-1">
                      <p className="whitespace-pre-line">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Callout: Inquiries directly to Nancy & Mike */}
        <div className="mt-10 p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-stone-900">
                Still have a question or wish to speak with the artist?
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                All enquiries are directly delivered to artist Nancy Berry and Fife Art studio management.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenEnquiry}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-2xs shrink-0 cursor-pointer text-center"
          >
            Enquire With Artist
          </button>
        </div>
      </div>
    </section>
  );
};
