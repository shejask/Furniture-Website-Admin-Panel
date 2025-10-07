'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebaseOperations } from '@/hooks/use-firebase-database';
import { Upload, Download } from 'lucide-react';

export default function ProductsBulkActions() {
  const { createWithUniqueId } = useFirebaseOperations();
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<{ total: number; created: number; failed: number; errors: string[] } | null>(null);

  const requiredColumns = ['vendorId','name','slug','shortDescription','sku','price','stockQuantity','categoryId'];

  const downloadSampleCsv = () => {
    const headers = [
      'vendorId','name','slug','shortDescription','description','sku','price','salePrice','commissionAmount','stockQuantity','categoryId','status'
    ];
    const example = [
      'VENDOR123','Elegant Wooden Chair','elegant-wooden-chair','Compact solid wood chair','A premium wooden chair suitable for dining and study.','SKU-CHAIR-001','4999','5499','200','25','category-chairs','active'
    ];
    const csv = `${headers.join(',')}\n${example.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCsvPick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) importCsvFile(file);
    };
    input.click();
  };

  const parseCsv = async (file: File): Promise<{ headers: string[]; rows: string[][] }> => {
    const text = await file.text();
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const splitLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result.map(v => v.trim());
    };
    const headers = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(l => splitLine(l).map(v => v.replace(/^"|"$/g, '')));
    return { headers, rows };
  };

  const importCsvFile = async (file: File) => {
    setIsImporting(true);
    setSummary(null);
    try {
      const { headers, rows } = await parseCsv(file);
      if (!headers.length) throw new Error('CSV is empty or unreadable.');
      const missing = requiredColumns.filter(c => !headers.includes(c));
      if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`);

      const headerIndex: Record<string, number> = {};
      headers.forEach((h, i) => { headerIndex[h] = i; });

      let created = 0;
      const errors: string[] = [];

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (row.length === 1 && row[0] === '') continue;
        try {
          const get = (key: string) => row[headerIndex[key]] ?? '';
          const images: string[] = [];
          const price = Number(get('price')) || 0;
          const salePrice = get('salePrice') ? Number(get('salePrice')) : 0;
          const commissionAmount = get('commissionAmount') ? Number(get('commissionAmount')) : 0;
          const stockQuantity = Number(get('stockQuantity')) || 0;
          const status = (get('status') || 'active').toLowerCase();

          if (!get('vendorId')) throw new Error('vendorId is required');
          if (!get('name')) throw new Error('name is required');
          if (!get('slug')) throw new Error('slug is required');
          if (!get('sku')) throw new Error('sku is required');
          if (!get('categoryId')) throw new Error('categoryId is required');

          const now = new Date().toISOString();
          const productData = {
            productType: 'physical',
            vendor: get('vendorId'),
            name: get('name'),
            slug: get('slug'),
            shortDescription: get('shortDescription') || '',
            description: get('description') || '',
            thumbnail: '',
            images,
            inventoryType: 'simple',
            stockStatus: stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
            sku: get('sku'),
            stockQuantity,
            price,
            discount: 0,
            salePrice,
            commissionAmount,
            taxId: '',
            rating: 0,
            variableOptions: [],
            tags: [],
            categories: [get('categoryId')],
            subCategories: [],
            brands: [],
            color: 'none',
            style: [],
            offerType: 0,
            usageFunctionality: [],
            theme: 'none',
            primaryMaterial: [],
            finish: [],
            upholsteryMaterial: [],
            pattern: 'none',
            madeIn: 'none',
            metaTitle: '',
            metaDescription: '',
            metaImage: '',
            weight: 0,
            deadWeight: 0,
            estimatedDeliveryText: '',
            dimensions: '',
            roomType: '',
            warrantyTime: '',
            new: false,
            bestSeller: false,
            onSale: false,
            newArrivals: false,
            trending: false,
            featured: false,
            status,
            createdAt: now,
            updatedAt: now
          } as any;

          await createWithUniqueId('products', productData, 'PROD');
          created++;
        } catch (e: any) {
          errors.push(`Row ${r + 2}: ${e?.message || 'Unknown error'}`);
        }
      }

      setSummary({ total: rows.length, created, failed: errors.length, errors });
    } catch (err: any) {
      setSummary({ total: 0, created: 0, failed: 1, errors: [err?.message || 'CSV import failed'] });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={handleCsvPick}
        disabled={isImporting}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isImporting ? 'Importing...' : 'Upload CSV'}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={downloadSampleCsv}
      >
        <Download className="h-4 w-4 mr-2" />
        Sample CSV
      </Button>

      {summary && (
        <div className="ml-2 text-xs text-muted-foreground">
          Total: {summary.total} · Created: {summary.created} · Failed: {summary.failed}
        </div>
      )}
    </div>
  );
}


