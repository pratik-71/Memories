import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  size: number; // in bytes
}

export const compressImage = async (uri: string): Promise<CompressionResult> => {
  try {
    const MAX_DIMENSION = 1080;
    const TARGET_SIZE_MAX = 100 * 1024; // 100 KB
    const HARD_LIMIT = 2 * 1024 * 1024; // 2 MB

    // 1. Get Original Dimensions to avoid upscaling
    const { width, height } = await new Promise<{ width: number, height: number }>((resolve, reject) => {
        Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), (err) => reject(err));
    });

    // 2. Determine Resize Actions
    const actions: ImageManipulator.Action[] = [];
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
            actions.push({ resize: { width: MAX_DIMENSION } });
        } else {
            actions.push({ resize: { height: MAX_DIMENSION } });
        }
    }

    // 3. Initial Compression (70% Quality / WebP)
    let result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP }
    );
    
    // Check file size
    let fileInfo = await getFileInfo(result.uri);
    
    // 4. Adaptive Compression Loop
    if (fileInfo.size > TARGET_SIZE_MAX) {
       // Reduce quality to 0.5 if over target
       result = await ImageManipulator.manipulateAsync(
          result.uri,
          [], 
          { compress: 0.5, format: ImageManipulator.SaveFormat.WEBP }
       );
       fileInfo = await getFileInfo(result.uri);
    }

    if (fileInfo.size > HARD_LIMIT) {
       // Emergency crunch to 0.4 if still huge (unlikely for 1080p, but safety net)
       result = await ImageManipulator.manipulateAsync(
          result.uri,
          [],
          { compress: 0.4, format: ImageManipulator.SaveFormat.WEBP }
       );
       fileInfo = await getFileInfo(result.uri);
    }
    
    return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        size: fileInfo.size
    };

  } catch (error) {
    console.warn("Image compression failed, falling back to original", error);
    // Return original if something breaks, effectively skipping optimization
    return { uri, width: 0, height: 0, size: 0 };
  }
};

const getFileInfo = async (uri: string) => {
    // using fetch to get blob size is reliable in RN
    const response = await fetch(uri);
    const blob = await response.blob();
    return { size: blob.size };
};
