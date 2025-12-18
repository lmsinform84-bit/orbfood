'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store, User, MapPin, Calendar, TrendingUp, DollarSign, ShoppingBag, FileText, Settings, Receipt, Ban, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { UpdateStoreStatusButton } from './update-store-status-button';
import { PaymentVerification } from './payment-verification';
import { StoreInvoiceManagement } from './store-invoice-management';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';

interface Store {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  status: string;
  is_open?: boolean;
  created_at: string;
  qris_url?: string | null;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  area?: {
    id: string;
    name: string;
  } | null;
}

interface StoreStats {
  todayOrders: number;
  monthOrders: number;
  todayRevenue: number;
  monthRevenue: number;
  totalFee: number;
  allTimeOrders: number;
}

interface Order {
  id: string;
  final_total: number;
  total_price: number;
  delivery_fee: number;
  status: string;
  payment_method: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
  };
  items?: Array<{
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    product: {
      id: string;
      name: string;
    };
  }>;
}

interface StoreDetailClientProps {
  store: Store;
  stats: StoreStats;
  orders: Order[];
  completedOrders: Order[];
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500">Aktif</Badge>;
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'suspended':
      return <Badge variant="destructive">Suspended</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const ORB_FEE_PERCENTAGE = 0.05;

interface AdminNote {
  id: string;
  note: string;
  created_at: string;
  created_by?: string;
}

export function StoreDetailClient({
  store,
  stats,
  orders,
  completedOrders,
}: StoreDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [adminNote, setAdminNote] = useState('');
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch admin notes
  useEffect(() => {
    const fetchAdminNotes = async () => {
      setLoadingNotes(true);
      try {
        const response = await fetch(`/api/admin/stores/${store.id}/notes`);
        if (response.ok) {
          const data = await response.json();
          setAdminNotes(data.notes || []);
        }
      } catch (error) {
        console.error('Error fetching admin notes:', error);
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchAdminNotes();
  }, [store.id]);

  // Calculate COD vs QRIS
  const codCount = orders.filter(o => o.payment_method === 'cod').length;
  const qrisCount = orders.filter(o => o.payment_method === 'qris').length;
  const cancelCount = orders.filter(o => o.status === 'dibatalkan').length;
  const cancelRate = orders.length > 0 ? (cancelCount / orders.length) * 100 : 0;

  // State for active period data
  const [activePeriodData, setActivePeriodData] = useState<{
    estimatedRevenue: number;
    estimatedFee: number;
    orderCount: number;
    periodStart: string | null;
    periodEnd: string | null;
  } | null>(null);

  // Fetch active period data
  useEffect(() => {
    const fetchActivePeriod = async () => {
      try {
        const response = await fetch(`/api/stores/estimate-fee?store_id=${store.id}`);
        if (response.ok) {
          const data = await response.json();
          setActivePeriodData(data);
        }
      } catch (error) {
        console.error('Error fetching active period:', error);
      }
    };
    fetchActivePeriod();
  }, [store.id]);

  // Calculate active period from unpaid orders (orders without invoices)
  // Filter completed orders that don't have invoices yet
  const activePeriodOrders = useMemo(() => {
    // This will be calculated properly when we have invoice data
    // For now, use all completed orders as fallback
    return completedOrders;
  }, [completedOrders]);

  // Use API data if available, otherwise calculate from completed orders
  const activePeriodRevenue = activePeriodData?.estimatedRevenue || 
    activePeriodOrders.reduce((sum, o) => sum + (o.final_total || 0), 0);
  const activePeriodFee = activePeriodData?.estimatedFee || (activePeriodRevenue * ORB_FEE_PERCENTAGE);
  const activePeriodOrderCount = activePeriodData?.orderCount || activePeriodOrders.length;
  
  // Get the earliest order date for active period start date
  const activePeriodStartDate = activePeriodData?.periodStart 
    ? new Date(activePeriodData.periodStart)
    : activePeriodOrders.length > 0
    ? new Date(Math.min(...activePeriodOrders.map(o => new Date(o.created_at).getTime())))
    : null;

  // Get orders with payment proof (closed periods/invoices)
  // This would ideally come from a separate invoices table, but for now we'll use PaymentVerification logic

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b pb-4 pt-4 -mt-6 -mx-6 px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/stores')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{store.name}</h1>
                {getStatusBadge(store.status)}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Pemilik: {store.user?.full_name || 'N/A'}</span>
                </div>
                {store.area && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>Wilayah: {store.area.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Gabung: {format(new Date(store.created_at), 'dd MMM yyyy', { locale: id })}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UpdateStoreStatusButton storeId={store.id} currentStatus={store.status as any} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ringkasan" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ringkasan" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Ringkasan</span>
          </TabsTrigger>
          <TabsTrigger value="operasional" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Operasional</span>
          </TabsTrigger>
          <TabsTrigger value="pesanan" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Pesanan</span>
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Invoice</span>
          </TabsTrigger>
          <TabsTrigger value="dokumen" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Dokumen</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Ringkasan */}
        <TabsContent value="ringkasan" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Order (All-time)</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.allTimeOrders || orders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Order Periode Aktif</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activePeriodOrderCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimasi Omzet Periode Aktif</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rp {activePeriodRevenue.toLocaleString('id-ID')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimasi Fee ORB (5%)</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rp {activePeriodFee.toLocaleString('id-ID')}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Toko</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>Alamat:</strong> {store.address}</div>
              {store.area && <div><strong>Wilayah:</strong> {store.area.name}</div>}
              {store.phone && <div><strong>Telepon:</strong> {store.phone}</div>}
              {store.email && <div><strong>Email:</strong> {store.email}</div>}
              {store.description && <div><strong>Deskripsi:</strong> {store.description}</div>}
              <div>
                <strong>Status Buka:</strong>{' '}
                {store.is_open ? (
                  <Badge className="bg-green-500">Buka</Badge>
                ) : (
                  <Badge variant="secondary">Tutup</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Operasional */}
        <TabsContent value="operasional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status Operasional</CardTitle>
              <CardDescription>Kontrol dan status harian toko</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div>
                  <strong>Status Akun Toko:</strong>
                  <div className="mt-1">{getStatusBadge(store.status)}</div>
                </div>
                <div>
                  <strong>Status Buka/Tutup:</strong>
                  <div className="mt-1">
                    {store.is_open ? (
                      <Badge className="bg-green-500">Buka</Badge>
                    ) : (
                      <Badge variant="secondary">Tutup</Badge>
                    )}
                  </div>
                </div>
                {store.status === 'suspended' && (
                  <div>
                    <strong>Alasan Suspend:</strong>
                    <p className="text-sm text-muted-foreground mt-1">
                      (Belum ada alasan yang dicatat)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catatan Admin (Internal)</CardTitle>
              <CardDescription>Log teks untuk catatan internal admin (append-only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-note">Tambah Catatan</Label>
                <Textarea
                  id="admin-note"
                  placeholder="Contoh: Toko telat bayar fee periode 2, Pernah ada laporan COD bermasalah..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={4}
                  disabled={savingNote}
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!adminNote.trim()) {
                      toast({
                        title: 'Catatan kosong',
                        description: 'Silakan isi catatan terlebih dahulu',
                        variant: 'destructive',
                      });
                      return;
                    }

                    setSavingNote(true);
                    try {
                      const response = await fetch(`/api/admin/stores/${store.id}/notes`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ note: adminNote }),
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.error || 'Gagal menyimpan catatan');
                      }

                      toast({
                        title: 'Catatan tersimpan',
                        description: 'Catatan admin berhasil ditambahkan',
                      });

                      // Add new note to list
                      setAdminNotes(prev => [...prev, data.note]);
                      setAdminNote('');
                    } catch (error: any) {
                      toast({
                        title: 'Gagal menyimpan',
                        description: error.message || 'Terjadi kesalahan saat menyimpan catatan',
                        variant: 'destructive',
                      });
                    } finally {
                      setSavingNote(false);
                    }
                  }}
                  disabled={savingNote || !adminNote.trim()}
                >
                  {savingNote ? 'Menyimpan...' : 'Simpan Catatan'}
                </Button>
              </div>

              {/* List of Admin Notes */}
              <div className="space-y-3 mt-6">
                <div className="text-sm font-semibold">Daftar Catatan</div>
                {loadingNotes ? (
                  <p className="text-sm text-muted-foreground">Memuat catatan...</p>
                ) : adminNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada catatan admin untuk toko ini.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {adminNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 border rounded-lg bg-muted/30 space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm flex-1">{note.note}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(note.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </span>
                          {note.created_by && (
                            <>
                              <span>•</span>
                              <span>{note.created_by}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rekap Keuangan</CardTitle>
              <CardDescription>Ringkasan keuangan toko</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Estimasi Fee Periode Aktif</div>
                  <div className="text-2xl font-bold text-primary">
                    Rp {activePeriodFee.toLocaleString('id-ID')}
                  </div>
                  {activePeriodData && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {activePeriodOrderCount} pesanan • Belum dibayar
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Estimasi Omzet Periode Aktif</div>
                  <div className="text-2xl font-bold">
                    Rp {activePeriodRevenue.toLocaleString('id-ID')}
                  </div>
                  {activePeriodData && activePeriodData.periodStart && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Periode: {format(new Date(activePeriodData.periodStart), 'dd MMM yyyy', { locale: id })}
                      {activePeriodData.periodEnd && ` - ${format(new Date(activePeriodData.periodEnd), 'dd MMM yyyy', { locale: id })}`}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Order Bulan Ini</div>
                  <div className="text-xl font-semibold">{stats.monthOrders}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Order Hari Ini</div>
                  <div className="text-xl font-semibold">{stats.todayOrders}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pesanan */}
        <TabsContent value="pesanan" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">COD vs QRIS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div>COD: {codCount} ({orders.length > 0 ? ((codCount / orders.length) * 100).toFixed(1) : 0}%)</div>
                  <div>QRIS: {qrisCount} ({orders.length > 0 ? ((qrisCount / orders.length) * 100).toFixed(1) : 0}%)</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cancel Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cancelRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Pesanan</CardTitle>
              <CardDescription>Monitoring pesanan toko</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">Belum ada pesanan</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 20).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {order.user?.full_name || 'Pelanggan'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.payment_method === 'cod' ? 'COD' : 'QRIS'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          Rp {order.final_total.toLocaleString('id-ID')}
                        </p>
                        <Badge variant="outline" className="mt-1">{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Detail Dialog */}
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detail Pesanan</DialogTitle>
                <DialogDescription>
                  {selectedOrder && format(new Date(selectedOrder.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-4">
                  <div>
                    <strong>Pelanggan:</strong> {selectedOrder.user?.full_name || 'N/A'}
                  </div>
                  <div>
                    <strong>Metode Pembayaran:</strong> {selectedOrder.payment_method === 'cod' ? 'COD' : 'QRIS'}
                  </div>
                  <div>
                    <strong>Status:</strong> <Badge>{selectedOrder.status}</Badge>
                  </div>
                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div>
                      <strong>Items:</strong>
                      <div className="mt-2 space-y-1">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.product?.name || 'Produk'} x {item.quantity}
                            </span>
                            <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rp {selectedOrder.total_price.toLocaleString('id-ID')}</span>
                    </div>
                    {selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span>Ongkir:</span>
                        <span>Rp {selectedOrder.delivery_fee.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg mt-2">
                      <span>Total:</span>
                      <span>Rp {selectedOrder.final_total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab Invoice */}
        <TabsContent value="invoice" className="space-y-4">
          <StoreInvoiceManagement storeId={store.id} storeName={store.name} />
        </TabsContent>

        {/* Tab Dokumen */}
        <TabsContent value="dokumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QRIS Toko</CardTitle>
              <CardDescription>QRIS milik toko untuk menerima pembayaran</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {store.qris_url ? (
                <div className="space-y-2">
                  <div className="relative w-48 h-48 border rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={store.qris_url}
                      alt="QRIS Toko"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <Badge className="bg-green-500">Tersedia</Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <Badge variant="secondary">Belum diupload</Badge>
                  <p className="text-sm text-muted-foreground">
                    Toko belum mengupload QRIS untuk menerima pembayaran.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dokumen Tambahan</CardTitle>
              <CardDescription>Dokumen administratif toko</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <strong>Foto Banner:</strong>
                  <p className="text-sm text-muted-foreground mt-1">Belum ada</p>
                </div>
                <div>
                  <strong>Surat Usaha:</strong>
                  <p className="text-sm text-muted-foreground mt-1">Belum ada (future-ready)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
