import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/components/navbar';
import { NavigationMenu } from '@/components/navigation-menu';
import { AdminBottomNavigation } from '@/components/admin/bottom-navigation';

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

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      iconName: 'BarChart3' as const,
    },
    {
      href: '/admin/stores',
      label: 'Kelola Toko',
      iconName: 'Store' as const,
    },
    {
      href: '/admin/users',
      label: 'Kelola Pengguna',
      iconName: 'Users' as const,
    },
    {
      href: '/admin/areas',
      label: 'Wilayah',
      iconName: 'MapPin' as const,
    },
  ];

  return (
    <>
      <Navbar userRole={user.role} userName={user.full_name || undefined} />
      <div className="hidden md:block border-b bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="flex h-12 items-center">
            <NavigationMenu items={navItems} />
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">{children}</main>
      <AdminBottomNavigation />
    </>
  );
}

