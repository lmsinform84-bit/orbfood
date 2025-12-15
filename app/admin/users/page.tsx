import { createAdminClient } from '@/lib/supabase/admin-server';
import { UsersListClient } from '@/components/admin/users-list-client';

async function getUsers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }

  // Debug logging (hanya di development)
  if (process.env.NODE_ENV === 'development' && data) {
    console.log('📊 Users fetched:', data.length);
    data.forEach((user: any) => {
      console.log(`  - ${user.email}: role=${user.role}, id=${user.id}`);
    });
  }

  return data || [];
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Kelola Pengguna</h1>
      <UsersListClient initialUsers={users} />
    </div>
  );
}

