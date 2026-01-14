"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronDown, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Chapter } from '@/features/manga';
import { Page, ReaderSettings } from '../types';

interface ReaderProps {
  mangaTitle: string;
  chapter: Chapter;
  chapters: Chapter[];
  pages: Page[];
  settings: ReaderSettings;
  onBack: () => void;
  onChapterChange: (chapter: Chapter) => void;
}

export function Reader({
  mangaTitle,
  chapter,
  chapters,
  pages,
  settings,
  onBack,
  onChapterChange,
}: ReaderProps) {
  const [mode, setMode] = useState(settings.mode);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen handling
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (!settings.autoScroll || mode !== 'webtoon' || !containerRef.current) return;
    
    const interval = setInterval(() => {
      containerRef.current?.scrollBy({ top: settings.scrollSpeed, behavior: 'auto' });
    }, 30);
    
    return () => clearInterval(interval);
  }, [settings.autoScroll, settings.scrollSpeed, mode]);

  // Navigation helpers
  const goToNextPage = () => setCurrentPage(p => Math.min(pages.length - 1, p + 1));
  const goToPrevPage = () => setCurrentPage(p => Math.max(0, p - 1));

  const currentIndex = chapters.findIndex(c => c.id === chapter.id);
  const nextChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const prevChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-900">
      {/* Header */}
      <header 
        className={cn(
          'absolute top-0 inset-x-0 z-10 bg-black/90 backdrop-blur transition-transform duration-300',
          showControls ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-white">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="font-semibold text-white text-sm line-clamp-1">{mangaTitle}</h2>
              <div className="flex items-center gap-1">
                <select
                  value={chapter.id}
                  onChange={(e) => {
                    const selected = chapters.find(c => c.id === e.target.value);
                    if (selected) onChapterChange(selected);
                  }}
                  className="text-xs bg-transparent text-neutral-400 border-none cursor-pointer focus:ring-0"
                >
                  {chapters.map(c => (
                    <option key={c.id} value={c.id} className="bg-neutral-800 text-white">
                      {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="text-neutral-500" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1 text-xs text-neutral-400 hover:text-white"
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
            <button
              onClick={() => setMode('webtoon')}
              className={cn(
                'px-3 py-1 rounded text-xs font-medium',
                mode === 'webtoon' ? 'bg-orange-500 text-white' : 'text-neutral-400'
              )}
            >
              Webtoon
            </button>
            <button
              onClick={() => setMode('page')}
              className={cn(
                'px-3 py-1 rounded text-xs font-medium',
                mode === 'page' ? 'bg-orange-500 text-white' : 'text-neutral-400'
              )}
            >
              Page
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto no-scrollbar"
        onClick={() => setShowControls(!showControls)}
      >
        {mode === 'webtoon' ? (
          <div className="max-w-3xl mx-auto py-16">
            {pages.map(page => (
              <img
                key={page.id}
                src={page.url}
                alt={`Page ${page.number}`}
                loading="lazy"
                className="w-full mb-1"
              />
            ))}
            
            {/* End of chapter */}
            <div className="py-12 text-center text-white">
              <p className="mb-4">End of Chapter</p>
              <div className="flex justify-center gap-4">
                {prevChapter && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onChapterChange(prevChapter); }}
                    className="px-6 py-2 bg-neutral-700 rounded-lg hover:bg-neutral-600"
                  >
                    Previous
                  </button>
                )}
                {nextChapter && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onChapterChange(nextChapter); }}
                    className="px-6 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 font-semibold"
                  >
                    Next Chapter
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <div className="relative max-h-full max-w-full">
              {pages[currentPage] && (
                <img
                  src={pages[currentPage].url}
                  alt={`Page ${currentPage + 1}`}
                  className="max-h-[calc(100vh-100px)] max-w-full object-contain"
                />
              )}
              
              {/* Click zones */}
              <div
                className="absolute inset-y-0 left-0 w-1/3 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
              />
              <div
                className="absolute inset-y-0 right-0 w-1/3 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
              />
              
              {/* Page indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs">
                {currentPage + 1} / {pages.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

