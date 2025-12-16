Siap.
Di bawah ini adalah **spesifikasi HALAMAN TOKO (Store Dashboard & Store Page)** untuk **ORBfood**, fokus **pengembangan web (bukan bisnis)**, **ringkas tapi lengkap**, dan **aman untuk free tier**.

Aku bagi jadi **2 bagian besar**:

1. **Halaman Toko (yang dilihat pelanggan)**
2. **Dashboard Toko (yang dipakai pemilik toko)**

---

# 1️⃣ HALAMAN TOKO (Dilihat oleh USER / Pelanggan)

> Ini adalah halaman profil toko + katalog makanan


## A. Informasi Utama Toko (Header)

Wajib ada:

* **Nama toko**
* **Status buka / tutup**
* **Wilayah / desa**
* **Alamat singkat**
* **Nomor WA toko (opsional)**
* **Badge “Toko Terverifikasi ORB” (jika approved)**

Opsional tapi bagus:

* Jam operasional
* Estimasi waktu siap (manual, bukan realtime)

---

## B. Banner / Foto Toko

* 1 banner utama (ringan, dikompres)
* Fallback jika tidak upload
* Tidak perlu carousel (hemat performa)

---

## C. Filter & Kategori menu

* Kategori menu (Makanan, Minuman, dll)
* Search menu di dalam toko
* Sorting:

  * Harga termurah
  * Terlaris (opsional, simple count)

---

## D. Daftar menu

Setiap **Product Card** berisi:

* Foto menu
* Nama menu
* Harga
* Status tersedia / habis
* Tombol **Tambah ke Keranjang**

UX penting:

* Tombol tambah cepat (+)
* Disable jika stok habis

---

## E. Informasi Operasional

Bagian bawah halaman:

* Sistem pembayaran yang diterima:

  * COD
  * Transfer (jika ada)
* Info pengantaran:

  * Driver toko / ambil sendiri
* Catatan toko:

  * “Harga belum termasuk ongkir”
  * “COD hanya wilayah X”

---

## F. Keranjang (Sticky Bottom)

* Total item
* Total harga
* Tombol **Checkout**

---

# 2️⃣ DASHBOARD TOKO (Untuk Pemilik Toko)

> URL contoh: `/toko/dashboard`

## A. Ringkasan Dashboard

Widget sederhana:

* Pesanan hari ini
* Pesanan belum diproses
* Total omzet hari ini
* Status toko (buka / tutup)

⚠️ Tidak realtime → refresh manual

---

## B. Manajemen Pesanan

Halaman paling penting.

### Status Pesanan:

* Pending (baru masuk)
* Diproses
* Selesai
* Dibatalkan

### Detail Pesanan:

* Nama pembeli
* Alamat antar
* Metode bayar (COD / transfer)
* Catatan pembeli
* Total harga

Aksi toko:

* Terima pesanan
* Tolak pesanan
* Tandai selesai

---

## C. Manajemen menu

Fitur wajib:

* Tambah menu
* Edit menu
* Hapus menu
* Upload foto
* Atur stok
* Aktif / nonaktif menu

Field menu minimal:

* Nama
* Harga
* Stok
* Kategori
* Foto

---

## D. Profil Toko

Toko WAJIB isi:

* Nama toko
* Alamat
* Wilayah (desa/kecamatan)
* Jam operasional
* Metode pembayaran
* Nomor WA

Admin bisa suspend jika kosong.

---

## E. Pengaturan Operasional

* Toggle buka / tutup toko
* Atur jam buka
* Catatan untuk pelanggan

---

## F. Rekap & Tagihan (PENTING untuk model tanpa payment gateway)

Halaman **Rekap Transaksi**:

* Total order hari ini
* Total omzet
* Total fee ORB (misal 5%)
* Total setoran ke ORB

➡️ Data ini dipakai toko untuk:

* Transfer harian ke ORB
* Cocokkan manual

---

## G. Riwayat Pembayaran ke ORB

* Tanggal setor
* Jumlah
* Status:

  * Menunggu verifikasi
  * Diterima
* Bukti transfer (upload foto)

---

# 3️⃣ FITUR KEAMANAN & BATASAN (WAJIB UNTUK FREE TIER)

* Tidak ada chat internal
* Tidak ada live tracking
* Tidak ada rating & review
* Tidak ada dompet digital internal
* Semua status manual
* Validasi via dashboard

➡️ Ini **bukan kekurangan**, tapi **strategi stabil & murah**

---

# 4️⃣ TABEL RINGKAS FITUR TOKO

| Area           | Fitur              | Wajib |
| -------------- | ------------------ | ----- |
| Halaman publik | Katalog            | ✅     |
| Halaman publik | Keranjang          | ✅     |
| Dashboard      | Pesanan            | ✅     |
| Dashboard      | menu             | ✅     |
| Dashboard      | Profil             | ✅     |
| Dashboard      | Rekap              | ✅     |
| Dashboard      | Upload bukti setor | ✅     |
| Chat           | Internal chat      | ❌     |
| Tracking       | Realtime map       | ❌     |

---

# 5️⃣ KENAPA STRUKTUR INI IDEAL UNTUK ORBfood

* ✔ Ringan untuk Supabase free
* ✔ Aman untuk Vercel free
* ✔ Mudah dipakai UMKM desa
* ✔ Minim komplain ke platform
* ✔ Mudah diskalakan
*UI LAYOUT DASHBOARD TOKO ORBfood (MOBILE-FRIENDLY)** yang **realistis untuk UMKM desa**, **ringan**, dan **cocok untuk Supabase + Vercel free tier**.

Fokus:

* Dipakai di HP
* Minim klik
* Tidak bikin bingung

---

# 📱 UI LAYOUT DASHBOARD TOKO — ORBfood

## 🧭 Pola Navigasi (WAJIB MOBILE)

Gunakan **Bottom Navigation (4 tab)**

```
[ Beranda ] [ Pesanan ] [ menu  ] [ Profil(pengaturan) ]
```

Kenapa?

* UMKM terbiasa dengan WhatsApp
* Bottom nav lebih cepat
* Tidak perlu sidebar berat

---

# 1️⃣ TAB: BERANDA (Dashboard Ringkas)

### Tujuan

→ Toko langsung tahu:

* Ada pesanan masuk atau tidak
* Toko buka atau tutup
* Hari ini dapat berapa

### Layout

```
┌──────────────────────┐
│ Halo, Warung Bu Sari │
│ Status: ● BUKA       │  ← toggle
└──────────────────────┘

┌─────────┬───────────┐
│ Pesanan │ Omzet     │
│  5      │ Rp 235K   │
└─────────┴───────────┘

┌──────────────────────┐
│ ⚠️ 2 pesanan menunggu │
│ [Lihat Pesanan]     │
└──────────────────────┘
```

### Elemen Wajib

* Toggle buka / tutup
* Jumlah pesanan hari ini
* Omzet hari ini
* Shortcut ke pesanan

---

# 2️⃣ TAB: PESANAN (Paling Penting)

### Filter (Chip)

```
[ Baru ] [ Diproses ] [ Selesai ]
```

### Card Pesanan

```
┌──────────────────────┐
│ #ORD-1023            │
│ Andi - COD           │
│ Total: Rp 28.000     │
│ Alamat singkat       │
│ [Terima] [Tolak]    │
└──────────────────────┘
```

### Detail Pesanan (Klik Card)

* Daftar item
* Catatan pembeli
* Metode bayar
* Alamat lengkap
* Tombol:

  * Proses
  * Selesai

⚠️ **Tidak ada chat di dalam aplikasi**

---

# 3️⃣ TAB: menu

### Daftar menu

```
┌──────────────────────┐
│ 🍜 Mie Goreng        │
│ Rp 12.000           │
│ Stok: 10            │
│ [Edit] [Nonaktif]  │
└──────────────────────┘
```

### FAB (Floating Button)

```
➕ Tambah menu
```

### Form menu (Mobile)

* Nama
* Harga
* Stok
* Kategori (select)
* Upload foto (1 saja)
* Toggle tersedia

---

# 4️⃣ TAB: PROFIL & TAGIHAN

### A. Profil Toko

```
Nama Toko
Alamat
Wilayah (desa/kecamatan)
Jam buka
Nomor WA
```

### B. Metode Pembayaran

Checkbox:

* COD
* Transfer

### C. Rekap & Setoran ORB

```
Total Order Hari Ini: Rp 300.000
Fee ORB (5%): Rp 15.000
Status Setoran: Belum
[Upload Bukti Transfer]
```

---

# 🧾 HALAMAN TAMBAHAN (DARI PROFIL)

### Riwayat Setoran

```
- 12 Jan | Rp 15.000 | Diterima
- 11 Jan | Rp 10.000 | Menunggu
```

---

# 🎨 STYLE GUIDE DASHBOARD TOKO

### Warna

* Background: Abu terang
* Card: Putih
* Primary: Hijau tua / Biru tua
* Button utama: Solid
* Button bahaya: Outline merah lembut

### Typography

* Judul: font semibold
* Angka besar & jelas
* Jangan pakai font dekoratif

### UX Rules

* Tidak lebih dari 2 tombol per card
* Semua klik ≥ 44px
* Hindari modal bertumpuk

---

# ⚙️ KOMPONEN TEKNIS (Next.js + shadcn)

Gunakan:

* `<Tabs />` → filter pesanan
* `<Card />` → semua data
* `<Switch />` → buka/tutup toko
* `<Sheet />` → detail pesanan
* `<Button />` → aksi utama
* `<Badge />` → status
jika sudah ada ini semua atau tidak sesuai dengan komponen lain tak perlu di terapkan
---
