import { Metadata } from 'next';
import { FirebaseDemo } from '@/components/firebase-demo';

export const metadata: Metadata = {
  title: 'Firebase Demo',
  description: 'Firebase integration demo page'
};

export default function FirebaseDemoPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Firebase Integration Demo</h1>
        <p className="text-muted-foreground mt-2">
          This page demonstrates Firebase Realtime Database and Storage integration.
        </p>
      </div>
      
      <FirebaseDemo />
    </div>
  );
} 