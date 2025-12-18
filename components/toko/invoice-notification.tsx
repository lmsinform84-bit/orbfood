'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface InvoiceNotificationProps {
  storeId: string;
}

export function InvoiceNotification({ storeId }: InvoiceNotificationProps) {
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnpaidInvoices();
  }, [storeId]);

  const fetchUnpaidInvoices = async () => {
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
        const invoices = data.invoices || [];
        // Filter invoices that are > 7 days old
        const oldInvoices = invoices.filter((invoice: any) => {
          const daysSinceCreated = Math.floor(
            (new Date().getTime() - new Date(invoice.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return daysSinceCreated > 7;
        });
        setUnpaidInvoices(oldInvoices);
      }
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || unpaidInvoices.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardContent className="pt-6">
        <Alert className="border-yellow-500 bg-transparent">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <p className="font-semibold mb-1">
              Ada {unpaidInvoices.length} invoice yang sudah lebih dari 7 hari belum dibayar.
            </p>
            <p className="text-sm">
              Invoice ORBfood sudah 7 hari belum dibayar. Disarankan melakukan pembayaran agar
              tagihan tidak menumpuk.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

