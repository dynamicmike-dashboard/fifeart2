import React, { useRef, useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
  onSeed226?: () => void;
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
}) => {
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = tagsContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = tagsContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = tagsContainerRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-3 pt-4 sm:pt-6 pb-2 w-full max-w-full min-w-0 overflow-hidden">
      {/* Top Bar: Search, Quick Status, Price Range & Sort */}
      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between w-full min-w-0">
        {/* Search Field */}
        <div className="relative w-full md:max-w-md min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="artwork-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search title, medium, coastal, wildlife..."
            className="w-full pl-10 pr-9 py-2 sm:py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-800 focus:border-stone-800 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters & Sort Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start sm:justify-end">
          {/* Price Range Filter */}
          <select
            id="gallery-price-range-select"
            value={priceRange}
            onChange={(e) =>
              onPriceRangeChange(e.target.value as 'all' | 'under100' | '100to250' | '250to450' | 'over450')
            }
            className="px-2.5 py-1.5 sm:py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700 shadow-2xs focus:outline-hidden cursor-pointer"
            title="Filter by budget"
          >
            <option value="all">Any Price</option>
            <option value="under100">Under £100</option>
            <option value="100to250">£100 – £250</option>
            <option value="250to450">£250 – £450</option>
            <option value="over450">£450 and above</option>
          </select>

          {/* Status Quick Toggle */}
          <div className="flex items-center space-x-1 bg-stone-100/90 p-0.5 sm:p-1 rounded-lg border border-stone-200/70 text-xs">
            {['All', 'Available', 'Discounted'].map((status) => (
              <button
                key={status}
                id={`filter-status-${status.toLowerCase()}`}
                onClick={() => onStatusChange(status)}
                className={`px-2 py-1 rounded-md font-medium transition-all text-xs cursor-pointer ${
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
            <div className="flex items-center space-x-1.5 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 sm:py-2 text-xs font-medium text-stone-700 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <select
                id="gallery-sort-select"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="bg-transparent text-stone-900 font-medium focus:outline-hidden cursor-pointer text-xs"
              >
                <option value="recent">Sort: Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="title-asc">Title: A to Z</option>
                <option value="title-desc">Title: Z to A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Chips Horizontally Scrollable Bar with Touch & Indicator Controls */}
      <div className="relative w-full max-w-full min-w-0 pt-1 group">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Scroll tags left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/95 shadow-md border border-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-950 transition-opacity cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={tagsContainerRef}
          className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1 px-1 w-full max-w-full min-w-0 touch-pan-x overscroll-x-contain scroll-smooth"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <span className="text-xs font-medium text-stone-400 shrink-0 flex items-center pr-1 select-none">
            <SlidersHorizontal className="w-3 h-3 mr-1 text-stone-500" /> Tags:
          </span>
          {AVAILABLE_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                id={`tag-chip-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => onTagChange(tag)}
                className={`shrink-0 whitespace-nowrap px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all select-none cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-stone-900 text-stone-50 shadow-xs ring-1 ring-stone-900'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Scroll tags right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/95 shadow-md border border-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-950 transition-opacity cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Count & Current Filter notice */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-500 pt-0.5 border-t border-stone-100">
        <div>
          {totalFiltered === 0 ? (
            <span className="text-rose-600 font-medium">No artworks match your current search or filter criteria.</span>
          ) : (
            <span>
              Showing <strong className="text-stone-800 font-medium">{startIndex + 1}–{Math.min(endIndex, totalFiltered)}</strong> of <strong className="text-stone-800 font-medium">{totalFiltered}</strong> pieces
              {totalFiltered !== totalAll && ` (filtered from ${totalAll} total)`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

