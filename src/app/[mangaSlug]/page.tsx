"use client";

import { useParams, notFound, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Eye, Bookmark, List, Users, UserCheck, Bell, Loader2 } from 'lucide-react';
import { Navbar } from '@/shared/components/navbar';
import { Skeleton, Button } from '@/shared/components/ui';
import { useMangaBySlug } from '@/features/manga/hooks/use-manga';
import { StarRating } from '@/shared/components/star-rating';
import { cn } from '@/shared/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useUserLibrary, useAuth, useBackendLibrary, useTrackMangaRead } from '@/core/providers';

// Helper to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return num.toString();
}

export default function MangaDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const mangaSlug = params.mangaSlug as string;
  
  const { data: manga, isLoading, error } = useMangaBySlug(mangaSlug);
  
  // Auth state
  const { isAuthenticated, requireAuth, isLoading: authLoading, user } = useAuth();
  
  // Local storage library (for guests)
  const { 
    isFollowing: isLocalFollowing, 
    followManga: localFollowManga, 
    unfollowManga: localUnfollowManga,
    isBookmarked: isLocalBookmarked,
    bookmarkManga: localBookmarkManga,
    removeBookmark: localRemoveBookmark,
    getRating,
    rateManga,
    getProgress,
    isLoaded: libraryLoaded,
  } = useUserLibrary();
  
  // Backend library (for authenticated users)
  const {
    isSubscribed,
    subscribe,
    unsubscribe,
    isBookmarked: isBackendBookmarked,
    addBookmark: backendAddBookmark,
    removeBookmark: backendRemoveBookmark,
  } = useBackendLibrary();
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [coverLoading, setCoverLoading] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  
  // Genre tracking for personalization
  const trackMangaRead = useTrackMangaRead();
  const hasTrackedRef = useRef(false);
  const mangaIdRef = useRef<string | null>(null);

  // Track manga view for personalization (only once per manga)
  useEffect(() => {
    // Only track once per manga ID
    if (manga && manga.genres.length > 0 && mangaIdRef.current !== manga.id) {
      mangaIdRef.current = manga.id;
      hasTrackedRef.current = true;
      // Track this manga's genres for personalization
      trackMangaRead(manga.id, manga.genres);
      console.log('[MangaDetail] Tracked genre preferences:', manga.genres);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manga?.id]); // Only depend on manga.id, not trackMangaRead

  // Get persisted states
  const localFollowing = isLocalFollowing(mangaSlug);
  const localBookmarked = isLocalBookmarked(mangaSlug);
  const userRating = getRating(mangaSlug);
  const progress = getProgress(mangaSlug);
  
  // Use backend state if authenticated, otherwise local
  const mangaUid = manga?.id || mangaSlug;
  const isSubscribedToManga = isAuthenticated ? isSubscribed(mangaUid) : false;
  const isBookmarkedManga = isAuthenticated ? isBackendBookmarked(mangaUid) : localBookmarked;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="pb-12">
          <Skeleton className="h-80 w-full" />
          <div className="max-w-6xl mx-auto px-4 -mt-32">
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="w-48 md:w-64 h-80 rounded-xl" />
              <div className="flex-grow pt-4 space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
                </div>
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !manga) {
    notFound();
  }

  const handleRateManga = (rating: number) => {
    rateManga(mangaSlug, rating);
    setShowRatingModal(false);
  };

  // Handle bookmark toggle
  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      if (localBookmarked) {
        localRemoveBookmark(mangaSlug);
      } else {
        localBookmarkManga({ 
          slug: manga.slug, 
          title: manga.title, 
          cover: manga.cover 
        });
      }
      return;
    }

    setBookmarkLoading(true);
    try {
      if (isBookmarkedManga) {
        await backendRemoveBookmark(mangaUid);
      } else {
        await backendAddBookmark({
          mangaUid: mangaUid,
          mangaSlug: manga.slug,
          mangaTitle: manga.title,
          mangaCover: manga.cover,
        });
      }
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Handle follow/subscribe toggle
  const handleToggleFollowUpdates = async () => {
    if (!isAuthenticated) {
      requireAuth(pathname);
      return;
    }

    if (!user?.emailUpdatesOptIn) {
      alert('Please enable email notifications in your profile settings to receive chapter updates.');
      return;
    }

    setSubscribeLoading(true);
    try {
      if (isSubscribedToManga) {
        await unsubscribe(mangaUid);
      } else {
        await subscribe({
          mangaUid: mangaUid,
          mangaSlug: manga.slug,
          mangaTitle: manga.title,
        });
      }
    } finally {
      setSubscribeLoading(false);
    }
  };

  // Determine which chapter to start/continue from
  const firstChapter = manga.chapters[manga.chapters.length - 1];
  const continueChapter = progress 
    ? manga.chapters.find(ch => ch.number === progress.lastChapterNumber + 1) || firstChapter
    : firstChapter;
  const hasContinue = progress && progress.lastChapterNumber < manga.chapters.length;

  return (
    <>
      <Navbar />
      <main className="animate-fade-in pb-12">
        {/* Banner */}
        <div className="relative h-80 overflow-hidden bg-sumi-800">
          {bannerLoading && (
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-sumi-800 via-sumi-700 to-sumi-800" />
          )}
          <Image 
            src={manga.banner}
            alt={manga.title}
            fill
            priority
            quality={85}
            sizes="100vw"
            className={cn(
              "object-cover transition-opacity duration-300",
              bannerLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setBannerLoading(false)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sumi-950 via-sumi-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-sumi-950/50 via-transparent to-sumi-950/50" />
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
              {/* Cover Image */}
              <div className="relative w-full aspect-[2/3] rounded-xl shadow-2xl overflow-hidden bg-sumi-800 ring-2 ring-kiniro-400/20">
                {coverLoading && (
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-sumi-800 via-sumi-700 to-sumi-800" />
                )}
                <Image
                  src={manga.cover}
                  alt={manga.title}
                  fill
                  priority
                  quality={85}
                  sizes="(max-width: 768px) 192px, 256px"
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    coverLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => setCoverLoading(false)}
                />
                {/* Gold corner accent */}
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[32px] border-t-kiniro-400/30 border-l-[32px] border-l-transparent" />
              </div>
              
              <div className="mt-5 flex flex-col gap-3">
                {/* Continue/Start Reading Button */}
                <Link
                  href={`/${manga.slug}/${continueChapter?.slug || 'chapter-1'}`}
                  className="w-full btn-jp text-white py-3.5 rounded-xl font-bold text-center transition-transform active:scale-95"
                >
                  {hasContinue ? `Continue Ch. ${progress!.lastChapterNumber + 1}` : '読む Read Now'}
                </Link>
                
                {/* Reading Progress Indicator */}
                {progress && (
                  <div className="jp-card rounded-xl p-4 text-center">
                    <div className="text-xs text-kiniro-400/70 mb-1">Your Progress • 進捗</div>
                    <div className="text-sm font-bold text-sumi-100">
                      {progress.lastChapterNumber} / {manga.chapters.length} chapters
                    </div>
                    <div className="w-full bg-sumi-700/50 rounded-full h-1.5 mt-3">
                      <div 
                        className="bg-gradient-to-r from-vermillion-500 to-kiniro-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${(progress.lastChapterNumber / manga.chapters.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Bookmark Button */}
                <button
                  onClick={handleToggleBookmark}
                  disabled={!libraryLoaded || bookmarkLoading}
                  className={cn(
                    "w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border",
                    isBookmarkedManga
                      ? "bg-kiniro-400/10 text-kiniro-400 border-kiniro-400/30"
                      : "bg-sumi-800/50 border-sumi-700/50 text-sumi-300 hover:text-sumi-100 hover:border-sumi-600"
                  )}
                >
                  {bookmarkLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Bookmark size={18} fill={isBookmarkedManga ? "currentColor" : "none"} />
                  )}
                  {isBookmarkedManga ? 'In Library' : 'Add to Library'}
                </button>

                {/* Follow Updates Button */}
                <button
                  onClick={handleToggleFollowUpdates}
                  disabled={subscribeLoading || authLoading}
                  className={cn(
                    "w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
                    isSubscribedToManga
                      ? "bg-matcha-500/10 text-matcha-400 border border-matcha-500/30"
                      : "bg-gradient-to-r from-ai-600 to-ai-500 hover:from-ai-500 hover:to-ai-400 text-white shadow-lg shadow-ai-500/20"
                  )}
                >
                  {subscribeLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Bell size={18} fill={isSubscribedToManga ? "currentColor" : "none"} />
                  )}
                  {isSubscribedToManga ? 'Following 🔔' : 'Follow Updates'}
                </button>
                
                {/* Show hint if not logged in */}
                {!isAuthenticated && !authLoading && (
                  <p className="text-xs text-center text-sumi-500">
                    Sign in to get notified when new chapters are released
                  </p>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-grow pt-4">
              <h1 className="text-3xl md:text-5xl font-black text-sumi-50 mb-2 text-center md:text-left">
                {manga.title}
              </h1>
              <p className="text-center md:text-left text-vermillion-400 font-medium mb-6">
                {manga.author}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-8">
                {manga.genres.map(g => (
                  <span key={g} className="px-4 py-1.5 bg-sumi-800/60 border border-sumi-700/50 rounded-full text-sm text-sumi-300">
                    {g}
                  </span>
                ))}
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-bold",
                  manga.status === 'Completed'
                    ? 'bg-ai-500/20 text-ai-400 border border-ai-500/30'
                    : manga.status === 'Hiatus'
                    ? 'bg-kiniro-400/20 text-kiniro-400 border border-kiniro-400/30'
                    : 'bg-matcha-500/20 text-matcha-400 border border-matcha-500/30'
                )}>
                  {manga.status === 'Completed' ? '完結 Completed' : manga.status === 'Ongoing' ? '連載 Ongoing' : '休載 Hiatus'}
                </span>
              </div>

              {/* Community Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="jp-card rounded-xl p-4 text-center">
                  <Users size={20} className="text-vermillion-400 mx-auto mb-2" />
                  <p className="text-2xl font-black text-sumi-50">
                    {formatNumber(manga.readers)}
                  </p>
                  <p className="text-xs text-sumi-500">Readers • 読者</p>
                </div>
                <div className="jp-card rounded-xl p-4 text-center">
                  <UserCheck size={20} className="text-ai-400 mx-auto mb-2" />
                  <p className="text-2xl font-black text-sumi-50">
                    {formatNumber(manga.followers)}
                  </p>
                  <p className="text-xs text-sumi-500">Following • フォロワー</p>
                </div>
                <div className="jp-card rounded-xl p-4 text-center">
                  <Star size={20} className="text-kiniro-400 mx-auto mb-2" fill="currentColor" />
                  <p className="text-2xl font-black text-sumi-50">
                    {manga.rating}
                  </p>
                  <p className="text-xs text-sumi-500">Rating • 評価</p>
                </div>
                <div className="jp-card rounded-xl p-4 text-center">
                  <Eye size={20} className="text-matcha-400 mx-auto mb-2" />
                  <p className="text-2xl font-black text-sumi-50">
                    {manga.views}
                  </p>
                  <p className="text-xs text-sumi-500">Views • 閲覧数</p>
                </div>
              </div>

              {/* User Rating Section */}
              <div className="jp-card rounded-xl p-6 mb-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 pattern-asanoha opacity-30" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-sumi-50 mb-1">Rate this Manga</h3>
                  <p className="text-xs text-kiniro-400/70 mb-4">この漫画を評価する</p>
                  {userRating ? (
                    <div className="flex flex-col items-center">
                      <StarRating rating={userRating} size="lg" className="mb-2" />
                      <p className="text-sm text-sumi-300">You rated {userRating}/5</p>
                      <Button variant="ghost" size="sm" onClick={() => setShowRatingModal(true)} className="mt-2 text-vermillion-400">
                        Edit Rating
                      </Button>
                    </div>
                  ) : (
                    <>
                      <StarRating rating={manga.rating} totalRatings={manga.readers} size="lg" className="mb-4" />
                      <Button onClick={() => setShowRatingModal(true)} className="btn-kiniro text-sumi-900 font-bold px-8 py-3 rounded-full">
                        Rate Now ⭐
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Synopsis */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-sumi-50 mb-1">Synopsis</h3>
                <p className="text-xs text-kiniro-400/70 mb-3">あらすじ</p>
                <p className="text-sumi-300 leading-relaxed">{manga.synopsis}</p>
              </div>

              {/* Chapter List */}
              <div className="jp-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-sumi-50 flex items-center gap-2">
                      <List size={20} className="text-vermillion-400" /> Chapter List
                    </h3>
                    <p className="text-xs text-kiniro-400/70">チャプターリスト</p>
                  </div>
                  <span className="text-sm text-sumi-500 bg-sumi-800/50 px-3 py-1 rounded-full">
                    {manga.chapters.length} Chapters
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {manga.chapters.map(ch => {
                    const isRead = progress && progress.lastChapterNumber >= ch.number;
                    const isCurrent = progress && progress.lastChapterNumber === ch.number;
                    
                    return (
                      <Link
                        key={ch.id}
                        href={`/${manga.slug}/${ch.slug}`}
                        className={cn(
                          "group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border",
                          isCurrent 
                            ? "bg-vermillion-500/10 border-vermillion-500/30"
                            : isRead
                            ? "bg-sumi-800/30 border-transparent opacity-60"
                            : "hover:bg-sumi-800/50 border-sumi-800/50 hover:border-vermillion-500/20"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "w-14 text-sm font-bold",
                            isCurrent ? "text-vermillion-400" : isRead ? "text-sumi-600" : "text-sumi-500 group-hover:text-vermillion-400"
                          )}>
                            #{ch.number}
                          </span>
                          <span className={cn(
                            "font-medium",
                            isRead ? "text-sumi-500" : "text-sumi-200"
                          )}>
                            {ch.title}
                          </span>
                          {isRead && (
                            <span className="text-xs text-matcha-400 font-medium">✓ Read</span>
                          )}
                          {isCurrent && (
                            <span className="text-xs bg-vermillion-500 text-white px-2 py-0.5 rounded-full font-medium">Current</span>
                          )}
                        </div>
                        <span className="text-xs text-sumi-600">{ch.date}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-sumi-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="jp-card rounded-2xl p-8 shadow-2xl max-w-md w-full text-center relative animate-in zoom-in-90 duration-300">
              <div className="absolute inset-0 pattern-seigaiha opacity-20 rounded-2xl" />
              <div className="relative z-10">
                <button 
                  onClick={() => setShowRatingModal(false)} 
                  className="absolute -top-2 -right-2 w-8 h-8 bg-sumi-800 rounded-full flex items-center justify-center text-sumi-400 hover:text-sumi-100 hover:bg-sumi-700 transition-colors"
                >
                  ✕
                </button>
                <h3 className="text-2xl font-bold text-sumi-50 mb-2">Rate {manga.title}</h3>
                <p className="text-sumi-400 mb-6">What do you think of this manga?</p>
                <div className="flex justify-center mb-6">
                  <StarRating
                    rating={userRating || 0}
                    onRate={(r) => handleRateManga(r)}
                    interactive
                    size="lg"
                    className="gap-3"
                  />
                </div>
                {userRating && (
                  <p className="text-lg font-semibold text-kiniro-400 mb-6">
                    {userRating === 1 && "Poor 😞"}
                    {userRating === 2 && "Fair 😐"}
                    {userRating === 3 && "Good 🙂"}
                    {userRating === 4 && "Great 😊"}
                    {userRating === 5 && "Masterpiece! 🌟"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
