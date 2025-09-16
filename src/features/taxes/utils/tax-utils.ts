import type { Tax, TaxStats, TaxFilters, TaxSortOptions } from '@/types/tax';

export function calculateTaxStats(taxes: Record<string, Tax>): TaxStats {
  const taxList = Object.values(taxes);
  
  const totalTaxes = taxList.length;
  const activeTaxes = taxList.filter(tax => tax.isActive).length;
  const inactiveTaxes = totalTaxes - activeTaxes;
  const averageRate = totalTaxes > 0 
    ? taxList.reduce((sum, tax) => sum + tax.rate, 0) / totalTaxes 
    : 0;

  return {
    totalTaxes,
    activeTaxes,
    inactiveTaxes,
    averageRate: Math.round(averageRate * 100) / 100
  };
}

export function filterTaxes(taxes: Record<string, Tax>, filters: TaxFilters): Record<string, Tax> {
  let filtered = { ...taxes };

  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = Object.fromEntries(
      Object.entries(filtered).filter(([_, tax]) =>
        tax.name.toLowerCase().includes(searchLower) ||
        tax.description?.toLowerCase().includes(searchLower)
      )
    );
  }

  if (filters.isActive !== undefined) {
    filtered = Object.fromEntries(
      Object.entries(filtered).filter(([_, tax]) => tax.isActive === filters.isActive)
    );
  }

  return filtered;
}

export function sortTaxes(taxes: Record<string, Tax>, sortBy: TaxSortOptions['sortBy'], sortOrder: TaxSortOptions['sortOrder']): Array<{ id: string; tax: Tax }> {
  return Object.entries(taxes)
    .map(([id, tax]) => ({ id, tax }))
    .sort((a, b) => {
      let aValue: any = a.tax[sortBy];
      let bValue: any = b.tax[sortBy];

      // Handle date sorting
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
}

export function formatTaxRate(rate: number): string {
  return `${rate}%`;
}

export function getTaxStatusBadge(isActive: boolean): "default" | "secondary" | "destructive" | "outline" {
  return isActive ? "default" : "secondary";
}

export function getTaxStatusText(isActive: boolean): string {
  return isActive ? "Active" : "Inactive";
}
