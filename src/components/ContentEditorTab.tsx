import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  Shield,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Eye,
  Info,
  Layers,
} from 'lucide-react';
import { FaqItem, FaqCategory, AboutContent, LegalContent } from '../types';
import { DEFAULT_FAQS } from '../data/faqData';
import { DEFAULT_ABOUT_CONTENT, DEFAULT_LEGAL_CONTENT } from '../data/contentDefaults';
import { StorageService } from '../services/storage';
import { SeoService } from '../services/seoService';

interface ContentEditorTabProps {
  faqs: FaqItem[];
  onSaveFaqs: (updatedFaqs: FaqItem[]) => void;
  onSaveAbout: (updatedAbout: AboutContent) => void;
  onSaveLegal: (updatedLegal: LegalContent) => void;
  onShowToast: (msg: string) => void;
}

type SubSection = 'faqs' | 'about' | 'legal';
type LegalSubSection = 'disclaimer' | 'privacy' | 'terms';

const FAQ_CATEGORIES: { value: FaqCategory; label: string }[] = [
  { value: 'purchasing', label: 'Purchasing & Enquiries' },
  { value: 'shipping', label: 'Packaging & Courier Shipping' },
  { value: 'authenticity', label: 'Authenticity & Archival Protection' },
  { value: 'location', label: 'Studio Location & Fife Viewings' },
  { value: 'commissions', label: 'Custom Scottish Commissions' },
];

export const ContentEditorTab: React.FC<ContentEditorTabProps> = ({
  faqs,
  onSaveFaqs,
  onSaveAbout,
  onSaveLegal,
  onShowToast,
}) => {
  const [activeSection, setActiveSection] = useState<SubSection>('faqs');
  const [activeLegalSection, setActiveLegalSection] = useState<LegalSubSection>('disclaimer');

  // FAQs local state
  const [localFaqs, setLocalFaqs] = useState<FaqItem[]>(faqs);
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState<FaqCategory>('purchasing');

  // About Content local state
  const [aboutForm, setAboutForm] = useState<AboutContent>(() => StorageService.getAboutContent());

  // Legal Content local state
  const [legalForm, setLegalForm] = useState<LegalContent>(() => StorageService.getLegalContent());

  // Keep local states in sync if props change
  useEffect(() => {
    setLocalFaqs(faqs);
  }, [faqs]);

  // -------------------------------------------------------------
  // FAQ Handlers
  // -------------------------------------------------------------
  const handleUpdateFaq = (id: string, field: keyof FaqItem, value: any) => {
    setLocalFaqs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localFaqs.length) return;
    const updated = [...localFaqs];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setLocalFaqs(updated);
  };

  const handleDeleteFaq = (id: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      setLocalFaqs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleAddNewFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      alert('Please fill in both question and answer.');
      return;
    }

    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      category: newCategory,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    };

    setLocalFaqs((prev) => [...prev, newItem]);
    setNewQuestion('');
    setNewAnswer('');
    setNewCategory('purchasing');
    setIsAddingFaq(false);
    onShowToast('New FAQ added. Click "Save All FAQs" to apply.');
  };

  const handleSaveAllFaqs = () => {
    onSaveFaqs(localFaqs);
    onShowToast('All FAQs successfully saved and updated across the site.');
  };

  const handleResetFaqs = () => {
    if (window.confirm('Reset all FAQs back to default Scottish studio questions?')) {
      setLocalFaqs(DEFAULT_FAQS);
      onSaveFaqs(DEFAULT_FAQS);
      onShowToast('FAQs reset to standard studio defaults.');
    }
  };

  // -------------------------------------------------------------
  // About Content Handlers
  // -------------------------------------------------------------
  const handleSaveAbout = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveAboutContent(aboutForm);
    onSaveAbout(aboutForm);
    onShowToast('About Me content updated successfully.');
  };

  const handleResetAbout = () => {
    if (window.confirm('Reset About Me content to original artist biography?')) {
      setAboutForm(DEFAULT_ABOUT_CONTENT);
      StorageService.saveAboutContent(DEFAULT_ABOUT_CONTENT);
      onSaveAbout(DEFAULT_ABOUT_CONTENT);
      onShowToast('About Me restored to defaults.');
    }
  };

  // -------------------------------------------------------------
  // Legal Content Handlers
  // -------------------------------------------------------------
  const handleSaveLegal = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveLegalContent(legalForm);
    onSaveLegal(legalForm);
    onShowToast('Privacy, Terms, and Disclaimer saved successfully.');
  };

  const handleResetLegal = () => {
    if (window.confirm('Reset all Legal and Disclaimer terms to studio defaults?')) {
      setLegalForm(DEFAULT_LEGAL_CONTENT);
      StorageService.saveLegalContent(DEFAULT_LEGAL_CONTENT);
      onSaveLegal(DEFAULT_LEGAL_CONTENT);
      onShowToast('Legal content restored to defaults.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header / Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h4 className="font-serif text-lg font-medium text-stone-900">
            Website Content & Legal Management
          </h4>
          <p className="text-xs text-stone-500">
            Customize collector FAQs, artist bio, and policies (including color & artwork representations).
          </p>
        </div>

        {/* Section Switcher Pills */}
        <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSection('faqs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeSection === 'faqs'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQs ({localFaqs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('about')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeSection === 'about'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>About the Artist</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('legal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeSection === 'legal'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Legal & Disclaimers</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: FAQS EDITOR */}
      {/* ========================================================= */}
      {activeSection === 'faqs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50/70 rounded-xl border border-amber-200/80">
            <div className="flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <span className="font-semibold block text-stone-900">
                  Live FAQ & Search Schema Integration
                </span>
                Modifying these questions updates both the interactive homepage accordion and the Schema.org FAQPage structured data used by search engines (AEO/SEO).
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddingFaq(true)}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
              <button
                type="button"
                onClick={handleResetFaqs}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-stone-500" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Add New FAQ Form Card */}
          {isAddingFaq && (
            <form
              onSubmit={handleAddNewFaq}
              className="p-5 bg-white rounded-xl border-2 border-stone-900 shadow-md space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h5 className="font-serif text-sm font-semibold text-stone-900">
                  Add New Collector FAQ
                </h5>
                <button
                  type="button"
                  onClick={() => setIsAddingFaq(false)}
                  className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-stone-800">
                    Question Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="e.g. Can I arrange studio collection in Kirkcaldy?"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-800">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FaqCategory)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                  >
                    {FAQ_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-800">
                  Answer Text *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Provide a clear, reassuring answer for collectors..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingFaq(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors shadow-2xs"
                >
                  Confirm & Insert FAQ
                </button>
              </div>
            </form>
          )}

          {/* FAQ Item Cards */}
          <div className="space-y-3">
            {localFaqs.map((faq, index) => (
              <div
                key={faq.id}
                className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-3 hover:border-stone-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-xs font-bold flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <select
                      value={faq.category}
                      onChange={(e) =>
                        handleUpdateFaq(faq.id, 'category', e.target.value as FaqCategory)
                      }
                      className="text-[11px] font-medium px-2 py-1 bg-stone-50 border border-stone-300 rounded-md text-stone-700"
                    >
                      {FAQ_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveFaq(index, 'up')}
                      className="p-1 rounded text-stone-400 hover:text-stone-800 disabled:opacity-30 cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === localFaqs.length - 1}
                      onClick={() => handleMoveFaq(index, 'down')}
                      className="p-1 rounded text-stone-400 hover:text-stone-800 disabled:opacity-30 cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer ml-2"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => handleUpdateFaq(faq.id, 'question', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                    Answer
                  </label>
                  <textarea
                    rows={3}
                    value={faq.answer}
                    onChange={(e) => handleUpdateFaq(faq.id, 'answer', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Save Action */}
          <div className="pt-3 border-t border-stone-200 flex justify-end">
            <button
              type="button"
              onClick={handleSaveAllFaqs}
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>Save & Publish FAQs</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: ABOUT THE ARTIST */}
      {/* ========================================================= */}
      {activeSection === 'about' && (
        <form onSubmit={handleSaveAbout} className="space-y-6">
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-stone-600">
              Update the artist biography and story presented in the "About the Artist" modal dialog across the website.
            </div>
            <button
              type="button"
              onClick={handleResetAbout}
              className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3 text-stone-500" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">
                Artist Name *
              </label>
              <input
                type="text"
                required
                value={aboutForm.artistName}
                onChange={(e) => setAboutForm({ ...aboutForm, artistName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">
                Studio Location *
              </label>
              <input
                type="text"
                required
                value={aboutForm.location}
                onChange={(e) => setAboutForm({ ...aboutForm, location: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-stone-800">
                Professional Tagline / Headline
              </label>
              <input
                type="text"
                value={aboutForm.headline}
                onChange={(e) => setAboutForm({ ...aboutForm, headline: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-stone-800">
                Portrait / Studio Image URL
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="url"
                  value={aboutForm.photoUrl}
                  onChange={(e) => setAboutForm({ ...aboutForm, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                {aboutForm.photoUrl && (
                  <img
                    src={aboutForm.photoUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-stone-300 shrink-0"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">
                Biography Paragraph 1 *
              </label>
              <textarea
                required
                rows={3}
                value={aboutForm.bioParagraph1}
                onChange={(e) => setAboutForm({ ...aboutForm, bioParagraph1: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">
                Biography Paragraph 2 (Optional)
              </label>
              <textarea
                rows={2}
                value={aboutForm.bioParagraph2 || ''}
                onChange={(e) => setAboutForm({ ...aboutForm, bioParagraph2: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">
                Mediums & Artistic Technique *
              </label>
              <textarea
                required
                rows={2}
                value={aboutForm.mediumsApproach}
                onChange={(e) => setAboutForm({ ...aboutForm, mediumsApproach: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800">
                Varnish & Archival Protection Note *
              </label>
              <textarea
                required
                rows={2}
                value={aboutForm.protectionNote}
                onChange={(e) => setAboutForm({ ...aboutForm, protectionNote: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Custom Commission Box Title
                </label>
                <input
                  type="text"
                  value={aboutForm.commissionPromptTitle}
                  onChange={(e) =>
                    setAboutForm({ ...aboutForm, commissionPromptTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Commission Box Subtitle
                </label>
                <input
                  type="text"
                  value={aboutForm.commissionPromptSubtitle}
                  onChange={(e) =>
                    setAboutForm({ ...aboutForm, commissionPromptSubtitle: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>Save About Me Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: LEGAL & DISCLAIMERS */}
      {/* ========================================================= */}
      {activeSection === 'legal' && (
        <form onSubmit={handleSaveLegal} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <span className="font-semibold text-xs text-stone-900 block">
                Manage Legal Policies & Customer Disclaimers
              </span>
              <span className="text-[11px] text-stone-500">
                These terms are displayed when collectors click the footer links or view purchase guarantees.
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetLegal}
              className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3 text-stone-500" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          {/* Sub-tab selection */}
          <div className="flex items-center space-x-2 border-b border-stone-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveLegalSection('disclaimer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeLegalSection === 'disclaimer'
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Art & Colour Disclaimer (Required)
            </button>

            <button
              type="button"
              onClick={() => setActiveLegalSection('privacy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeLegalSection === 'privacy'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Privacy Policy (GDPR)
            </button>

            <button
              type="button"
              onClick={() => setActiveLegalSection('terms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeLegalSection === 'terms'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Terms & Conditions of Sale
            </button>
          </div>

          {/* SUB-TAB 3A: ART & COLOUR DISCLAIMER */}
          {activeLegalSection === 'disclaimer' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-stone-900">
                    Art Digital Representation Requirement
                  </span>
                  As required, this disclaimer clearly informs collectors that original handcrafted art may have organic subtle variations from digital screens (due to pigment, natural lighting, and monitor calibration).
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Primary Colour Representation Notice *
                </label>
                <textarea
                  required
                  rows={3}
                  value={legalForm.disclaimer.colourRepresentationNotice}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      disclaimer: {
                        ...legalForm.disclaimer,
                        colourRepresentationNotice: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-amber-300 bg-amber-50/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 leading-relaxed font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Handmade Characteristics & Organic Texture *
                </label>
                <textarea
                  required
                  rows={3}
                  value={legalForm.disclaimer.handmadeCharacteristics}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      disclaimer: {
                        ...legalForm.disclaimer,
                        handmadeCharacteristics: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Dimensions, Framing & Edges *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.disclaimer.dimensionsFraming}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      disclaimer: {
                        ...legalForm.disclaimer,
                        dimensionsFraming: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Lighting, Display & Pigment Preservation Advice *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.disclaimer.lightingDisplayAdvice}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      disclaimer: {
                        ...legalForm.disclaimer,
                        lightingDisplayAdvice: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* SUB-TAB 3B: PRIVACY POLICY */}
          {activeLegalSection === 'privacy' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Policy Introduction *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.privacyPolicy.introduction}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      privacyPolicy: {
                        ...legalForm.privacyPolicy,
                        introduction: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Data Collected *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.privacyPolicy.dataCollected}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      privacyPolicy: {
                        ...legalForm.privacyPolicy,
                        dataCollected: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  How We Use Collector Data *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.privacyPolicy.howWeUseData}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      privacyPolicy: {
                        ...legalForm.privacyPolicy,
                        howWeUseData: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Data Storage, Security & Direct Studio Notification Routing *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.privacyPolicy.dataStorageSecurity}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      privacyPolicy: {
                        ...legalForm.privacyPolicy,
                        dataStorageSecurity: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Cookies & Analytics Policy *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.privacyPolicy.cookiesAnalytics}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      privacyPolicy: {
                        ...legalForm.privacyPolicy,
                        cookiesAnalytics: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Collector Rights & Studio Contact *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.privacyPolicy.contactInfo}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      privacyPolicy: {
                        ...legalForm.privacyPolicy,
                        contactInfo: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          )}

          {/* SUB-TAB 3C: TERMS & CONDITIONS */}
          {activeLegalSection === 'terms' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Original Art Ordering Process *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.termsConditions.orderingProcess}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      termsConditions: {
                        ...legalForm.termsConditions,
                        orderingProcess: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Pricing & Payment Terms *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.termsConditions.pricingPayment}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      termsConditions: {
                        ...legalForm.termsConditions,
                        pricingPayment: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Shipping, Packaging & Transit Insurance *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.termsConditions.shippingPackaging}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      termsConditions: {
                        ...legalForm.termsConditions,
                        shippingPackaging: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  14-Day Return Policy & Satisfaction Guarantee *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.termsConditions.cancellationsReturns}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      termsConditions: {
                        ...legalForm.termsConditions,
                        cancellationsReturns: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-800">
                  Artist Copyright & Intellectual Property *
                </label>
                <textarea
                  required
                  rows={2}
                  value={legalForm.termsConditions.copyrightIntellectualProperty}
                  onChange={(e) =>
                    setLegalForm({
                      ...legalForm,
                      termsConditions: {
                        ...legalForm.termsConditions,
                        copyrightIntellectualProperty: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-stone-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>Save Legal Policies & Disclaimer</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
