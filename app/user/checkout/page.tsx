'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ShoppingCart, MapPin, CreditCard, FileText } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { QRISDisplay } from '@/components/user/qris-display';

interface CartItem {
  productId: string;
  storeId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

interface CheckoutData {
  cart: CartItem[];
  deliveryAddress: string;
  notes: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load checkout data from localStorage
    const stored = localStorage.getItem('checkoutData');
    if (!stored) {
      router.push('/user/cart');
      return;
    }

    try {
      const data = JSON.parse(stored);
      setCheckoutData(data);
    } catch (error) {
      console.error('Error parsing checkout data:', error);
      router.push('/user/cart');
    }
  }, [router]);

  const handleCreateOrder = async () => {
    if (!checkoutData) return;

    setLoading(true);
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat pesanan');
      }

      // Clear cart and checkout data
      localStorage.removeItem('cart');
      localStorage.removeItem('checkoutData');
      window.dispatchEvent(new Event('cartUpdated'));

      toast({
        title: 'Pesanan berhasil dibuat',
        description: 'Pesanan Anda sedang diproses',
      });

      // Redirect to order detail page
      router.push(`/user/orders/${result.orderId}`);
    } catch (error: any) {
      toast({
        title: 'Gagal membuat pesanan',
        description: error.message || 'Terjadi kesalahan saat membuat pesanan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Memuat data checkout...</p>
        </div>
      </div>
    );
  }

  const { cart, deliveryAddress, notes, paymentMethod, subtotal, deliveryFee, total } = checkoutData;
  const storeId = cart[0]?.storeId;

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'COD':
        return 'Cash / COD (Bayar di Tempat)';
      case 'QRIS':
        return 'QRIS Toko';
      default:
        return method;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Konfirmasi Pesanan</h1>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Penting:</strong> Pesanan akan diproses setelah toko menyetujui alamat pengantaran. 
          Pembayaran dilakukan langsung ke toko, bukan melalui aplikasi.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="md:col-span-2 space-y-4">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Detail Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={getImageUrl(item.imageUrl, 'thumbnail') || '/placeholder-food.jpg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        Subtotal: Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Alamat Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{deliveryAddress}</p>
            </CardContent>
          </Card>

          {/* Notes */}
          {notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Catatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Ringkasan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Method */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Metode Pembayaran</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getPaymentMethodLabel(paymentMethod)}
                </p>
              </div>

              {/* QRIS Display */}
              {paymentMethod === 'QRIS' && storeId && (
                <QRISDisplay
                  storeId={storeId}
                  amount={total}
                  onPaymentConfirmed={() => {
                    toast({
                      title: 'Pembayaran dikonfirmasi',
                      description: 'Toko akan memverifikasi pembayaran Anda',
                    });
                  }}
                />
              )}

              {/* COD Info */}
              {paymentMethod === 'COD' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Pembayaran dilakukan langsung ke kasir atau driver saat pesanan diterima.
                  </AlertDescription>
                </Alert>
              )}

              {/* Price Summary */}
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
                  <span>Total Bayar</span>
                  <span className="text-primary">Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2">
                <Button
                  className="w-full"
                  onClick={handleCreateOrder}
                  disabled={loading}
                >
                  {loading ? 'Memproses...' : 'Buat Pesanan'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Kembali
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

