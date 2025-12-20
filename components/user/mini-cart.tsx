'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartItem {
  productId: string;
  storeId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

export function MiniCart() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load cart from localStorage
    const loadCart = () => {
      const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCart(storedCart);
      setIsVisible(storedCart.length > 0);
    };

    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  if (!isVisible || cart.length === 0) {
    return null;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {itemCount} item{itemCount > 1 ? 's' : ''}
              </p>
              <p className="text-lg font-bold text-primary">
                Rp {subtotal.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/user/cart')}
            className="flex-shrink-0 px-6"
          >
            Lihat Keranjang
          </Button>
        </div>
      </div>
    </div>
  );
}

