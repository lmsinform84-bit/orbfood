'use client';

import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
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
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Area {
  id: string;
  name: string;
  description: string | null;
}

interface AreaSelectProps {
  value?: string | null;
  onValueChange: (value: string) => void;
  required?: boolean;
  label?: string;
  error?: string;
}

export function AreaSelect({ 
  value, 
  onValueChange, 
  required = false,
  label = 'Wilayah Operasional Toko',
  error 
}: AreaSelectProps) {
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
    <div className="space-y-2">
      <Label htmlFor="area">
        {label} {required && '*'}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="area"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat...
              </>
            ) : selectedArea ? (
              selectedArea.name
            ) : (
              'Pilih Wilayah Operasional'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
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
                {filteredAreas.map((area) => (
                  <CommandItem
                    key={area.id}
                    value={area.id}
                    onSelect={() => {
                      onValueChange(area.id === value ? '' : area.id);
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
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {selectedArea?.description && !error && (
        <p className="text-xs text-muted-foreground">
          {selectedArea.description}
        </p>
      )}
    </div>
  );
}
