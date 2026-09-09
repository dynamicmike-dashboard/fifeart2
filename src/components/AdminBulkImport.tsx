import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  ArrowRight,
  Columns,
} from 'lucide-react';
import { Artwork } from '../types';
import { StorageService } from '../services/storage';
import { parseArtworksImport, ParseResult, ColumnMapping, generateCanvasPlaceholder } from '../utils/artworkParser';

interface AdminBulkImportProps {
  artworksCount: number;
  onArtworksUpdated: (updated: Artwork[]) => void;
  onRequestClearAll: () => void;
}

export const AdminBulkImport: React.FC<AdminBulkImportProps> = ({
  artworksCount,
  onArtworksUpdated,
  onRequestClearAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rawText, setRawText] = useState('');
  const [rawContentCache, setRawContentCache] = useState<string>('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [customMapping, setCustomMapping] = useState<Partial<ColumnMapping>>({});
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isRemovingPlaceholders, setIsRemovingPlaceholders] = useState(false);

  // File selection / drag-and-drop processing
  const processFileContent = (content: string, name: string) => {
    setStatusMessage(null);
    setFileName(name);
    setRawContentCache(content);
    const result = parseArtworksImport(content);
    setParseResult(result);
    if (result.detectedMapping) {
      setCustomMapping(result.detectedMapping);
    }
    if (!result.success) {
      setStatusMessage({
        type: 'error',
        text: result.errorMessage || 'Failed to parse file. Please check format.',
      });
    } else {
      setStatusMessage({
        type: 'success',
        text: `Loaded ${result.artworks.length} artworks from "${name}". Click "Confirm & Apply" to make them live!`,
      });
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, colName: string) => {
    const nextMapping = { ...customMapping, [field]: colName };
    setCustomMapping(nextMapping);
    if (rawContentCache) {
      const updated = parseArtworksImport(rawContentCache, nextMapping);
      setParseResult(updated);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processFileContent(content, file.name);
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Error reading file from disk.' });
    };
    reader.readAsText(file);
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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processFileContent(content, file.name);
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Error reading dropped file.' });
    };
    reader.readAsText(file);
  };

  const handleParsePastedText = () => {
    if (!rawText.trim()) return;
    processFileContent(rawText, 'pasted-content.csv');
  };

  const handleExecuteImport = () => {
    if (!parseResult || !parseResult.success || parseResult.artworks.length === 0) return;

    setIsImporting(true);
    try {
      const result = StorageService.importParsedArtworks(
        parseResult.artworks,
        importMode === 'replace'
      );
      onArtworksUpdated(result.artworks);
      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${result.count} artworks! Gallery catalog now has ${result.artworks.length} items. All placeholders have been replaced.`,
      });
      // Reset preview state
      setParseResult(null);
      setRawText('');
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Import failed: ${(err as Error).message}`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemovePlaceholdersOnly = () => {
    setIsRemovingPlaceholders(true);
    const remaining = StorageService.removePlaceholderArtworks();
    onArtworksUpdated(remaining);
    setStatusMessage({
      type: 'success',
      text: `Removed all sample placeholders! Gallery now contains ${remaining.length} paintings.`,
    });
    setIsRemovingPlaceholders(false);
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

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-serif text-lg font-medium text-stone-900">
            Bulk Artwork Import & Teable Sync
          </h4>
          <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
            Upload your CSV export from Teable or Airtable to replace all placeholders with authentic Scottish paintings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRemovePlaceholdersOnly}
          disabled={isRemovingPlaceholders}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-amber-700" />
          <span>Remove Sample Placeholders</span>
        </button>
      </div>

      {/* Status Banners */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Main File Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-stone-900 bg-amber-50/60 scale-[1.01]'
            : 'border-stone-300 hover:border-stone-500 bg-stone-50/50 hover:bg-stone-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.tsv,.txt,.json"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center text-stone-700">
            <Upload className="w-6 h-6 text-stone-700" />
          </div>

          <div>
            <p className="text-sm font-medium text-stone-900">
              Drag and drop your Teable CSV file here
            </p>
            <p className="text-xs text-stone-500 mt-1">
              or <span className="text-stone-900 font-semibold underline">browse from your hard drive</span>
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-stone-400">
            <span className="px-2 py-0.5 bg-white border border-stone-200 rounded-md font-mono">.csv</span>
            <span className="px-2 py-0.5 bg-white border border-stone-200 rounded-md font-mono">.tsv</span>
            <span className="px-2 py-0.5 bg-white border border-stone-200 rounded-md font-mono">.json</span>
          </div>

          {fileName && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-stone-900 text-white rounded-full text-xs font-mono">
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              <span>Loaded: {fileName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Alternative: Copy/Paste Raw Text */}
      <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setShowPasteBox(!showPasteBox)}
          className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100/80 text-xs font-medium text-stone-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-stone-500" />
            <span>Prefer to paste CSV or JSON text directly?</span>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">
            {showPasteBox ? 'Hide paste area' : 'Click to expand'}
          </span>
        </button>

        {showPasteBox && (
          <div className="p-4 space-y-3 border-t border-stone-200 bg-white">
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your CSV rows (with header row) or JSON array here..."
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-700"
            />
            <button
              type="button"
              onClick={handleParsePastedText}
              className="px-3.5 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors"
            >
              Parse Pasted Content
            </button>
          </div>
        )}
      </div>

      {/* Parsed Preview Section */}
      {parseResult && parseResult.success && parseResult.artworks.length > 0 && (
        <div className="p-5 bg-stone-50 border border-stone-300 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-medium rounded-full text-xs">
                {parseResult.formatDetected} File Ready
              </span>
              <span className="text-xs font-semibold text-stone-900">
                Found {parseResult.artworks.length} paintings
              </span>
            </div>

            {/* Instant Apply Button */}
            <button
              type="button"
              disabled={isImporting}
              onClick={handleExecuteImport}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying to Catalog...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Apply & Replace Placeholders Now</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </div>

          {/* Column Mapping Controls (if headers available) */}
          {parseResult.headers && parseResult.headers.length > 0 && (
            <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-1.5 text-stone-800 font-semibold text-xs">
                <Columns className="w-3.5 h-3.5 text-stone-500" />
                <span>Column Mapping:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div>
                  <label className="block text-stone-600 mb-0.5 font-medium">Title Column</label>
                  <select
                    value={customMapping.titleCol || ''}
                    onChange={(e) => handleMappingChange('titleCol', e.target.value)}
                    className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
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
                    className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                  >
                    <option value="">-- Auto-detect images --</option>
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
                    className="w-full p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                  >
                    <option value="">-- Auto-detect price --</option>
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

          {/* Quick Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {parseResult.artworks.slice(0, 4).map((art, idx) => (
              <div
                key={art.id || idx}
                className="p-2.5 bg-white border border-stone-200 rounded-xl flex items-center space-x-3 text-xs shadow-2xs"
              >
                <img
                  src={art.imageUrl}
                  alt={art.title}
                  className="w-12 h-12 object-cover rounded-lg border border-stone-200 shrink-0 bg-stone-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = generateCanvasPlaceholder(art.title);
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-serif font-medium text-stone-900 truncate">
                    {art.title}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">
                    {art.medium} • {art.dimensions}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-semibold text-stone-900">£{art.price}</span>
                    <span className="px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded text-[10px]">
                      {art.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Import Mode Options */}
          <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-2">
            <p className="text-xs font-medium text-stone-800">
              Select Import Action:
            </p>
            <div className="space-y-2">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5 text-stone-900 focus:ring-stone-800"
                />
                <div className="text-xs">
                  <span className="font-semibold text-stone-900">
                    Replace Entire Catalog (Recommended)
                  </span>
                  <p className="text-stone-500 text-[11px]">
                    Clears all existing {artworksCount} placeholder items and populates with your {parseResult.artworks.length} authentic originals.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5 text-stone-900 focus:ring-stone-800"
                />
                <div className="text-xs">
                  <span className="font-semibold text-stone-900">
                    Add to Existing Catalog
                  </span>
                  <p className="text-stone-500 text-[11px]">
                    Appends these {parseResult.artworks.length} items to the current {artworksCount} paintings without deleting anything.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Execute Import Action */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setParseResult(null)}
              className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Cancel Preview
            </button>

            <button
              type="button"
              disabled={isImporting}
              onClick={handleExecuteImport}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <span>Confirm & Import {parseResult.artworks.length} Artworks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Backups & Exports Section */}
      <div className="pt-4 border-t border-stone-200">
        <h5 className="font-medium text-xs text-stone-800 mb-2">
          Backup Current Catalog ({artworksCount} Pieces):
        </h5>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={onRequestClearAll}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Current Catalog</span>
          </button>
        </div>
      </div>
    </div>
  );
};
