"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Compass, BookOpen, User, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/core/providers';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Navbar({ searchQuery = '', onSearchChange }: NavbarProps) {
  const pathname = usePathname();
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 glass-dark">
      {/* Top gold accent line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-kiniro-400 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            {/* Torii gate inspired logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-vermillion-500 to-vermillion-700 rounded-lg flex items-center justify-center shadow-lg shadow-vermillion-500/20 transition-transform group-hover:scale-105">
              <span className="text-white font-black text-lg">漫</span>
            </div>
            {/* Gold accent dot */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-kiniro-400 rounded-full animate-pulse" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-bold text-xl tracking-tight text-sumi-50">
              Manga<span className="text-gradient-vermillion">Fan</span>
            </span>
            <span className="text-[10px] text-kiniro-400/70 tracking-[0.2em] -mt-1">マンガファン</span>
          </div>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-grow max-w-xl mx-8 relative">
          <input
            type="text"
            placeholder="Search manga, authors..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-sumi-800/50 border border-sumi-700/50 rounded-full py-2.5 pl-11 pr-4 text-sm text-sumi-100 placeholder:text-sumi-500 focus:ring-2 focus:ring-vermillion-500/50 focus:border-vermillion-500/50 focus:outline-none transition-all"
          />
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sumi-500" />
        </div>

        {/* Nav Links */}
        <nav className="flex items-center gap-2 md:gap-3">
          <Link
            href="/discover"
            className={cn(
              'hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
              pathname === '/discover'
                ? 'bg-vermillion-500/20 text-vermillion-400 border border-vermillion-500/30'
                : 'text-sumi-300 hover:text-sumi-100 hover:bg-sumi-800/50'
            )}
          >
            <Compass size={18} /> Discover
          </Link>
          <Link
            href="/library"
            className={cn(
              'hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
              pathname === '/library'
                ? 'bg-vermillion-500/20 text-vermillion-400 border border-vermillion-500/30'
                : 'text-sumi-300 hover:text-sumi-100 hover:bg-sumi-800/50'
            )}
          >
            <BookOpen size={18} /> Library
          </Link>

          {/* Auth Section */}
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300',
                      pathname === '/profile'
                        ? 'bg-vermillion-500/20 text-vermillion-400 border border-vermillion-500/30'
                        : 'text-sumi-300 hover:text-sumi-100 hover:bg-sumi-800/50'
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-vermillion-400 to-kiniro-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:inline max-w-24 truncate text-sumi-200">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="p-2 text-sumi-500 hover:text-vermillion-400 transition-colors"
                    title="Sign out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-5 py-2.5 btn-jp text-white rounded-full text-sm font-medium"
                >
                  <LogIn size={16} />
                  <span className="hidden md:inline">Sign In</span>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
