'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { supabase } from '@/lib/supabase/client';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Area {
  id: string;
  name: string;
  description: string | null;
}

interface AreaComboboxProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
}

export function AreaCombobox({ 
  value, 
  onValueChange,
  placeholder = 'Pilih Wilayah',
  showAllOption = true,
  allOptionLabel = 'Semua Wilayah',
  className
}: AreaComboboxProps) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load areas on mount
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const { data, error } = await supabase
          .from('areas')
          .select('id, name, description')
          .order('name', { ascending: true });

        if (error) throw error;
        setAreas(data || []);
      } catch (error) {
        console.error('Error loading areas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAreas();
  }, []);

  // Filter areas based on search query
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) {
      return areas;
    }
    
    const query = searchQuery.toLowerCase();
    return areas.filter((area) => 
      area.name.toLowerCase().includes(query) ||
      area.description?.toLowerCase().includes(query)
    );
  }, [areas, searchQuery]);

  const selectedArea = areas.find((area) => area.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between rounded-full bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm",
            "h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm font-medium",
            "max-w-full",
            className
          )}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span className="hidden sm:inline">Memuat...</span>
            </>
          ) : (
            <>
              <span className="mr-1 sm:mr-2 truncate max-w-[120px] sm:max-w-none">
                {selectedArea ? selectedArea.name : placeholder}
              </span>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] sm:w-[320px] p-0" align="center">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Cari wilayah..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Memuat...' : 'Wilayah tidak ditemukan.'}
            </CommandEmpty>
            <CommandGroup>
              {showAllOption && (
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onValueChange(null);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      !value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {allOptionLabel}
                </CommandItem>
              )}
              {filteredAreas.map((area) => (
                <CommandItem
                  key={area.id}
                  value={area.id}
                  onSelect={() => {
                    onValueChange(area.id === value ? null : area.id);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === area.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{area.name}</span>
                    {area.description && (
                      <span className="text-xs text-muted-foreground">
                        {area.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

