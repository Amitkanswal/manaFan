"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Star, Eye } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Manga } from '../types';
import { useState } from 'react';

interface MangaCardProps {
  manga: Manga;
  className?: string;
  variant?: 'scroll' | 'grid';
  priority?: boolean;
}

// Shimmer placeholder for loading state
const shimmerDataUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjI3MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciPjxzdG9wIHN0b3AtY29sb3I9IiMxYTFhMmUiIG9mZnNldD0iMjAlIiAvPjxzdG9wIHN0b3AtY29sb3I9IiMyYTJhM2QiIG9mZnNldD0iNTAlIiAvPjxzdG9wIHN0b3AtY29sb3I9IiMxYTFhMmUiIG9mZnNldD0iNzAlIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMjcwIiBmaWxsPSIjMWExYTJlIiAvPjxyZWN0IGlkPSJyIiB3aWR0aD0iMTgwIiBoZWlnaHQ9IjI3MCIgZmlsbD0idXJsKCNnKSIgLz48YW5pbWF0ZSB4bGluazpocmVmPSIjciIgYXR0cmlidXRlTmFtZT0ieCIgZnJvbT0iLTE4MCIgdG89IjE4MCIgZHVyPSIxcyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIC8+PC9zdmc+";

export function MangaCard({ manga, className, variant = 'scroll', priority = false }: MangaCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine image sizes based on variant
  const sizes = variant === 'scroll' 
    ? '(max-width: 640px) 140px, (max-width: 768px) 160px, 180px'
    : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw';

  return (
    <Link
      href={`/${manga.slug}`}
      className={cn(
        'group cursor-pointer flex flex-col snap-start',
        variant === 'scroll' 
          ? 'flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]' 
          : 'w-full',
        className
      )}
    >
      {/* Cover - Fixed aspect ratio container */}
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl mb-3 bg-sumi-800 group-hover:ring-2 group-hover:ring-vermillion-500/50 transition-all duration-300">
        {/* Loading shimmer */}
        {isLoading && (
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-sumi-800 via-sumi-700 to-sumi-800" />
        )}
        
        <Image 
          src={hasError ? '/placeholder-manga.svg' : manga.cover}
          alt={manga.title}
          fill
          sizes={sizes}
          quality={75}
          priority={priority}
          placeholder="blur"
          blurDataURL={shimmerDataUrl}
          className={cn(
            'object-cover transition-all duration-500 group-hover:scale-110',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
        
        {/* Status Badge */}
        <div className={cn(
          'absolute top-2 left-2 text-[10px] px-2.5 py-1 rounded-full font-bold shadow-lg z-10 uppercase tracking-wide',
          manga.status === 'Completed' 
            ? 'bg-gradient-to-r from-ai-600 to-ai-500 text-white' 
            : 'bg-gradient-to-r from-matcha-600 to-matcha-500 text-white'
        )}>
          {manga.status === 'Completed' ? '完結' : '連載'}
        </div>
        
        {/* Gold accent corner */}
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-t-kiniro-400/20 border-l-[24px] border-l-transparent z-10" />
        
        {/* Stats Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-sumi-950/95 via-sumi-950/70 to-transparent z-10">
          <div className="flex items-center justify-between text-xs px-0.5">
            <span className="flex items-center gap-1.5 text-kiniro-400 font-medium">
              <Star size={11} className="fill-kiniro-400" />
              {manga.rating}
            </span>
            <span className="flex items-center gap-1.5 text-sumi-400">
              <Eye size={11} />
              {manga.views || '0'}
            </span>
          </div>
        </div>
        
        {/* Hover overlay with read button */}
        <div className="absolute inset-0 bg-vermillion-500/0 group-hover:bg-vermillion-500/10 transition-colors duration-300 z-5" />
      </div>
      
      {/* Info */}
      <h3 className="font-bold text-sumi-100 line-clamp-1 group-hover:text-vermillion-400 transition-colors text-sm">
        {manga.title}
      </h3>
      <p className="text-xs text-sumi-500 line-clamp-1 mb-1">
        Vol 1 • {manga.chapters[0]?.title || 'Chapter 1'}
      </p>
      <div className="flex items-center gap-2 text-xs text-sumi-600">
        <span className="truncate">{manga.genres?.[0] || 'Unknown'}</span>
        <span className="w-1 h-1 rounded-full bg-sumi-700" />
        <span className="text-kiniro-500/70">{manga.chapters.length}話</span>
      </div>
    </Link>
  );
}
