import { createAdminClient } from '@/lib/supabase/admin-server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeeMutationList } from '@/components/admin/fee-mutation-list';
import { ORBQRISUpload } from '@/components/admin/orb-qris-upload';
import { QrCode, Receipt } from 'lucide-react';

async function getORBQRIS() {
  const supabase = createAdminClient();
  // Get ORB QRIS from a system store or admin config
  // For now, we'll use a special store ID or admin config
  const { data } = await supabase
    .from('stores')
    .select('orb_qris_url')
    .not('orb_qris_url', 'is', null)
    .limit(1)
    .maybeSingle();

  return data?.orb_qris_url || null;
}

export default async function AdminPaymentPage() {
  const orbQris = await getORBQRIS();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Pembayaran & Fee ORBfood</h1>
        <p className="text-muted-foreground">
          Kelola QRIS ORBfood dan mutasi fee dari toko
        </p>
      </div>

      <Tabs defaultValue="qris-orb" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qris-orb" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QRIS ORBfood
          </TabsTrigger>
          <TabsTrigger value="fee-mutation" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Mutasi Fee
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qris-orb" className="space-y-4">
          <ORBQRISUpload />
        </TabsContent>

        <TabsContent value="fee-mutation" className="space-y-4">
          <FeeMutationList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

