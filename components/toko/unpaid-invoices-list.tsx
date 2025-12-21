'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, AlertCircle, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { PayInvoiceButton } from './pay-invoice-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface InvoiceOrder {
  id: string;
  order_id: string;
  order_revenue: number;
  order_fee: number;
  orders?: {
    id: string;
    created_at: string;
    final_total: number;
  };
}

interface Invoice {
  id: string;
  order_id?: string | null;
  total_orders: number;
  total_revenue: number;
  fee_amount: number;
  status: string;
  created_at: string;
  period_start?: string;
  period_end?: string;
  payment_proof_url?: string | null;
  payment_proof_uploaded_at?: string | null;
  store_periods?: {
    id: string;
    start_date: string;
    end_date?: string;
  } | null;
  invoice_orders?: InvoiceOrder[];
  invoice_activity_logs?: Array<{
    id: string;
    action: string;
    description: string;
    created_at: string;
  }>;
}

interface UnpaidInvoicesListProps {
  storeId: string;
  storeName: string;
  orbQrisUrl?: string | null;
}

export function UnpaidInvoicesList({ storeId, storeName, orbQrisUrl }: UnpaidInvoicesListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [storeId]);

  const fetchInvoices = async () => {
    setLoading(true);
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
        console.log('Fetched invoices:', data.invoices);
        console.log('Invoice count:', data.invoices?.length || 0);
        setInvoices(data.invoices || []);
      } else {
        console.error('Error fetching invoices:', data.error);
        console.error('Error details:', data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    fetchInvoices();
    setSelectedInvoice(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat invoice...</p>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Tidak ada tagihan aktif saat ini</p>
          <p className="text-sm text-muted-foreground mb-4">
            Semua invoice Anda sudah dibayar atau belum ada tagihan yang perlu dibayar.
          </p>
          <Button
            variant="outline"
            onClick={fetchInvoices}
            className="mt-2"
          >
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => {
        const periodStart = invoice.period_start || invoice.store_periods?.start_date;
        const periodEnd = invoice.period_end || invoice.store_periods?.end_date;
        const daysSinceCreated = Math.floor(
          (new Date().getTime() - new Date(invoice.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                  </CardTitle>
                  <CardDescription>
                    {periodStart && periodEnd
                      ? `Periode: ${format(new Date(periodStart), 'dd MMM yyyy', { locale: id })} - ${format(new Date(periodEnd), 'dd MMM yyyy', { locale: id })}`
                      : `Dibuat: ${format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: id })}`}
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {invoice.total_orders} pesanan
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fee ORBfood (5%)</p>
                    <p className="text-lg font-semibold text-primary">
                      Rp {invoice.fee_amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* List of orders in this invoice */}
                {invoice.invoice_orders && invoice.invoice_orders.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Daftar Pesanan:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {invoice.invoice_orders.map((io) => (
                        <div key={io.id} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            #{io.orders?.id.slice(0, 8) || io.order_id.slice(0, 8)}
                            {io.orders?.created_at && (
                              <span className="ml-2">
                                {format(new Date(io.orders.created_at), 'dd MMM', { locale: id })}
                              </span>
                            )}
                          </span>
                          <span>Rp {io.order_revenue.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {daysSinceCreated > 7 && (
                  <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      Invoice ini sudah {daysSinceCreated} hari belum dibayar. Disarankan melakukan
                      pembayaran agar tagihan tidak menumpuk.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Detail Invoice
                  </Button>
                  <PayInvoiceButton
                    invoiceId={invoice.id}
                    amount={invoice.fee_amount}
                    orbQrisUrl={orbQrisUrl}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Detail Invoice Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Invoice</DialogTitle>
            <DialogDescription>
              Invoice #{selectedInvoice?.id.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
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

              {/* List of Orders */}
              {selectedInvoice.invoice_orders && selectedInvoice.invoice_orders.length > 0 && (
                <>
                  <div>
                    <h4 className="font-semibold mb-2">Daftar Pesanan ({selectedInvoice.total_orders})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedInvoice.invoice_orders.map((io) => (
                        <div key={io.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                          <div>
                            <span className="font-medium">
                              #{io.orders?.id.slice(0, 8) || io.order_id.slice(0, 8)}
                            </span>
                            {io.orders?.created_at && (
                              <span className="text-muted-foreground ml-2">
                                {format(new Date(io.orders.created_at), 'dd MMM yyyy', { locale: id })}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">Rp {io.order_revenue.toLocaleString('id-ID')}</div>
                            <div className="text-xs text-muted-foreground">
                              Fee: Rp {io.order_fee.toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

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

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Aktivitas</h4>
                <div className="space-y-2">
                  {selectedInvoice.invoice_activity_logs && selectedInvoice.invoice_activity_logs.length > 0 ? (
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
                <PayInvoiceButton
                  invoiceId={selectedInvoice.id}
                  amount={selectedInvoice.fee_amount}
                  orbQrisUrl={orbQrisUrl}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

