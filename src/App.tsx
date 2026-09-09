/**
 * Fife Art - Original Scottish Paintings & Wildlife Art
 * Clean, modern, museum-grade art gallery & sales portfolio
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { GalleryToolbar } from './components/GalleryToolbar';
import { ArtworkCard } from './components/ArtworkCard';
import { ArtworkModal } from './components/ArtworkModal';
import { EnquiryModal } from './components/EnquiryModal';
import { AboutArtistModal } from './components/AboutArtistModal';
import { AdminPortal } from './components/AdminPortal';
import { ViewOnWallModal } from './components/ViewOnWallModal';
import { CertificateModal } from './components/CertificateModal';
import { Pagination } from './components/Pagination';
import { Footer } from './components/Footer';
import { Artwork, SortOption, CurrencyCode } from './types';
import { StorageService } from './services/storage';
import { Sparkles, RefreshCw, Palette, Heart } from 'lucide-react';

const FAVORITES_STORAGE_KEY = 'fifeart_favorites_v1';

export default function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [priceRange, setPriceRange] = useState<'all' | 'under100' | '100to250' | '250to450' | 'over450'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // 20 artworks per page

  // Currency & Internationalization
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');

  // Favorites / Saved Wishlist
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isFavoritesOnly, setIsFavoritesOnly] = useState(false);

  // Modals state
  const [detailArtwork, setDetailArtwork] = useState<Artwork | null>(null);
  const [enquiryArtwork, setEnquiryArtwork] = useState<Artwork | null>(null);
  const [wallViewArtwork, setWallViewArtwork] = useState<Artwork | null>(null);
  const [certificateArtwork, setCertificateArtwork] = useState<Artwork | null>(null);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isWallViewOpen, setIsWallViewOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Initialize artworks from storage
  useEffect(() => {
    const loaded = StorageService.getArtworks();
    setArtworks(loaded);
  }, []);

  // Keyboard shortcut listener (Alt+A for hidden admin, Escape for modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsAdminOpen(true);
      }
      if (e.key === 'Escape') {
        setDetailArtwork(null);
        setIsEnquiryOpen(false);
        setIsAboutOpen(false);
        setIsAdminOpen(false);
        setIsWallViewOpen(false);
        setIsCertificateOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter & Sort Logic
  const filteredAndSortedArtworks = useMemo(() => {
    return artworks
      .filter((art) => {
        // Favorites-only filter
        if (isFavoritesOnly && !favorites.includes(art.id)) {
          return false;
        }

        // Tag filter
        if (selectedTag !== 'All' && !art.tags.includes(selectedTag)) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'All') {
          if (selectedStatus === 'Available' && art.status !== 'Available') return false;
          if (selectedStatus === 'Discounted' && art.status !== 'Discounted') return false;
        }

        // Price range filter
        if (priceRange === 'under100' && art.price >= 100) return false;
        if (priceRange === '100to250' && (art.price < 100 || art.price > 250)) return false;
        if (priceRange === '250to450' && (art.price < 250 || art.price > 450)) return false;
        if (priceRange === 'over450' && art.price <= 450) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesTitle = art.title.toLowerCase().includes(q);
          const matchesMedium = art.medium.toLowerCase().includes(q);
          const matchesSku = art.sku.toLowerCase().includes(q);
          const matchesTags = art.tags.some((t) => t.toLowerCase().includes(q));
          const matchesDesc = art.description.toLowerCase().includes(q);
          return matchesTitle || matchesMedium || matchesSku || matchesTags || matchesDesc;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'recent':
          default:
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
      });
  }, [artworks, searchQuery, selectedTag, selectedStatus, priceRange, sortBy, isFavoritesOnly, favorites]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag, selectedStatus, priceRange, sortBy, isFavoritesOnly]);

  // Pagination slice (20 items per page)
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArtworks = filteredAndSortedArtworks.slice(startIndex, endIndex);

  // Detail Modal Navigation
  const currentDetailIndex = detailArtwork
    ? filteredAndSortedArtworks.findIndex((a) => a.id === detailArtwork.id)
    : -1;
  const hasPrev = currentDetailIndex > 0;
  const hasNext = currentDetailIndex !== -1 && currentDetailIndex < filteredAndSortedArtworks.length - 1;

  const handlePrevDetail = () => {
    if (hasPrev) {
      setDetailArtwork(filteredAndSortedArtworks[currentDetailIndex - 1]);
    }
  };

  const handleNextDetail = () => {
    if (hasNext) {
      setDetailArtwork(filteredAndSortedArtworks[currentDetailIndex + 1]);
    }
  };

  const handleOpenEnquiryForArtwork = (artwork: Artwork) => {
    setEnquiryArtwork(artwork);
    setIsEnquiryOpen(true);
  };

  const handleOpenGeneralEnquiry = () => {
    setEnquiryArtwork(null);
    setIsEnquiryOpen(true);
  };

  const handleOpenWallView = (artwork: Artwork, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWallViewArtwork(artwork);
    setIsWallViewOpen(true);
  };

  const handleOpenCertificate = (artwork: Artwork) => {
    setCertificateArtwork(artwork);
    setIsCertificateOpen(true);
  };

  const handleSeed226Catalog = () => {
    const full = StorageService.populateFull226Inventory();
    setArtworks(full);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTag('All');
    setSelectedStatus('All');
    setPriceRange('all');
    setSortBy('recent');
    setIsFavoritesOnly(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#1A1A1A]">
      {/* Primary Sticky Header */}
      <Header
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenGeneralEnquiry={handleOpenGeneralEnquiry}
        onOpenAdmin={() => setIsAdminOpen(true)}
        totalArtworksCount={artworks.length}
        currency={currency}
        onCurrencyChange={setCurrency}
        favoritesCount={favorites.length}
        onToggleFavoritesOnly={() => setIsFavoritesOnly(!isFavoritesOnly)}
        isFavoritesOnly={isFavoritesOnly}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subtle Artist Intro Banner */}
        <section className="pt-8 pb-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200/60 gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-stone-900 leading-tight">
              Original Paintings by Fife Art
            </h1>
            <p className="text-stone-600 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
              Hand-painted original works inspired by the historic Kirkcaldy coastline, Scottish wildlife, and the ever-shifting light across the Firth of Forth.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs text-stone-500 self-center sm:self-auto">
            <span className="inline-flex items-center space-x-1 bg-stone-100 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Acrylics & Oils, watercolour and sketches</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-stone-100 px-3 py-1.5 rounded-full">
              <span>Framed & Canvas Works</span>
            </span>
          </div>
        </section>

        {/* Gallery Toolbar with Search, Tags, Status filter, Price filter, Sort & Counts */}
        <GalleryToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalFiltered={filteredAndSortedArtworks.length}
          totalAll={artworks.length}
          startIndex={startIndex}
          endIndex={endIndex}
          onSeed226={handleSeed226Catalog}
        />

        {/* Favorites Notice Banner if in Favorites View */}
        {isFavoritesOnly && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
              <span>Showing your saved collection ({filteredAndSortedArtworks.length} pieces)</span>
            </div>
            <button
              onClick={() => setIsFavoritesOnly(false)}
              className="text-rose-900 font-semibold underline hover:text-rose-950"
            >
              Show all paintings
            </button>
          </div>
        )}

        {/* Artworks Grid (4 columns on desktop, 2 on mobile) */}
        {paginatedArtworks.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4 pb-8">
            {paginatedArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                currency={currency}
                isFavorite={favorites.includes(artwork.id)}
                onToggleFavorite={toggleFavorite}
                onSelect={(art) => setDetailArtwork(art)}
                onQuickEnquire={(art, e) => {
                  e.stopPropagation();
                  handleOpenEnquiryForArtwork(art);
                }}
                onOpenViewOnWall={handleOpenWallView}
              />
            ))}
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-medium text-stone-900">
              No paintings found
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              We couldn't find any artwork matching your current search or tag filters. Try selecting "All" or clearing the search terms.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}

        {/* Pagination Controls (20 per page) */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredAndSortedArtworks.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 160, behavior: 'smooth' });
          }}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenEnquiry={handleOpenGeneralEnquiry}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* MODAL 1: Detail Lightbox View */}
      <ArtworkModal
        artwork={detailArtwork}
        currency={currency}
        onClose={() => setDetailArtwork(null)}
        onEnquireToBuy={(art) => {
          setDetailArtwork(null);
          handleOpenEnquiryForArtwork(art);
        }}
        onOpenViewOnWall={(art) => {
          setDetailArtwork(null);
          handleOpenWallView(art);
        }}
        onPrev={handlePrevDetail}
        onNext={handleNextDetail}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      {/* MODAL 2: View on Wall & Framing Simulator */}
      <ViewOnWallModal
        artwork={wallViewArtwork}
        currency={currency}
        isOpen={isWallViewOpen}
        onClose={() => setIsWallViewOpen(false)}
        onEnquireToBuy={(art) => {
          setIsWallViewOpen(false);
          handleOpenEnquiryForArtwork(art);
        }}
      />

      {/* MODAL 3: Certificate of Authenticity Generator */}
      <CertificateModal
        artwork={certificateArtwork}
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
      />

      {/* MODAL 4: Enquiry & Order to Buy Form */}
      <EnquiryModal
        artwork={enquiryArtwork}
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
      />

      {/* MODAL 5: About the Artist */}
      <AboutArtistModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onOpenEnquiry={handleOpenGeneralEnquiry}
      />

      {/* MODAL 6: Hidden Studio Admin Portal */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        artworks={artworks}
        onArtworksUpdated={(updated) => setArtworks(updated)}
        onGenerateCertificate={handleOpenCertificate}
      />
    </div>
  );
}
