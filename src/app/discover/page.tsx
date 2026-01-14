"use client";

import { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Navbar } from '@/shared/components/navbar';
import { MangaCard, useMangaList, useGenres, GenreTerm, MangaFilters } from '@/features/manga';
import { Skeleton } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { Manga } from '@/features/manga/types';

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  // Store the selected genre term (with termUid for taxonomy filtering)
  const [selectedGenreTerm, setSelectedGenreTerm] = useState<GenreTerm | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Manga['status'] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Build filters object with taxonomy term UIDs for server-side filtering
  const filters: MangaFilters = useMemo(() => ({
    searchQuery: searchQuery.trim() || undefined,
    // Use taxonomy term UID for genre filtering (server-side via Contentstack)
    genre: selectedGenreTerm?.termUid,
    status: selectedStatus || undefined,
  }), [searchQuery, selectedGenreTerm, selectedStatus]);

  // Pass filters to useMangaList - the API will use taxonomy queries
  const { data: mangaList, isLoading } = useMangaList(filters);
  const { data: genres } = useGenres();

  // No client-side filtering needed - server handles it via taxonomy queries
  const filteredManga = mangaList;

  const clearFilters = () => {
    setSelectedGenreTerm(null);
    setSelectedStatus(null);
    setSearchQuery('');
  };

  const hasActiveFilters = searchQuery || selectedGenreTerm || selectedStatus;

  return (
    <>
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Discover Manga</h1>
          
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              showFilters || hasActiveFilters
                ? "bg-vermillion-100 text-vermillion-600 dark:bg-vermillion-900/30 dark:text-vermillion-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            )}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="bg-vermillion-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {[searchQuery, selectedGenreTerm, selectedStatus].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mb-4 relative">
          <input
            type="text"
            placeholder="Search manga, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-vermillion-500 focus:outline-none"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Filter Options</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-vermillion-500 hover:text-vermillion-600 flex items-center gap-1"
                >
                  <X size={14} /> Clear all
                </button>
              )}
            </div>

            {/* Genre Filter - Uses Taxonomy */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Genre <span className="text-xs text-vermillion-500">(Taxonomy-filtered)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre.termUid}
                    onClick={() => setSelectedGenreTerm(
                      selectedGenreTerm?.termUid === genre.termUid ? null : genre
                    )}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      selectedGenreTerm?.termUid === genre.termUid
                        ? "bg-vermillion-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter - Uses Taxonomy */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Status <span className="text-xs text-vermillion-500">(Taxonomy-filtered)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(['Ongoing', 'Completed', 'Hiatus'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      selectedStatus === status
                        ? status === 'Completed' 
                          ? "bg-ai-500 text-white"
                          : status === 'Hiatus'
                          ? "bg-kiniro-500 text-white"
                          : "bg-matcha-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-vermillion-500">
                  <X size={14} />
                </button>
              </span>
            )}
            {selectedGenreTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-vermillion-100 dark:bg-vermillion-900/30 text-vermillion-600 dark:text-vermillion-400 rounded-full text-sm">
                {selectedGenreTerm.name}
                <button onClick={() => setSelectedGenreTerm(null)} className="hover:text-vermillion-700">
                  <X size={14} />
                </button>
              </span>
            )}
            {selectedStatus && (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm",
                selectedStatus === 'Completed' 
                  ? "bg-ai-100 dark:bg-ai-900/30 text-ai-600 dark:text-ai-400"
                  : selectedStatus === 'Hiatus'
                  ? "bg-kiniro-100 dark:bg-kiniro-900/30 text-kiniro-600 dark:text-kiniro-400"
                  : "bg-matcha-100 dark:bg-matcha-900/30 text-matcha-600 dark:text-matcha-400"
              )}>
                {selectedStatus}
                <button onClick={() => setSelectedStatus(null)} className="hover:opacity-70">
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredManga.length} manga found
            {hasActiveFilters && ' (filtered by taxonomy)'}
          </p>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <Skeleton className="aspect-[2/3] rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredManga.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 mb-4">
              {hasActiveFilters 
                ? `No manga found matching your filters`
                : 'No manga available'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-vermillion-500 hover:text-vermillion-600 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredManga.map(manga => (
              <MangaCard key={manga.id} manga={manga} variant="grid" />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
