import { RolesTable } from '@/features/users/components/roles-table';

export default function RolesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Role Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and their permissions
        </p>
      </div>
      <RolesTable />
    </div>
  );
} 