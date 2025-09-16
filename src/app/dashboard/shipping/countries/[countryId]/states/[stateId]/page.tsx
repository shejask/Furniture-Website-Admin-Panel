import { StateDetailNew } from '@/features/shipping/components/state-detail-new';

export default async function StateDetailPage({ params, searchParams }: { 
  params: Promise<{ countryId: string; stateId: string }>; 
  searchParams: Promise<{ countryName?: string; stateName?: string }> 
}) {
  const { countryId, stateId } = await params;
  const { countryName, stateName } = await searchParams;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <StateDetailNew 
          countryId={countryId} 
          stateId={stateId}
          countryName={countryName || 'Unknown Country'}
          stateName={stateName || 'Unknown State'}
        />
      </div>
    </div>
  );
}
