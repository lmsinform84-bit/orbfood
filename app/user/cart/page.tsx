'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Trash2, ShoppingCart, CreditCard, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [paymentMethod, setPaymentMethod] = useState<string>('QRIS');
  const [deliveryFee, setDeliveryFee] = useState(0);

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

    // Load delivery fee from first store in cart
    const loadDeliveryFee = async () => {
      if (cart.length > 0) {
        const firstStoreId = cart[0].storeId;
        const { data } = await supabase
          .from('store_settings')
          .select('delivery_fee')
          .eq('store_id', firstStoreId)
          .single();
        if (data?.delivery_fee) {
          setDeliveryFee(data.delivery_fee);
        }
      }
    };
    loadDeliveryFee();
  }, [cart]);

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
  const total = subtotal + deliveryFee;

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

    if (!paymentMethod) {
      toast({
        title: 'Metode pembayaran diperlukan',
        description: 'Mohon pilih metode pembayaran',
        variant: 'destructive',
      });
      return;
    }

    // Redirect to confirmation page with cart data
    const checkoutData = {
      cart,
      deliveryAddress,
      notes,
      paymentMethod,
      subtotal,
      deliveryFee,
      total,
    };
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    router.push('/user/checkout');
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

              <div className="space-y-2">
                <Label htmlFor="payment">Metode Pembayaran *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment">
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QRIS">QRIS Toko</SelectItem>
                    <SelectItem value="COD">Cash / COD (Bayar di Tempat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Penting:</strong> Pembayaran dilakukan langsung ke toko, bukan melalui aplikasi.
                </AlertDescription>
              </Alert>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Ongkir</span>
                    <span>Rp {deliveryFee.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={loading || !deliveryAddress.trim() || !paymentMethod}
              >
                {loading ? 'Memproses...' : 'Lanjut ke Konfirmasi'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

