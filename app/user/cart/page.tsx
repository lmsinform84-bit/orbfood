'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  productId: string;
  storeId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Load cart from localStorage
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(storedCart);

    // Listen for cart updates
    const handleCartUpdate = () => {
      const updatedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCart(updatedCart);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  useEffect(() => {
    // Load user address
    const loadUserAddress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('address')
          .eq('id', user.id)
          .single();
        if (data?.address) {
          setDeliveryAddress(data.address);
        }
      }
    };
    loadUserAddress();
  }, []);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter((item) => item.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Keranjang kosong',
        description: 'Tambahkan item ke keranjang terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    if (!deliveryAddress.trim()) {
      toast({
        title: 'Alamat diperlukan',
        description: 'Mohon masukkan alamat pengiriman',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Group cart items by store
      const stores = new Map<string, CartItem[]>();
      cart.forEach((item) => {
        if (!stores.has(item.storeId)) {
          stores.set(item.storeId, []);
        }
        stores.get(item.storeId)!.push(item);
      });

      // Create orders for each store
      for (const [storeId, items] of stores.entries()) {
        const storeSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        // Get store settings for delivery fee
        const { data: settings } = await supabase
          .from('store_settings')
          .select('delivery_fee')
          .eq('store_id', storeId)
          .single();

        const deliveryFee = settings?.delivery_fee || 0;
        const finalTotal = storeSubtotal + deliveryFee;

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            store_id: storeId,
            total_price: storeSubtotal,
            delivery_fee: deliveryFee,
            final_total: finalTotal,
            status: 'pending',
            delivery_address: deliveryAddress,
            notes: notes || null,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Clear cart
      localStorage.removeItem('cart');
      setCart([]);

      toast({
        title: 'Pesanan berhasil dibuat',
        description: 'Pesanan Anda sedang diproses',
      });

      router.push('/user/orders');
    } catch (error: any) {
      toast({
        title: 'Checkout gagal',
        description: error.message || 'Terjadi kesalahan saat checkout',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Keranjang Kosong</h2>
        <p className="text-muted-foreground mb-4">Tambahkan item ke keranjang untuk melanjutkan</p>
        <Button onClick={() => router.push('/user/home')}>Belanja Sekarang</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Keranjang</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item.productId}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={getImageUrl(item.imageUrl, 'thumbnail') || '/placeholder-food.jpg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 flex items-center justify-center">
                        <span className="text-2xl">🍽️</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Rp {item.price.toLocaleString('id-ID')} x {item.quantity}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-auto text-destructive"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Alamat Pengiriman</Label>
                <Textarea
                  id="address"
                  placeholder="Masukkan alamat lengkap pengiriman"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan untuk toko..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={loading || !deliveryAddress.trim()}
              >
                {loading ? 'Memproses...' : 'Checkout'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

