export interface Tax {
  id: string;
  name: string;
  rate: number; // Percentage rate (e.g., 10 for 10%)
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxFormData {
  name: string;
  rate: number;
  description?: string;
  isActive: boolean;
}

export interface TaxStats {
  totalTaxes: number;
  activeTaxes: number;
  inactiveTaxes: number;
  averageRate: number;
}

export interface TaxFilters {
  searchTerm?: string;
  isActive?: boolean;
}

export interface TaxSortOptions {
  sortBy: 'name' | 'rate' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}
