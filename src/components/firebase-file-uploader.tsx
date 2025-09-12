import React, { useCallback, useState } from 'react';
import { useFirebaseStorage, useFileDrop } from '@/hooks/use-firebase-storage';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Archive, 
  FileText, 
  File 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FileUploaderProps {
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  folder?: string;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  showPreview?: boolean;
  className?: string;
}

const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
  if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <Archive className="h-4 w-4" />;
  if (type.includes('text') || type.includes('document')) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FirebaseFileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  folder = 'uploads',
  multiple = false,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  showPreview = true,
  className
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; url: string }>>([]);

  const {
    upload,
    uploadImageFile,
    uploading,
    uploadProgress,
    error: uploadError,
    generatePath
  } = useFirebaseStorage();

  const {
    isDragOver,
    error: dropError,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput
  } = useFileDrop(
    (files) => {
      if (selectedFiles.length + files.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }
      setSelectedFiles(prev => [...prev, ...files]);
    },
    {
      accept,
      multiple,
      maxSize
    }
  );

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const path = generatePath(file.name, folder);
        
        // Use image upload for images, regular upload for others
        const url = file.type.startsWith('image/')
          ? await uploadImageFile(path, file, {
              maxWidth: 1920,
              maxHeight: 1080,
              quality: 0.8,
              format: 'jpeg'
            })
          : await upload(path, file);

        return { file, url };
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...results]);
      setSelectedFiles([]);
      onUploadComplete(results.map(r => r.url));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      onUploadError?.(err);
    }
  }, [selectedFiles, folder, upload, uploadImageFile, generatePath, onUploadComplete, onUploadError]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeUploadedFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const error = dropError || uploadError;
  const errorMessage = error instanceof Error ? error.message : error || 'An error occurred';

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Drop Zone */}
      <Card className={cn(
        "border-2 border-dashed transition-colors",
        isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        uploading && "opacity-50 pointer-events-none"
      )}>
        <CardContent className="p-6">
          <div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                {accept ? `Accepted types: ${accept}` : 'All file types'} • 
                Max size: {formatFileSize(maxSize)} • 
                Max files: {maxFiles}
              </p>
            </div>
            <input
              type="file"
              multiple={multiple}
              accept={accept}
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
            >
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="w-full"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}

      {/* Uploaded Files Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadedFiles.map(({ file, url }, index) => (
              <Card key={`${file.name}-${index}`} className="overflow-hidden">
                <CardContent className="p-3">
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
                        {getFileIcon(file)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadedFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 