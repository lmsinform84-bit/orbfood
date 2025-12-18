import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { PaidInvoicesHistory } from '@/components/toko/paid-invoices-history';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

async function getStore(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching store:', error);
    return null;
  }

  return data;
}

export default async function InvoiceHistoryPage() {
  const user = await requireAuth();
  const store = await getStore(user.id);

  if (!store) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Profil toko tidak ditemukan. Silakan buat profil toko terlebih dahulu di halaman Pengaturan.
            </p>
            <a href="/toko/settings" className="text-primary hover:underline">
              Buka Pengaturan Toko
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">History Pelunasan</h1>
        </div>
        <p className="text-muted-foreground">
          Daftar invoice yang sudah dibayar dan diverifikasi
        </p>
      </div>

      <PaidInvoicesHistory storeId={store.id} />
    </div>
  );
}

