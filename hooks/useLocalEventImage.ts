import { EventImage } from '@/store/eventStore';
import { useMemo } from 'react';

interface LocalImageCheckResult {
  hasLocalImage: boolean;
  localUri: string | null;
}

/**
 * Hook to get first image URI for display
 * SYNCHRONOUS - No async checks, shows images immediately
 */
export const useLocalEventImage = (images?: EventImage[]): LocalImageCheckResult => {
  return useMemo(() => {
    if (!images || images.length === 0) {
      return { hasLocalImage: false, localUri: null };
    }

    const firstImage = images[0];
    
    // Extract URI (prioritize local, fallback to remote)
    let uri: string | null = null;
    
    if (typeof firstImage === 'string') {
      uri = firstImage;
    } else {
      // Try local first (instant), fallback to remote (cloud)
      uri = firstImage.local || firstImage.remote;
    }

    return {
      hasLocalImage: !!uri,
      localUri: uri
    };
  }, [images, images?.length]);
};
