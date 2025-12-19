'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export function StorePageClient({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const scrollExecuted = useRef(false);

  useEffect(() => {
    if (productId && !scrollExecuted.current) {
      scrollExecuted.current = true;
      // Wait for DOM to be ready
      setTimeout(() => {
        const element = document.getElementById(`product-${productId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('animate-pulse');
          setTimeout(() => {
            element.classList.remove('animate-pulse');
          }, 2000);
        }
      }, 100);
    }
  }, [productId]);

  return <>{children}</>;
}

