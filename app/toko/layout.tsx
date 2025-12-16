import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { NavigationMenu } from '@/components/navigation-menu';
import { BottomNavigation } from '@/components/toko/bottom-navigation';

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

  const navItems = [
    {
      href: '/toko/dashboard',
      label: 'Dashboard',
      iconName: 'LayoutDashboard' as const,
    },
    {
      href: '/toko/menu',
      label: 'Menu',
      iconName: 'Package' as const,
    },
    {
      href: '/toko/orders',
      label: 'Pesanan',
      iconName: 'ShoppingBag' as const,
    },
    {
      href: '/toko/invoice',
      label: 'Invoice',
      iconName: 'FileText' as const,
    },
    {
      href: '/toko/settings',
      label: 'Pengaturan',
      iconName: 'Settings' as const,
    },
  ];

  return (
    <>
      <Navbar userRole={user.role} userName={user.full_name || undefined} />
      {/* Desktop Navigation - hidden on mobile */}
      <div className="hidden border-b bg-muted/40 md:block">
        <div className="container mx-auto px-4">
          <div className="flex h-12 items-center">
            <NavigationMenu items={navItems} />
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </>
  );
}

