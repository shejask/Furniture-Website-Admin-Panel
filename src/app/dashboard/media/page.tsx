import PageContainer from '@/components/layout/page-container';
import { MediaTable } from '@/features/media/components/media-table';

export default function MediaPage() {
  return (
    <PageContainer>
      <div className="space-y-6 w-full">
        <div>
          <h3 className="text-lg font-medium">Media Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage banners, ads, and other media assets for your application.
          </p>
        </div>
        <MediaTable />
      </div>
    </PageContainer>
  );
} 