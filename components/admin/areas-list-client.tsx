'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, RefreshCw, MapPin, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Helper to fetch areas using admin client via API
async function fetchAreasAdmin() {
  const response = await fetch('/api/admin/areas', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch areas');
  }
  return response.json();
}

interface Area {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  store_count?: number;
}

interface AreasListClientProps {
  initialAreas: Area[];
}

export function AreasListClient({ initialAreas }: AreasListClientProps) {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deletingArea, setDeletingArea] = useState<Area | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Sync with server data on mount and when refreshing
  useEffect(() => {
    setAreas(initialAreas);
    setCurrentPage(1); // Reset to first page when data changes
  }, [initialAreas]);

  // Pagination calculations
  const totalPages = Math.ceil(areas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAreas = areas.slice(startIndex, endIndex);

  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  const handleAddArea = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Nama area wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use API route to insert area (bypasses RLS)
      const response = await fetch('/api/admin/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add area');
      }

      const { data } = await response.json();

      // Update state immediately without refresh
      const newArea: Area = {
        id: data.id,
        name: data.name,
        description: data.description,
        created_at: data.created_at,
        store_count: 0,
      };
      setAreas((prev) => [...prev, newArea].sort((a, b) => a.name.localeCompare(b.name)));

      toast({
        title: 'Area berhasil ditambahkan',
        description: `Area "${data.name}" telah ditambahkan`,
      });

      setFormData({ name: '', description: '' });
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding area:', error);
      toast({
        title: 'Gagal menambahkan area',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleEditArea = async () => {
    if (!editingArea || !formData.name.trim()) {
      toast({
        title: 'Nama area wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use API route to update area (bypasses RLS)
      const response = await fetch('/api/admin/areas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingArea.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update area');
      }

      // Update state immediately without refresh
      setAreas((prev) =>
        prev.map((area) =>
          area.id === editingArea.id
            ? { ...area, name: formData.name.trim(), description: formData.description.trim() || null }
            : area
        )
      );

      toast({
        title: 'Area berhasil diupdate',
        description: `Area "${formData.name}" telah diupdate`,
      });

      setEditingArea(null);
      setFormData({ name: '', description: '' });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating area:', error);
      toast({
        title: 'Gagal mengupdate area',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteArea = async () => {
    if (!deletingArea) return;

    try {
      // Use API route to delete area (bypasses RLS)
      const response = await fetch('/api/admin/areas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingArea.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.includes('masih digunakan')) {
          toast({
            title: 'Tidak dapat menghapus area',
            description: errorData.error,
            variant: 'destructive',
          });
          setIsDeleteDialogOpen(false);
          setDeletingArea(null);
          return;
        }
        throw new Error(errorData.error || 'Failed to delete area');
      }

      // Update state immediately without refresh
      setAreas((prev) => prev.filter((area) => area.id !== deletingArea.id));

      toast({
        title: 'Area berhasil dihapus',
        description: `Area "${deletingArea.name}" telah dihapus`,
      });

      setDeletingArea(null);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting area:', error);
      toast({
        title: 'Gagal menghapus area',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (area: Area) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      description: area.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (area: Area) => {
    setDeletingArea(area);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Daftar Wilayah/Area</h2>
          <p className="text-sm text-muted-foreground">
            Kelola wilayah untuk filtering toko dan pelanggan
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Area
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Area Baru</DialogTitle>
                <DialogDescription>
                  Tambahkan wilayah/area baru untuk filtering toko
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nama Area *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Desa Sukamaju, Dusun Sari, dll"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi area (opsional)"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleAddArea}>Tambah</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {areas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Belum ada area yang ditambahkan</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Area Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Nama Area</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-center">Jumlah Toko</TableHead>
                    <TableHead className="text-center w-[150px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAreas.map((area, index) => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {area.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {area.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span>{area.store_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(area)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(area)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription>Ubah informasi area</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Nama Area *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleEditArea}>Simpan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Area?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus area "{deletingArea?.name}"? 
              Area yang masih digunakan oleh toko tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingArea(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArea} className="bg-destructive">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


