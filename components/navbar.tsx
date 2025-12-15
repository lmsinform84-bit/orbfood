'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, LogOut, User, ShoppingCart, Store } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavbarProps {
  userRole?: 'user' | 'toko' | 'admin';
  userName?: string;
}

export function Navbar({ userRole, userName }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Logout gagal',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'toko':
        return 'Toko';
      case 'user':
        return 'Pelanggan';
      default:
        return 'Pengguna';
    }
  };

  const getHomePath = (role?: string) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'toko':
        return '/toko/dashboard';
      case 'user':
        return '/user/home';
      default:
        return '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href={getHomePath(userRole)} 
            className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">🍽️</span>
            <span>ORBfood</span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* User info and role badge */}
            {userName && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {getRoleLabel(userRole)}
                </span>
              </div>
            )}

            {/* User-specific actions */}
            {userRole === 'user' && (
              <>
                <Link href="/user/open-store">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <Store className="h-4 w-4 mr-2" />
                    Buka Toko
                  </Button>
                </Link>
                <Link href="/user/cart">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "relative",
                      pathname === '/user/cart' && "bg-accent"
                    )}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Keranjang</span>
                  </Button>
                </Link>
              </>
            )}

            {/* Theme toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Terang</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Gelap</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <span className="mr-2 h-4 w-4">💻</span>
                  <span>Sistem</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout button */}
            {userRole && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
