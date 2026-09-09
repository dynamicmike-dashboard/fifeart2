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
} from 'lucide-react';
import { Artwork, ArtworkStatus, Enquiry } from '../types';
import { StorageService, DEFAULT_ADMIN_PASSWORD, IS_CUSTOM_ADMIN_PASSWORD_SET } from '../services/storage';
import { AVAILABLE_TAGS, STATUS_OPTIONS } from '../data/sampleArtworks';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  artworks: Artwork[];
  onArtworksUpdated: (updated: Artwork[]) => void;
  onGenerateCertificate: (art: Artwork) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  artworks,
  onArtworksUpdated,
  onGenerateCertificate,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'add' | 'inbox' | 'import' | 'sanity'>('inventory');

  // Form states for adding/editing artwork
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formMedium, setFormMedium] = useState('Acrylic on canvas');
  const [formDimensions, setFormDimensions] = useState('50 x 40 cm (19.7 x 15.7 in)');
  const [formPrice, setFormPrice] = useState<number | ''>(350);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number | ''>('');
  const [formStatus, setFormStatus] = useState<ArtworkStatus>('Available');
  const [formTags, setFormTags] = useState<string[]>(['Wildlife']);
  const [formCustomTag, setFormCustomTag] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSku, setFormSku] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageCompressionNote, setImageCompressionNote] = useState('');

  // Search & Filter within Admin
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('All');

  // Bulk JSON / CSV import state
  const [bulkJsonInput, setBulkJsonInput] = useState('');
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Inquiries state
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (StorageService.verifyAdminPassword(passwordInput)) {
      setIsAuthenticated(true);
      setAuthError('');
      setEnquiries(StorageService.getEnquiries());
    } else {
      setAuthError(`Incorrect password. (Default is "${DEFAULT_ADMIN_PASSWORD}")`);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const generateAutoSku = (tag: string) => {
    const prefix = tag.substring(0, 3).toUpperCase();
    const count = artworks.length + 1;
    return `FAF-${prefix}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenAddForm = () => {
    setEditingArtworkId(null);
    setFormTitle('');
    setFormMedium('Acrylic on canvas');
    setFormDimensions('50 x 40 cm (19.7 x 15.7 in)');
    setFormPrice(320);
    setFormOriginalPrice('');
    setFormStatus('Available');
    setFormTags(['Wildlife']);
    setFormDescription('Original hand-painted piece by Fife Art. Finished with protective satin varnish.');
    setFormImageUrl('https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80');
    setFormSku(generateAutoSku('Wildlife'));
    setFormFeatured(false);
    setImageCompressionNote('');
    setActiveTab('add');
  };

  const handleEditArtwork = (artwork: Artwork) => {
    setEditingArtworkId(artwork.id);
    setFormTitle(artwork.title);
    setFormMedium(artwork.medium);
    setFormDimensions(artwork.dimensions);
    setFormPrice(artwork.price);
    setFormOriginalPrice(artwork.originalPrice || '');
    setFormStatus(artwork.status);
    setFormTags(artwork.tags);
    setFormDescription(artwork.description);
    setFormImageUrl(artwork.imageUrl);
    setFormSku(artwork.sku);
    setFormFeatured(Boolean(artwork.featured));
    setImageCompressionNote('');
    setActiveTab('add');
  };

  const handleSaveArtworkForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formImageUrl.trim() || formPrice === '') return;

    const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const priceNum = Number(formPrice);
    const origPriceNum = formOriginalPrice ? Number(formOriginalPrice) : undefined;
    const finalSku = formSku.trim() || generateAutoSku(formTags[0] || 'ART');

    if (editingArtworkId) {
      StorageService.updateArtwork(editingArtworkId, {
        title: formTitle,
        slug,
        medium: formMedium,
        dimensions: formDimensions,
        price: priceNum,
        originalPrice: origPriceNum,
        status: formStatus,
        tags: formTags,
        description: formDescription,
        imageUrl: formImageUrl,
        sku: finalSku,
        featured: formFeatured,
      });
    } else {
      StorageService.addArtwork({
        sku: finalSku,
        title: formTitle,
        slug,
        medium: formMedium,
        dimensions: formDimensions,
        price: priceNum,
        originalPrice: origPriceNum,
        tags: formTags,
        status: formStatus,
        imageUrl: formImageUrl,
        description: formDescription,
        year: new Date().getFullYear(),
        featured: formFeatured,
      });
    }

    const updated = StorageService.getArtworks();
    onArtworksUpdated(updated);
    setActiveTab('inventory');
  };

  const handleDeleteArtwork = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      StorageService.deleteArtwork(id);
      const updated = StorageService.getArtworks();
      onArtworksUpdated(updated);
    }
  };

  const handleQuickStatusChange = (id: string, newStatus: ArtworkStatus) => {
    StorageService.updateStatus(id, newStatus);
    const updated = StorageService.getArtworks();
    onArtworksUpdated(updated);
  };

  const handleBulkImport = () => {
    if (!bulkJsonInput.trim()) return;
    const res = StorageService.importFromJSON(bulkJsonInput);
    setImportStatusMessage(res.message);
    if (res.success) {
      const updated = StorageService.getArtworks();
      onArtworksUpdated(updated);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(StorageService.exportToJSON());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fifeart-inventory-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(StorageService.exportToCSV());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fifeart-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredAdminArtworks = artworks.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.sku.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.medium.toLowerCase().includes(adminSearch.toLowerCase());
    const matchesStatus = adminStatusFilter === 'All' || a.status === adminStatusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-300 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-stone-900">
                Fife Art Studio Portal
              </h3>
              <p className="text-[11px] text-stone-500">
                Manage paintings, prices, status badges, inquiries & catalog inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="admin-modal-close"
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
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
            <div className="flex items-center space-x-1 px-6 border-b border-stone-200 bg-stone-100/60 overflow-x-auto">
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
                onClick={() => setActiveTab('import')}
                className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'import'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <FileUp className="w-3.5 h-3.5 inline mr-1" />
                Bulk Import & Backup
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
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Filter by title, SKU, or medium..."
                        className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs w-64 text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
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
                    </div>

                    <button
                      onClick={handleOpenAddForm}
                      className="inline-flex items-center justify-center space-x-1 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload New Piece</span>
                    </button>
                  </div>

                  {/* Artwork Table */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto max-h-[55vh]">
                      <table className="w-full text-left text-xs text-stone-700">
                        <thead className="bg-stone-50 border-b border-stone-200 sticky top-0 font-medium text-stone-500 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-3">Artwork</th>
                            <th className="py-3 px-3">SKU</th>
                            <th className="py-3 px-3">Medium & Size</th>
                            <th className="py-3 px-3">Price</th>
                            <th className="py-3 px-3">Status Label</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredAdminArtworks.map((art) => (
                            <tr key={art.id} className="hover:bg-stone-50/70 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center space-x-2.5">
                                  <img
                                    src={art.imageUrl}
                                    alt={art.title}
                                    className="w-10 h-10 object-cover rounded-md border border-stone-200"
                                  />
                                  <span className="font-serif text-sm font-medium text-stone-900 truncate max-w-[200px]">
                                    {art.title}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">
                                {art.sku}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="text-stone-800 font-medium">{art.medium}</div>
                                <div className="text-stone-400 text-[10px]">{art.dimensions}</div>
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
                                  className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded transition-colors inline-block"
                                  title="Generate Certificate of Authenticity"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleEditArtwork(art)}
                                  className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
                                  title="Edit details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteArtwork(art.id, art.title)}
                                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                  title="Delete artwork"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ADD / EDIT ARTWORK FORM */}
              {activeTab === 'add' && (
                <form onSubmit={handleSaveArtworkForm} className="max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <h4 className="font-serif text-lg font-medium text-stone-900">
                      {editingArtworkId ? 'Edit Artwork Details' : 'Upload New Painting'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('inventory')}
                      className="text-xs text-stone-500 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Image Upload Area with WebP Auto-Compression */}
                  <div className="p-4 rounded-xl bg-stone-50 border-2 border-dashed border-stone-300 text-center space-y-2">
                    {formImageUrl ? (
                      <div className="relative inline-block">
                        <img
                          src={formImageUrl}
                          alt="Preview"
                          className="max-h-48 rounded-lg object-contain border border-stone-200 mx-auto shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-stone-900 text-white hover:bg-stone-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Upload className="w-8 h-8 text-stone-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-stone-700">
                          Click to upload painting photo
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Automatically resized & converted to modern WebP format for fast loading
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-center space-x-2">
                      <label className="cursor-pointer px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-2xs">
                        <span>Select Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-stone-400">or paste image URL:</span>
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="px-2.5 py-1 text-xs bg-white border border-stone-200 rounded-md w-48 text-stone-800"
                      />
                    </div>

                    {imageCompressionNote && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        {imageCompressionNote}
                      </p>
                    )}
                  </div>

                  {/* Title & SKU */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Painting Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. Isle of May Puffins in Sun"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        SKU Number
                      </label>
                      <input
                        type="text"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        placeholder="e.g. FAF-WLD-104"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                    </div>
                  </div>

                  {/* Medium & Dimensions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Medium / Format *
                      </label>
                      <input
                        type="text"
                        required
                        value={formMedium}
                        onChange={(e) => setFormMedium(e.target.value)}
                        placeholder="e.g. Acrylic on canvas"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                      {/* Presets */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['Acrylic on canvas', 'Oil on linen', 'Watercolour on 300gsm', 'Oil on board'].map(
                          (m) => (
                            <button
                              type="button"
                              key={m}
                              onClick={() => setFormMedium(m)}
                              className="text-[10px] text-stone-500 hover:text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded"
                            >
                              {m}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Dimensions *
                      </label>
                      <input
                        type="text"
                        required
                        value={formDimensions}
                        onChange={(e) => setFormDimensions(e.target.value)}
                        placeholder="e.g. 50 x 40 cm (19.7 x 15.7 in)"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                    </div>
                  </div>

                  {/* Price & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Price (£ GBP) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Original Price (if discounted)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formOriginalPrice}
                        onChange={(e) =>
                          setFormOriginalPrice(e.target.value ? Number(e.target.value) : '')
                        }
                        placeholder="e.g. 420"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Status Label *
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as ArtworkStatus)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tags selection */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Tags & Categories
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {AVAILABLE_TAGS.filter((t) => t !== 'All').map((tag) => {
                        const hasTag = formTags.includes(tag);
                        return (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => {
                              if (hasTag) {
                                setFormTags(formTags.filter((t) => t !== tag));
                              } else {
                                setFormTags([...formTags, tag]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                              hasTag
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {tag} {hasTag && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Artwork Description & Artist Inspiration
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Details on the technique, inspiration, and location..."
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-800"
                    />
                  </div>

                  {/* Featured checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="form-featured"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="rounded border-stone-300 text-stone-900"
                    />
                    <label htmlFor="form-featured" className="text-xs text-stone-700">
                      Feature on front gallery highlight
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('inventory')}
                      className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingImage}
                      className="px-5 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 shadow-xs cursor-pointer"
                    >
                      {editingArtworkId ? 'Save Changes' : 'Publish Artwork to Gallery'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: INQUIRIES INBOX */}
              {activeTab === 'inbox' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <h4 className="font-serif text-lg font-medium text-stone-900">
                        Customer Inquiries Inbox
                      </h4>
                      <p className="text-xs text-stone-500">
                        All order requests submitted via website enquiry forms
                      </p>
                    </div>
                  </div>

                  {enquiries.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p className="text-xs font-medium">No inquiries received yet.</p>
                      <p className="text-[11px] mt-1">
                        When buyers submit an order form, it will appear here as well as routing to your email.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enquiries.map((enq) => (
                        <div
                          key={enq.id}
                          className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-stone-900 text-xs">
                                  {enq.customerName}
                                </span>
                                <span className="text-[11px] font-mono text-stone-500">
                                  &lt;{enq.customerEmail}&gt;
                                </span>
                                {enq.customerPhone && (
                                  <span className="text-[11px] text-stone-500">
                                    • {enq.customerPhone}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-amber-900 font-medium mt-0.5">
                                Regarding: {enq.artworkTitle} ({enq.artworkSku}) • £{enq.artworkPrice}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-stone-400">
                              {new Date(enq.date).toLocaleDateString()} {new Date(enq.date).toLocaleTimeString()}
                            </span>
                          </div>

                          <p className="text-xs text-stone-700 bg-white p-3 rounded-lg border border-stone-200/60 whitespace-pre-line">
                            "{enq.message}"
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                            <span>Delivery Preference: {enq.shippingPreference.replace('_', ' ')}</span>
                            <a
                              href={`mailto:${enq.customerEmail}?subject=Re: Fife Art Enquiry for ${encodeURIComponent(
                                enq.artworkTitle || ''
                              )}`}
                              className="text-amber-900 hover:underline font-medium"
                            >
                              Reply to customer email →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: BULK IMPORT & BACKUP */}
              {activeTab === 'import' && (
                <div className="space-y-5 max-w-3xl">
                  <div>
                    <h4 className="font-serif text-lg font-medium text-stone-900">
                      Bulk Artwork Import (226 Artworks)
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      You can instantly populate or update your art catalog in bulk without re-entering pieces manually.
                      Paste your inventory JSON array or CSV export data below, or load the full 226 Scottish paintings dataset.
                    </p>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <label className="block text-xs font-medium text-stone-800">
                      Paste Catalog JSON or CSV Export Content:
                    </label>
                    <textarea
                      rows={4}
                      value={bulkJsonInput}
                      onChange={(e) => setBulkJsonInput(e.target.value)}
                      placeholder='[{"title":"Puffin on Rock","medium":"Acrylic on canvas","dimensions":"50x40cm","price":320,"status":"Available","image_url":"https://..."}, ...]'
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden"
                    />

                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleBulkImport}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Import Records into Catalog
                      </button>

                      <button
                        onClick={() => {
                          const full = StorageService.populateFull226Inventory();
                          onArtworksUpdated(full);
                          setImportStatusMessage('Loaded full 226-item Scottish art inventory into gallery!');
                        }}
                        className="text-xs text-amber-900 hover:underline font-medium"
                      >
                        Load 226-item Test Catalog Demo
                      </button>
                    </div>

                    {importStatusMessage && (
                      <p className="text-xs text-emerald-700 font-medium">
                        {importStatusMessage}
                      </p>
                    )}
                  </div>

                  {/* Backup & Exports */}
                  <div className="pt-3 border-t border-stone-200">
                    <h5 className="font-medium text-xs text-stone-800 mb-2">
                      Export Current Gallery Backup:
                    </h5>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportJSON}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download JSON</span>
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
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
    { name: 'sku', title: 'SKU', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } },
    { name: 'medium', title: 'Medium / Format', type: 'string', placeholder: 'e.g. Acrylic on canvas' },
    { name: 'dimensions', title: 'Dimensions', type: 'string', placeholder: 'e.g. 50 x 40 cm' },
    { name: 'price', title: 'Price (£)', type: 'number', validation: Rule => Rule.required().positive() },
    { name: 'originalPrice', title: 'Original Price (£)', type: 'number' },
    { name: 'status', title: 'Status', type: 'string', options: {
      list: ['Available', 'Sold', 'On Order', 'Two Sizes', 'Discounted']
    }, initialValue: 'Available' },
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
