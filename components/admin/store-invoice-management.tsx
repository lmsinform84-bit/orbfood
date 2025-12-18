'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, CheckCircle2, Eye, AlertCircle, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase/client';

interface Invoice {
  id: string;
  order_id: string;
  total_revenue: number;
  fee_amount: number;
  status: string;
  created_at: string;
  verified_at?: string;
  period_start?: string;
  period_end?: string;
  payment_proof_url?: string | null;
  payment_proof_uploaded_at?: string | null;
  payment_proof_rejected?: boolean;
  payment_proof_rejection_reason?: string | null;
  store_periods?: {
    id: string;
    start_date: string;
    end_date?: string;
  } | null;
  invoice_activity_logs?: Array<{
    id: string;
    action: string;
    description: string;
    created_at: string;
  }>;
}

interface StoreInvoiceManagementProps {
  storeId: string;
  storeName: string;
}

export function StoreInvoiceManagement({ storeId, storeName }: StoreInvoiceManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [paidInvoices, setPaidInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [paidPage, setPaidPage] = useState(1);
  const [paidTotalPages, setPaidTotalPages] = useState(1);
  const [paidTotal, setPaidTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchUnpaidInvoices();
    fetchPaidInvoices();
  }, [storeId, paidPage]);

  const fetchUnpaidInvoices = async () => {
    try {
      // First, try to generate invoices for completed orders
      try {
        await fetch('/api/invoices/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storeId }),
        });
      } catch (genError) {
        console.log('Note: Could not generate invoices (may already exist)');
      }

      // Then fetch invoices
      const response = await fetch(
        `/api/invoices/list?store_id=${storeId}&status=menunggu_pembayaran`
      );
      const data = await response.json();
      if (response.ok) {
        console.log('Fetched unpaid invoices:', data.invoices);
        setUnpaidInvoices(data.invoices || []);
      } else {
        console.error('Error fetching unpaid invoices:', data.error);
      }
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
    }
  };

  const fetchPaidInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/invoices/list?store_id=${storeId}&status=lunas&page=${paidPage}&limit=${limit}`
      );
      const data = await response.json();
      if (response.ok) {
        setPaidInvoices(data.invoices || []);
        setPaidTotalPages(data.pagination?.totalPages || 1);
        setPaidTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching paid invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (!confirm('Apakah Anda yakin ingin menandai invoice ini sebagai LUNAS?')) {
      return;
    }

    setVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'Anda harus login untuk melakukan aksi ini',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/invoices/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          action: 'confirm',
          adminId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify invoice');
      }

      toast({
        title: 'Berhasil',
        description: 'Invoice telah ditandai sebagai LUNAS',
      });

      // Refresh invoices
      fetchUnpaidInvoices();
      fetchPaidInvoices();
      setSelectedInvoice(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menandai invoice sebagai LUNAS',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const getPeriodText = (invoice: Invoice) => {
    // Prioritize period_start and period_end from invoice, fallback to store_periods
    const periodStart = invoice.period_start || invoice.store_periods?.start_date;
    const periodEnd = invoice.period_end || invoice.store_periods?.end_date;
    if (periodStart && periodEnd) {
      return `${format(new Date(periodStart), 'dd MMM yyyy', { locale: id })} - ${format(new Date(periodEnd), 'dd MMM yyyy', { locale: id })}`;
    }
    if (periodStart) {
      return format(new Date(periodStart), 'dd MMM yyyy', { locale: id });
    }
    return format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: id });
  };

  return (
    <Tabs defaultValue="unpaid" className="w-full">
      <TabsList>
        <TabsTrigger value="unpaid">Tagihan Aktif</TabsTrigger>
        <TabsTrigger value="paid">History Pelunasan</TabsTrigger>
      </TabsList>

      {/* Tab Tagihan Aktif */}
      <TabsContent value="unpaid" className="space-y-4">
        {unpaidInvoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Tidak ada tagihan aktif</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {unpaidInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        {getPeriodText(invoice)}
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">Belum Dibayar</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-lg font-semibold">
                          Rp {invoice.total_revenue.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fee ORBfood (5%)</p>
                        <p className="text-lg font-semibold text-primary">
                          Rp {invoice.fee_amount.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat Detail
                      </Button>
                      <Button
                        onClick={() => handleMarkAsPaid(invoice)}
                        disabled={verifying}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Tandai LUNAS
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tab History Pelunasan */}
      <TabsContent value="paid" className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Memuat history pelunasan...</p>
            </CardContent>
          </Card>
        ) : paidInvoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Belum ada history pelunasan</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Total Fee</TableHead>
                    <TableHead>Tanggal Lunas</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        #{invoice.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>{getPeriodText(invoice)}</TableCell>
                      <TableCell>
                        Rp {invoice.fee_amount.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        {invoice.verified_at
                          ? format(new Date(invoice.verified_at), 'dd MMM yyyy', { locale: id })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Lunas</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {paidTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {((paidPage - 1) * limit) + 1} - {Math.min(paidPage * limit, paidTotal)} dari {paidTotal} invoice
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaidPage((p) => Math.max(1, p - 1))}
                    disabled={paidPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaidPage((p) => Math.min(paidTotalPages, p + 1))}
                    disabled={paidPage === paidTotalPages}
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </TabsContent>

      {/* Dialog Detail Invoice */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Invoice</DialogTitle>
              <DialogDescription>
                Invoice #{selectedInvoice.id.slice(0, 8).toUpperCase()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="destructive">Belum Dibayar</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Dibuat</p>
                  <p className="font-medium">
                    {format(new Date(selectedInvoice.created_at), 'dd MMM yyyy HH:mm', {
                      locale: id,
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Informasi Periode</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Periode Mulai</p>
                      <p className="font-medium">
                        {selectedInvoice.period_start
                          ? format(new Date(selectedInvoice.period_start), 'dd MMM yyyy', { locale: id })
                          : selectedInvoice.store_periods?.start_date
                          ? format(new Date(selectedInvoice.store_periods.start_date), 'dd MMM yyyy', { locale: id })
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Periode Berakhir</p>
                      <p className="font-medium">
                        {selectedInvoice.period_end
                          ? format(new Date(selectedInvoice.period_end), 'dd MMM yyyy', { locale: id })
                          : selectedInvoice.store_periods?.end_date
                          ? format(new Date(selectedInvoice.store_periods.end_date), 'dd MMM yyyy', { locale: id })
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Durasi Tagihan</p>
                    {(() => {
                      const daysSinceCreated = Math.floor(
                        (new Date().getTime() - new Date(selectedInvoice.created_at).getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
                      let badgeText = `${daysSinceCreated} hari`;
                      
                      if (daysSinceCreated <= 1) {
                        badgeVariant = 'default';
                        badgeText = '1 hari';
                      } else if (daysSinceCreated <= 7) {
                        badgeVariant = 'secondary';
                        badgeText = `${daysSinceCreated} hari`;
                      } else if (daysSinceCreated <= 30) {
                        badgeVariant = 'outline';
                        badgeText = `${daysSinceCreated} hari`;
                      } else {
                        badgeVariant = 'destructive';
                        badgeText = `${daysSinceCreated} hari (Melebihi 30 hari)`;
                      }
                      
                      return (
                        <div className="flex items-center gap-2">
                          <Badge variant={badgeVariant}>{badgeText}</Badge>
                          {daysSinceCreated > 7 && (
                            <span className="text-xs text-muted-foreground">
                              (Disarankan segera melakukan pembayaran)
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Ringkasan Keuangan</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Revenue:</span>
                    <span className="font-medium">
                      Rp {selectedInvoice.total_revenue.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee ORBfood (5%):</span>
                    <span className="font-medium text-primary">
                      Rp {selectedInvoice.fee_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {selectedInvoice.payment_proof_url && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Bukti Pembayaran</h4>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Bukti Pembayaran</span>
                        {selectedInvoice.payment_proof_rejected && (
                          <Badge variant="destructive">Ditolak</Badge>
                        )}
                      </div>
                      {selectedInvoice.payment_proof_url && (
                        <div className="mt-2">
                          <img
                            src={selectedInvoice.payment_proof_url}
                            alt="Bukti Pembayaran"
                            className="max-w-full h-auto rounded border"
                          />
                        </div>
                      )}
                      {selectedInvoice.payment_proof_uploaded_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Upload: {format(new Date(selectedInvoice.payment_proof_uploaded_at), 'dd MMM yyyy HH:mm', {
                            locale: id,
                          })}
                        </p>
                      )}
                      {selectedInvoice.payment_proof_rejection_reason && (
                        <Alert className="mt-2" variant="destructive">
                          <AlertDescription>
                            Alasan penolakan: {selectedInvoice.payment_proof_rejection_reason}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Aktivitas</h4>
                <div className="space-y-2">
                  {selectedInvoice.invoice_activity_logs &&
                  selectedInvoice.invoice_activity_logs.length > 0 ? (
                    selectedInvoice.invoice_activity_logs.map((log) => (
                      <div key={log.id} className="text-sm">
                        <p className="font-medium">{log.description}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Invoice dibuat pada{' '}
                      {format(new Date(selectedInvoice.created_at), 'dd MMM yyyy HH:mm', {
                        locale: id,
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                  Tutup
                </Button>
                <Button
                  onClick={() => handleMarkAsPaid(selectedInvoice)}
                  disabled={verifying}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Tandai LUNAS
                </Button>
              </div>
            </div>
        </DialogContent>
      </Dialog>
      )}
    </Tabs>
  );
}

