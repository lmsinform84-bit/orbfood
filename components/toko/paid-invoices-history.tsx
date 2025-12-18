'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

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
  store_periods?: {
    id: string;
    start_date: string;
    end_date?: string;
  } | null;
}

interface PaidInvoicesHistoryProps {
  storeId: string;
}

export function PaidInvoicesHistory({ storeId }: PaidInvoicesHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchInvoices();
  }, [storeId, page]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/invoices/list?store_id=${storeId}&status=lunas&page=${page}&limit=${limit}`
      );
      const data = await response.json();
      if (response.ok) {
        setInvoices(data.invoices || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      } else {
        console.error('Error fetching invoices:', data.error);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat history pelunasan...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          History Pelunasan
        </CardTitle>
        <CardDescription>
          Daftar invoice yang sudah dibayar dan diverifikasi
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada history pelunasan</p>
          </div>
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
                  {invoices.map((invoice) => (
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} dari {total} invoice
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

