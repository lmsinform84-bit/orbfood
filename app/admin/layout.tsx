import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Store, Users, BarChart3, Settings } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect jika tidak login
  if (!user) {
    redirect('/login');
  }

  // Redirect jika bukan admin
  if (user.role !== 'admin') {
    redirect('/user/home');
  }

  return (
    <>
      <Navbar userRole={user.role} userName={user.full_name || undefined} />
      <div className="border-b bg-background">
        <div className="container mx-auto px-4">
          <nav className="flex gap-2 py-2">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/stores">
              <Button variant="ghost" size="sm">
                <Store className="h-4 w-4 mr-2" />
                Toko
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Pengguna
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Pesanan
              </Button>
            </Link>
          </nav>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </>
  );
}

