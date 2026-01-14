import Link from 'next/link';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Manga } from '../types';
import { MangaCard } from './manga-card';

interface SectionRowProps {
  title: string;
  subtitle?: string;
  items: Manga[];
  icon?: LucideIcon;
  viewAllHref?: string;
}

export function SectionRow({ title, subtitle, items, icon: Icon, viewAllHref = '/discover' }: SectionRowProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-vermillion-500/10 border border-vermillion-500/20 flex items-center justify-center">
              <Icon size={20} className="text-vermillion-400" />
            </div>
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-sumi-50">
              {title}
            </h2>
            {subtitle && (
              <span className="text-xs text-kiniro-400/70 tracking-widest">{subtitle}</span>
            )}
          </div>
        </div>
        <Link
          href={viewAllHref}
          className="text-sm font-medium text-sumi-400 hover:text-vermillion-400 flex items-center gap-1 transition-colors group"
        >
          View All 
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      {/* Horizontal scroll container */}
      <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar snap-x scroll-pl-4 -mx-4 px-4 md:mx-0 md:px-0">
        {items.map((manga, index) => (
          <MangaCard 
            key={manga.id} 
            manga={manga}
            priority={index < 3}
          />
        ))}
      </div>
    </div>
  );
}
