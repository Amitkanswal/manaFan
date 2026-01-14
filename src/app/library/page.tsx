"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Heart, PlayCircle, Bell, Trash2, BookOpen } from 'lucide-react';
import { Navbar } from '@/shared/components/navbar';
import { cn } from '@/shared/lib/utils';
import { useUserLibrary } from '@/core/providers';
import { Skeleton } from '@/shared/components/ui';

// Force dynamic rendering - this page uses localStorage which is client-only
export const dynamic = 'force-dynamic';

type LibraryTab = 'history' | 'collection';

export default function LibraryPage() {
  const [tab, setTab] = useState<LibraryTab>('history');
  const { 
    history, 
    bookmarked, 
    readingProgress, 
    clearHistory,
    removeBookmark,
    isLoaded 
  } = useUserLibrary();

  // Calculate total unread count
  const totalUnreadCount = useMemo(() => {
    return Object.values(readingProgress).reduce((acc, progress) => {
      const unread = progress.totalChapters - progress.lastChapterNumber;
      return acc + Math.max(0, unread);
    }, 0);
  }, [readingProgress]);

  // Get bookmarked items with progress
  const bookmarkedWithProgress = useMemo(() => {
    return Object.values(bookmarked).map(item => {
      const progress = readingProgress[item.mangaSlug];
      return {
        ...item,
        progress,
        lastReadChapter: progress?.lastChapterNumber || 0,
        totalChapters: progress?.totalChapters || 0,
        unreadCount: progress ? Math.max(0, progress.totalChapters - progress.lastChapterNumber) : 0,
      };
    }).sort((a, b) => {
      // Sort by most recent progress first
      const aDate = a.progress?.lastReadAt || a.bookmarkedAt;
      const bDate = b.progress?.lastReadAt || b.bookmarkedAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [bookmarked, readingProgress]);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in relative">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-vermillion-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-kiniro-400/5 rounded-full blur-3xl" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10">
          <div>
            <h2 className="text-3xl font-bold text-sumi-50">My Library</h2>
            <p className="text-xs text-kiniro-400/70 tracking-widest mt-1">マイライブラリ</p>
          </div>
          
          {/* Tabs */}
          <div className="jp-card p-1.5 rounded-xl inline-flex">
            <button
              onClick={() => setTab('history')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                tab === 'history'
                  ? 'bg-gradient-to-r from-vermillion-500 to-vermillion-600 text-white shadow-lg shadow-vermillion-500/30'
                  : 'text-sumi-400 hover:text-sumi-200'
              )}
            >
              <Clock size={16} />
              History
              {history.length > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  tab === 'history' ? 'bg-white/20' : 'bg-sumi-700'
                )}>
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('collection')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-bold transition-all relative flex items-center gap-2",
                tab === 'collection'
                  ? 'bg-gradient-to-r from-vermillion-500 to-vermillion-600 text-white shadow-lg shadow-vermillion-500/30'
                  : 'text-sumi-400 hover:text-sumi-200'
              )}
            >
              <Heart size={16} />
              Collection
              {/* Show total unread count */}
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-kiniro-400 text-sumi-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {!isLoaded ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Content */}
            {tab === 'history' ? (
              <HistoryContent 
                history={history} 
                onClearHistory={clearHistory}
              />
            ) : (
              <CollectionContent 
                items={bookmarkedWithProgress}
                onRemove={removeBookmark}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}

interface HistoryContentProps {
  history: Array<{
    mangaSlug: string;
    mangaTitle: string;
    mangaCover: string;
    chapterSlug: string;
    chapterNumber: number;
    chapterTitle: string;
    readAt: string;
  }>;
  onClearHistory: () => void;
}

function HistoryContent({ history, onClearHistory }: HistoryContentProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-20 jp-card rounded-2xl border-2 border-dashed border-sumi-700/50">
        <Clock size={48} className="mx-auto text-sumi-600 mb-4" />
        <p className="text-sumi-400 mb-2">No reading history yet.</p>
        <p className="text-sm text-sumi-500 mb-1">履歴がありません</p>
        <p className="text-sm text-sumi-600 mb-6">Start reading manga to see your history here!</p>
        <Link href="/discover" className="text-vermillion-400 hover:text-vermillion-300 transition-colors">
          Discover manga →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clear History Button */}
      <div className="flex justify-end">
        <button
          onClick={onClearHistory}
          className="text-sm text-sumi-500 hover:text-vermillion-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 size={14} />
          Clear History
        </button>
      </div>

      <div className="space-y-4">
        {history.map((item, idx) => (
          <div
            key={`${item.mangaSlug}-${item.chapterSlug}-${idx}`}
            className="jp-card p-4 rounded-xl flex gap-4 hover:border-vermillion-500/20 transition-all"
          >
            <Link
              href={`/${item.mangaSlug}`}
              className="relative w-20 md:w-24 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden bg-sumi-800 ring-1 ring-sumi-700"
            >
              <Image 
                src={item.mangaCover} 
                alt={item.mangaTitle} 
                fill
                sizes="(max-width: 768px) 80px, 96px"
                className="object-cover"
              />
            </Link>
            <div className="flex-grow flex flex-col justify-center">
              <Link href={`/${item.mangaSlug}`}>
                <h3 className="font-bold text-lg mb-1 line-clamp-1 text-sumi-100 hover:text-vermillion-400 transition-colors">
                  {item.mangaTitle}
                </h3>
              </Link>
              <p className="text-sm text-sumi-500 mb-1">
                Last read: <span className="text-vermillion-400 font-medium">{item.chapterTitle}</span>
              </p>
              <p className="text-xs text-sumi-600 mb-3">
                {formatRelativeTime(item.readAt)}
              </p>
              <Link
                href={`/${item.mangaSlug}/${item.chapterSlug}`}
                className="flex items-center gap-2 btn-jp text-white px-5 py-2 rounded-lg text-sm font-bold w-max"
              >
                <PlayCircle size={16} /> Resume
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CollectionItem {
  mangaSlug: string;
  mangaTitle: string;
  mangaCover: string;
  bookmarkedAt: string;
  progress?: {
    lastChapterNumber: number;
    lastChapterSlug: string;
    totalChapters: number;
  };
  lastReadChapter: number;
  totalChapters: number;
  unreadCount: number;
}

interface CollectionContentProps {
  items: CollectionItem[];
  onRemove: (slug: string) => void;
}

function CollectionContent({ items, onRemove }: CollectionContentProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 jp-card rounded-2xl border-2 border-dashed border-sumi-700/50">
        <Heart size={48} className="mx-auto text-sumi-600 mb-4" />
        <p className="text-sumi-400 mb-2">Your library is empty.</p>
        <p className="text-sm text-sumi-500 mb-1">コレクションが空です</p>
        <p className="text-sm text-sumi-600 mb-6">Add manga to your collection by clicking the bookmark button!</p>
        <Link href="/discover" className="text-vermillion-400 hover:text-vermillion-300 transition-colors">
          Discover manga →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map(item => {
        const hasProgress = item.lastReadChapter > 0;
        const hasUnread = item.unreadCount > 0;
        const progressPercent = hasProgress 
          ? (item.lastReadChapter / item.totalChapters) * 100 
          : 0;
        
        return (
          <div
            key={item.mangaSlug}
            className="group relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all bg-sumi-800 ring-1 ring-sumi-700 hover:ring-vermillion-500/50"
          >
            <Link href={`/${item.mangaSlug}`}>
              {/* Cover Image */}
              <Image 
                src={item.mangaCover} 
                alt={item.mangaTitle} 
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105" 
              />
              
              {/* Gold corner accent */}
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-t-kiniro-400/30 border-l-[24px] border-l-transparent z-10" />
              
              {/* New Chapters Badge */}
              {hasUnread && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-vermillion-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse z-10">
                  <Bell size={12} fill="currentColor" />
                  <span>{item.unreadCount > 9 ? '9+' : item.unreadCount} new</span>
                </div>
              )}
              
              {/* Caught Up Badge */}
              {hasProgress && !hasUnread && (
                <div className="absolute top-2 right-2 bg-matcha-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                  ✓ Caught up
                </div>
              )}
              
              {/* Progress Bar */}
              {hasProgress && (
                <div className="absolute bottom-14 left-0 right-0 px-3 z-10">
                  <div className="w-full bg-sumi-900/60 backdrop-blur-sm rounded-full h-1.5">
                    <div 
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        hasUnread ? "bg-gradient-to-r from-vermillion-500 to-kiniro-400" : "bg-matcha-500"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-white text-xs mt-1 text-center drop-shadow-lg">
                    {item.lastReadChapter} / {item.totalChapters} chapters
                  </p>
                </div>
              )}
              
              {/* Title Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-sumi-950/95 via-sumi-950/70 to-transparent z-10">
                <h3 className="text-white font-bold line-clamp-2 text-sm leading-tight">
                  {item.mangaTitle}
                </h3>
              </div>
            </Link>

            {/* Remove Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onRemove(item.mangaSlug);
              }}
              className="absolute top-2 left-2 bg-sumi-900/70 hover:bg-vermillion-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
              title="Remove from library"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}
