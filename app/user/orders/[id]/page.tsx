'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Store, 
  Phone, 
  MapPin, 
  FileText,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Home
} from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';
import Link from 'next/link';
import { OrderStatus } from '@/types/database';
import { PaymentProofUpload } from '@/components/user/payment-proof-upload';

interface OrderDetail {
  id: string;
  status: OrderStatus;
  total_price: number;
  delivery_fee: number;
  final_total: number;
  delivery_address: string;
  notes: string | null;
  payment_method: string | null;
  payment_proof_url: string | null;
  payment_proof_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
  store: {
    id: string;
    name: string;
    phone: string | null;
    address: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    product: {
      id: string;
      name: string;
      image_url: string | null;
    };
  }>;
}

const getStatusBadgeVariant = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'diproses':
      return 'secondary';
    case 'selesai':
      return 'default';
    case 'dibatalkan':
      return 'destructive';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'Menunggu Diproses';
    case 'diproses':
      return 'Sedang Diproses';
    case 'selesai':
      return 'Selesai';
    case 'dibatalkan':
      return 'Dibatalkan';
    default:
      return status;
  }
};

const getPaymentMethodLabel = (method: string | null) => {
  if (!method) return 'Belum dipilih';
  switch (method) {
    case 'COD':
      return 'COD (Bayar di Tempat)';
    case 'TRANSFER':
      return 'Transfer Bank';
    case 'QRIS':
      return 'QRIS';
    default:
      return method;
  }
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = params.id as string;

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchOrder = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            store:stores(id, name, phone, address),
            items:order_items(
              id,
              quantity,
              price,
              subtotal,
              product:products(id, name, image_url)
            )
          `)
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching order:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) {
        setOrder(data as any);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error:', error);
        if (mounted) setLoading(false);
      }
    };

    fetchOrder();

    // Set up real-time subscription with debouncing
    channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (mounted) {
          setOrder((prev) => prev ? { ...prev, ...payload.new } : null);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (channel) {
      supabase.removeChannel(channel);
      }
    };
  }, [orderId, router]);

  const handleWhatsApp = useCallback(() => {
    if (!order?.store.phone) return;
    const message = `Halo, saya ingin menanyakan tentang pesanan #${order.id.substring(0, 8)}`;
    const waUrl = `https://wa.me/${order.store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  }, [order]);

  const isActiveOrder = useMemo(() => {
    return order?.status === 'pending' || order?.status === 'diproses';
  }, [order?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Memuat detail pesanan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Pesanan Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-4">Pesanan yang Anda cari tidak ditemukan atau tidak memiliki akses.</p>
        <Link href="/user/orders">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Riwayat
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation Header */}
      <div className="sticky top-0 z-50 bg-[#1E3A8A] border-b border-[#1E3A8A]/20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Link href={isActiveOrder ? "/user/my-orders" : "/user/orders"}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="font-bold text-lg sm:text-xl text-white truncate">
                Detail Pesanan
              </h1>
            </div>
            <Link href="/user/home">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 text-white hover:bg-white/20"
              >
                <Home className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Badge variant={getStatusBadgeVariant(order.status)} className="text-lg px-4 py-2">
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Pesanan dibuat pada {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
          </p>
        </div>

      {/* Status Alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Status pesanan Anda akan diperbarui secara real-time. 
          {order.status === 'pending' && ' Silakan tunggu konfirmasi dari toko.'}
          {order.status === 'diproses' && ' Pesanan Anda sedang diproses oleh toko.'}
          {order.status === 'selesai' && ' Pesanan Anda telah selesai. Terima kasih!'}
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="md:col-span-2 space-y-4">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Daftar Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.image_url ? (
                        <Image
                          src={getImageUrl(item.product.image_url, 'thumbnail') || '/placeholder-food.jpg'}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          loading="lazy"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        Subtotal: Rp {item.subtotal.toLocaleString('id-ID')}
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
              <p className="text-sm">{order.delivery_address}</p>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Catatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary & Store Info */}
        <div className="space-y-4">
          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>Rp {order.total_price.toLocaleString('id-ID')}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Ongkir</span>
                  <span>Rp {order.delivery_fee.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">Rp {order.final_total.toLocaleString('id-ID')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Metode Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{getPaymentMethodLabel(order.payment_method)}</p>
              
              {order.payment_method === 'QRIS' && (
                <div className="space-y-3">
                  {order.payment_proof_url ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-600">Bukti Pembayaran Telah Diupload</p>
                      <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={order.payment_proof_url}
                          alt="Bukti pembayaran"
                          fill
                          className="object-contain"
                        />
                      </div>
                      {order.payment_proof_uploaded_at && (
                        <p className="text-xs text-muted-foreground">
                          Diupload: {format(new Date(order.payment_proof_uploaded_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Silakan lakukan pembayaran sesuai nominal yang tertera. Setelah membayar, upload bukti pembayaran di bawah ini.
                        </AlertDescription>
                      </Alert>
                      <PaymentProofUpload
                        orderId={order.id}
                        onUploadSuccess={() => {
                          // Refresh order data
                          const fetchOrder = async () => {
                            const { data } = await supabase
                              .from('orders')
                              .select('payment_proof_url, payment_proof_uploaded_at')
                              .eq('id', order.id)
                              .single();
                            if (data) {
                              setOrder(prev => prev ? { ...prev, ...data } : null);
                            }
                          };
                          fetchOrder();
                        }}
                      />
                    </>
                  )}
                </div>
              )}
              
              {order.payment_method === 'COD' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Pembayaran dilakukan langsung ke kasir atau driver saat pesanan diterima.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Info Toko
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold mb-1">{order.store.name}</p>
                <p className="text-sm text-muted-foreground">{order.store.address}</p>
              </div>
              {order.store.phone && (
                <Button
                  className="w-full"
                  onClick={handleWhatsApp}
                  variant="outline"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Hubungi via WhatsApp
                </Button>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

