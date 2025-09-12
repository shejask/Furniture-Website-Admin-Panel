import { FAQTable } from '@/features/faq/components/faq-table';

export default function FAQPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">FAQ Management</h1>
        <p className="text-muted-foreground">
          Manage frequently asked questions and their answers
        </p>
      </div>
      <FAQTable />
    </div>
  );
} 