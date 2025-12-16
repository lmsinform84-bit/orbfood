import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserHomeWrapper } from '@/components/user/user-home-wrapper';
import { StoreApprovalAlert } from '@/components/user/store-approval-alert';

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function UserHomePage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Check if user has a store
  let userStore = null;
  let userProfile = null;
  const supabase = await createClient();
  const [storeData, profileData] = await Promise.all([
    supabase
      .from('stores')
      .select('id, name, status')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single(),
  ]);
  userStore = storeData.data;
  userProfile = profileData.data;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Show approval alert if store is approved but user role is still 'user' */}
      {user && userStore && userStore.status === 'approved' && userProfile && userProfile.role === 'user' && (
        <div className="container mx-auto px-4 pt-6 z-40 relative">
          <StoreApprovalAlert
            storeName={userStore.name}
            storeStatus={userStore.status}
            userRole={userProfile.role}
          />
        </div>
      )}

      <UserHomeWrapper />
    </div>
  );
}
