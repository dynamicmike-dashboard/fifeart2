import React, { useState } from 'react';
import {
  X,
  Lock,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Check,
  FileCode,
  Download,
  FileUp,
  Inbox,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Copy,
  CheckCheck,
  RefreshCw,
  Award,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Maximize2,
  Calendar,
  Layers,
  Compass,
  Tag,
  Hash,
  ArrowLeft,
  Image as ImageIcon,
  Globe,
  Mail,
  Send,
  Share2,
  FileText,
} from 'lucide-react';
import { Artwork, ArtworkOrientation, ArtworkStatus, Enquiry, SeoSettings, FaqItem, AboutContent, LegalContent } from '../types';
import { StorageService, DEFAULT_ADMIN_PASSWORD, IS_CUSTOM_ADMIN_PASSWORD_SET } from '../services/storage';
import { SeoService, DEFAULT_SEO_SETTINGS } from '../services/seoService';
import { DEFAULT_STUDIO_NOTIFICATION_EMAILS } from '../data/faqData';
import { AVAILABLE_TAGS, STATUS_OPTIONS } from '../data/sampleArtworks';
import { AdminBulkImport } from './AdminBulkImport';
import { ContentEditorTab } from './ContentEditorTab';
import { generateCanvasPlaceholder } from '../utils/artworkParser';

const MEDIUM_PRESETS = [
  'Oil on canvas',
  'Oil on linen',
  'Oil on board',
  'Sketch (Graphite)',
  'Sketch (Charcoal)',
  'Acrylic on canvas',
  'Watercolour on Arches',
  'Gouache on paper',
  'Mixed Media',
  'Pastel on mountboard',
];

const DIMENSION_PRESETS = [
  '40 x 30 cm (15.7 x 11.8 in)',
  '50 x 40 cm (19.7 x 15.7 in)',
  '60 x 50 cm (23.6 x 19.7 in)',
  '70 x 50 cm (27.5 x 19.7 in)',
  '80 x 60 cm (31.5 x 23.6 in)',
  '100 x 75 cm (39.4 x 29.5 in)',
  '120 x 90 cm (47.2 x 35.4 in)',
];

const SUBJECT_PRESETS = [
  'Scottish Wildlife',
  'Coastal & Shore',
  'Seascapes',
  'Harbours & Boats',
  'Landscapes & Hills',
  'Bothies & Cottages',
  'Highlands & Lochs',
  'Castles & Architecture',
  'Flora & Thistles',
  'East Neuk Villages',
  'Puffins & Seabirds',
  'Sketches & Studies',
];

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  artworks: Artwork[];
  onArtworksUpdated: (updated: Artwork[]) => void;
  onGenerateCertificate: (art: Artwork) => void;
  onFaqsUpdated?: (faqs: FaqItem[]) => void;
  onAboutContentUpdated?: (about: AboutContent) => void;
  onLegalContentUpdated?: (legal: LegalContent) => void;
  catalogSource?: 'sanity' | 'local' | null;
  onReloadCatalog?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  artworks,
  onArtworksUpdated,
  onGenerateCertificate,
  onFaqsUpdated,
  onAboutContentUpdated,
  onLegalContentUpdated,
  catalogSource,
  onReloadCatalog,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'add' | 'inbox' | 'seo' | 'content' | 'import' | 'sanity'>('inventory');

  // Form states for adding/editing artwork
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formMedium, setFormMedium] = useState('Oil on canvas');
  const [formDimensions, setFormDimensions] = useState('50 x 40 cm (19.7 x 15.7 in)');
  const [formOrientation, setFormOrientation] = useState<ArtworkOrientation>('Landscape');
  const [formPrice, setFormPrice] = useState<number | ''>(350);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number | ''>('');
  const [formStatus, setFormStatus] = useState<ArtworkStatus>('Available');
  const [formTags, setFormTags] = useState<string[]>(['Wildlife']);
  const [formCustomTag, setFormCustomTag] = useState('');
  const [formSubjects, setFormSubjects] = useState<string[]>(['Scottish Wildlife']);
  const [formCustomSubject, setFormCustomSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSku, setFormSku] = useState('');
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formExtraFields, setFormExtraFields] = useState<Record<string, string>>({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // Fullscreen image viewer state
  const [isEnlargeImageOpen, setIsEnlargeImageOpen] = useState(false);

  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageCompressionNote, setImageCompressionNote] = useState('');

  // Search & Filter within Admin
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('All');
  const [adminSortBy, setAdminSortBy] = useState<'latest' | 'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc'>('latest');
  const [adminAttentionOnly, setAdminAttentionOnly] = useState(false);

  // Bulk selection and clear state
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<Set<string>>(new Set());
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [artworkToDelete, setArtworkToDelete] = useState<Artwork | null>(null);
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);
  const [isClearPlaceholdersModalOpen, setIsClearPlaceholdersModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Inquiries state & notification configuration
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [notificationEmails, setNotificationEmails] = useState<string>(() => StorageService.getNotificationEmails());
  const [isEditingEmails, setIsEditingEmails] = useState(false);
  const [emailsDraft, setEmailsDraft] = useState('');
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'new' | 'replied' | 'archived'>('all');

  // SEO, Schema & AEO state
  const [seoSettings, setSeoSettings] = useState<SeoSettings>(() => SeoService.getSeoSettings());
  const [faqsList, setFaqsList] = useState<FaqItem[]>(() => SeoService.getFaqs());
  const [copiedLdJson, setCopiedLdJson] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (StorageService.verifyAdminPassword(passwordInput)) {
      setIsAuthenticated(true);
      setAuthError('');
      setEnquiries(StorageService.getEnquiries());
      setNotificationEmails(StorageService.getNotificationEmails());
      setSeoSettings(SeoService.getSeoSettings());
      setFaqsList(SeoService.getFaqs());
    } else {
      setAuthError(`Incorrect password. (Default is "${DEFAULT_ADMIN_PASSWORD}")`);
    }
  };

  const processImageFile = async (file: File) => {
    setIsProcessingImage(true);
    setImageCompressionNote('Optimizing & converting image to modern WebP format...');

    try {
      const originalSizeKb = Math.round(file.size / 1024);
      const webpDataUrl = await StorageService.convertImageToWebP(file, 1600, 0.85);

      // Estimate compressed size
      const base64Len = webpDataUrl.length - 'data:image/webp;base64,'.length;
      const compressedKb = Math.round((base64Len * 3) / 4 / 1024);

      setFormImageUrl(webpDataUrl);
      setImageCompressionNote(`Converted to WebP (${compressedKb} KB, reduced from ${originalSizeKb} KB)`);
    } catch (err) {
      console.error(err);
      setImageCompressionNote('Error converting image. Using standard reader.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  const handleImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await processImageFile(file);
  };

  const generateAutoSku = (tag: string) => {
    const prefix = tag.substring(0, 3).toUpperCase();
    const count = artworks.length + 1;
    return `FAF-${prefix}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenAddForm = () => {
    setEditingArtworkId(null);
    setFormTitle('');
    setFormMedium('Oil on canvas');
    setFormDimensions('50 x 40 cm (19.7 x 15.7 in)');
    setFormOrientation('Landscape');
    setFormPrice(320);
    setFormOriginalPrice('');
    setFormStatus('Available');
    setFormTags(['Wildlife']);
    setFormCustomTag('');
    setFormSubjects(['Scottish Wildlife']);
    setFormCustomSubject('');
    setFormDescription('Original hand-painted Scottish artwork by Fife Art. Finished with protective satin varnish.');
    setFormImageUrl('');
    const autoSku = generateAutoSku('Wildlife');
    setFormSku(autoSku);
    setFormOrderNumber(autoSku);
    setFormDate(String(new Date().getFullYear()));
    setFormFeatured(false);
    setFormExtraFields({});
    setNewFieldKey('');
    setNewFieldValue('');
    setImageCompressionNote('');
    setActiveTab('add');
  };

  const handleEditArtwork = (artwork: Artwork) => {
    setEditingArtworkId(artwork.id);
    setFormTitle(artwork.title);
    setFormMedium(artwork.medium);
    setFormDimensions(artwork.dimensions);
    setFormOrientation(artwork.orientation || 'Landscape');
    setFormPrice(artwork.price);
    setFormOriginalPrice(artwork.originalPrice || '');
    setFormStatus(artwork.status);
    setFormTags(artwork.tags || []);
    setFormCustomTag('');
    setFormSubjects(
      artwork.subjects && artwork.subjects.length > 0 ? artwork.subjects : [...artwork.tags]
    );
    setFormCustomSubject('');
    setFormDescription(artwork.description || '');
    setFormImageUrl(artwork.imageUrl || '');
    setFormSku(artwork.sku || '');
    setFormOrderNumber(artwork.orderNumber || artwork.sku || '');
    setFormDate(artwork.date || (artwork.year ? String(artwork.year) : ''));
    setFormFeatured(Boolean(artwork.featured));
    setFormExtraFields(artwork.extraFields ? { ...artwork.extraFields } : {});
    setNewFieldKey('');
    setNewFieldValue('');
    setImageCompressionNote('');
    setActiveTab('add');
  };

  const handleAddSubject = (subjectToAdd?: string) => {
    const s = (subjectToAdd || formCustomSubject).trim();
    if (!s) return;
    if (!formSubjects.includes(s)) {
      setFormSubjects([...formSubjects, s]);
    }
    setFormCustomSubject('');
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setFormSubjects(formSubjects.filter((s) => s !== subjectToRemove));
  };

  const handleAddCustomTag = () => {
    const t = formCustomTag.trim();
    if (!t) return;
    if (!formTags.includes(t)) {
      setFormTags([...formTags, t]);
    }
    setFormCustomTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter((t) => t !== tagToRemove));
  };

  const handleAddExtraField = () => {
    if (!newFieldKey.trim()) return;
    setFormExtraFields((prev) => ({
      ...prev,
      [newFieldKey.trim()]: newFieldValue.trim(),
    }));
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const handleRemoveExtraField = (key: string) => {
    setFormExtraFields((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleUpdateExtraField = (key: string, val: string) => {
    setFormExtraFields((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSaveArtworkForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formPrice === '') return;

    const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const priceNum = Number(formPrice);
    const origPriceNum = formOriginalPrice ? Number(formOriginalPrice) : undefined;
    const finalSku = formSku.trim() || formOrderNumber.trim() || generateAutoSku(formTags[0] || 'ART');
    const finalOrderNumber = formOrderNumber.trim() || finalSku;
    const finalImageUrl = formImageUrl.trim() || generateCanvasPlaceholder(formTitle, formMedium);

    const cleanExtraFields: Record<string, string> = {};
    Object.entries(formExtraFields).forEach(([k, v]) => {
      const trimmedK = String(k).trim();
      const trimmedV = String(v ?? '').trim();
      if (trimmedK && trimmedV) {
        cleanExtraFields[trimmedK] = trimmedV;
      }
    });

    const artworkPayload: Omit<Artwork, 'id' | 'createdAt'> = {
      title: formTitle.trim(),
      slug,
      medium: formMedium.trim(),
      dimensions: formDimensions.trim(),
      orientation: formOrientation,
      price: priceNum,
      originalPrice: origPriceNum,
      status: formStatus,
      tags: formTags.length > 0 ? formTags : ['Original'],
      subjects: formSubjects.length > 0 ? formSubjects : formTags,
      description: formDescription.trim(),
      imageUrl: finalImageUrl,
      sku: finalSku,
      orderNumber: finalOrderNumber,
      date: formDate.trim() || undefined,
      year: formDate.trim()
        ? parseInt(formDate.replace(/[^0-9]/g, ''), 10) || new Date().getFullYear()
        : new Date().getFullYear(),
      featured: formFeatured,
      extraFields: Object.keys(cleanExtraFields).length > 0 ? cleanExtraFields : undefined,
    };

    if (editingArtworkId) {
      StorageService.updateArtwork(editingArtworkId, artworkPayload);
    } else {
      StorageService.addArtwork(artworkPayload);
    }

    const updated = StorageService.getArtworks();
    onArtworksUpdated(updated);
    setToastMessage(
      editingArtworkId ? `Saved changes to "${formTitle}"` : `Added "${formTitle}" to catalog`
    );
    setActiveTab('inventory');
  };

  const handleDeleteArtwork = (art: Artwork) => {
    setArtworkToDelete(art);
  };

  const handleConfirmDeleteSingle = () => {
    if (!artworkToDelete) return;
    StorageService.deleteArtwork(artworkToDelete.id);
    setSelectedArtworkIds((prev) => {
      const next = new Set(prev);
      next.delete(artworkToDelete.id);
      return next;
    });
    if (editingArtworkId === artworkToDelete.id) {
      setEditingArtworkId(null);
      setActiveTab('inventory');
    }
    const updated = StorageService.getArtworks();
    onArtworksUpdated(updated);
    setToastMessage(`Deleted "${artworkToDelete.title}"`);
    setArtworkToDelete(null);
  };

  const handleToggleSelectArtwork = (id: string) => {
    setSelectedArtworkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedArtworkIds.size === filteredAdminArtworks.length && filteredAdminArtworks.length > 0) {
      setSelectedArtworkIds(new Set());
    } else {
      setSelectedArtworkIds(new Set(filteredAdminArtworks.map((a) => a.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedArtworkIds.size === 0) return;
    setIsDeleteSelectedModalOpen(true);
  };

  const handleConfirmDeleteSelected = () => {
    if (selectedArtworkIds.size === 0) return;
    const count = selectedArtworkIds.size;
    const updated = StorageService.deleteMultipleArtworks(Array.from(selectedArtworkIds));
    setSelectedArtworkIds(new Set());
    onArtworksUpdated(updated);
    setToastMessage(`Deleted ${count} selected painting(s)`);
    setIsDeleteSelectedModalOpen(false);
  };

  const handleRemovePlaceholders = () => {
    const updated = StorageService.removePlaceholderArtworks();
    setSelectedArtworkIds(new Set());
    onArtworksUpdated(updated);
    const removedCount = artworks.length - updated.length;
    setToastMessage(`Removed ${removedCount} placeholder painting(s). Current catalog now has ${updated.length} piece(s).`);
    setIsClearPlaceholdersModalOpen(false);
  };

  const handleConfirmClearAll = () => {
    StorageService.clearAllArtworks();
    setSelectedArtworkIds(new Set());
    onArtworksUpdated([]);
    setIsClearModalOpen(false);
    setToastMessage('Catalog wiped. All paintings have been cleared.');
  };

  const handleQuickStatusChange = (id: string, newStatus: ArtworkStatus) => {
    StorageService.updateStatus(id, newStatus);
    const updated = StorageService.getArtworks();
    onArtworksUpdated(updated);
  };

  const handleSaveNotificationEmails = (newEmails: string) => {
    const trimmed = newEmails.trim() || DEFAULT_STUDIO_NOTIFICATION_EMAILS;
    StorageService.setNotificationEmails(trimmed);
    setNotificationEmails(trimmed);
    setIsEditingEmails(false);
    setToastMessage(`Updated enquiry notification emails to: ${trimmed}`);
  };

  const handleUpdateEnquiryStatus = (id: string, status: 'new' | 'replied' | 'archived') => {
    const updated = StorageService.updateEnquiryStatus(id, status);
    setEnquiries(updated);
    setToastMessage(`Inquiry marked as "${status}"`);
  };

  const handleDeleteEnquiry = (id: string) => {
    if (!window.confirm('Delete this inquiry from the inbox?')) return;
    const updated = StorageService.deleteEnquiry(id);
    setEnquiries(updated);
    setToastMessage('Inquiry deleted from inbox');
  };

  const handleExportInquiriesCsv = () => {
    if (enquiries.length === 0) {
      setToastMessage('No inquiries to export');
      return;
    }
    const headers = ['id', 'date', 'customerName', 'customerEmail', 'customerPhone', 'artworkTitle', 'artworkSku', 'artworkPrice', 'shippingPreference', 'status', 'recipientEmails', 'message'];
    const rows = enquiries.map((e) => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.customerName.replace(/"/g, '""')}"`,
      `"${e.customerEmail.replace(/"/g, '""')}"`,
      `"${(e.customerPhone || '').replace(/"/g, '""')}"`,
      `"${(e.artworkTitle || '').replace(/"/g, '""')}"`,
      `"${(e.artworkSku || '').replace(/"/g, '""')}"`,
      e.artworkPrice || '',
      `"${e.shippingPreference}"`,
      `"${e.status}"`,
      `"${(e.recipientEmails || notificationEmails).replace(/"/g, '""')}"`,
      `"${e.message.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fifeart-inquiries-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage('Exported inquiries to CSV');
  };

  const handleSaveSeoSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    SeoService.saveSeoSettings(seoSettings);
    SeoService.applySeoToDom(seoSettings, artworks, faqsList);
    setToastMessage('SEO metadata & Schema.org JSON-LD updated and applied to site!');
  };

  const handleResetSeoDefaults = () => {
    setSeoSettings(DEFAULT_SEO_SETTINGS);
    SeoService.saveSeoSettings(DEFAULT_SEO_SETTINGS);
    SeoService.applySeoToDom(DEFAULT_SEO_SETTINGS, artworks, faqsList);
    setToastMessage('Reset SEO & Schema settings to default Scottish Art settings');
  };

  const needsAttention = (a: Artwork): boolean => {
    return (
      !a.title?.trim() ||
      !a.price ||
      a.price <= 0 ||
      !a.medium?.trim() ||
      !a.imageUrl?.trim()
    );
  };

  const attentionCount = artworks.filter(needsAttention).length;

  const filteredAdminArtworks = (() => {
    const list = artworks.filter((a) => {
      if (adminAttentionOnly && !needsAttention(a)) return false;
      const q = adminSearch.toLowerCase().trim();
      if (!q) {
        return adminStatusFilter === 'All' || a.status === adminStatusFilter;
      }
      const matchesSearch =
        a.title.toLowerCase().includes(q) ||
        a.sku.toLowerCase().includes(q) ||
        (a.orderNumber && a.orderNumber.toLowerCase().includes(q)) ||
        a.medium.toLowerCase().includes(q) ||
        (a.orientation && a.orientation.toLowerCase().includes(q)) ||
        (a.date && a.date.toLowerCase().includes(q)) ||
        (a.subjects && a.subjects.some((s) => s.toLowerCase().includes(q))) ||
        (a.tags && a.tags.some((t) => t.toLowerCase().includes(q)));
      const matchesStatus = adminStatusFilter === 'All' || a.status === adminStatusFilter;
      return matchesSearch && matchesStatus;
    });
    return [...list].sort((a, b) => {
      switch (adminSortBy) {
        case 'alpha-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'alpha-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'latest':
        default: {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        }
      }
    });
  })();

  const placeholderCount = artworks.filter((a) => StorageService.isPlaceholderArtwork(a)).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 bg-stone-50 gap-2">
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-300 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-base sm:text-lg font-medium text-stone-900 truncate">
                Fife Art Studio Portal
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">
                Manage paintings, prices, status badges, inquiries & catalog inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="admin-modal-close"
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Barrier if not logged in */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto my-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-xl font-medium text-stone-900">
              Artist Studio Login
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Enter your studio access password to upload paintings, mark items as sold, adjust prices, or manage your inventory.
            </p>

            <form onSubmit={handleLogin} className="space-y-3 pt-2">
              <div>
                <input
                  type="password"
                  id="admin-password-input"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter studio password..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-center text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-800"
                />
                {authError && (
                  <p className="text-xs text-rose-600 mt-1.5 font-medium">{authError}</p>
                )}
              </div>

              <button
                type="submit"
                id="admin-login-submit-btn"
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium transition-colors cursor-pointer"
              >
                Access Studio Portal
              </button>

              {IS_CUSTOM_ADMIN_PASSWORD_SET ? (
                <p className="text-[11px] text-stone-500 text-center">
                  Protected: Authorized password configured via environment variable (<code className="font-mono text-stone-700">VITE_ADMIN_PASSWORD</code>).
                </p>
              ) : (
                <p className="text-[11px] text-stone-400 text-center">
                  Default password for demonstration: <code className="text-stone-700 font-mono">{DEFAULT_ADMIN_PASSWORD}</code>
                </p>
              )}
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Nav Tabs */}
            <div className="flex items-center space-x-1 px-3 sm:px-6 border-b border-stone-200 bg-stone-100/60 overflow-x-auto no-scrollbar w-full min-w-0">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'inventory'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                Inventory List ({artworks.length})
              </button>
              <button
                onClick={handleOpenAddForm}
                className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'add'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                {editingArtworkId ? 'Edit Artwork' : 'Add New Painting'}
              </button>
              <button
                onClick={() => {
                  setEnquiries(StorageService.getEnquiries());
                  setActiveTab('inbox');
                }}
                className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'inbox'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Inbox className="w-3.5 h-3.5 inline mr-1" />
                Inquiries Inbox ({enquiries.length})
              </button>
              <button
                onClick={() => {
                  setSeoSettings(SeoService.getSeoSettings());
                  setFaqsList(SeoService.getFaqs());
                  setActiveTab('seo');
                }}
                className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'seo'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5 inline mr-1" />
                SEO, Schema & AEO
              </button>
              <button
                onClick={() => {
                  setFaqsList(SeoService.getFaqs());
                  setActiveTab('content');
                }}
                className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'content'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                FAQs, About & Legal
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'import'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <FileUp className="w-3.5 h-3.5 inline mr-1" />
                Bulk Import (CSV / Teable)
              </button>
              <button
                onClick={() => setActiveTab('sanity')}
                className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'sanity'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 inline mr-1" />
                Sanity Studio Schema & Script
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: INVENTORY MANAGEMENT */}
              {activeTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Filter by title, SKU, or medium..."
                        className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs w-56 sm:w-64 text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                      <select
                        value={adminStatusFilter}
                        onChange={(e) => setAdminStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                      >
                        <option value="All">All Statuses</option>
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={adminSortBy}
                        onChange={(e) => setAdminSortBy(e.target.value as typeof adminSortBy)}
                        aria-label="Sort artworks"
                        className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                      >
                        <option value="latest">Latest First</option>
                        <option value="alpha-asc">Title A–Z</option>
                        <option value="alpha-desc">Title Z–A</option>
                        <option value="price-asc">Price Low → High</option>
                        <option value="price-desc">Price High → Low</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setAdminAttentionOnly((v) => !v)}
                        title="Show only items missing title, price, medium or image"
                        className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          adminAttentionOnly
                            ? 'bg-amber-900 text-white border-amber-900'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:text-stone-900'
                        }`}
                      >
                        Needs attention ({attentionCount})
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span>
                        Showing {filteredAdminArtworks.length} of {artworks.length}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                          catalogSource === 'sanity'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                        title={
                          catalogSource === 'sanity'
                            ? 'Catalog loaded live from Sanity'
                            : 'Showing browser-local copy — Sanity unreachable. Check CORS/env, then reload.'
                        }
                      >
                        {catalogSource === 'sanity' ? '● Live: Sanity' : '● Local only'}
                      </span>
                      {onReloadCatalog && (
                        <button
                          type="button"
                          onClick={onReloadCatalog}
                          className="underline hover:text-stone-800 cursor-pointer"
                        >
                          Reload from Sanity
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {placeholderCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsClearPlaceholdersModalOpen(true)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Remove all placeholder paintings and stock photos immediately"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Remove Placeholders ({placeholderCount})</span>
                        </button>
                      )}

                      {artworks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsClearModalOpen(true)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          title="Erase all current paintings to clear placeholders"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear All ({artworks.length})</span>
                        </button>
                      )}

                      <button
                        onClick={handleOpenAddForm}
                        className="inline-flex items-center justify-center space-x-1 px-3.5 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload New Piece</span>
                      </button>
                    </div>
                  </div>

                  {/* Multi-select Action Bar */}
                  {selectedArtworkIds.size > 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{selectedArtworkIds.size}</span>
                        <span>painting{selectedArtworkIds.size > 1 ? 's' : ''} selected</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedArtworkIds(new Set())}
                          className="px-2 py-1 text-stone-600 hover:text-stone-900 text-xs font-medium cursor-pointer"
                        >
                          Deselect All
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteSelected}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Selected ({selectedArtworkIds.size})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Artwork Table */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    {filteredAdminArtworks.length > 0 ? (
                      <div className="overflow-x-auto max-h-[55vh]">
                        <table className="w-full text-left text-xs text-stone-700">
                          <thead className="bg-stone-50 border-b border-stone-200 sticky top-0 font-medium text-stone-500 uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="py-3 px-3 w-8 text-center">
                                <input
                                  type="checkbox"
                                  aria-label="Select all artworks"
                                  checked={
                                    filteredAdminArtworks.length > 0 &&
                                    selectedArtworkIds.size === filteredAdminArtworks.length
                                  }
                                  onChange={handleToggleSelectAll}
                                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-800 cursor-pointer"
                                />
                              </th>
                              <th className="py-3 px-3">Artwork & Title</th>
                              <th className="py-3 px-3">Order # / SKU</th>
                              <th className="py-3 px-3">Medium & Orientation</th>
                              <th className="py-3 px-3">Dimensions</th>
                              <th className="py-3 px-3">Price</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {filteredAdminArtworks.map((art) => {
                              const isSelected = selectedArtworkIds.has(art.id);
                              return (
                                <tr
                                  key={art.id}
                                  className={`transition-colors ${
                                    isSelected ? 'bg-amber-50/40' : 'hover:bg-stone-50/70'
                                  }`}
                                >
                                  <td className="py-2.5 px-3 w-8 text-center">
                                    <input
                                      type="checkbox"
                                      aria-label={`Select ${art.title}`}
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectArtwork(art.id)}
                                      className="rounded border-stone-300 text-stone-900 focus:ring-stone-800 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center space-x-2.5">
                                      <img
                                        src={art.imageUrl}
                                        alt={art.title}
                                        className="w-11 h-11 object-cover rounded-md border border-stone-200 shrink-0 bg-stone-100 shadow-2xs"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            generateCanvasPlaceholder(art.title, art.medium);
                                        }}
                                      />
                                      <div className="min-w-0">
                                        <p className="font-serif text-xs font-semibold text-stone-900 truncate max-w-[190px]">
                                          {art.title}
                                        </p>
                                        <p className="text-[10px] text-stone-400 truncate">
                                          {art.date || art.year || '2024'} • {art.tags?.[0] || 'Original'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600">
                                    <div className="font-medium text-stone-900">{art.orderNumber || art.sku}</div>
                                    {art.orderNumber && art.orderNumber !== art.sku && (
                                      <div className="text-[10px] text-stone-400">SKU: {art.sku}</div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="text-stone-800 font-medium text-xs">{art.medium}</div>
                                    <div className="flex items-center space-x-1.5 mt-0.5">
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                                        {art.orientation || 'Landscape'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-stone-700 text-xs">
                                    {art.dimensions}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-stone-900">
                                    £{art.price}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <select
                                      value={art.status}
                                      onChange={(e) =>
                                        handleQuickStatusChange(art.id, e.target.value as ArtworkStatus)
                                      }
                                      className="text-xs font-medium px-2 py-1 rounded-md border border-stone-200 bg-stone-50 cursor-pointer"
                                    >
                                      {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2.5 px-3 text-right space-x-1">
                                    <button
                                      onClick={() => onGenerateCertificate(art)}
                                      className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded transition-colors inline-block cursor-pointer"
                                      title="Generate Certificate of Authenticity"
                                    >
                                      <Award className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleEditArtwork(art)}
                                      className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer transition-colors"
                                      title="Edit details (all Teable fields)"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteArtwork(art)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                      title="Delete artwork"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center space-y-3">
                        <p className="font-serif text-base font-medium text-stone-800">
                          {artworks.length === 0 ? 'No Paintings in Catalog' : 'No matching artworks found'}
                        </p>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                          {artworks.length === 0
                            ? 'Your gallery catalog is currently empty. Use the Bulk Import tab to upload your Teable CSV or click Upload New Piece.'
                            : 'Try adjusting your search query or status filter to find pieces.'}
                        </p>
                        {artworks.length === 0 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('import')}
                            className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 cursor-pointer"
                          >
                            <FileUp className="w-3.5 h-3.5" />
                            <span>Go to Bulk Import (CSV / Teable)</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ADD / EDIT ARTWORK FORM */}
              {activeTab === 'add' && (
                <form onSubmit={handleSaveArtworkForm} className="max-w-3xl mx-auto space-y-5 pb-8">
                  {/* Top Bar with navigation and quick delete */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('inventory')}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        <span>Back to Inventory</span>
                      </button>
                      <h4 className="font-serif text-lg font-medium text-stone-900 truncate">
                        {editingArtworkId ? `Edit: ${formTitle || 'Artwork'}` : 'Upload New Scottish Artwork'}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2">
                      {editingArtworkId && (
                        <button
                          type="button"
                          onClick={() => {
                            const art = artworks.find((a) => a.id === editingArtworkId);
                            if (art) handleDeleteArtwork(art);
                          }}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Artwork</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab('inventory')}
                        className="px-3 py-1.5 border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* SECTION 1: IMAGE / ATTACHMENTS (Teable: Attachments / Image) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-amber-700" />
                        <span className="font-semibold text-xs text-stone-900">Artwork Image & Photo</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 font-semibold border border-amber-200">
                          Teable: Attachments
                        </span>
                      </div>
                      {formImageUrl && (
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setIsEnlargeImageOpen(true)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Inspect high resolution image"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Fullscreen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormImageUrl('')}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Remove this image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear Photo</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Image Preview & Dropzone */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleImageDrop}
                      className="p-4 rounded-xl bg-white border-2 border-dashed border-stone-300 hover:border-amber-500 transition-colors text-center space-y-3"
                    >
                      {formImageUrl ? (
                        <div className="space-y-2">
                          <div className="relative inline-block group">
                            <img
                              src={formImageUrl}
                              alt="Artwork Preview"
                              className="max-h-56 max-w-full rounded-lg object-contain border border-stone-200 mx-auto shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = generateCanvasPlaceholder(
                                  formTitle || 'Scottish Artwork',
                                  formMedium
                                );
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setIsEnlargeImageOpen(true)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-900 text-white shadow-md cursor-pointer transition-transform hover:scale-105"
                              title="Enlarge Image"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Drop a new image here or click Browse below to replace this picture.
                          </p>
                        </div>
                      ) : (
                        <div className="py-6 space-y-2">
                          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6 text-stone-500" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-stone-800">
                              Drag and drop painting photo here, or browse from computer
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Supports JPG, PNG, WEBP. Automatically optimized for retina displays.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-stone-100">
                        <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-2xs transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formImageUrl ? 'Browse Replacement Photo' : 'Select Image File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const placeholder = generateCanvasPlaceholder(
                              formTitle || 'Scottish Painting',
                              formMedium || 'Oil on canvas'
                            );
                            setFormImageUrl(placeholder);
                            setImageCompressionNote('Generated custom Studio Canvas artwork graphic');
                          }}
                          className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          title="Generate a clean Fife Art Studio digital canvas preview"
                        >
                          <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                          <span>Generate Studio Canvas</span>
                        </button>
                      </div>

                      {/* Direct URL input */}
                      <div className="flex items-center justify-center space-x-2 pt-1">
                        <span className="text-xs text-stone-400">or image link:</span>
                        <input
                          type="url"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          placeholder="https://... (Teable attachment link or web URL)"
                          className="px-2.5 py-1 text-xs bg-stone-50 border border-stone-200 rounded-md w-64 text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      {imageCompressionNote && (
                        <p className="text-[11px] text-emerald-700 font-medium">
                          {imageCompressionNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: TITLE, ORDER NUMBER & SKU */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    <div className="sm:col-span-6">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          Painting Title *
                        </label>
                        <span className="text-[10px] uppercase font-mono text-stone-400">Teable: Title</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. Isle of May Puffins in Summer"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs font-medium"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          Order Number
                        </label>
                        <span className="text-[10px] uppercase font-mono text-stone-400">Teable: Order #</span>
                      </div>
                      <input
                        type="text"
                        value={formOrderNumber}
                        onChange={(e) => setFormOrderNumber(e.target.value)}
                        placeholder="e.g. 104 or FAF-001"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          SKU Code
                        </label>
                        <span className="text-[10px] uppercase font-mono text-stone-400">Teable: SKU</span>
                      </div>
                      <div className="flex space-x-1">
                        <input
                          type="text"
                          value={formSku}
                          onChange={(e) => setFormSku(e.target.value)}
                          placeholder="e.g. FAF-WLD-104"
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSku = generateAutoSku(formTags[0] || 'ART');
                            setFormSku(newSku);
                            if (!formOrderNumber) setFormOrderNumber(newSku);
                          }}
                          className="px-2 py-1 border border-stone-200 hover:bg-stone-100 rounded-lg text-[10px] text-stone-600 font-medium shrink-0"
                          title="Generate automatic SKU"
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: ORIENTATION, DATE & STATUS */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    {/* Orientation Selector */}
                    <div className="sm:col-span-5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          Orientation (Aspect Ratio) *
                        </label>
                        <span className="text-[10px] uppercase font-mono text-stone-400">
                          Teable: Orientation
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['Landscape', 'Portrait', 'Square'] as ArtworkOrientation[]).map((orient) => {
                          const isSelected = formOrientation === orient;
                          return (
                            <button
                              type="button"
                              key={orient}
                              onClick={() => setFormOrientation(orient)}
                              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                              }`}
                            >
                              {/* Visual ratio preview icon */}
                              {orient === 'Landscape' && (
                                <div
                                  className={`w-6 h-4 rounded-xs border mb-1 ${
                                    isSelected ? 'border-amber-300 bg-stone-800' : 'border-stone-400 bg-stone-100'
                                  }`}
                                />
                              )}
                              {orient === 'Portrait' && (
                                <div
                                  className={`w-4 h-6 rounded-xs border mb-1 ${
                                    isSelected ? 'border-amber-300 bg-stone-800' : 'border-stone-400 bg-stone-100'
                                  }`}
                                />
                              )}
                              {orient === 'Square' && (
                                <div
                                  className={`w-5 h-5 rounded-xs border mb-1 ${
                                    isSelected ? 'border-amber-300 bg-stone-800' : 'border-stone-400 bg-stone-100'
                                  }`}
                                />
                              )}
                              <span className="text-[11px]">{orient}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date / Created Date */}
                    <div className="sm:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          Date / Year Created
                        </label>
                        <span className="text-[10px] uppercase font-mono text-stone-400">Teable: Date</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          placeholder="e.g. 2024, May 2023"
                          className="w-full pl-8 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs"
                        />
                        <Calendar className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    {/* Status Label */}
                    <div className="sm:col-span-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          Availability Status *
                        </label>
                        <span className="text-[10px] uppercase font-mono text-stone-400">Teable: Status</span>
                      </div>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as ArtworkStatus)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs cursor-pointer font-medium"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* SECTION 4: MEDIUM & DIMENSIONS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Medium (eg. oil, sketch) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          Medium / Technique (e.g. Oil, Sketch) *
                        </label>
                        <span className="text-[10px] uppercase font-mono text-stone-400">Teable: Medium</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={formMedium}
                        onChange={(e) => setFormMedium(e.target.value)}
                        placeholder="e.g. Oil on canvas, Sketch (Graphite)"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs font-medium"
                      />
                      {/* Medium Presets */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {MEDIUM_PRESETS.map((m) => (
                          <button
                            type="button"
                            key={m}
                            onClick={() => setFormMedium(m)}
                            className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                              formMedium === m
                                ? 'bg-stone-900 text-white border-stone-900 font-medium'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          Dimensions (Metric & Imperial) *
                        </label>
                        <span className="text-[10px] uppercase font-mono text-stone-400">
                          Teable: Dimensions
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        value={formDimensions}
                        onChange={(e) => setFormDimensions(e.target.value)}
                        placeholder="e.g. 50 x 40 cm (19.7 x 15.7 in)"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs font-medium"
                      />
                      {/* Dimension Presets */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {DIMENSION_PRESETS.map((dim) => (
                          <button
                            type="button"
                            key={dim}
                            onClick={() => setFormDimensions(dim)}
                            className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                              formDimensions === dim
                                ? 'bg-stone-900 text-white border-stone-900 font-medium'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200'
                            }`}
                          >
                            {dim.split(' ')[0]} cm
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5: SUBJECTS (Teable: Subjects) */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Compass className="w-3.5 h-3.5 text-amber-700" />
                        <label className="text-xs font-semibold text-stone-900">
                          Artwork Subjects & Scottish Themes
                        </label>
                      </div>
                      <span className="text-[10px] uppercase font-mono text-stone-400">Teable: Subjects</span>
                    </div>

                    {/* Active Subjects Chips */}
                    <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 bg-white rounded-lg border border-stone-200">
                      {formSubjects.length === 0 ? (
                        <span className="text-[11px] text-stone-400 italic">
                          No subjects assigned yet. Select presets below or type a custom theme.
                        </span>
                      ) : (
                        formSubjects.map((sub) => (
                          <span
                            key={sub}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950 text-amber-100 shadow-2xs"
                          >
                            <span>{sub}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(sub)}
                              className="text-amber-400 hover:text-white cursor-pointer ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Quick Preset Buttons for Subjects */}
                    <div className="flex flex-wrap gap-1">
                      {SUBJECT_PRESETS.map((preset) => {
                        const isIncluded = formSubjects.includes(preset);
                        return (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => {
                              if (isIncluded) {
                                handleRemoveSubject(preset);
                              } else {
                                handleAddSubject(preset);
                              }
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                              isIncluded
                                ? 'bg-amber-800 text-white border-amber-900 font-semibold'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            {preset} {isIncluded ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Subject Adder */}
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        value={formCustomSubject}
                        onChange={(e) => setFormCustomSubject(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubject();
                          }
                        }}
                        placeholder="Add custom subject (e.g. Bass Rock Gannets, Fife Bothy)..."
                        className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSubject()}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-2xs cursor-pointer"
                      >
                        Add Subject
                      </button>
                    </div>
                  </div>

                  {/* SECTION 6: TAGS & CATEGORIES (Teable: Tags) */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-700" />
                        <label className="text-xs font-semibold text-stone-900">
                          Tags & Catalog Filter Categories
                        </label>
                      </div>
                      <span className="text-[10px] uppercase font-mono text-stone-400">Teable: Tags</span>
                    </div>

                    {/* Active Tags */}
                    <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 bg-white rounded-lg border border-stone-200">
                      {formTags.length === 0 ? (
                        <span className="text-[11px] text-stone-400 italic">No tags selected.</span>
                      ) : (
                        formTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-900 text-white shadow-2xs"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-stone-400 hover:text-white cursor-pointer ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Preset Available Tags */}
                    <div className="flex flex-wrap gap-1">
                      {AVAILABLE_TAGS.filter((t) => t !== 'All').map((tag) => {
                        const hasTag = formTags.includes(tag);
                        return (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => {
                              if (hasTag) {
                                handleRemoveTag(tag);
                              } else {
                                setFormTags([...formTags, tag]);
                              }
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                              hasTag
                                ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            {tag} {hasTag ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Tag Adder */}
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        value={formCustomTag}
                        onChange={(e) => setFormCustomTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomTag();
                          }
                        }}
                        placeholder="Add custom tag (e.g. Limited Edition, Framed, Exhibition)..."
                        className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTag}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-2xs cursor-pointer"
                      >
                        Add Tag
                      </button>
                    </div>
                  </div>

                  {/* SECTION 7: PRICE & FEATURED */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          Price (£ GBP) *
                        </label>
                        <span className="text-[10px] uppercase font-mono text-stone-400">Teable: Price</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-stone-500 text-xs font-medium">£</span>
                        <input
                          type="number"
                          required
                          min={1}
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value ? Number(e.target.value) : '')}
                          className="w-full pl-7 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">
                          Original Price (Optional)
                        </label>
                        <span className="text-[10px] uppercase font-mono text-stone-400">Teable: Original</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-stone-500 text-xs font-medium">£</span>
                        <input
                          type="number"
                          min={1}
                          value={formOriginalPrice}
                          onChange={(e) =>
                            setFormOriginalPrice(e.target.value ? Number(e.target.value) : '')
                          }
                          placeholder="e.g. 420"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-4 sm:pt-0">
                      <input
                        type="checkbox"
                        id="form-featured"
                        checked={formFeatured}
                        onChange={(e) => setFormFeatured(e.target.checked)}
                        className="rounded border-stone-300 text-stone-900 focus:ring-stone-800 cursor-pointer w-4 h-4"
                      />
                      <label htmlFor="form-featured" className="text-xs font-medium text-stone-800 cursor-pointer">
                        Feature in curated highlights on homepage
                      </label>
                    </div>
                  </div>

                  {/* SECTION 8: DESCRIPTION */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-stone-700">
                        Artwork Description, Technique & Provenance
                      </label>
                      <span className="text-[10px] uppercase font-mono text-stone-400">
                        Teable: Description / Notes
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Enter details on the Scottish landscape, coastal location, impasto technique, or frame details..."
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 shadow-2xs leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1">
                      <span>Full descriptions appear in the visitor artwork modal and certificate.</span>
                      <span>{formDescription.length} characters</span>
                    </div>
                  </div>

                  {/* SECTION 9: EXTRA TEABLE CSV COLUMNS */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-xs font-semibold text-stone-900">
                          Custom Teable CSV Columns & Extra Metadata
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono text-stone-400">
                        Teable: Custom Fields
                      </span>
                    </div>

                    {Object.keys(formExtraFields).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(formExtraFields).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-stone-200">
                            <span className="text-xs font-mono font-medium text-stone-800 w-1/3 truncate" title={key}>
                              {key}:
                            </span>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleUpdateExtraField(key, e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs bg-stone-50 border border-stone-200 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraField(key)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Delete this custom field"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-stone-500 italic">
                        No additional custom columns recorded. Any extra columns in your uploaded Teable CSV (e.g. Location, Framing, Exhibition) will appear here.
                      </p>
                    )}

                    {/* Add Custom Field row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-stone-200">
                      <input
                        type="text"
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                        placeholder="Column name (e.g. Framing, Location)"
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs sm:w-1/3 text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                      <input
                        type="text"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        placeholder="Field value"
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs flex-1 text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                      <button
                        type="button"
                        onClick={handleAddExtraField}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
                      >
                        + Add Column
                      </button>
                    </div>
                  </div>

                  {/* FORM ACTIONS (SUBMIT / DELETE / CANCEL) */}
                  <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div>
                      {editingArtworkId ? (
                        <button
                          type="button"
                          onClick={() => {
                            const art = artworks.find((a) => a.id === editingArtworkId);
                            if (art) handleDeleteArtwork(art);
                          }}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer w-full sm:w-auto justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete This Artwork</span>
                        </button>
                      ) : (
                        <span className="text-xs text-stone-400">
                          All changes are instantly saved to local storage catalog.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('inventory')}
                        className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-medium hover:bg-stone-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessingImage}
                        className="inline-flex items-center space-x-2 px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{editingArtworkId ? 'Save All Changes' : 'Publish Artwork to Gallery'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 3: INQUIRIES INBOX */}
              {activeTab === 'inbox' && (
                <div className="space-y-5">
                  {/* Email Routing Notice & Configuration */}
                  <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-2.5">
                        <Mail className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                            Studio Notification Inboxes
                          </h4>
                          <p className="text-xs text-stone-700 mt-0.5">
                            Customer order requests & inquiries are delivered to:
                          </p>
                          {!isEditingEmails ? (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {notificationEmails.split(',').map((email) => (
                                <span
                                  key={email}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-white text-stone-900 border border-amber-300 shadow-2xs"
                                >
                                  {email.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input
                                type="text"
                                value={emailsDraft}
                                onChange={(e) => setEmailsDraft(e.target.value)}
                                placeholder="nancyberrykdy@gmail.com, fifeart@dynamicmike.com"
                                className="px-3 py-1.5 bg-white border border-amber-400 rounded-lg text-xs font-mono text-stone-900 w-full sm:w-96 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                              />
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveNotificationEmails(emailsDraft)}
                                  className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 cursor-pointer"
                                >
                                  Save Inboxes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsEditingEmails(false)}
                                  className="px-3 py-1.5 border border-stone-300 bg-white text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-50 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {!isEditingEmails && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmailsDraft(notificationEmails);
                              setIsEditingEmails(true);
                            }}
                            className="px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/60 text-stone-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                            Edit Inboxes
                          </button>
                        )}
                        <a
                          href={`mailto:${encodeURIComponent(
                            notificationEmails
                          )}?subject=${encodeURIComponent(
                            'Fife Art Studio: Email Routing Test'
                          )}&body=${encodeURIComponent(
                            'This is a verification test to confirm notifications arrive at nancyberrykdy@gmail.com and fifeart@dynamicmike.com.'
                          )}`}
                          className="px-2.5 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-lg text-xs font-medium transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-stone-600" />
                          <span>Test Inboxes</span>
                        </a>
                        <button
                          type="button"
                          onClick={handleExportInquiriesCsv}
                          className="px-2.5 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-lg text-xs font-medium transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-stone-600" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filter & Count Header */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
                    <div>
                      <h4 className="font-serif text-lg font-medium text-stone-900">
                        Customer Inquiries Inbox ({enquiries.length})
                      </h4>
                      <p className="text-xs text-stone-500">
                        All order requests submitted via website enquiry modal
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center space-x-1 p-1 bg-stone-100 rounded-lg self-start sm:self-auto">
                      {(['all', 'new', 'replied', 'archived'] as const).map((filter) => {
                        const count =
                          filter === 'all'
                            ? enquiries.length
                            : enquiries.filter((e) => e.status === filter).length;
                        return (
                          <button
                            key={filter}
                            onClick={() => setInquiryFilter(filter)}
                            className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                              inquiryFilter === filter
                                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            {filter} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Enquiries Listing */}
                  {enquiries.filter((e) => inquiryFilter === 'all' || e.status === inquiryFilter).length === 0 ? (
                    <div className="text-center py-12 text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p className="text-xs font-medium">No inquiries in this category.</p>
                      <p className="text-[11px] mt-1 text-stone-500">
                        Enquiries submitted via the gallery will appear here and route to {notificationEmails}.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {enquiries
                        .filter((e) => inquiryFilter === 'all' || e.status === inquiryFilter)
                        .map((enq) => {
                          const replyMailto = `mailto:${enq.customerEmail}?cc=${encodeURIComponent(
                            notificationEmails
                          )}&subject=Re: Fife Art Enquiry - ${encodeURIComponent(
                            enq.artworkTitle || 'Original Scottish Painting'
                          )} (${enq.artworkSku || 'Art'})`;

                          const forwardMailto = `mailto:${encodeURIComponent(
                            notificationEmails
                          )}?subject=Fwd: Fife Art Enquiry from ${encodeURIComponent(
                            enq.customerName
                          )}&body=${encodeURIComponent(
                            `Customer: ${enq.customerName} (${enq.customerEmail}, ${
                              enq.customerPhone || 'No phone'
                            })\nArtwork: ${enq.artworkTitle} (${enq.artworkSku}) - £${
                              enq.artworkPrice
                            }\nShipping: ${enq.shippingPreference}\n\nMessage:\n${enq.message}`
                          )}`;

                          return (
                            <div
                              key={enq.id}
                              className="p-4.5 rounded-xl bg-stone-50 border border-stone-200 space-y-3 shadow-2xs transition-all hover:border-stone-300"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-stone-900 text-sm">
                                      {enq.customerName}
                                    </span>
                                    <span className="text-xs font-mono text-stone-600">
                                      &lt;{enq.customerEmail}&gt;
                                    </span>
                                    {enq.customerPhone && (
                                      <span className="text-xs text-stone-600 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                                        📞 {enq.customerPhone}
                                      </span>
                                    )}
                                    {/* Status Badge */}
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                        enq.status === 'new'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : enq.status === 'replied'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-stone-200 text-stone-700'
                                      }`}
                                    >
                                      {enq.status}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2 text-xs text-amber-900 font-medium">
                                    <span>
                                      Regarding: <strong>{enq.artworkTitle}</strong> ({enq.artworkSku}) • £{enq.artworkPrice}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-[11px] font-mono text-stone-400 block">
                                    {new Date(enq.date).toLocaleDateString()} {new Date(enq.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="text-[10px] text-stone-400 font-mono">
                                    ID: {enq.id}
                                  </span>
                                </div>
                              </div>

                              {/* Message quotation */}
                              <div className="bg-white p-3 rounded-lg border border-stone-200 text-xs text-stone-800 whitespace-pre-line leading-relaxed shadow-2xs">
                                {enq.message}
                              </div>

                              {/* Enquiry Footer with Delivery info & Notification recipients */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200/80 text-xs text-stone-500">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="bg-stone-200/70 px-2 py-0.5 rounded-md text-[11px] font-medium text-stone-700">
                                    🚚 {enq.shippingPreference.replace('_', ' ')}
                                  </span>
                                  <span className="text-[11px] text-stone-500">
                                    Notified inboxes:{' '}
                                    <strong className="font-mono text-stone-700">
                                      {enq.recipientEmails || notificationEmails}
                                    </strong>
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Quick Status Changers */}
                                  {enq.status !== 'replied' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateEnquiryStatus(enq.id, 'replied')}
                                      className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                                    >
                                      Mark Replied
                                    </button>
                                  )}
                                  {enq.status !== 'archived' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateEnquiryStatus(enq.id, 'archived')}
                                      className="px-2 py-1 bg-white hover:bg-stone-100 text-stone-600 border border-stone-300 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                                    >
                                      Archive
                                    </button>
                                  )}

                                  <a
                                    href={forwardMailto}
                                    className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-md text-[11px] font-medium transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Share2 className="w-3 h-3 text-stone-500" />
                                    <span>Forward</span>
                                  </a>

                                  <a
                                    href={replyMailto}
                                    onClick={() => handleUpdateEnquiryStatus(enq.id, 'replied')}
                                    className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-[11px] font-medium transition-colors inline-flex items-center space-x-1 cursor-pointer shadow-2xs"
                                  >
                                    <Mail className="w-3 h-3 text-amber-300" />
                                    <span>Reply with CC</span>
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEnquiry(enq.id)}
                                    title="Delete inquiry"
                                    className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SEO, SCHEMA & AEO (ANSWER ENGINE OPTIMIZATION) */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  {/* SEO Tab Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                    <div>
                      <h4 className="font-serif text-lg font-medium text-stone-900 flex items-center space-x-2">
                        <Globe className="w-5 h-5 text-amber-700" />
                        <span>SEO, Schema & AEO Engine</span>
                      </h4>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Manage search engine meta tags, local Fife art studio knowledge graph, and dynamic Schema.org JSON-LD (@graph) for Google, Bing & AI Answer Engines.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetSeoDefaults}
                        className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                      >
                        Restore Scottish Defaults
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const ldJson = SeoService.generateLdJsonSchema(seoSettings, artworks, faqsList);
                          navigator.clipboard.writeText(JSON.stringify(ldJson, null, 2));
                          setCopiedLdJson(true);
                          setToastMessage('Copied Schema.org JSON-LD to clipboard');
                          setTimeout(() => setCopiedLdJson(false), 2500);
                        }}
                        className="px-3 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-medium transition-colors inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      >
                        {copiedLdJson ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-stone-500" />
                        )}
                        <span>{copiedLdJson ? 'Copied JSON-LD' : 'Copy JSON-LD'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveSeoSettings()}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-amber-300" />
                        <span>Save & Apply SEO Changes</span>
                      </button>
                    </div>
                  </div>

                  {/* Google SERP Visual Simulator Card */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      Google Search Result Simulator (Live Preview)
                    </span>
                    <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-2xs max-w-2xl space-y-1">
                      <div className="flex items-center space-x-2 text-xs text-stone-600">
                        <div className="w-4 h-4 rounded-full bg-amber-800 text-white flex items-center justify-center text-[9px] font-serif font-bold">
                          F
                        </div>
                        <span className="text-xs text-stone-800 font-medium">fifeart.co.uk</span>
                        <span className="text-stone-400">› gallery › paintings</span>
                      </div>
                      <h5 className="text-base sm:text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                        {seoSettings.siteTitle || 'Fife Art | Original Scottish Landscape & Wildlife Paintings'}
                      </h5>
                      <p className="text-xs sm:text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                        {seoSettings.metaDescription ||
                          'Original Scottish paintings by artist Nancy Berry in Kirkcaldy, Fife. High-quality oil landscapes, East Neuk harbours, highlands, and native wildlife.'}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#006621]">
                        <span>✓ Kirkcaldy, Fife Studio</span>
                        <span>•</span>
                        <span>✓ UK Courier & Global Shipping</span>
                        <span>•</span>
                        <span>✓ Certificate of Authenticity</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Primary Search Metadata */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-semibold text-stone-900 uppercase tracking-wider border-b border-stone-200 pb-1.5">
                      1. Core Search Engine Meta Tags
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Site Title */}
                      <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium text-stone-700">
                            Page Title (`&lt;title&gt;` and `og:title`)
                          </label>
                          <span
                            className={`text-[10px] font-mono ${
                              seoSettings.siteTitle.length > 60 ? 'text-amber-600' : 'text-stone-400'
                            }`}
                          >
                            {seoSettings.siteTitle.length}/60 chars (Recommended: 50-60)
                          </span>
                        </div>
                        <input
                          type="text"
                          value={seoSettings.siteTitle}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, siteTitle: e.target.value }))
                          }
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      {/* Meta Description */}
                      <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium text-stone-700">
                            Meta Description (`description` and `og:description`)
                          </label>
                          <span
                            className={`text-[10px] font-mono ${
                              seoSettings.metaDescription.length > 160 ? 'text-amber-600' : 'text-stone-400'
                            }`}
                          >
                            {seoSettings.metaDescription.length}/160 chars (Recommended: 140-160)
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={seoSettings.metaDescription}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, metaDescription: e.target.value }))
                          }
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800 leading-relaxed"
                        />
                      </div>

                      {/* Keywords */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Target Keywords (comma separated)
                        </label>
                        <input
                          type="text"
                          value={seoSettings.keywords}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, keywords: e.target.value }))
                          }
                          placeholder="Fife Art, Nancy Berry, Scottish art, oil paintings, Kirkcaldy, East Neuk..."
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      {/* Canonical URL */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Canonical Website URL
                        </label>
                        <input
                          type="url"
                          value={seoSettings.canonicalUrl}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, canonicalUrl: e.target.value }))
                          }
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      {/* OpenGraph Social Image */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Social Share Image URL (og:image)
                        </label>
                        <input
                          type="url"
                          value={seoSettings.ogImageUrl}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, ogImageUrl: e.target.value }))
                          }
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: GEO & Local Business Knowledge Graph */}
                  <div className="space-y-4">
                    <div className="border-b border-stone-200 pb-1.5">
                      <h5 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                        2. GEO Location & Local Business Knowledge Graph (Kirkcaldy & Fife)
                      </h5>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Populates ArtGallery and LocalBusiness Schema to establish authority in Kirkcaldy, Fife, and Scottish art directories.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Artist Full Name
                        </label>
                        <input
                          type="text"
                          value={seoSettings.artistName}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, artistName: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Studio / Business Name
                        </label>
                        <input
                          type="text"
                          value={seoSettings.businessName}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, businessName: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Notification & Contact Inboxes
                        </label>
                        <input
                          type="text"
                          value={seoSettings.contactEmails}
                          onChange={(e) => {
                            setSeoSettings((prev) => ({ ...prev, contactEmails: e.target.value }));
                            setNotificationEmails(e.target.value);
                            StorageService.setNotificationEmails(e.target.value);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Town / Locality (GEO)
                        </label>
                        <input
                          type="text"
                          value={seoSettings.addressLocality}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, addressLocality: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Region / County
                        </label>
                        <input
                          type="text"
                          value={seoSettings.addressRegion}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, addressRegion: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Postcode / ZIP
                        </label>
                        <input
                          type="text"
                          value={seoSettings.postalCode}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, postalCode: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Geo Latitude (Kirkcaldy)
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={seoSettings.geoLatitude}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({
                              ...prev,
                              geoLatitude: parseFloat(e.target.value) || 56.1107,
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Geo Longitude (Kirkcaldy)
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={seoSettings.geoLongitude}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({
                              ...prev,
                              geoLongitude: parseFloat(e.target.value) || -3.1674,
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Price Range Indicator
                        </label>
                        <input
                          type="text"
                          value={seoSettings.priceRange}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, priceRange: e.target.value }))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Schema.org Graph Toggles */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold text-stone-900 uppercase tracking-wider border-b border-stone-200 pb-1.5">
                      3. Schema.org JSON-LD Graph Modules
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <label className="flex items-start space-x-2.5 p-3 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-colors">
                        <input
                          type="checkbox"
                          checked={seoSettings.enableLdJson}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, enableLdJson: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-stone-900 focus:ring-stone-800"
                        />
                        <div>
                          <span className="block text-xs font-semibold text-stone-900">
                            Master JSON-LD Script
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Injects Schema.org script tag into &lt;head&gt;
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start space-x-2.5 p-3 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-colors">
                        <input
                          type="checkbox"
                          checked={seoSettings.enableArtGallerySchema}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({
                              ...prev,
                              enableArtGallerySchema: e.target.checked,
                            }))
                          }
                          className="mt-0.5 rounded text-stone-900 focus:ring-stone-800"
                        />
                        <div>
                          <span className="block text-xs font-semibold text-stone-900">
                            ArtGallery & LocalBusiness
                          </span>
                          <span className="text-[11px] text-stone-500">
                            GEO Kirkcaldy local studio entity
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start space-x-2.5 p-3 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-colors">
                        <input
                          type="checkbox"
                          checked={seoSettings.enableArtistSchema}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({
                              ...prev,
                              enableArtistSchema: e.target.checked,
                            }))
                          }
                          className="mt-0.5 rounded text-stone-900 focus:ring-stone-800"
                        />
                        <div>
                          <span className="block text-xs font-semibold text-stone-900">
                            VisualArtist / Person
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Nancy Berry artist bio & credentials
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start space-x-2.5 p-3 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-colors">
                        <input
                          type="checkbox"
                          checked={seoSettings.enableFaqSchema}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({ ...prev, enableFaqSchema: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-stone-900 focus:ring-stone-800"
                        />
                        <div>
                          <span className="block text-xs font-semibold text-stone-900">
                            FAQPage (AEO & AI Search)
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Feeds Google rich FAQ snippets & answer engines
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start space-x-2.5 p-3 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-colors">
                        <input
                          type="checkbox"
                          checked={seoSettings.enableProductCatalogSchema}
                          onChange={(e) =>
                            setSeoSettings((prev) => ({
                              ...prev,
                              enableProductCatalogSchema: e.target.checked,
                            }))
                          }
                          className="mt-0.5 rounded text-stone-900 focus:ring-stone-800"
                        />
                        <div>
                          <span className="block text-xs font-semibold text-stone-900">
                            ItemList / Artwork Catalog
                          </span>
                          <span className="text-[11px] text-stone-500">
                            VisualArtwork catalog with prices & SKU
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Section 4: Live Schema.org JSON-LD Inspector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                        4. Live Generated Schema.org JSON-LD Code
                      </span>
                      <a
                        href="https://search.google.com/test/rich-results"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-900 hover:underline inline-flex items-center space-x-1"
                      >
                        <span>Test in Google Rich Results Test</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <pre className="p-4 bg-stone-900 text-stone-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 border border-stone-800 leading-relaxed">
                        {JSON.stringify(
                          SeoService.generateLdJsonSchema(seoSettings, artworks, faqsList),
                          null,
                          2
                        )}
                      </pre>
                      <button
                        type="button"
                        onClick={() => {
                          const ldJson = SeoService.generateLdJsonSchema(seoSettings, artworks, faqsList);
                          navigator.clipboard.writeText(JSON.stringify(ldJson, null, 2));
                          setCopiedLdJson(true);
                          setToastMessage('Copied Schema.org JSON-LD to clipboard');
                          setTimeout(() => setCopiedLdJson(false), 2500);
                        }}
                        className="absolute top-3 right-3 px-2.5 py-1.5 bg-stone-800/90 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition-colors border border-stone-700 inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-stone-400" />
                        <span>{copiedLdJson ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 5: Homepage FAQ & AEO Inspection */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                      <div>
                        <h5 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                          5. Homepage Footer FAQ Synced Entries ({faqsList.length})
                        </h5>
                        <p className="text-[11px] text-stone-500">
                          These questions are rendered in the homepage footer FAQ accordion and injected into the FAQPage schema graph.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {faqsList.map((faq, i) => (
                        <div
                          key={faq.id}
                          className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-900">
                              {i + 1}. {faq.question}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white text-stone-600 border border-stone-200">
                              {faq.category}
                            </span>
                          </div>
                          <p className="text-stone-600 text-[11px] leading-relaxed line-clamp-2">
                            {faq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Save Action */}
                  <div className="pt-4 border-t border-stone-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveSeoSettings()}
                      className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center space-x-2 cursor-pointer shadow-sm"
                    >
                      <Check className="w-4 h-4 text-amber-300" />
                      <span>Save & Apply All SEO & Schema Changes</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: FAQS, ABOUT & LEGAL CONTENT MANAGEMENT */}
              {activeTab === 'content' && (
                <ContentEditorTab
                  faqs={faqsList}
                  onSaveFaqs={(updatedFaqs) => {
                    setFaqsList(updatedFaqs);
                    SeoService.saveFaqs(updatedFaqs);
                    if (onFaqsUpdated) onFaqsUpdated(updatedFaqs);
                  }}
                  onSaveAbout={(updatedAbout) => {
                    StorageService.saveAboutContent(updatedAbout);
                    if (onAboutContentUpdated) onAboutContentUpdated(updatedAbout);
                  }}
                  onSaveLegal={(updatedLegal) => {
                    StorageService.saveLegalContent(updatedLegal);
                    if (onLegalContentUpdated) onLegalContentUpdated(updatedLegal);
                  }}
                  onShowToast={(msg) => setToastMessage(msg)}
                />
              )}

              {/* TAB 4: BULK IMPORT & BACKUP */}
              {activeTab === 'import' && (
                <AdminBulkImport
                  artworksCount={artworks.length}
                  onArtworksUpdated={onArtworksUpdated}
                  onRequestClearAll={() => setIsClearModalOpen(true)}
                />
              )}

              {/* TAB 5: SANITY SCHEMA & MIGRATION SCRIPT BLUEPRINT */}
              {activeTab === 'sanity' && (
                <div className="space-y-4 max-w-3xl">
                  <div>
                    <h4 className="font-serif text-lg font-medium text-stone-900">
                      Sanity Studio Schema & Node Migration Script
                    </h4>
                    <p className="text-xs text-stone-600 mt-1">
                      Ready-to-use Sanity Studio schema and automated migration script for Fife Art.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-stone-700">
                        schemaTypes/artwork.js
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(SANITY_SCHEMA_CODE);
                          setCopiedScript(true);
                          setTimeout(() => setCopiedScript(false), 2000);
                        }}
                        className="inline-flex items-center space-x-1 text-xs text-stone-600 hover:text-stone-900"
                      >
                        {copiedScript ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedScript ? 'Copied' : 'Copy Schema'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-stone-900 text-amber-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
                      {SANITY_SCHEMA_CODE}
                    </pre>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-mono font-medium text-stone-700">
                        scripts/migrate-catalog-to-sanity.js
                      </span>
                    </div>
                    <pre className="p-3 bg-stone-900 text-stone-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48">
                      {MIGRATION_SCRIPT_CODE}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLEAR ALL ARTWORKS CONFIRMATION MODAL */}
        {isClearModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-200">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-serif text-lg font-medium text-stone-900">
                  Erase All {artworks.length} Artworks?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  This will permanently delete all {artworks.length} current paintings from your catalog.
                  This action cannot be undone and gives you a completely clean slate to upload your authentic Teable CSV catalog without placeholder items.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearAll}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Erase All Artworks</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REMOVE PLACEHOLDERS CONFIRMATION MODAL */}
        {isClearPlaceholdersModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-amber-200 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-serif text-lg font-medium text-stone-900">
                  Remove All {placeholderCount} Placeholders?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  This will delete all sample paintings and stock placeholder pictures, leaving only your real imported artworks. Your custom Scottish catalog will remain untouched.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsClearPlaceholdersModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemovePlaceholders}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Remove Placeholders</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE SINGLE ARTWORK CONFIRMATION MODAL */}
        {artworkToDelete && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 border border-stone-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center space-x-2 text-stone-900 font-semibold text-sm">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Artwork?</span>
              </div>
              <p className="text-xs text-stone-600">
                Are you sure you want to delete <strong>"{artworkToDelete.title}"</strong> ({artworkToDelete.sku})? This cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setArtworkToDelete(null)}
                  className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSingle}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE SELECTED ARTWORKS CONFIRMATION MODAL */}
        {isDeleteSelectedModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 border border-stone-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center space-x-2 text-stone-900 font-semibold text-sm">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Selected Artworks?</span>
              </div>
              <p className="text-xs text-stone-600">
                Are you sure you want to permanently delete the <strong>{selectedArtworkIds.size}</strong> selected painting(s)?
              </p>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteSelectedModalOpen(false)}
                  className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSelected}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Yes, Delete ({selectedArtworkIds.size})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULLSCREEN IMAGE INSPECTION MODAL */}
        {isEnlargeImageOpen && formImageUrl && (
          <div className="fixed inset-0 z-80 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-3.5 border-b border-stone-800">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-white font-serif">
                    {formTitle || 'Artwork Image Inspection'}
                  </span>
                  {formOrientation && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
                      {formOrientation}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsEnlargeImageOpen(false)}
                  className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 flex items-center justify-center flex-1 overflow-auto bg-stone-950">
                <img
                  src={formImageUrl}
                  alt={formTitle || 'Painting Preview'}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = generateCanvasPlaceholder(
                      formTitle || 'Scottish Artwork',
                      formMedium
                    );
                  }}
                />
              </div>
              <div className="p-3 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <span>{formMedium || 'Original painting'} • {formDimensions || 'Studio piece'}</span>
                <button
                  type="button"
                  onClick={() => setIsEnlargeImageOpen(false)}
                  className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION BANNER */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 z-70 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SANITY_SCHEMA_CODE = `// Sanity Studio Schema for Fife Art (artwork.js)
export default {
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required() },
    { name: 'orderNumber', title: 'Order Number', type: 'string' },
    { name: 'sku', title: 'SKU', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } },
    { name: 'orientation', title: 'Orientation', type: 'string', options: { list: ['Landscape', 'Portrait', 'Square'] } },
    { name: 'date', title: 'Date / Year', type: 'string' },
    { name: 'medium', title: 'Medium / Format', type: 'string', placeholder: 'e.g. Oil on canvas' },
    { name: 'dimensions', title: 'Dimensions', type: 'string', placeholder: 'e.g. 50 x 40 cm' },
    { name: 'price', title: 'Price (£)', type: 'number', validation: Rule => Rule.required().positive() },
    { name: 'originalPrice', title: 'Original Price (£)', type: 'number' },
    { name: 'status', title: 'Status', type: 'string', options: {
      list: ['Available', 'Sold', 'On Order', 'Two Sizes', 'Discounted']
    }, initialValue: 'Available' },
    { name: 'subjects', title: 'Subjects', type: 'array', of: [{ type: 'string' }] },
    { name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }
  ]
};`;

const MIGRATION_SCRIPT_CODE = `// Automated Catalog to Sanity Migration Script (Node.js)
import { createClient } from '@sanity/client';
import fs from 'fs';
import sharp from 'sharp';
import axios from 'axios';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: 'production',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01',
});

async function migrate() {
  const records = JSON.parse(fs.readFileSync('./inventory-export.json', 'utf8'));
  console.log(\`Starting migration of \${records.length} items...\`);

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    // 1. Download & convert to WebP
    const imgRes = await axios.get(item.image_url, { responseType: 'arraybuffer' });
    const webpBuffer = await sharp(imgRes.data).webp({ quality: 85 }).toBuffer();
    
    // 2. Upload asset
    const asset = await client.assets.upload('image', webpBuffer, { filename: \`art-\${i}.webp\` });

    // 3. Create document
    await client.create({
      _type: 'artwork',
      title: item.title,
      medium: item.medium,
      dimensions: item.dimensions,
      price: Number(item.price),
      status: item.status || 'Available',
      sku: \`FAF-\${String(i+1).padStart(3, '0')}\`,
      image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
    });
    console.log(\`[✓] Imported \${item.title}\`);
  }
}
migrate();`;
