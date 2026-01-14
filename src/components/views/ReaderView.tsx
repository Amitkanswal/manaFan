import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronDown, Maximize, Minimize } from 'lucide-react';
import { Manga, Chapter, UserSettings } from '@/types';

export interface ReaderPage {
  id: number;
  url: string;
  num: number;
}

interface ReaderViewProps {
  chapter: Chapter;
  manga: Manga;
  pages: ReaderPage[];
  settings: UserSettings;
  onBack: () => void;
  onNavigateChapter: (chapter: Chapter) => void;
}

/**
 * ReaderView - Pure presentational component for reading manga
 * All data and callbacks come from props - no internal data fetching
 */
export const ReaderView: React.FC<ReaderViewProps> = ({ 
  chapter, 
  manga, 
  pages,
  settings,
  onBack,
  onNavigateChapter,
}) => {
  // UI-only state (appropriate for presentational components)
  const [mode, setMode] = useState<'webtoon' | 'page'>('webtoon');
  const [currentPage, setCurrentPage] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn("Fullscreen request failed:", err.message);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
     let interval: NodeJS.Timeout;
     if(settings.autoScroll && mode === 'webtoon' && scrollContainerRef.current) {
        interval = setInterval(() => {
           scrollContainerRef.current?.scrollBy({ top: settings.scrollSpeed, behavior: 'auto' });
        }, 30);
     }
     return () => clearInterval(interval);
  }, [settings.autoScroll, settings.scrollSpeed, mode]);

  // Reset page when chapter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [chapter.id]);

  const nextChapter = () => {
     const currIndex = manga.chapters.findIndex(c => c.id === chapter.id);
     if (currIndex > 0) onNavigateChapter(manga.chapters[currIndex - 1]);
  };
  
  const prevChapter = () => {
     const currIndex = manga.chapters.findIndex(c => c.id === chapter.id);
     if (currIndex < manga.chapters.length - 1) onNavigateChapter(manga.chapters[currIndex + 1]);
  };

  const getReaderBg = () => {
     if(settings.theme === 'light') return 'bg-white';
     if(settings.theme === 'blue') return 'bg-[#1e293b]';
     return 'bg-[#1a1a1a]';
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col h-screen ${getReaderBg()}`}>
      {/* Header Controls */}
      <div className={`transition-transform duration-300 ${controlsVisible ? 'translate-y-0' : '-translate-y-full'} absolute top-0 left-0 right-0 bg-gray-900/95 backdrop-blur text-white p-4 flex items-center justify-between z-10 border-b border-gray-800`}>
        <div className="flex items-center gap-4">
           <button onClick={onBack} aria-label="Go back"><ChevronLeft /></button>
           <div className="flex flex-col">
             <h2 className="font-bold text-sm md:text-base line-clamp-1">{manga.title}</h2>
             <div className="relative group flex items-center">
               <select 
                  value={chapter.id}
                  onChange={(e) => {
                     const selected = manga.chapters.find(c => c.id === e.target.value);
                     if(selected) onNavigateChapter(selected);
                  }}
                  className="text-xs bg-transparent text-gray-400 border-none p-0 pr-4 cursor-pointer focus:ring-0 appearance-none hover:text-orange-500 transition-colors font-medium outline-none"
                  aria-label="Select chapter"
               >
                  {manga.chapters.map(c => (
                     <option key={c.id} value={c.id} className="bg-gray-800 text-white">
                        {c.title}
                     </option>
                  ))}
               </select>
               <ChevronDown size={12} className="text-gray-500 pointer-events-none ml-1"/>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
           <button 
             onClick={toggleFullscreen}
             className="px-3 py-1 rounded text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-white flex items-center gap-1"
             aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
           >
             {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
             <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full'}</span>
           </button>
           <div className="w-px h-4 bg-gray-700 mx-1"></div>
           <button 
             onClick={() => setMode('webtoon')}
             className={`px-3 py-1 rounded text-xs font-medium ${mode === 'webtoon' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
             aria-pressed={mode === 'webtoon'}
           >
             Webtoon
           </button>
           <button 
             onClick={() => setMode('page')}
             className={`px-3 py-1 rounded text-xs font-medium ${mode === 'page' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
             aria-pressed={mode === 'page'}
           >
             Page
           </button>
        </div>
      </div>

      {/* Reading Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-grow overflow-auto relative h-full no-scrollbar"
        onClick={() => setControlsVisible(!controlsVisible)}
      >
        <div className="max-w-3xl mx-auto min-h-full">
          {mode === 'webtoon' ? (
             <div className="flex flex-col items-center py-20">
               {pages.map(page => (
                 <img key={page.id} src={page.url} alt={`Page ${page.num}`} className="w-full max-w-full mb-2 shadow-2xl" loading="lazy" />
               ))}
               
               <div className={`w-full p-8 flex flex-col items-center gap-4 ${settings.theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  <p>End of Chapter</p>
                  <div className="flex gap-4">
                    <button onClick={(e) => { e.stopPropagation(); prevChapter(); }} className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Prev</button>
                    <button onClick={(e) => { e.stopPropagation(); nextChapter(); }} className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-bold">Next Chapter</button>
                  </div>
               </div>
             </div>
          ) : (
             <div className="h-full flex items-center justify-center p-4">
               <div className="relative w-full h-full flex items-center justify-center">
                  {pages[currentPage] && (
                    <img src={pages[currentPage].url} className="max-h-full max-w-full object-contain shadow-2xl" alt={`Page ${currentPage + 1}`}/>
                  )}
                  <div className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(0, p - 1)); }} />
                  <div className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(pages.length - 1, p + 1)); }} />
                  <div className="absolute bottom-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                     Page {currentPage + 1} / {pages.length}
                  </div>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
