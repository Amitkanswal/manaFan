"use client";

import Image, { ImageProps } from 'next/image';
import { useState, useEffect, useRef, CSSProperties } from 'react';
import { cn } from '@/shared/lib/utils';

// Shimmer placeholder SVG for blur effect
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#1f2937" offset="20%" />
      <stop stop-color="#374151" offset="50%" />
      <stop stop-color="#1f2937" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#1f2937" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

// Default blur data URL
const defaultBlurDataURL = `data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`;

// Low Quality Image Placeholder generator
const generateLQIP = (color: string = '#1f2937') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="${color}" width="1" height="1"/></svg>`;
  return `data:image/svg+xml;base64,${toBase64(svg)}`;
};

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
  aspectRatio?: string;
  showSkeleton?: boolean;
  priority?: boolean;
  quality?: number;
  onLoadComplete?: () => void;
  containerClassName?: string;
}

/**
 * OptimizedImage - A wrapper around Next.js Image with:
 * - Shimmer placeholder while loading
 * - Progressive loading (blur → full quality)
 * - Error handling with fallback
 * - Lazy loading by default
 * - Optimized for slow networks
 */
export function OptimizedImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  containerClassName,
  fallbackSrc = '/placeholder-image.svg',
  aspectRatio,
  showSkeleton = true,
  priority = false,
  quality = 75,
  onLoadComplete,
  sizes,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const imgRef = useRef<HTMLDivElement>(null);

  // Reset states when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setImageSrc(src);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  // Calculate sizes for responsive images
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // Container styles for aspect ratio
  const containerStyle: CSSProperties = aspectRatio
    ? { aspectRatio, position: 'relative' }
    : {};

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-gray-800',
        isLoading && showSkeleton && 'animate-pulse',
        containerClassName
      )}
      style={containerStyle}
    >
      {/* Shimmer skeleton while loading */}
      {isLoading && showSkeleton && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer" />
      )}

      {fill ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          placeholder="blur"
          blurDataURL={defaultBlurDataURL}
          priority={priority}
          quality={quality}
          sizes={defaultSizes}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      ) : (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          placeholder="blur"
          blurDataURL={defaultBlurDataURL}
          priority={priority}
          quality={quality}
          sizes={defaultSizes}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && imageSrc === fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * MangaCover - Optimized image specifically for manga covers
 */
interface MangaCoverProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const coverSizes = {
  sm: { width: 140, height: 210 },
  md: { width: 180, height: 270 },
  lg: { width: 256, height: 384 },
  xl: { width: 300, height: 450 },
};

export function MangaCover({
  src,
  alt,
  priority = false,
  className,
  containerClassName,
  size = 'md',
}: MangaCoverProps) {
  const dimensions = coverSizes[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      quality={80}
      className={cn('object-cover', className)}
      containerClassName={cn('rounded-lg', containerClassName)}
      sizes="(max-width: 640px) 140px, (max-width: 768px) 160px, 180px"
    />
  );
}

/**
 * ReaderImage - Optimized image for manga reader pages
 * - Higher quality for reading
 * - Preloading support
 * - Progressive loading
 */
interface ReaderImageProps {
  src: string;
  alt: string;
  pageNumber: number;
  isVisible?: boolean;
  onLoad?: () => void;
  className?: string;
}

export function ReaderImage({
  src,
  alt,
  pageNumber,
  isVisible = true,
  onLoad,
  className,
}: ReaderImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Preload next images when this one is visible
  useEffect(() => {
    if (!isVisible) return;

    // Create image element for preloading
    const preloadImage = new window.Image();
    preloadImage.src = src;
    preloadImage.onload = () => {
      setLoaded(true);
      onLoad?.();
    };

    return () => {
      preloadImage.onload = null;
    };
  }, [src, isVisible, onLoad]);

  return (
    <div className={cn('relative w-full bg-gray-900', className)}>
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Loading page {pageNumber}...</span>
          </div>
        </div>
      )}

      {/* Actual image using Next.js Image */}
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        width={800}
        height={1200}
        quality={90}
        priority={pageNumber <= 2}
        loading={pageNumber <= 2 ? 'eager' : 'lazy'}
        className={cn(
          'w-full h-auto transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
      />
    </div>
  );
}

/**
 * BannerImage - Optimized large banner/hero images
 */
interface BannerImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function BannerImage({ src, alt, priority = true, className }: BannerImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority={priority}
      quality={85}
      className={cn('object-cover', className)}
      sizes="100vw"
    />
  );
}


