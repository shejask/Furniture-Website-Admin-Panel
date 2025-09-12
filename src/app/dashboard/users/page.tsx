import { UsersTable } from '@/features/users/components/users-table';

export default function UsersPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and their roles
        </p>
      </div>
      <UsersTable />
    </div>
  );
} 