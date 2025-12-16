import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/navbar';

export async function UserPageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar userRole={user.role} userName={user.full_name || undefined} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </>
  );
}

