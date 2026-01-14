"use client";

import { useEffect, useState, useRef } from 'react';
import { Sparkles, BookOpen, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePersonalize } from '@/core/providers';
import { contentstackApi } from '@/lib/contentstack';
import { cn } from '@/shared/lib/utils';

// Banner content type from CMS
interface BannerContent {
  title: string;
  experience_id: string;
  variant_id: string;
  headline: string;
  headline_jp?: string;
  subtext?: string;
  cta_text?: string;
  cta_link?: string;
  icon?: string;
  gradient?: string;
  priority?: number;
}

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-6 h-6" />,
  'book-open': <BookOpen className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
};

// Default banners if CMS content not available
const defaultBanners: Record<string, BannerContent> = {
  new_user: {
    title: 'New User Welcome',
    experience_id: 'welcome_exp',
    variant_id: 'new_user',
    headline: 'Welcome to MangaFan!',
    headline_jp: 'ようこそマンガファンへ！',
    subtext: 'Discover thousands of manga series. Start your journey with our curated picks for new readers.',
    cta_text: 'Start Reading',
    cta_link: '/discover',
    icon: 'sparkles',
    gradient: 'from-vermillion-500 to-kiniro-500',
  },
  returning_user: {
    title: 'Returning User Welcome',
    experience_id: 'welcome_exp',
    variant_id: 'returning_user',
    headline: 'Welcome Back, Reader!',
    headline_jp: 'おかえりなさい！',
    subtext: 'Continue your manga journey. New chapters await in your followed series.',
    cta_text: 'View Library',
    cta_link: '/library',
    icon: 'book-open',
    gradient: 'from-ai-500 to-matcha-500',
  },
};

export function WelcomeBanner() {
  const { isNewUser, isReturningUser, getVariant, isLoading, isInitialized } = usePersonalize();
  const [banner, setBanner] = useState<BannerContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  
  // Use ref to track if we've already fetched to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Prevent duplicate fetches
    if (hasFetchedRef.current || isLoading || !isInitialized) {
      return;
    }
    
    const fetchBannerContent = async () => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      setIsLoadingContent(true);
      hasFetchedRef.current = true;

      try {
        // Get variant from Personalize (experience short ID: "0" for welcome experience)
        const variant = getVariant('0'); // Your welcome experience short ID
        
        // Determine which variant to show
        let variantId = 'new_user';
        if (variant === '1' || isReturningUser) {
          variantId = 'returning_user';
        }

        console.log('[WelcomeBanner] Using variant:', variantId, 'isNewUser:', isNewUser, 'isReturningUser:', isReturningUser);

        // Try to fetch from CMS
        try {
          const response = await contentstackApi.getPersonalizedBanner('welcome_exp', variantId);
          if (response) {
            setBanner(response);
            console.log('[WelcomeBanner] Loaded CMS content:', response);
          } else {
            // Use default
            setBanner(defaultBanners[variantId] || defaultBanners.new_user);
          }
        } catch (cmsError) {
          console.warn('[WelcomeBanner] CMS fetch failed, using default:', cmsError);
          setBanner(defaultBanners[variantId] || defaultBanners.new_user);
        }
      } catch (error) {
        console.error('[WelcomeBanner] Error:', error);
        setBanner(defaultBanners.new_user);
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchBannerContent();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isLoading, isInitialized, isReturningUser, isNewUser, getVariant]);

  // Loading state
  if (isLoading || isLoadingContent) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sumi-800 to-sumi-900 p-6 md:p-8 animate-pulse">
        <div className="h-8 bg-sumi-700 rounded w-1/3 mb-4" />
        <div className="h-4 bg-sumi-700 rounded w-2/3 mb-2" />
        <div className="h-4 bg-sumi-700 rounded w-1/2" />
      </div>
    );
  }

  if (!banner) return null;

  const Icon = iconMap[banner.icon || 'sparkles'] || iconMap.sparkles;
  const gradientClasses = banner.gradient || 'from-vermillion-500 to-kiniro-500';

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 md:p-8",
        "bg-gradient-to-r",
        gradientClasses,
        "shadow-lg shadow-vermillion-500/20"
      )}
    >
      {/* Japanese pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
            {Icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Japanese headline */}
            {banner.headline_jp && (
              <p className="text-white/80 text-sm font-medium mb-1">
                {banner.headline_jp}
              </p>
            )}
            
            {/* Main headline */}
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {banner.headline}
            </h2>
            
            {/* Subtext */}
            {banner.subtext && (
              <p className="text-white/90 text-sm md:text-base max-w-xl">
                {banner.subtext}
              </p>
            )}
          </div>
        </div>

        {/* CTA Button */}
        {banner.cta_text && banner.cta_link && (
          <Link
            href={banner.cta_link}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
              "bg-white text-sumi-900 font-semibold",
              "hover:bg-white/90 transition-all duration-200",
              "shadow-lg hover:shadow-xl hover:scale-105",
              "whitespace-nowrap"
            )}
          >
            {banner.cta_text}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

