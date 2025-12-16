'use client';

import { useState, useTransition } from 'react';
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
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

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
      const { data, error } = await supabase
        .from('areas')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Area berhasil ditambahkan',
        description: `Area "${data.name}" telah ditambahkan`,
      });

      setFormData({ name: '', description: '' });
      setIsAddDialogOpen(false);
      handleRefresh();
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
      const { error } = await supabase
        .from('areas')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        })
        .eq('id', editingArea.id);

      if (error) throw error;

      toast({
        title: 'Area berhasil diupdate',
        description: `Area "${formData.name}" telah diupdate`,
      });

      setEditingArea(null);
      setFormData({ name: '', description: '' });
      setIsEditDialogOpen(false);
      handleRefresh();
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
      // Check if area has stores
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('area_id', deletingArea.id)
        .limit(1);

      if (stores && stores.length > 0) {
        toast({
          title: 'Tidak dapat menghapus area',
          description: `Area ini masih digunakan oleh ${stores.length} toko. Hapus atau pindahkan toko terlebih dahulu.`,
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        setDeletingArea(null);
        return;
      }

      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', deletingArea.id);

      if (error) throw error;

      toast({
        title: 'Area berhasil dihapus',
        description: `Area "${deletingArea.name}" telah dihapus`,
      });

      setDeletingArea(null);
      setIsDeleteDialogOpen(false);
      handleRefresh();
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <Card key={area.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {area.name}
                    </CardTitle>
                    {area.description && (
                      <CardDescription className="mt-2">{area.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {area.store_count || 0} toko
                    </span>
                  </div>
                  <div className="flex gap-2">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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


