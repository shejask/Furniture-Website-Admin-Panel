import { useState, useCallback } from 'react';
import { 
  uploadFile, 
  uploadString, 
  uploadImage, 
  uploadMultipleFiles,
  getFileURL, 
  deleteFile, 
  listFiles,
  getFileMetadata,
  updateFileMetadata,
  generateFilePath
} from '@/lib/firebase-storage';

// Hook for file upload operations
export const useFirebaseStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (
    path: string, 
    file: File | Blob,
    metadata?: any
  ): Promise<string> => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);
      
      // Convert Blob to File if needed
      let fileToUpload: File;
      if (file instanceof File) {
        fileToUpload = file;
      } else {
        // Convert Blob to File
        fileToUpload = new File([file], 'uploaded-file', { type: file.type });
      }
      
      const url = await uploadFile(path, fileToUpload, metadata);
      setUploadProgress(100);
      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      throw error;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadStringData = useCallback(async (
    path: string, 
    data: string,
    format: 'raw' | 'base64' | 'base64url' | 'data_url' = 'raw',
    metadata?: any
  ): Promise<string> => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);
      
      const url = await uploadString(path, data, format, metadata);
      setUploadProgress(100);
      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('String upload failed');
      setError(error);
      throw error;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadImageFile = useCallback(async (
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
      setUploading(true);
      setError(null);
      setUploadProgress(0);
      
      const url = await uploadImage(path, file, options);
      setUploadProgress(100);
      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Image upload failed');
      setError(error);
      throw error;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: File[],
    basePath: string,
    options?: {
      onProgress?: (progress: number) => void;
      metadata?: any;
    }
  ): Promise<string[]> => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);
      
      const urls = await uploadMultipleFiles(files, basePath, {
        onProgress: (progress) => {
          const percentage = (progress.bytesTransferred / progress.totalBytes) * 100;
          setUploadProgress(percentage);
          options?.onProgress?.(percentage);
        },
        metadata: options?.metadata
      });
      
      setUploadProgress(100);
      return urls;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Multiple files upload failed');
      setError(error);
      throw error;
    } finally {
      setUploading(false);
    }
  }, []);

  const getURL = useCallback(async (path: string): Promise<string> => {
    try {
      setError(null);
      return await getFileURL(path);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get file URL');
      setError(error);
      throw error;
    }
  }, []);

  const remove = useCallback(async (path: string): Promise<void> => {
    try {
      setError(null);
      await deleteFile(path);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete file');
      setError(error);
      throw error;
    }
  }, []);

  const list = useCallback(async (path: string): Promise<string[]> => {
    try {
      setError(null);
      return await listFiles(path);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list files');
      setError(error);
      throw error;
    }
  }, []);

  const getMetadata = useCallback(async (path: string): Promise<any> => {
    try {
      setError(null);
      return await getFileMetadata(path);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get file metadata');
      setError(error);
      throw error;
    }
  }, []);

  const updateMetadata = useCallback(async (path: string, metadata: any): Promise<void> => {
    try {
      setError(null);
      await updateFileMetadata(path, metadata);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update file metadata');
      setError(error);
      throw error;
    }
  }, []);

  const generatePath = useCallback((fileName: string, folder?: string): string => {
    return generateFilePath(fileName, folder);
  }, []);

  return {
    upload,
    uploadStringData,
    uploadImageFile,
    uploadMultiple,
    getURL,
    remove,
    list,
    getMetadata,
    updateMetadata,
    generatePath,
    uploading,
    uploadProgress,
    error,
  };
};

// Hook for drag and drop file upload
export const useFileDrop = (
  onUpload: (files: File[]) => void,
  options?: {
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in bytes
  }
) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (options?.accept) {
      const acceptedTypes = options.accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileExtension = `.${file.name.split('.').pop()}`;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension.toLowerCase() === type.toLowerCase();
        }
        return fileType === type || fileType.startsWith(type.replace('*', ''));
      });
      
      if (!isAccepted) {
        setError(`File type not supported. Accepted types: ${options.accept}`);
        return false;
      }
    }

    // Check file size
    if (options?.maxSize && file.size > options.maxSize) {
      setError(`File too large. Maximum size: ${Math.round(options.maxSize / 1024 / 1024)}MB`);
      return false;
    }

    setError(null);
    return true;
  }, [options?.accept, options?.maxSize]);

  const handleFiles = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);
    
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  }, [validateFile, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return {
    isDragOver,
    error,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
  };
}; 