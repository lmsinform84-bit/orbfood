import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function HomePage() {
  const user = await getCurrentUser();

  // If user is logged in, redirect based on role
  if (user) {
    if (user.role === 'admin') {
      redirect('/admin/dashboard');
    } else if (user.role === 'toko') {
      redirect('/toko/dashboard');
    } else {
      redirect('/user/home');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            ORBfood
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Platform pesan makanan online untuk menghubungkan pelanggan dengan toko lokal terdekat
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <Card>
            <CardHeader>
              <CardTitle>👤 Pelanggan</CardTitle>
              <CardDescription>
                Pesan makanan dari berbagai toko terdekat dengan mudah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Lihat daftar toko & menu</li>
                <li>✓ Pesan makanan online</li>
                <li>✓ Lacak status pesanan</li>
                <li>✓ Riwayat pesanan</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🏪 Toko</CardTitle>
              <CardDescription>
                Kelola menu, stok, dan pesanan dengan dashboard yang mudah digunakan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Kelola menu & stok</li>
                <li>✓ Terima & proses pesanan</li>
                <li>✓ Lihat laporan penjualan</li>
                <li>✓ Atur jam operasional</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>👨‍💼 Admin</CardTitle>
              <CardDescription>
                Monitor dan kelola seluruh platform dengan dashboard lengkap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Approve toko baru</li>
                <li>✓ Lihat statistik lengkap</li>
                <li>✓ Kelola pengguna & toko</li>
                <li>✓ Kontrol keamanan</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-x-4">
          <Link href="/login">
            <Button size="lg">Login</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Daftar Sekarang
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
