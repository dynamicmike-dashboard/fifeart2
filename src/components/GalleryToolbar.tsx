import React from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { SortOption } from '../types';
import { AVAILABLE_TAGS } from '../data/sampleArtworks';

interface GalleryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTag: string;
  onTagChange: (tag: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  priceRange: 'all' | 'under100' | '100to250' | '250to450' | 'over450';
  onPriceRangeChange: (range: 'all' | 'under100' | '100to250' | '250to450' | 'over450') => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalFiltered: number;
  totalAll: number;
  startIndex: number;
  endIndex: number;
  onSeed226: () => void;
}

export const GalleryToolbar: React.FC<GalleryToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagChange,
  selectedStatus,
  onStatusChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  totalFiltered,
  totalAll,
  startIndex,
  endIndex,
  onSeed226,
}) => {
  return (
    <div className="space-y-4 pt-6 pb-2">
      {/* Top Bar: Search, Quick Status, Price Range & Sort */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="artwork-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search title, medium (e.g. Acrylic), wildlife..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-800 focus:border-stone-800 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right side: Status Filter, Price Filter & Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Price Range Filter */}
          <select
            id="gallery-price-range-select"
            value={priceRange}
            onChange={(e) => onPriceRangeChange(e.target.value as 'all' | 'under100' | '100to250' | '250to450' | 'over450')}
            className="px-2.5 py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700 shadow-2xs focus:outline-hidden cursor-pointer"
            title="Filter by budget"
          >
            <option value="all">Any Price</option>
            <option value="under100">Under £100</option>
            <option value="100to250">£100 – £250</option>
            <option value="250to450">£250 – £450</option>
            <option value="over450">£450 and above</option>
          </select>

          {/* Status Select */}
          <div className="flex items-center space-x-1 bg-stone-100/90 p-1 rounded-lg border border-stone-200/70 text-xs">
            {['All', 'Available', 'Discounted'].map((status) => (
              <button
                key={status}
                id={`filter-status-${status.toLowerCase()}`}
                onClick={() => onStatusChange(status)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedStatus === status
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <div className="flex items-center space-x-1.5 bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-stone-400">Sort:</span>
              <select
                id="gallery-sort-select"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="bg-transparent text-stone-900 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="recent">Recent / Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="title-asc">Title: A to Z</option>
                <option value="title-desc">Title: Z to A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Chips Scrollable Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-medium text-stone-400 shrink-0 flex items-center pr-1">
          <SlidersHorizontal className="w-3 h-3 mr-1" /> Tags:
        </span>
        {AVAILABLE_TAGS.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <button
              key={tag}
              id={`tag-chip-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => onTagChange(tag)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Results Count & Quick Actions */}
      <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
        <div>
          {totalFiltered === 0 ? (
            <span>No artworks match your search or filter criteria.</span>
          ) : (
            <span>
              Showing <strong className="text-stone-800 font-medium">{startIndex + 1}–{Math.min(endIndex, totalFiltered)}</strong> of <strong className="text-stone-800 font-medium">{totalFiltered}</strong> pieces
              {totalFiltered !== totalAll && ` (filtered from ${totalAll} total)`}
            </span>
          )}
        </div>

        {totalAll < 100 && (
          <button
            onClick={onSeed226}
            title="Populate 226 Scottish paintings dataset to preview full 20-per-page pagination"
            className="text-[11px] text-amber-900 hover:text-amber-950 underline decoration-amber-300 font-medium"
          >
            Load full 226-item sample inventory
          </button>
        )}
      </div>
    </div>
  );
};
