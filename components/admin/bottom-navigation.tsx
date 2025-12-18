'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BarChart3, Store, Users, MapPin } from 'lucide-react';

export function AdminBottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
    },
    {
      href: '/admin/stores',
      label: 'Toko',
      icon: Store,
    },
    {
      href: '/admin/users',
      label: 'Pengguna',
      icon: Users,
    },
    {
      href: '/admin/areas',
      label: 'Wilayah',
      icon: MapPin,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2 flex-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive && 'font-semibold'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

