'use client';

import React from 'react';
import { DedicatedVendorProductForm } from './dedicated-vendor-product-form';

interface VendorProductFormProps {
  initialData?: any;
}

function VendorProductForm({ initialData }: VendorProductFormProps) {
  return (
    <div className="w-full">
      <DedicatedVendorProductForm initialData={initialData} />
    </div>
  );
}

export default VendorProductForm;
