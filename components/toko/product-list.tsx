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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-md transition-shadow">
          <div className="relative h-40 md:h-48 w-full">
            {product.image_url ? (
              <Image
                src={getImageUrl(product.image_url, 'medium') || '/placeholder-food.jpg'}
                alt={product.name}
                fill
                className="object-cover rounded-t-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 flex items-center justify-center rounded-t-lg">
                <span className="text-4xl">🍽️</span>
              </div>
            )}
          </div>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="line-clamp-1 text-lg">{product.name}</CardTitle>
              {!product.is_available && (
                <Badge variant="secondary" className="text-xs">Tidak Tersedia</Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2 text-sm">
              {product.description || 'Menu lezat dari toko kami'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl md:text-2xl font-bold text-primary">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">
                Stok: {product.stock}
              </span>
            </div>
            <div className="flex gap-2">
              <Link href={`/toko/menu/${product.id}/edit`} className="flex-1">
                <Button variant="outline" className="w-full text-sm" size="sm">
                  <Edit className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
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

