import { CountriesOverview } from '@/features/shipping/components/countries-overview';

export default function CountriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Shipping Countries</h1>
          <p className="text-muted-foreground">
            Manage countries and their shipping structure
          </p>
        </div>
        <CountriesOverview />
      </div>
    </div>
  );
}
