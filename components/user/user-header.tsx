'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { User, ChevronDown, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Area {
  id: string;
  name: string;
}

interface UserHeaderProps {
  selectedAreaId?: string | null;
  onAreaChange?: (areaId: string | null) => void;
}

export function UserHeader({ selectedAreaId, onAreaChange }: UserHeaderProps) {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data, error } = await supabase
          .from('areas')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching areas:', error);
          return;
        }

        setAreas(data || []);

        // If area is selected, find it
        if (selectedAreaId) {
          const area = data?.find((a) => a.id === selectedAreaId);
          if (area) {
            setSelectedArea(area);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAreas();
  }, [selectedAreaId]);

  const handleAreaSelect = (area: Area | null) => {
    setSelectedArea(area);
    if (onAreaChange) {
      onAreaChange(area?.id || null);
    }
  };

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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "rounded-full bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm",
                    "h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm font-medium",
                    "max-w-full"
                  )}
                >
                  <span className="mr-1 sm:mr-2 truncate max-w-[120px] sm:max-w-none">
                    {selectedArea ? selectedArea.name : 'Pilih Wilayah'}
                  </span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="center">
                <div className="space-y-1">
                  <button
                    onClick={() => handleAreaSelect(null)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      !selectedArea
                        ? "bg-[#312E81] text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    Semua Wilayah
                  </button>
                  {areas.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => handleAreaSelect(area)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedArea?.id === area.id
                          ? "bg-[#312E81] text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      {area.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
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

