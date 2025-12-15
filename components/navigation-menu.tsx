'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  iconName: keyof typeof Icons;
}

interface NavigationMenuProps {
  items: NavItem[];
}

export function NavigationMenu({ items }: NavigationMenuProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const IconComponent = Icons[item.iconName] as React.ComponentType<{ className?: string }>;
        
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "gap-2 whitespace-nowrap",
                isActive && "bg-secondary font-medium"
              )}
            >
              {IconComponent && <IconComponent className="h-4 w-4" />}
              <span>{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
