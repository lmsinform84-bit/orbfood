'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store } from '@/types/database';

interface StoreHeaderProps {
  store: Store & { area?: { name: string } | null };
  isScrolled?: boolean;
}

export function StoreHeader({ store, isScrolled = false }: StoreHeaderProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div 
      className={`sticky top-0 z-50 bg-[#1E3A8A] border-b border-[#1E3A8A]/20 transition-all duration-300 ${
        isScrolled ? 'shadow-md py-2' : 'shadow-sm py-2.5'
      }`}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          {/* Back Button & Store Name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-white hover:bg-white/20"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className={`font-bold text-white truncate transition-all ${
                isScrolled ? 'text-base' : 'text-lg sm:text-xl'
              }`}>
                {store.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {store.area?.name && (
                  <>
                    <span className="text-xs text-white/80 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {store.area.name}
                    </span>
                    <span className="text-xs text-white/40">•</span>
                  </>
                )}
                <span className="text-xs text-white/80 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {store.is_open ? 'Buka' : 'Tutup'}
                </span>
              </div>
            </div>
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-white hover:bg-white/20"
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <Heart 
              className={`h-4 w-4 ${
                isFavorite ? 'fill-white text-white' : 'text-white/80'
              }`} 
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

