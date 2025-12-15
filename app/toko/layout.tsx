import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, Settings, Store } from 'lucide-react';

export default async function TokoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Redirect jika tidak login
  if (!user) {
    redirect('/login');
  }

  // Redirect jika bukan toko
  if (user.role !== 'toko') {
    redirect('/user/home');
  }

  return (
    <>
      <Navbar userRole={user.role} userName={user.full_name || undefined} />
      <div className="border-b bg-background">
        <div className="container mx-auto px-4">
          <nav className="flex gap-2 py-2">
            <Link href="/toko/dashboard">
              <Button variant="ghost" size="sm">
                <Store className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/toko/menu">
              <Button variant="ghost" size="sm">
                <Package className="h-4 w-4 mr-2" />
                Menu
              </Button>
            </Link>
            <Link href="/toko/orders">
              <Button variant="ghost" size="sm">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Pesanan
              </Button>
            </Link>
            <Link href="/toko/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Pengaturan
              </Button>
            </Link>
          </nav>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </>
  );
}

