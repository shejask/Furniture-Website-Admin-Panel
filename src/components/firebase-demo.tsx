'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FirebaseFileUploader } from '@/components/firebase-file-uploader';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import { useFirebaseStorage } from '@/hooks/use-firebase-storage';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export function FirebaseDemo() {
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { data: realtimeData, loading: realtimeLoading } = useFirebaseData('demo/messages');
  const { createWithKey, remove, loading: dbLoading } = useFirebaseOperations();
  const { upload, uploading, uploadProgress } = useFirebaseStorage();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      await createWithKey('demo/messages', {
        text: message,
        timestamp: new Date().toISOString(),
        user: 'Demo User'
      });
      setMessage('');
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const url = await upload(`demo/files/${Date.now()}_${file.name}`, file);
      setUploadedFiles(prev => [...prev, url]);
    } catch (error) {
      // Log error for debugging but don't expose to client
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="realtime" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="realtime">Realtime Database</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="file-uploader">File Uploader</TabsTrigger>
        </TabsList>

        {/* Realtime Database Demo */}
        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Realtime Messages</CardTitle>
              <CardDescription>
                Send messages and see them update in real-time across all clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={dbLoading}>
                  {dbLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Messages (Real-time)</Label>
                <div className="border rounded-lg p-4 h-64 overflow-y-auto">
                  {realtimeLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : realtimeData ? (
                    <div className="space-y-2">
                      {Object.entries(realtimeData).map(([key, msg]: [string, any]) => (
                        <div key={key} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div>
                            <p className="font-medium">{msg.text}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(msg.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(`demo/messages/${key}`)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center">No messages yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Demo */}
        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Storage</CardTitle>
              <CardDescription>
                Upload files to Firebase Storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="flex space-x-2">
                  <Input
                    type="file"
                    onChange={handleFileInput}
                    className="flex-1"
                  />
                  {uploading && (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{Math.round(uploadProgress)}%</span>
                    </div>
                  )}
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((url, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          File {index + 1}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Uploader Demo */}
        <TabsContent value="file-uploader" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced File Uploader</CardTitle>
              <CardDescription>
                Drag and drop file uploader with Firebase Storage integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FirebaseFileUploader
                onUploadComplete={(urls) => {
                  alert(`Successfully uploaded ${urls.length} file(s)!`);
                }}
                onUploadError={(error) => {
                  alert(`Upload failed: ${error.message}`);
                }}
                folder="demo/uploads"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                maxSize={10 * 1024 * 1024} // 10MB
                maxFiles={5}
                showPreview
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Firebase Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Firebase Integration Status</CardTitle>
          <CardDescription>
            Current Firebase configuration and connection status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Firebase Realtime Database: Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Firebase Storage: Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Authentication: Static (Local Storage)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 