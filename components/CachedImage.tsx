import { EventImage } from '@/store/eventStore';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import { Image, ImageProps, ImageSourcePropType } from 'react-native';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
    source: EventImage | string; // Support both hybrid and legacy string URLs
}

/**
 * Smart Image Component with Local-First Loading
 * 
 * Optimization Strategy:
 * 1. Try local file path first (instant, free)
 * 2. If local file doesn't exist → Fallback to remote Supabase URL
 * 3. Saves bandwidth costs by preferring cached local files
 */
export const CachedImage: React.FC<CachedImageProps> = ({ source, ...props }) => {
    const [imageSource, setImageSource] = useState<ImageSourcePropType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadImage();
    }, [source]);

    const loadImage = async () => {
        setIsLoading(true);

        try {
            // Handle legacy string input (backward compatibility)
            if (typeof source === 'string') {
                setImageSource({ uri: source });
                setIsLoading(false);
                return;
            }

            // Hybrid EventImage input
            const { local, remote } = source;

            // **Step 1: Try local file first (fast, free)**
            if (local && local.startsWith('file://')) {
                const fileInfo = await FileSystem.getInfoAsync(local);

                if (fileInfo.exists) {
                    // ✅ Local file found - use it!
                    setImageSource({ uri: local });
                    setIsLoading(false);
                    return;
                }
            }

            // **Step 2: Fallback to remote Supabase URL**
            if (remote) {
                setImageSource({ uri: remote });
            } else {
                console.warn('[CachedImage] No valid image source available');
                setImageSource(null);
            }
        } catch (error) {
            // On any error, fallback to remote
            console.warn('[CachedImage] Local load failed, using remote:', error);
            if (typeof source !== 'string' && source.remote) {
                setImageSource({ uri: source.remote });
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!imageSource) {
        return null; // Or show a placeholder
    }

    return <Image {...props} source={imageSource} />;
};
