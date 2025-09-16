'use client';

import { TaxesTable } from './taxes-table';

export default function TaxesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Taxes</h1>
        <p className="text-muted-foreground">
          Manage tax rates and configurations for your business
        </p>
      </div>
      <TaxesTable />
    </div>
  );
}
