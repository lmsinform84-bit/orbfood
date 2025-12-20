'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/types/database';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MenuTabsProps {
  products: Product[];
  activeCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;
}

export function MenuTabs({ products, activeCategory: externalCategory, onCategoryChange }: MenuTabsProps) {
  const [internalCategory, setInternalCategory] = useState<string | null>('all');
  const activeCategory = externalCategory !== undefined ? externalCategory : internalCategory;

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = products
      .map(p => p.category)
      .filter((cat): cat is string => cat !== null && cat !== '')
      .filter((cat, index, self) => self.indexOf(cat) === index);
    return cats;
  }, [products]);

  const handleCategoryChange = (category: string | null) => {
    if (externalCategory === undefined) {
      setInternalCategory(category);
    }
    onCategoryChange?.(category);
  };

  return (
    <div className="sticky top-[73px] z-40 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
          <Button
            variant={activeCategory === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleCategoryChange('all')}
            className={cn(
              'whitespace-nowrap flex-shrink-0',
              activeCategory === 'all' && 'bg-primary text-white'
            )}
          >
            Semua
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleCategoryChange(category)}
              className={cn(
                'whitespace-nowrap flex-shrink-0',
                activeCategory === category && 'bg-primary text-white'
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

