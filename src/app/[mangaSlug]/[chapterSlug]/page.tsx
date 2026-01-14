"use client";

import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, Home, List, X, 
  Maximize, Minimize, ArrowUp, Play, Pause, Wifi, WifiOff
} from 'lucide-react';
import { useChapterBySlug } from '@/features/manga/hooks/use-manga';
import { Skeleton } from '@/shared/components/ui';
import { cn, parseChapterSlug } from '@/shared/lib/utils';
import { useImagePreloader, useNetworkAwareLoading } from '@/shared/hooks/use-image-loading';
import { useUserLibrary } from '@/core/providers';

type ReadingMode = 'webtoon' | 'page';

/**
 * Optimized Reader Page Image Component
 * - Lazy loading with intersection observer
 * - Progressive loading with blur placeholder
 * - Preloading for upcoming pages
 */
function ReaderPageImage({ 
  src, 
  alt, 
  index, 
  isPreloaded,
  quality = 85
}: { 
  src: string; 
  alt: string; 
  index: number;
  isPreloaded: boolean;
  quality?: number;
}) {
  const [isLoading, setIsLoading] = useState(!isPreloaded);
  const [isInView, setIsInView] = useState(index < 3);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (index < 3) return; // First 3 images load immediately

    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0.01,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div 
      ref={imgRef}
      className="relative w-full min-h-[300px] bg-gray-800"
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Loading page {index + 1}...</span>
          </div>
        </div>
      )}

      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={800}
          height={1200}
          quality={quality}
          priority={index < 2}
          loading={index < 3 ? 'eager' : 'lazy'}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
          className={cn(
            'w-full h-auto transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  );
}

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  
  const mangaSlug = params.mangaSlug as string;
  const chapterSlugParam = params.chapterSlug as string;
  const chapterNumber = parseChapterSlug(chapterSlugParam) || 1;
  
  const { data, isLoading, error } = useChapterBySlug(mangaSlug, chapterNumber);

  // Reader state
  const [mode, setMode] = useState<ReadingMode>('webtoon');
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Image preloading
  const pages = data?.pages || [];
  const { preloadNext, isPreloaded } = useImagePreloader(pages, 5);
  
  // Network-aware quality
  const { isSlowConnection, getRecommendedQuality, connectionType } = useNetworkAwareLoading();
  const imageQuality = getRecommendedQuality();

  // User library for tracking progress
  const { updateReadingProgress, addToHistory } = useUserLibrary();

  // Preload next images when current page changes
  useEffect(() => {
    if (pages.length > 0) {
      preloadNext(currentPage);
    }
  }, [currentPage, pages, preloadNext]);

  // Track reading progress and add to history when chapter is loaded
  // Use refs to track if we've already saved progress to prevent duplicate saves
  const progressSavedRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (data) {
      const { manga, chapter } = data;
      const progressKey = `${manga.slug}-${chapter.slug}`;
      
      // Only save if we haven't saved for this chapter yet
      if (progressSavedRef.current !== progressKey) {
        progressSavedRef.current = progressKey;
        
        // Update reading progress
        updateReadingProgress({
          mangaSlug: manga.slug,
          mangaTitle: manga.title,
          mangaCover: manga.cover,
          chapterSlug: chapter.slug,
          chapterNumber: chapter.number,
          chapterTitle: chapter.title,
          totalChapters: manga.chapters.length,
        });

        // Add to reading history
        addToHistory({
          mangaSlug: manga.slug,
          mangaTitle: manga.title,
          mangaCover: manga.cover,
          chapterSlug: chapter.slug,
          chapterNumber: chapter.number,
          chapterTitle: chapter.title,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.manga?.slug, data?.chapter?.slug]);

  // Hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-scroll for webtoon mode
  useEffect(() => {
    if (!autoScroll || mode !== 'webtoon') return;
    
    const interval = setInterval(() => {
      containerRef.current?.scrollBy({ top: 2, behavior: 'smooth' });
    }, 50);
    
    return () => clearInterval(interval);
  }, [autoScroll, mode]);

  // Handlers (defined early to use in useEffect)
  const handleNextPage = useCallback(() => {
    if (!data) return;
    const { manga, pages } = data;
    const nextChapter = manga.chapters[manga.chapters.findIndex(ch => ch.number === data.chapter.number) - 1];
    
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (nextChapter) {
      router.push(`/${manga.slug}/${nextChapter.slug}`);
    }
  }, [currentPage, data, router]);

  const handlePrevPage = useCallback(() => {
    if (!data) return;
    const { manga } = data;
    const prevChapter = manga.chapters[manga.chapters.findIndex(ch => ch.number === data.chapter.number) + 1];
    
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    } else if (prevChapter) {
      router.push(`/${manga.slug}/${prevChapter.slug}`);
    }
  }, [currentPage, data, router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'page') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          handleNextPage();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevPage();
        }
      }
      if (e.key === 'f') toggleFullscreen();
      if (e.key === 'Escape' && showChapterList) setShowChapterList(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, showChapterList, handleNextPage, handlePrevPage, toggleFullscreen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl mx-auto p-4">
          <Skeleton className="h-8 w-64 mx-auto bg-gray-800" />
          <Skeleton className="h-[80vh] w-full bg-gray-800" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    notFound();
  }

  const { manga, chapter } = data;

  // Navigation helpers
  const currentChapterIndex = manga.chapters.findIndex(ch => ch.number === chapter.number);
  const prevChapter = manga.chapters[currentChapterIndex + 1];
  const nextChapter = manga.chapters[currentChapterIndex - 1];

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "min-h-screen bg-gray-900 text-white relative",
        mode === 'webtoon' ? 'overflow-y-auto' : 'overflow-hidden'
      )}
    >
      {/* Network indicator for slow connections */}
      {isSlowConnection && (
        <div className="fixed top-4 right-4 z-[100] bg-yellow-600 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2">
          <WifiOff size={14} />
          Slow connection - Loading optimized images
        </div>
      )}

      {/* Top Controls */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent p-4 transition-opacity duration-300",
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${manga.slug}`} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="font-bold text-lg line-clamp-1">{manga.title}</h1>
              <p className="text-sm text-gray-400">{chapter.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowChapterList(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <List size={20} />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Home size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Reading Mode Toggle */}
      <div className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-gray-800 rounded-full p-1 flex transition-opacity duration-300",
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <button
          onClick={() => setMode('webtoon')}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            mode === 'webtoon' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          Webtoon
        </button>
        <button
          onClick={() => { setMode('page'); setCurrentPage(0); }}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            mode === 'page' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          Page
        </button>
      </div>

      {/* Content */}
      <div className="pt-24 pb-20">
        {mode === 'webtoon' ? (
          // Webtoon (Vertical Scroll) Mode with optimized images
          <div className="max-w-3xl mx-auto px-4">
            {pages.map((page, index) => (
              <ReaderPageImage
                key={`${page}-${index}`}
                src={page}
                alt={`Page ${index + 1}`}
                index={index}
                isPreloaded={isPreloaded(page)}
                quality={imageQuality}
              />
            ))}
            
            {/* End of Chapter Navigation */}
            <div className="py-10 text-center space-y-4">
              <p className="text-gray-400">End of {chapter.title}</p>
              <div className="flex justify-center gap-4">
                {prevChapter && (
                  <Link
                    href={`/${manga.slug}/${prevChapter.slug}`}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    ← Previous Chapter
                  </Link>
                )}
                {nextChapter && (
                  <Link
                    href={`/${manga.slug}/${nextChapter.slug}`}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition-colors"
                  >
                    Next Chapter →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Page Mode with optimized single image
          <div className="h-[calc(100vh-6rem)] flex items-center justify-center px-4 relative">
            {/* Previous Page Area */}
            <button 
              onClick={handlePrevPage}
              className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-w-resize"
              disabled={currentPage === 0 && !prevChapter}
            />
            
            {/* Current Page - Optimized */}
            <div className="relative max-h-full max-w-full">
              <Image
                src={pages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                width={800}
                height={1200}
                quality={imageQuality}
                priority
                sizes="(max-width: 768px) 100vw, 80vw"
                className="max-h-[calc(100vh-8rem)] w-auto object-contain"
              />
            </div>
            
            {/* Next Page Area */}
            <button 
              onClick={handleNextPage}
              className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-e-resize"
              disabled={currentPage === pages.length - 1 && !nextChapter}
            />

            {/* Page Number */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-sm">
              {currentPage + 1} / {pages.length}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300",
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={prevChapter ? `/${manga.slug}/${prevChapter.slug}` : '#'}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              prevChapter ? 'hover:bg-white/10' : 'opacity-50 cursor-not-allowed'
            )}
          >
            <ChevronLeft size={20} /> Prev
          </Link>
          
          {mode === 'webtoon' && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoScroll(prev => !prev)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  autoScroll ? 'bg-orange-500' : 'hover:bg-white/10'
                )}
              >
                {autoScroll ? <Pause size={18} /> : <Play size={18} />}
                Auto Scroll
              </button>
              <button
                onClick={scrollToTop}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowUp size={20} />
              </button>
            </div>
          )}
          
          <Link
            href={nextChapter ? `/${manga.slug}/${nextChapter.slug}` : '#'}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              nextChapter ? 'hover:bg-white/10 bg-orange-500' : 'opacity-50 cursor-not-allowed'
            )}
          >
            Next <ChevronRight size={20} />
          </Link>
        </div>
      </div>

      {/* Chapter List Sidebar */}
      {showChapterList && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowChapterList(false)} 
          />
          <div className="relative w-80 max-w-full bg-gray-900 h-full overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-bold text-lg">Chapters</h2>
              <button 
                onClick={() => setShowChapterList(false)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-2">
              {manga.chapters.map(ch => (
                <Link
                  key={ch.id}
                  href={`/${manga.slug}/${ch.slug}`}
                  onClick={() => setShowChapterList(false)}
                  className={cn(
                    "block p-3 rounded-lg transition-colors",
                    ch.number === chapter.number
                      ? 'bg-orange-500 text-white'
                      : 'hover:bg-gray-800'
                  )}
                >
                  <span className="font-medium">{ch.title}</span>
                  <span className="text-sm text-gray-400 ml-2">{ch.date}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
