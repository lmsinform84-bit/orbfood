'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, LogOut, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShoppingCart, Store } from 'lucide-react';

interface NavbarProps {
  userRole?: 'user' | 'toko' | 'admin';
  userName?: string;
}

export function Navbar({ userRole, userName }: NavbarProps) {
  const router = useRouter();
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
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={getHomePath(userRole)} className="text-2xl font-bold text-primary">
          ORBfood
        </Link>

        <div className="flex items-center gap-4">
          {userName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{userName}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {getRoleLabel(userRole)}
              </span>
            </div>
          )}

          {userRole === 'user' && (
            <>
              <Link href="/user/open-store">
                <Button variant="outline" size="sm">
                  <Store className="h-4 w-4 mr-2" />
                  Buka Toko
                </Button>
              </Link>
            <Link href="/user/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                Terang
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                Gelap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                Sistem
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {userRole && (
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

