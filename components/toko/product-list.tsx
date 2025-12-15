import { Product } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image';
import { Edit, Trash2 } from 'lucide-react';
import { DeleteProductButton } from './delete-product-button';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Belum ada menu yang ditambahkan.</p>
          <Link href="/toko/menu/new">
            <Button>Tambah Menu Pertama</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card key={product.id}>
          <div className="relative h-48 w-full">
            {product.image_url ? (
              <Image
                src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
                alt={product.name}
                fill
                className="object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 flex items-center justify-center rounded-t-lg">
                <span className="text-4xl">🍽️</span>
              </div>
            )}
          </div>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="line-clamp-1">{product.name}</CardTitle>
              {!product.is_available && (
                <Badge variant="secondary">Tidak Tersedia</Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {product.description || 'Menu lezat dari toko kami'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-primary">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
              <span className="text-sm text-muted-foreground">Stok: {product.stock}</span>
            </div>
            <div className="flex gap-2">
              <Link href={`/toko/menu/${product.id}/edit`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <DeleteProductButton productId={product.id} productName={product.name} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

