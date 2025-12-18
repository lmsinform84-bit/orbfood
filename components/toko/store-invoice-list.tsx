'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Eye, AlertCircle, Receipt, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
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
import { PayInvoiceButton } from './pay-invoice-button';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';

interface PaymentProof {
  fileName: string;
  url: string;
  uploadedAt: string;
  rejected?: boolean;
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

interface StoreInvoiceListProps {
  orders: Order[];
  storeId: string;
  storeName: string;
  orbQrisUrl?: string | null;
}

const ORB_FEE_PERCENTAGE = 0.05;

type InvoiceStatus = 'menunggu_pembayaran' | 'menunggu_verifikasi' | 'lunas';

export function StoreInvoiceList({ orders, storeId, storeName, orbQrisUrl }: StoreInvoiceListProps) {
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

  const [invoiceStatuses, setInvoiceStatuses] = useState<Record<string, InvoiceStatus>>({});

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      const proofs: Record<string, PaymentProof> = {};
      const statuses: Record<string, InvoiceStatus> = {};

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
          // Default to menunggu_pembayaran on error
          statuses[order.id] = 'menunggu_pembayaran';
        }
      }

      setPaymentProofs(proofs);
      setInvoiceStatuses(statuses);
      setLoading(false);
    };

    if (orders.length > 0) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [orders]);

  const getFeeAmount = (orderTotal: number) => {
    return orderTotal * ORB_FEE_PERCENTAGE;
  };

  const getInvoiceStatus = (order: Order): InvoiceStatus => {
    // Use status from database if available, otherwise default
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
    const periodStart = orderDate;
    const periodEnd = new Date();
    
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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat invoice...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoice</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Verifikasi</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingVerification.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lunas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Invoices */}
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Verification */}
      {pendingVerification.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Menunggu Verifikasi</CardTitle>
            <CardDescription>
              {pendingVerification.length} invoice yang sudah diupload bukti pembayaran dan menunggu verifikasi admin
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paid Invoices */}
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

      {orders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada invoice untuk toko ini</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Detail Invoice - Store View */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl mb-2">
                      Invoice #{selectedInvoice.order.id.substring(0, 8).toUpperCase()}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {storeName}
                    </DialogDescription>
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

                {/* Ringkasan Periode */}
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
                          <div className="text-sm text-muted-foreground mb-1">Total Omzet</div>
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

                {/* Status Pembayaran */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Status Pembayaran</h3>
                  
                  {selectedInvoice.status === 'menunggu_pembayaran' && (
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Menunggu Anda melakukan pembayaran dan mengunggah bukti transfer
                        </AlertDescription>
                      </Alert>
                      <PayInvoiceButton
                        orderId={selectedInvoice.order.id}
                        feeAmount={selectedInvoice.fee}
                        orbQrisUrl={orbQrisUrl}
                        onPaymentSuccess={async () => {
                          // Refresh invoice data from database
                          const response = await fetch(`/api/invoices/${selectedInvoice.order.id}`);
                          if (response.ok) {
                            const data = await response.json();
                            const invoice = data.invoice;
                            
                            // Update status
                            setInvoiceStatuses(prev => ({
                              ...prev,
                              [selectedInvoice.order.id]: invoice.status as InvoiceStatus,
                            }));
                            
                            // Update payment proof if exists
                            if (invoice.payment_proof_url) {
                              setPaymentProofs(prev => ({
                                ...prev,
                                [selectedInvoice.order.id]: {
                                  fileName: invoice.payment_proof_url.split('/').pop() || 'proof',
                                  url: invoice.payment_proof_url,
                                  uploadedAt: invoice.payment_proof_uploaded_at || new Date().toISOString(),
                                  rejected: invoice.payment_proof_rejected || false,
                                },
                              }));
                              
                              // Update selected invoice
                              setSelectedInvoice({
                                ...selectedInvoice,
                                status: invoice.status as InvoiceStatus,
                                proof: {
                                  fileName: invoice.payment_proof_url.split('/').pop() || 'proof',
                                  url: invoice.payment_proof_url,
                                  uploadedAt: invoice.payment_proof_uploaded_at || new Date().toISOString(),
                                  rejected: invoice.payment_proof_rejected || false,
                                },
                              });
                            }
                          }
                        }}
                      />
                    </div>
                  )}

                  {selectedInvoice.status === 'menunggu_verifikasi' && selectedInvoice.proof && (
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
                        </div>
                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            Bukti pembayaran Anda sedang menunggu verifikasi dari admin. Kami akan memproses segera setelah verifikasi.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  )}

                  {selectedInvoice.status === 'lunas' && (
                    <Card>
                      <CardContent className="pt-6">
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            Invoice ini sudah lunas. Periode telah ditutup dan periode baru telah dimulai.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

