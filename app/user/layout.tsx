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

  // Home page handles its own layout
  // Other pages use default navbar
  // This will be checked in each page component
  return <>{children}</>;
}

