'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UpdateUserRoleButton } from './update-user-role-button';
import { UserRole } from '@/types/database';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  address: string | null;
  created_at: string;
}

interface UsersListClientProps {
  initialUsers: User[];
}

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return <Badge variant="destructive">Admin</Badge>;
    case 'toko':
      return <Badge variant="secondary">Toko</Badge>;
    case 'user':
      return <Badge>User</Badge>;
    default:
      return <Badge>{role}</Badge>;
  }
};

export function UsersListClient({ initialUsers }: UsersListClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [refreshing, setRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Fetch fresh data
      const response = await fetch('/api/users/all', {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
      // Also refresh router
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Error refreshing users:', error);
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Update users when initialUsers changes
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Belum ada pengguna yang terdaftar.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || isPending}
            className="mt-4"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(refreshing || isPending) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(refreshing || isPending) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2">{user.full_name || 'N/A'}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                {getRoleBadge(user.role)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                {user.phone && (
                  <div>
                    <strong>Telepon:</strong> {user.phone}
                  </div>
                )}
                {user.address && (
                  <div>
                    <strong>Alamat:</strong> {user.address}
                  </div>
                )}
                <div>
                  <strong>Terdaftar:</strong>{' '}
                  {new Date(user.created_at).toLocaleDateString('id-ID')}
                </div>
              </div>
              <UpdateUserRoleButton 
                key={`${user.id}-${user.role}`} 
                userId={user.id} 
                currentRole={user.role} 
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
