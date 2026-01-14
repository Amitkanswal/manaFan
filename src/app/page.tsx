"use client";

import Link from 'next/link';
import { Calendar, Zap, CheckCircle, Star, BookOpen, Sparkles } from 'lucide-react';
import { Navbar } from '@/shared/components/navbar';
import { Skeleton } from '@/shared/components/ui';
import { useMangaList, SectionRow } from '@/features/manga';
import { WelcomeBanner, PersonalizedRecommendations } from '@/components/personalized';

export default function HomePage() {
  const { data: mangaList, isLoading } = useMangaList();

  const featured = mangaList[0];
  const ongoing = mangaList.filter(m => m.status === 'Ongoing');
  const completed = mangaList.filter(m => m.status === 'Completed');
  const recentlyUpdated = [...mangaList].sort((a, b) => 
    b.updatedAt.localeCompare(a.updatedAt)
  );

  return (
    <>
      <Navbar />
      <main className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-vermillion-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-40 h-40 bg-kiniro-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Personalized Welcome Banner */}
        <section className="mb-8 animate-fade-in">
          <WelcomeBanner />
        </section>

        {/* Hero Section */}
        <section className="mb-16 animate-fade-in">
          {isLoading ? (
            <Skeleton className="h-[450px] md:h-[550px] rounded-2xl" />
          ) : featured ? (
            <Link href={`/${featured.slug}`}>
              <div className="relative h-[450px] md:h-[550px] w-full overflow-hidden rounded-2xl group cursor-pointer">
                {/* Background image */}
                <img
                  src={featured.banner}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-sumi-950 via-sumi-950/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-sumi-950/80 via-transparent to-transparent" />
                
                {/* Gold frame accent */}
                <div className="absolute inset-4 border border-kiniro-400/20 rounded-xl pointer-events-none" />
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-kiniro-400/40 rounded-tl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-kiniro-400/40 rounded-br-lg" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-14">
                  {/* Badge */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="inline-flex items-center gap-2 bg-gradient-to-r from-vermillion-600 to-vermillion-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-vermillion-500/30">
                      <Zap size={12} fill="currentColor" /> 人気上昇中
                    </span>
                    <span className="inline-flex items-center gap-1 bg-sumi-900/80 backdrop-blur-sm text-kiniro-400 px-3 py-1.5 rounded-full text-xs font-medium border border-kiniro-400/20">
                      <Sparkles size={12} /> Trending Now
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-4xl md:text-7xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
                    {featured.title}
                  </h1>
                  
                  {/* Synopsis preview */}
                  <p className="text-sumi-300 text-sm md:text-base max-w-2xl mb-6 line-clamp-2">
                    {featured.synopsis || 'Dive into an epic adventure filled with action, drama, and unforgettable characters.'}
                  </p>
                  
                  {/* Tags and rating */}
                  <div className="flex flex-wrap gap-3 mb-8">
                    {featured.genres.slice(0, 4).map(g => (
                      <span key={g} className="px-4 py-1.5 bg-sumi-800/60 backdrop-blur-sm rounded-full text-sm text-sumi-200 border border-sumi-700/50">
                        {g}
                      </span>
                    ))}
                    <span className="flex items-center gap-1.5 text-kiniro-400 bg-sumi-900/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-kiniro-400/20">
                      <Star size={14} fill="currentColor" /> {featured.rating}
                    </span>
                  </div>
                  
                  {/* CTA Button */}
                  <button className="btn-jp text-white px-10 py-4 rounded-full font-bold w-max text-lg flex items-center gap-3">
                    <BookOpen size={20} /> Read Now
                    <span className="text-sm opacity-70">読む</span>
                  </button>
                </div>
              </div>
            </Link>
          ) : null}
        </section>

        {/* Section Divider */}
        <div className="relative my-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-sumi-700 to-transparent" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-sumi-950 px-6 text-kiniro-400/60 text-lg">⛩️</span>
          </div>
        </div>

        {/* Personalized Recommendations (Based on reading history) */}
        <PersonalizedRecommendations className="mb-12" />

        {/* Content Rows */}
        <div className="space-y-12">
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <SectionRow
              title="Recently Updated"
              subtitle="最新更新"
              items={recentlyUpdated.slice(0, 6)}
              icon={Calendar}
            />
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <SectionRow
              title="Hot Ongoing Series"
              subtitle="連載中"
              items={ongoing}
              icon={Zap}
            />
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <SectionRow
              title="Completed Gems"
              subtitle="完結"
              items={completed}
              icon={CheckCircle}
            />
          </div>
        </div>

        {/* Footer decoration */}
        <div className="mt-20 text-center">
          <p className="text-sumi-600 text-sm">
            Made with <span className="text-vermillion-500">♥</span> for manga lovers
          </p>
          <p className="text-sumi-700 text-xs mt-2 tracking-widest">マンガファン</p>
        </div>
      </main>
    </>
  );
}
