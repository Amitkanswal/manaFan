"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Star, BookOpen, Zap } from 'lucide-react';
import { Manga } from '../types';
import { useState } from 'react';

interface MangaHeroProps {
  manga: Manga;
}

export function MangaHero({ manga }: MangaHeroProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Link href={`/${manga.slug}`}>
      <section 
        className="relative h-[400px] md:h-[500px] w-full overflow-hidden rounded-2xl cursor-pointer group shadow-2xl"
      >
        {/* Loading shimmer */}
        {isLoading && (
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 z-0" />
        )}
        
        {/* Background - Optimized Image */}
        <Image 
          src={manga.banner}
          alt={manga.title}
          fill
          priority // Hero images should load immediately
          quality={85}
          sizes="100vw"
          className={`object-cover transition-all duration-700 group-hover:scale-105 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 z-20">
          {/* Badge */}
          <span className="inline-flex items-center gap-1 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold w-max mb-4">
            <Zap size={12} fill="currentColor" /> TRENDING NOW
          </span>
          
          {/* Title */}
          <h1 className="text-4xl md:text-7xl font-black text-white mb-4 leading-tight">
            {manga.title}
          </h1>
          
          {/* Meta */}
          <div className="flex flex-wrap gap-3 mb-6 text-gray-200 text-sm font-medium">
            {manga.genres.map(genre => (
              <span key={genre} className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-md border border-white/10">
                {genre}
              </span>
            ))}
            <span className="flex items-center gap-1 text-yellow-400 bg-black/50 px-3 py-1 rounded-full">
              <Star size={14} fill="currentColor" /> {manga.rating}
            </span>
          </div>
          
          {/* CTA Button */}
          <button 
            className="bg-white text-black hover:bg-gray-200 px-10 py-4 rounded-full font-bold w-max transition-colors text-lg shadow-lg flex items-center gap-2"
          >
            <BookOpen size={20} /> Read Now
          </button>
        </div>
      </section>
    </Link>
  );
}
