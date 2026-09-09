import React, { useState, useRef } from 'react';
import {
  Table,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Database,
  Sparkles,
  Trash2,
  Columns,
  RefreshCw,
} from 'lucide-react';
import { Artwork } from '../types';
import { StorageService } from '../services/storage';
import { parseArtworksImport, ParseResult, ColumnMapping } from '../utils/artworkParser';

interface TeableSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArtworksUpdated: (artworks: Artwork[]) => void;
  currentCount: number;
  hasPlaceholderData: boolean;
}

export const TeableSyncModal: React.FC<TeableSyncModalProps> = ({
  isOpen,
  onClose,
  onArtworksUpdated,
  currentCount,
  hasPlaceholderData,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'api'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [rawFileContent, setRawFileContent] = useState<string>('');
  const [fileInputName, setFileInputName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [customMapping, setCustomMapping] = useState<Partial<ColumnMapping>>({});
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // Live Teable API state
  const [teableBaseUrl, setTeableBaseUrl] = useState('https://app.teable.io');
  const [teableTableId, setTeableTableId] = useState('');
  const [teableToken, setTeableToken] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setFileInputName(file.name);
    setStatusMessage({ type: 'info', text: `Reading "${file.name}"...` });

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setStatusMessage({ type: 'error', text: 'Uploaded file is empty.' });
        return;
      }
      setRawFileContent(content);
      const result = parseArtworksImport(content);
      setParseResult(result);
      if (result.detectedMapping) {
        setCustomMapping(result.detectedMapping);
      }

      if (result.success && result.artworks.length > 0) {
        setStatusMessage({
          type: 'success',
          text: `Found ${result.artworks.length} artworks in "${file.name}". Ready to apply to your gallery!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.errorMessage || 'Failed to parse file. Please check that it is a valid CSV or JSON export.',
        });
      }
    };

    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Error reading file from disk.' });
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, colName: string) => {
    const nextMapping = { ...customMapping, [field]: colName };
    setCustomMapping(nextMapping);
    if (rawFileContent) {
      const updatedResult = parseArtworksImport(rawFileContent, nextMapping);
      setParseResult(updatedResult);
    } else if (pastedText) {
      const updatedResult = parseArtworksImport(pastedText, nextMapping);
      setParseResult(updatedResult);
    }
  };

  const handlePasteChange = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setParseResult(null);
      setStatusMessage(null);
      return;
    }
    const result = parseArtworksImport(text);
    setParseResult(result);
    if (result.detectedMapping) {
      setCustomMapping(result.detectedMapping);
    }
    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `Identified ${result.artworks.length} items (${result.formatDetected}).`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: result.errorMessage || 'Invalid data format.',
      });
    }
  };

  const handleApplyArtworks = (replace = true) => {
    if (!parseResult || !parseResult.success || parseResult.artworks.length === 0) return;

    setIsProcessing(true);
    try {
      let updated: Artwork[];
      if (replace) {
        StorageService.saveArtworks(parseResult.artworks);
        updated = parseResult.artworks;
      } else {
        const existing = StorageService.getArtworks();
        updated = [...parseResult.artworks, ...existing];
        StorageService.saveArtworks(updated);
      }

      onArtworksUpdated(updated);
      setStatusMessage({
        type: 'success',
        text: `Success! ${parseResult.artworks.length} authentic paintings from your Teable catalog are now live in the gallery!`,
      });

      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Failed to save imported artworks to gallery storage.' });
      setIsProcessing(false);
    }
  };

  const handleConfirmWipePlaceholders = () => {
    const remaining = StorageService.removePlaceholderArtworks();
    onArtworksUpdated(remaining);
    setShowWipeConfirm(false);
    setStatusMessage({
      type: 'info',
      text: `All placeholder paintings have been wiped. Current gallery has ${remaining.length} paintings.`,
    });
    setParseResult(null);
  };

  const handleFetchTeableApi = async () => {
    if (!teableTableId.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Teable Table ID.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Connecting to Teable API...' });

    try {
      let tableId = teableTableId.trim();
      const urlMatch = tableId.match(/table\/([a-zA-Z0-9_-]+)/);
      if (urlMatch) {
        tableId = urlMatch[1];
      }

      const endpoint = `${teableBaseUrl.replace(/\/$/, '')}/api/table/${tableId}/record`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (teableToken.trim()) {
        headers['Authorization'] = `Bearer ${teableToken.trim()}`;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const records = data.records || data.data || (Array.isArray(data) ? data : []);

      if (!records || records.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'Connected to Teable successfully, but no records were found in this table.',
        });
        return;
      }

      const rowsForParser = records.map((r: { fields?: Record<string, unknown> }) => r.fields || r);
      const jsonString = JSON.stringify(rowsForParser);
      const result = parseArtworksImport(jsonString);
      setParseResult(result);

      if (result.success && result.artworks.length > 0) {
        setStatusMessage({
          type: 'success',
          text: `Fetched ${result.artworks.length} paintings directly from Teable API! Click "Apply to Gallery" below.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.errorMessage || 'Could not parse Teable records into paintings.',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: 'error',
        text: `Direct API call failed: ${message}. If CORS blocks direct requests from your browser, please export your Teable view as CSV and upload it in the "Upload File" tab.`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shadow-2xs">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-stone-900 leading-tight">
                Connect Authentic Teable Artworks
              </h3>
              <p className="text-[11px] text-stone-500">
                Replace placeholder pictures with your real Scottish art catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wipe Placeholders Banner if placeholders exist */}
        {hasPlaceholderData && (
          <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200/80 text-xs text-amber-900">
            {!showWipeConfirm ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Notice:</strong> Your gallery currently contains {currentCount} sample paintings with stock photos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWipeConfirm(true)}
                  className="inline-flex items-center space-x-1 text-rose-700 hover:text-rose-900 font-semibold cursor-pointer underline text-[11px] shrink-0 ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5 inline" />
                  <span>Wipe Placeholders</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-rose-50 p-2 rounded-lg border border-rose-200 text-rose-950">
                <span className="font-medium text-[11px]">
                  Confirm wipe all placeholder paintings?
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowWipeConfirm(false)}
                    className="px-2 py-0.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWipePlaceholders}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Yes, Wipe Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-100/50 px-5 pt-2 text-xs font-medium text-stone-600 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 border-b-2 font-medium transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1.5" />
            Upload Teable CSV File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 border-b-2 font-medium transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Paste CSV / Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`pb-2.5 px-3 border-b-2 font-medium transition-all cursor-pointer ${
              activeTab === 'api'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Live Teable API
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all group ${
                  isDragging
                    ? 'border-stone-900 bg-amber-50/60 scale-[1.01]'
                    : 'border-stone-300 hover:border-stone-800 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.json,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center mx-auto text-stone-500 group-hover:text-stone-900 shadow-2xs mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-serif text-base font-medium text-stone-900">
                  {fileInputName ? fileInputName : 'Drop your Teable CSV here or click to browse'}
                </p>
                <p className="text-stone-500 text-[11px] mt-1 max-w-sm mx-auto">
                  Export your paintings view from Teable as CSV, then drag and drop it here or select it from your hard drive.
                </p>
              </div>

              {/* Instant Apply Banner if file parsed successfully */}
              {parseResult && parseResult.success && parseResult.artworks.length > 0 && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="font-semibold text-emerald-950 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{parseResult.artworks.length} authentic paintings ready to apply!</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Click the button on the right to immediately replace placeholders and make these live.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyArtworks(true)}
                    disabled={isProcessing}
                    className="inline-flex items-center space-x-1 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <span>Apply & Replace Placeholders</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              )}

              {/* Instructions Guide */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 text-stone-600">
                <span className="font-semibold text-stone-800 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 mr-1.5" /> How to export from Teable in 10 seconds:
                </span>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                  <li>Open your paintings table in Teable (<a href="https://app.teable.io" target="_blank" rel="noreferrer" className="text-amber-800 underline">app.teable.io</a>).</li>
                  <li>Click the view menu / table options (the three dots or table export icon).</li>
                  <li>Select <strong>Export view to CSV</strong>.</li>
                  <li>Drop the downloaded file right here to immediately load all true artwork images!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block font-medium text-stone-800">
                Paste your Teable export CSV rows or JSON array:
              </label>
              <textarea
                rows={7}
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={`"title","image_url","price","medium","dimensions","status"\n"Puffin on Rocks","https://teable-storage...jpg",320,"Acrylic on canvas","50x40cm","Available"`}
                className="w-full p-3 font-mono text-stone-900 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-stone-800"
              />
            </div>
          )}

          {/* TAB 3: LIVE API */}
          {activeTab === 'api' && (
            <div className="space-y-3.5">
              <p className="text-stone-600 leading-relaxed">
                Connect directly to your Teable Cloud or self-hosted Teable server using your table ID and API token.
              </p>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Teable Server URL</label>
                <input
                  type="text"
                  value={teableBaseUrl}
                  onChange={(e) => setTeableBaseUrl(e.target.value)}
                  placeholder="https://app.teable.io"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Teable Table ID</label>
                <input
                  type="text"
                  value={teableTableId}
                  onChange={(e) => setTeableTableId(e.target.value)}
                  placeholder="tblxxxxxxxx or paste table URL"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Personal Access Token (optional for public tables)</label>
                <input
                  type="password"
                  value={teableToken}
                  onChange={(e) => setTeableToken(e.target.value)}
                  placeholder="teable_acc_xxxxxx..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleFetchTeableApi}
                disabled={isProcessing}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Fetch Paintings via Teable API</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-start space-x-2 leading-relaxed ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Column Mapping Selectors (if headers detected) */}
          {parseResult && parseResult.headers && parseResult.headers.length > 0 && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-1.5 text-stone-800 font-semibold">
                <Columns className="w-3.5 h-3.5 text-stone-500" />
                <span>Column Mapping:</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Confirm or adjust which column from your CSV maps to each painting attribute:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div>
                  <label className="block text-stone-600 mb-0.5 font-medium">Title Column</label>
                  <select
                    value={customMapping.titleCol || ''}
                    onChange={(e) => handleMappingChange('titleCol', e.target.value)}
                    className="w-full p-1.5 bg-white border border-stone-200 rounded-lg text-stone-800"
                  >
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-0.5 font-medium">Image / Attachment Column</label>
                  <select
                    value={customMapping.imageCol || ''}
                    onChange={(e) => handleMappingChange('imageCol', e.target.value)}
                    className="w-full p-1.5 bg-white border border-stone-200 rounded-lg text-stone-800"
                  >
                    <option value="">-- Auto-Detect URLs --</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-0.5 font-medium">Price Column</label>
                  <select
                    value={customMapping.priceCol || ''}
                    onChange={(e) => handleMappingChange('priceCol', e.target.value)}
                    className="w-full p-1.5 bg-white border border-stone-200 rounded-lg text-stone-800"
                  >
                    <option value="">-- Default £240 --</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parseResult && parseResult.success && parseResult.artworks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800">
                  Preview of Parsed Artworks ({parseResult.artworks.length} items ready):
                </span>
                <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                  Format: {parseResult.formatDetected}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100 bg-stone-50/50">
                {parseResult.artworks.slice(0, 10).map((art, idx) => (
                  <div key={art.id || idx} className="p-2 flex items-center space-x-3 text-[11px]">
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="w-10 h-10 object-cover rounded-md border border-stone-200 bg-white shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-stone-900 truncate">{art.title}</div>
                      <div className="text-stone-500 text-[10px] truncate">
                        {art.medium} • {art.dimensions} • {art.status}
                      </div>
                    </div>
                    <div className="font-semibold text-stone-900 shrink-0">
                      £{art.price}
                    </div>
                  </div>
                ))}
              </div>
              {parseResult.artworks.length > 10 && (
                <p className="text-[10px] text-stone-400 text-center">
                  + {parseResult.artworks.length - 10} additional paintings
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-[11px] text-stone-500 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
            <span>Updates gallery catalog instantly</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-stone-200 hover:bg-stone-100 rounded-xl text-stone-700 font-medium text-xs transition-colors cursor-pointer"
            >
              Close
            </button>

            {parseResult && parseResult.success && parseResult.artworks.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => handleApplyArtworks(false)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 border border-stone-300 hover:bg-stone-200/70 rounded-xl text-stone-800 font-medium text-xs transition-colors cursor-pointer"
                  title="Keep existing and add new items"
                >
                  Append
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyArtworks(true)}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <span>Replace Placeholders with My Data</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
