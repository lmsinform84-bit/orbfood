'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AreaCombobox } from './area-combobox';

interface UserHeaderProps {
  selectedAreaId?: string | null;
  onAreaChange?: (areaId: string | null) => void;
}

export function UserHeader({ selectedAreaId, onAreaChange }: UserHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1E3A8A] border-b border-[#1E3A8A]/20">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/user/home" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span className="text-xl sm:text-2xl">🍽️</span>
            <span className="text-lg sm:text-xl font-bold text-white">ORBfood</span>
          </Link>

          {/* Area Selector */}
          <div className="flex-1 flex justify-center min-w-0">
            <AreaCombobox
              value={selectedAreaId || null}
              onValueChange={onAreaChange || (() => {})}
              placeholder="Pilih Wilayah"
              showAllOption={true}
              allOptionLabel="Semua Wilayah"
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Link href="/user/cart">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Keranjang</span>
              </Button>
            </Link>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Profil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/user/profile">Profil Saya</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/user/orders">Riwayat Pesanan</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/user/open-store">Buka Toko</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

