import { 
  ref, 
  uploadBytes, 
  uploadString as firebaseUploadString, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { storage } from './firebase';

// Types for storage operations
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'paused' | 'success' | 'canceled';
}

// Upload file with metadata
export const uploadFile = async (
  path: string, 
  file: File, 
  metadata?: any
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Upload string data (JSON, text, etc.)
export const uploadString = async (
  path: string, 
  data: string,
  format: 'raw' | 'base64' | 'base64url' | 'data_url' = 'raw',
  metadata?: any
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await firebaseUploadString(storageRef, data, format, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Get download URL for a file
export const getFileURL = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Delete a file
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// List all files in a directory
export const listFiles = async (path: string): Promise<string[]> => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    return result.items.map(item => item.fullPath);
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
    return [];
  }
};

// Get file metadata
export const getFileMetadata = async (path: string): Promise<any> => {
  try {
    const storageRef = ref(storage, path);
    return await getMetadata(storageRef);
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Update file metadata
export const updateFileMetadata = async (path: string, metadata: any): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await updateMetadata(storageRef, metadata);
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Upload image with compression and resizing
export const uploadImage = async (
  path: string,
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }
): Promise<string> => {
  try {
    // Create a canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const maxWidth = options?.maxWidth || 1920;
        const maxHeight = options?.maxHeight || 1080;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              try {
                // Convert blob to File
                const compressedFile = new File([blob], file.name, {
                  type: `image/${options?.format || 'jpeg'}`,
                  lastModified: Date.now()
                });
                
                const url = await uploadFile(path, compressedFile, {
                  contentType: `image/${options?.format || 'jpeg'}`,
                  customMetadata: {
                    originalName: file.name,
                    originalSize: file.size.toString(),
                    compressedSize: blob.size.toString(),
                  }
                });
                resolve(url);
              } catch (error) {
                reject(error);
              }
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          `image/${options?.format || 'jpeg'}`,
          options?.quality || 0.8
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (
  files: File[],
  basePath: string,
  options?: {
    onProgress?: (progress: UploadProgress) => void;
    metadata?: any;
  }
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = `${Date.now()}_${index}_${file.name}`;
      const filePath = `${basePath}/${fileName}`;
      return await uploadFile(filePath, file, options?.metadata);
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    // Log error for debugging but don't expose to client
    throw error;
  }
};

// Generate a unique file path
export const generateFilePath = (
  fileName: string,
  folder: string = 'uploads'
): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = fileName.split('.').pop();
  return `${folder}/${timestamp}_${randomId}.${extension}`;
}; 