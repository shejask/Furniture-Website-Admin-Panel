import { CountryDetail } from '@/features/shipping/components/country-detail';

export default async function CountryDetailPage({ params, searchParams }: { 
  params: Promise<{ countryId: string }>; 
  searchParams: Promise<{ name?: string }> 
}) {
  const { countryId } = await params;
  const { name } = await searchParams;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <CountryDetail countryId={countryId} countryName={name || 'Unknown Country'} />
      </div>
    </div>
  );
}
