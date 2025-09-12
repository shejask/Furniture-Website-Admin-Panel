import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFirebaseStorage } from '@/hooks/use-firebase-storage';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SimpleFileUploaderProps {
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  folder?: string;
  accept?: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  showPreview?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const SimpleFileUploader: React.FC<SimpleFileUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  onUploadStart,
  onUploadEnd,
  folder = 'uploads',
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 1,
  showPreview = true,
  className
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; url: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    uploadImageFile,
    error: uploadError
  } = useFirebaseStorage();

  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileExtension = `.${file.name.split('.').pop()}`;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension.toLowerCase() === type.toLowerCase();
        }
        return fileType === type || fileType.startsWith(type.replace('*', ''));
      });
      
      if (!isAccepted) {
        setError(`File type not supported. Accepted types: ${accept}`);
        return false;
      }
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      setError(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }

    setError(null);
    return true;
  }, [accept, maxSize]);

  const handleFileSelect = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);
    
    if (validFiles.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    onUploadStart?.();

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split('.').pop();
        const path = `${folder}/${timestamp}_${randomId}.${extension}`;
        
        const url = await uploadImageFile(path, file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          format: 'jpeg'
        });

        return { file, url };
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...results]);
      onUploadComplete(results.map(r => r.url));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error.message);
      onUploadError?.(error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      onUploadEnd?.();
    }
  }, [folder, uploadImageFile, validateFile, onUploadComplete, onUploadError, onUploadStart, onUploadEnd]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const removeUploadedFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const currentError = error || uploadError?.message;

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Upload Zone */}
      <div className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
        isUploading ? "border-muted bg-muted/50" : "border-muted-foreground/25 hover:border-primary/50"
      )}>
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isUploading ? 'Uploading...' : 'Click to upload or drag files here'}
          </p>
          <p className="text-xs text-muted-foreground">
            {accept ? `Accepted types: ${accept}` : 'All file types'} • 
            Max size: {formatFileSize(maxSize)} • 
            Max files: {maxFiles}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="mt-4"
        >
          {isUploading ? 'Uploading...' : 'Choose Files'}
        </Button>
      </div>

      {/* Error Display */}
      {currentError && (
        <Alert variant="destructive">
          <AlertDescription>{currentError}</AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Uploaded Files Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadedFiles.map(({ file, url }, index) => (
              <div key={`${file.name}-${index}`} className="relative p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  {file.type.startsWith('image/') ? (
                    <Image
                      src={url}
                      alt={file.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadedFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 