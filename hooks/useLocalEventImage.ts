import { EventImage } from '@/store/eventStore';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';

interface LocalImageCheckResult {
  hasLocalImage: boolean;
  localUri: string | null;
}

/**
 * Hook to check if event's first image exists locally
 * WITHOUT downloading from Supabase
 */
export const useLocalEventImage = (images?: EventImage[]): LocalImageCheckResult => {
  const [result, setResult] = useState<LocalImageCheckResult>({
    hasLocalImage: false,
    localUri: null,
  });

  useEffect(() => {
    const checkLocalImage = async () => {
      try {
        const firstImage = images?.[0];
        if (!firstImage) {
          setResult({ hasLocalImage: false, localUri: null });
          return;
        }

        // Extract local path from EventImage or use string directly
        const localPath = typeof firstImage === 'string' ? firstImage : firstImage.local;

        // Only check if it's a local file path (don't download remote)
        if (localPath && localPath.startsWith('file://')) {
          const fileInfo = await FileSystem.getInfoAsync(localPath);

          if (fileInfo.exists) {
            setResult({ hasLocalImage: true, localUri: localPath });
          } else {
            setResult({ hasLocalImage: false, localUri: null });
          }
        } else {
          setResult({ hasLocalImage: false, localUri: null });
        }
      } catch (error) {
        console.log('[useLocalEventImage] Check failed:', error);
        setResult({ hasLocalImage: false, localUri: null });
      }
    };

    checkLocalImage();
  }, [images]);

  return result;
};
