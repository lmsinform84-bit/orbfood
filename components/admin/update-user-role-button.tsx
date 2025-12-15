'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UpdateUserRoleButtonProps {
  userId: string;
  currentRole: UserRole;
}

export function UpdateUserRoleButton({
  userId,
  currentRole,
}: UpdateUserRoleButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>(currentRole);

  // Sync role dengan currentRole prop (untuk refresh setelah update)
  useEffect(() => {
    setRole(currentRole);
  }, [currentRole]);

  const handleUpdateRole = async (newRole: UserRole) => {
    setLoading(true);
    const previousRole = role;
    setRole(newRole);

    try {
      const response = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Gagal memperbarui role');
      }

      toast({
        title: 'Role diperbarui',
        description: `Role user telah diupdate menjadi ${newRole}`,
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Gagal memperbarui role',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
      setRole(previousRole);
    } finally {
      setLoading(false);
    }
  };

  // Debug: log current role
  useEffect(() => {
    console.log(`📋 User ${userId}: currentRole=${currentRole}, state=${role}`);
  }, [userId, currentRole, role]);

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onValueChange={handleUpdateRole} disabled={loading}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Pilih role">
            {role === 'user' && 'User'}
            {role === 'toko' && 'Toko'}
            {role === 'admin' && 'Admin'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="toko">Toko</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      {loading && <span className="text-sm text-muted-foreground">Menyimpan...</span>}
    </div>
  );
}
