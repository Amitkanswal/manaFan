"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface PreloadedImage {
  src: string;
  loaded: boolean;
  error: boolean;
}

/**
 * Hook to preload images for better UX on slow networks
 * Preloads images ahead of time so they're ready when needed
 * Properly cleans up image elements to prevent memory leaks
 */
export function useImagePreloader(urls: string[], preloadAhead: number = 3) {
  const [preloadedImages, setPreloadedImages] = useState<Map<string, PreloadedImage>>(new Map());
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());
  const mountedRef = useRef(true);

  // Cleanup function to properly dispose of image elements
  const cleanupImage = useCallback((img: HTMLImageElement) => {
    img.onload = null;
    img.onerror = null;
    img.src = ''; // Cancel any pending load
  }, []);

  const preloadImage = useCallback((src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Skip if already preloaded or preloading
      if (imageRefs.current.has(src)) {
        const existing = preloadedImages.get(src);
        resolve(existing?.loaded ?? false);
        return;
      }

      const img = new Image();
      imageRefs.current.set(src, img);

      img.onload = () => {
        if (mountedRef.current) {
          setPreloadedImages(prev => {
            const next = new Map(prev);
            next.set(src, { src, loaded: true, error: false });
            return next;
          });
        }
        resolve(true);
      };

      img.onerror = () => {
        if (mountedRef.current) {
          setPreloadedImages(prev => {
            const next = new Map(prev);
            next.set(src, { src, loaded: false, error: true });
            return next;
          });
        }
        resolve(false);
      };

      // Add loading priority hint
      img.loading = 'eager';
      img.decoding = 'async';
      img.src = src;
    });
  }, [preloadedImages]);

  // Preload images when URLs change
  useEffect(() => {
    mountedRef.current = true;
    const toPreload = urls.slice(0, preloadAhead);
    toPreload.forEach(preloadImage);
    
    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      // Clean up all image references
      imageRefs.current.forEach((img) => {
        cleanupImage(img);
      });
      imageRefs.current.clear();
    };
  }, [urls, preloadAhead, preloadImage, cleanupImage]);

  const isPreloaded = useCallback((src: string): boolean => {
    const img = preloadedImages.get(src);
    return img?.loaded ?? false;
  }, [preloadedImages]);

  const preloadNext = useCallback((currentIndex: number) => {
    const nextUrls = urls.slice(currentIndex + 1, currentIndex + 1 + preloadAhead);
    nextUrls.forEach(preloadImage);
  }, [urls, preloadAhead, preloadImage]);

  return {
    preloadedImages,
    isPreloaded,
    preloadImage,
    preloadNext,
  };
}

/**
 * Hook for intersection observer based lazy loading
 */
export function useLazyImage(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, no need to observe anymore
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: '100px', // Start loading 100px before visible
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  const onLoad = useCallback(() => {
    setHasLoaded(true);
  }, []);

  return { ref, isVisible, hasLoaded, onLoad };
}

/**
 * Hook to track network conditions and adapt image quality
 */
export function useNetworkAwareLoading() {
  const [connectionType, setConnectionType] = useState<string>('4g');
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Check if Network Information API is available
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    if (connection) {
      const updateConnectionInfo = () => {
        setConnectionType(connection.effectiveType || '4g');
        setIsSlowConnection(
          connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g' ||
          connection.effectiveType === '3g' ||
          connection.saveData === true
        );
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  // Return recommended quality based on connection
  const getRecommendedQuality = useCallback((): number => {
    switch (connectionType) {
      case 'slow-2g':
      case '2g':
        return 40; // Low quality for very slow connections
      case '3g':
        return 60; // Medium quality for 3G
      case '4g':
      default:
        return 80; // High quality for fast connections
    }
  }, [connectionType]);

  return {
    connectionType,
    isSlowConnection,
    getRecommendedQuality,
  };
}

/**
 * Hook to progressively load higher quality images
 */
export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string
) {
  const [src, setSrc] = useState(lowQualitySrc);
  const [isHighQuality, setIsHighQuality] = useState(false);

  useEffect(() => {
    // Start with low quality
    setSrc(lowQualitySrc);
    setIsHighQuality(false);

    // Load high quality in background
    const highQualityImage = new Image();
    highQualityImage.src = highQualitySrc;
    
    highQualityImage.onload = () => {
      setSrc(highQualitySrc);
      setIsHighQuality(true);
    };

    return () => {
      highQualityImage.onload = null;
    };
  }, [lowQualitySrc, highQualitySrc]);

  return { src, isHighQuality };
}


