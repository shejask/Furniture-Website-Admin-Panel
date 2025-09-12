import PageContainer from '@/components/layout/page-container';
import { VendorSignupsTable } from '@/features/vendors/components/vendor-signups-table';

export default function VendorSignupsPage() {
  return (
    <PageContainer>
      <div className="space-y-6 w-full">
        <VendorSignupsTable />
      </div>
    </PageContainer>
  );
}


