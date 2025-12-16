Oke, mari kita susun ulang **UI/UX pembayaran ORBfood** supaya lebih jelas **toko dan admin bisa upload QRIS mereka sendiri**, tetap sesuai model **QRIS statis + fee manual**.

---

# 🧾 ORBfood – UI/UX Pembayaran (Revisi)

## 1️⃣ Tujuan

* **Pelanggan** membayar langsung ke toko via QRIS atau cash
* **Toko** bisa **upload QRIS mereka sendiri** agar user bisa scan
* **Admin ORBfood** bisa **upload QRIS ORBfood** untuk menerima fee dari toko
* Fee dihitung otomatis, tapi pembayaran fee tetap **manual**

---

## 2️⃣ Flow Pembayaran

### 2.1 Pelanggan → Toko

1. User pilih produk → checkout
2. Pilih metode pembayaran:

   * **QRIS Toko** → tampilkan QRIS statis yang di-upload toko → scan & bayar
   * **Cash / COD** → bayar langsung ke kasir / driver
3. Status pesanan:

   * **Menunggu Konfirmasi** → belum diverifikasi
   * **Dibayar** → pembayaran diverifikasi toko

### 2.2 Toko → ORBfood

1. ORBfood otomatis hitung **fee 5% per order**
2. Toko transfer manual ke QRIS ORBfood (upload QRIS ORBfood tersedia di dashboard toko)
3. Admin cek mutasi → update status fee **Diterima**

---

## 3️⃣ Halaman User (Checkout)

```
┌───────────────────────────────┐
│ Checkout ORBfood              │
└───────────────────────────────┘
│ Pesanan:                     │
│ - Nasi Goreng x1 Rp 25.000   │
│ - Es Teh x1      Rp 5.000    │
│ Total            Rp 30.000   │
│ Delivery Fee     Rp 5.000    │
│ Final Total      Rp 35.000   │
└───────────────────────────────┘
│ Metode Pembayaran:            │
│ [QRIS Toko] [Cash / COD]     │
└───────────────────────────────┘
│ QR Code (statis, di-upload toko) │
│ [Scan & Bayar]                 │
└───────────────────────────────┘
│ Button: Konfirmasi Pembayaran  │
```

---

## 4️⃣ Halaman Toko (Upload QRIS + Fee ORBfood)

**Tab 1: QRIS Toko**

```
┌───────────────────────────────┐
│ QRIS Toko                     │
└───────────────────────────────┘
│ Upload QRIS Baru              │
│ [Pilih File / Preview QRIS]   │
│ QRIS Saat Ini: [tampilkan]    │
└───────────────────────────────┘
```

**Tab 2: Fee ORBfood**

```
┌───────────────────────────────┐
│ Fee ORBfood                   │
└───────────────────────────────┘
│ Total Fee Hari Ini: Rp 1.750  │
│ Total Fee Minggu Ini: Rp 8.500│
│ QRIS ORBfood (untuk transfer fee) │
│ Upload / Preview QRIS ORBfood │
└───────────────────────────────┘
│ Riwayat Setoran Fee ORB       │
│ - 12 Des 2025  Rp 1.750  Belum │
│ - 11 Des 2025  Rp 1.600  Sudah │
```

**UX Rules Toko:**

* Upload QRIS → preview QR code
* Fee list → card / tabel, scrollable di mobile
* QRIS ORBfood disediakan supaya toko transfer fee dengan mudah

---

## 5️⃣ Halaman Admin (ORBfood)

**Tab 1: Mutasi Fee ORBfood**

```
┌───────────────────────────────┐
│ Mutasi Fee ORBfood            │
└───────────────────────────────┘
│ Filter: Hari / Minggu / Bulan │
│ Table: Toko | Total Fee | Status Setoran | Tanggal |
│ Action: Update Status Manual  │
```

**Tab 2: QRIS ORBfood**

```
┌───────────────────────────────┐
│ QRIS ORBfood                  │
└───────────────────────────────┘
│ Upload / Preview QRIS          │
│ QRIS digunakan untuk menerima  │
│ transfer fee dari toko         │
```

**UX Rules Admin:**

* Desktop: sortable table, export CSV/PDF
* Mobile: card list dengan slide-up detail
* Upload QRIS ORBfood sendiri → jelas & mudah akses

---

## 6️⃣ Komponen Teknis (Next.js + Tailwind + shadcn)

* `<Card />` → fee list, mutasi
* `<Tabs />` → QRIS / Fee / Riwayat
* `<Button />` → upload QRIS / konfirmasi pembayaran
* `<Badge />` → status setoran (Belum / Sudah)
* `<Modal />` → preview QRIS & detail order

---