import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/navbar';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect jika tidak login
  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <Navbar userRole={user.role} userName={user.full_name || undefined} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </>
  );
}

