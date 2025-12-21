'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Eye, AlertCircle, Image as ImageIcon, Receipt, Clock, FileText, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getImageUrl } from '@/lib/utils/image';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface PaymentProof {
  fileName: string;
  url: string;
  uploadedAt: string;
  rejected?: boolean;
  storeNote?: string;
}

interface Order {
  id: string;
  final_total: number;
  created_at: string;
  status: string;
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

interface Store {
  id: string;
  name: string;
}

interface PaymentVerificationProps {
  orders: Order[];
  storeId: string;
  storeName?: string;
}

const ORB_FEE_PERCENTAGE = 0.05;

type InvoiceStatus = 'menunggu_pembayaran' | 'menunggu_verifikasi' | 'lunas';

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  description: string;
}

export function PaymentVerification({ orders, storeId, storeName }: PaymentVerificationProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [paymentProofs, setPaymentProofs] = useState<Record<string, PaymentProof>>({});
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<{
    order: Order;
    proof?: PaymentProof;
    fee: number;
    status: InvoiceStatus;
    invoiceDate: Date;
    periodStart: Date;
    periodEnd: Date;
  } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [invoiceStatuses, setInvoiceStatuses] = useState<Record<string, InvoiceStatus>>({});

  const fetchInvoices = async () => {
    setLoading(true);
    const proofs: Record<string, PaymentProof> = {};
    const statuses: Record<string, InvoiceStatus> = {};

    // For each order, get invoice from database
    for (const order of orders) {
      try {
        // Get invoice from database
        const response = await fetch(`/api/invoices/${order.id}`);
        if (response.ok) {
          const data = await response.json();
          const invoice = data.invoice;
          
          // Get status from database
          statuses[order.id] = invoice.status as InvoiceStatus;
          
          // If invoice has payment proof URL, use it
          if (invoice.payment_proof_url) {
            proofs[order.id] = {
              fileName: invoice.payment_proof_url.split('/').pop() || 'proof',
              url: invoice.payment_proof_url,
              uploadedAt: invoice.payment_proof_uploaded_at || new Date().toISOString(),
              rejected: invoice.payment_proof_rejected || false,
            };
          }
        } else {
          // Invoice doesn't exist yet, default to menunggu_pembayaran
          statuses[order.id] = 'menunggu_pembayaran';
        }

        // Also check storage for any uploaded files (fallback)
        const { data: files, error } = await supabase.storage
          .from('store-uploads')
          .list('invoice-payments', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (!error && files) {
          const orderFiles = files.filter(file => file.name.startsWith(order.id));
          
          if (orderFiles.length > 0 && !proofs[order.id]) {
            // Only use storage if database doesn't have proof
            const latestFile = orderFiles[0];
            const { data: urlData } = supabase.storage
              .from('store-uploads')
              .getPublicUrl(`invoice-payments/${latestFile.name}`);

            proofs[order.id] = {
              fileName: latestFile.name,
              url: urlData.publicUrl,
              uploadedAt: latestFile.created_at || latestFile.updated_at || new Date().toISOString(),
            };
          }
        }
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        statuses[order.id] = 'menunggu_pembayaran';
      }
    }

    setPaymentProofs(proofs);
    setInvoiceStatuses(statuses);
    setLoading(false);
  };

  useEffect(() => {
    if (orders.length > 0) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [orders]);

  // Generate activity logs for an invoice
  const generateActivityLogs = (order: Order, hasProof: boolean, status: InvoiceStatus): ActivityLog[] => {
    const logs: ActivityLog[] = [];
    const orderDate = new Date(order.created_at);
    
    // Invoice dibuat
    logs.push({
      id: '1',
      action: 'invoice_created',
      timestamp: order.created_at,
      description: `Invoice dibuat pada ${format(orderDate, 'dd MMMM yyyy, HH:mm', { locale: id })}`,
    });

    // Jika ada bukti pembayaran
    if (hasProof && paymentProofs[order.id]) {
      const proof = paymentProofs[order.id];
      const uploadDate = new Date(proof.uploadedAt);
      logs.push({
        id: '2',
        action: 'proof_uploaded',
        timestamp: proof.uploadedAt,
        description: `Bukti pembayaran diupload pada ${format(uploadDate, 'dd MMMM yyyy, HH:mm', { locale: id })}`,
      });

      if (proof.rejected) {
        logs.push({
          id: '3',
          action: 'proof_rejected',
          timestamp: proof.uploadedAt,
          description: `Bukti pembayaran ditolak. Silakan upload ulang.`,
        });
      }
    }

    // Jika sudah lunas
    if (status === 'lunas') {
      logs.push({
        id: '4',
        action: 'invoice_paid',
        timestamp: new Date().toISOString(),
        description: `Invoice dilunasi. Periode ditutup dan periode baru dimulai.`,
      });
    }

    return logs;
  };

  const getFeeAmount = (orderTotal: number) => {
    return orderTotal * ORB_FEE_PERCENTAGE;
  };

  const getInvoiceStatus = (order: Order): InvoiceStatus => {
    // Use status from database if available
    return invoiceStatuses[order.id] || 'menunggu_pembayaran';
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'menunggu_pembayaran':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">🟡 Menunggu Pembayaran</Badge>;
      case 'menunggu_verifikasi':
        return <Badge className="bg-blue-500">🔵 Menunggu Verifikasi</Badge>;
      case 'lunas':
        return <Badge className="bg-green-500">🟢 Lunas</Badge>;
    }
  };

  const ordersWithProofs = orders.map(order => {
    return {
      ...order,
      fee: getFeeAmount(order.final_total),
      proof: paymentProofs[order.id],
      status: getInvoiceStatus(order),
    };
  });

  const unpaidOrders = ordersWithProofs.filter(o => o.status === 'menunggu_pembayaran');
  const pendingVerification = ordersWithProofs.filter(o => o.status === 'menunggu_verifikasi');
  const paidOrders = ordersWithProofs.filter(o => o.status === 'lunas');

  const handleOpenInvoice = (order: any) => {
    const orderDate = new Date(order.created_at);
    const periodStart = orderDate; // For now, use order date as period start
    const periodEnd = new Date(); // Invoice created date (now)
    
    const logs = generateActivityLogs(order, !!order.proof, order.status);
    setActivityLogs(logs);
    
    setSelectedInvoice({
      order,
      proof: order.proof,
      fee: order.fee,
      status: order.status,
      invoiceDate: periodEnd,
      periodStart,
      periodEnd,
    });
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    
    setVerifying(true);
    try {
      // Get or create invoice for this order
      const orderId = selectedInvoice.order.id;
      
      // First, get invoice (or create if doesn't exist)
      const invoiceResponse = await fetch(`/api/invoices/${orderId}`);
      const invoiceData = await invoiceResponse.json();
      
      if (!invoiceResponse.ok) {
        throw new Error(invoiceData.error || 'Failed to get invoice');
      }
      
      const invoiceId = invoiceData.invoice.id;
      
      const response = await fetch('/api/invoices/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          action: 'confirm',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm payment');
      }
      
      toast({
        title: 'Pembayaran Dikonfirmasi',
        description: 'Invoice ditandai LUNAS. Periode ditutup dan periode baru dimulai.',
      });
      
      // Fetch updated invoice data from server to get latest status
      try {
        const updatedInvoiceResponse = await fetch(`/api/invoices/${orderId}`);
        if (updatedInvoiceResponse.ok) {
          const updatedData = await updatedInvoiceResponse.json();
          const updatedInvoice = updatedData.invoice;
          
          // Update status in local state with data from server
          setInvoiceStatuses(prev => ({
            ...prev,
            [selectedInvoice.order.id]: updatedInvoice.status as InvoiceStatus,
          }));
          
          // Update selected invoice status
          setSelectedInvoice({
            ...selectedInvoice,
            status: updatedInvoice.status as InvoiceStatus,
          });
          
          // Update activity logs with latest data
          const updatedLogs = generateActivityLogs(
            selectedInvoice.order,
            !!selectedInvoice.proof,
            updatedInvoice.status as InvoiceStatus
          );
          setActivityLogs(updatedLogs);
        }
      } catch (fetchError) {
        console.error('Error fetching updated invoice:', fetchError);
        // Fallback: update local state anyway
        setInvoiceStatuses(prev => ({
          ...prev,
          [selectedInvoice.order.id]: 'lunas',
        }));
        setSelectedInvoice({
          ...selectedInvoice,
          status: 'lunas',
        });
      }
      
      // Refresh all invoice data from server to update badges
      await fetchInvoices();
      
      // Refresh router to get updated data
      router.refresh();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan saat mengonfirmasi pembayaran',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectProof = async () => {
    if (!selectedInvoice || !selectedInvoice.proof) return;
    
    setRejecting(true);
    try {
      // Get or create invoice for this order
      const orderId = selectedInvoice.order.id;
      
      // First, get invoice (or create if doesn't exist)
      const invoiceResponse = await fetch(`/api/invoices/${orderId}`);
      const invoiceData = await invoiceResponse.json();
      
      if (!invoiceResponse.ok) {
        throw new Error(invoiceData.error || 'Failed to get invoice');
      }
      
      const invoiceId = invoiceData.invoice.id;
      
      const response = await fetch('/api/invoices/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          action: 'reject',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject proof');
      }
      
      toast({
        title: 'Bukti Pembayaran Ditolak',
        description: 'Status invoice kembali ke Menunggu Pembayaran. Toko akan diberi notifikasi.',
      });
      
      // Update activity log
      setActivityLogs(prev => [...prev, {
        id: Date.now().toString(),
        action: 'proof_rejected',
        timestamp: new Date().toISOString(),
        description: `Bukti pembayaran ditolak oleh admin. Silakan upload ulang.`,
      }]);
      
      // Update status in local state
      setInvoiceStatuses(prev => ({
        ...prev,
        [selectedInvoice.order.id]: 'menunggu_pembayaran',
      }));
      
      // Update proof to rejected
      if (selectedInvoice.proof) {
        selectedInvoice.proof.rejected = true;
      }
      
      // Update status back to menunggu_pembayaran
      setSelectedInvoice({
        ...selectedInvoice,
        status: 'menunggu_pembayaran',
      });
      
      router.refresh();
    } catch (error: any) {
      console.error('Error rejecting proof:', error);
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan saat menolak bukti pembayaran',
        variant: 'destructive',
      });
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat bukti pembayaran...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Verifikasi Pembayaran</CardTitle>
          <CardDescription>
            Verifikasi bukti pembayaran fee dari toko
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Invoice</div>
              <div className="text-2xl font-bold">{orders.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Menunggu Verifikasi</div>
              <div className="text-2xl font-bold text-blue-600">{pendingVerification.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Lunas</div>
              <div className="text-2xl font-bold text-green-600">{paidOrders.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingVerification.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Menunggu Verifikasi</CardTitle>
            <CardDescription>
              {pendingVerification.length} invoice yang sudah diupload bukti pembayaran dan menunggu verifikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingVerification.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleOpenInvoice(order)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono">
                        INV-{order.id.substring(0, 8).toUpperCase()}
                      </Badge>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Periode: {format(new Date(order.created_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                    <div className="text-sm font-medium mt-1">
                      Fee: Rp {order.fee.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInvoice(order);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {paidOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Lunas</CardTitle>
            <CardDescription>
              {paidOrders.length} invoice yang sudah lunas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paidOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 cursor-pointer"
                  onClick={() => handleOpenInvoice(order)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono">
                        INV-{order.id.substring(0, 8).toUpperCase()}
                      </Badge>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Periode: {format(new Date(order.created_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                    <div className="text-sm font-medium mt-1">
                      Fee: Rp {order.fee.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenInvoice(order);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {unpaidOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Belum Dibayar</CardTitle>
            <CardDescription>
              {unpaidOrders.length} invoice yang belum diupload bukti pembayaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unpaidOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleOpenInvoice(order)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono">
                        INV-{order.id.substring(0, 8).toUpperCase()}
                      </Badge>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Periode: {format(new Date(order.created_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                    <div className="text-sm font-medium mt-1">
                      Fee: Rp {order.fee.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenInvoice(order);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Belum ada invoice untuk toko ini</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Detail Invoice - Sesuai peltoko.md */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              {/* 1. Header Invoice */}
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl mb-2">
                      Invoice #{selectedInvoice.order.id.substring(0, 8).toUpperCase()}
                    </DialogTitle>
                    {storeName && (
                      <DialogDescription className="text-base">
                        <User className="h-4 w-4 inline mr-1" />
                        {storeName}
                      </DialogDescription>
                    )}
                  </div>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Periode dan Tanggal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Periode</div>
                    <div className="font-medium">
                      Dari: {format(selectedInvoice.periodStart, 'dd MMMM yyyy', { locale: id })}
                      <br />
                      Sampai: {format(selectedInvoice.periodEnd, 'dd MMMM yyyy', { locale: id })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Tanggal Invoice Dibuat</div>
                    <div className="font-medium">
                      {format(selectedInvoice.invoiceDate, 'dd MMMM yyyy, HH:mm', { locale: id })}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 2. Ringkasan Periode (Read-only) */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Ringkasan Periode</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Jumlah Order</div>
                          <div className="text-2xl font-bold">1</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Total Omzet (Estimasi)</div>
                          <div className="text-2xl font-bold">
                            Rp {selectedInvoice.order.final_total.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Fee ORB (5%)</div>
                          <div className="text-2xl font-bold text-primary">
                            Rp {selectedInvoice.fee.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                      <Alert className="mt-4">
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                          Fee dihitung dari seluruh pesanan selesai dalam periode ini
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* 3. Status Pembayaran (Section Dinamis) */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Status Pembayaran</h3>
                  
                  {/* 🟡 Menunggu Pembayaran */}
                  {selectedInvoice.status === 'menunggu_pembayaran' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Menunggu toko melakukan pembayaran dan mengunggah bukti transfer
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 🔵 Menunggu Verifikasi */}
                  {selectedInvoice.status === 'menunggu_verifikasi' && selectedInvoice.proof && (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Bukti Pembayaran</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="relative w-full h-96 border rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={selectedInvoice.proof.url}
                              alt="Bukti Pembayaran"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              <strong>Tanggal Upload:</strong>{' '}
                              {format(new Date(selectedInvoice.proof.uploadedAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                            </div>
                            <div>
                              <strong>File:</strong> {selectedInvoice.proof.fileName}
                            </div>
                            {selectedInvoice.proof.storeNote && (
                              <div>
                                <strong>Catatan Toko:</strong> {selectedInvoice.proof.storeNote}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleConfirmPayment}
                          disabled={verifying}
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {verifying ? 'Memproses...' : '✔️ Konfirmasi Pembayaran'}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleRejectProof}
                          disabled={rejecting}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {rejecting ? 'Memproses...' : '❌ Tolak Bukti'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 🟢 LUNAS */}
                  {selectedInvoice.status === 'lunas' && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                              Invoice ini sudah lunas. Periode telah ditutup dan periode baru telah dimulai.
                            </AlertDescription>
                          </Alert>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              <strong>Tanggal Pelunasan:</strong>{' '}
                              {format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id })}
                            </div>
                            <div>
                              <strong>Admin yang Mengonfirmasi:</strong> Admin (TODO: Get from database)
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* 4. Log Aktivitas (Audit Trail) */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Log Aktivitas</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {activityLogs.map((log, index) => (
                          <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <Clock className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{log.description}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(log.timestamp), 'dd MMMM yyyy, HH:mm', { locale: id })}
                              </div>
                            </div>
                          </div>
                        ))}
                        {activityLogs.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Belum ada aktivitas
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
