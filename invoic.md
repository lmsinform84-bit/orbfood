

# 📄 Fitur Invoice (UI/UX)

## 1️⃣ Tujuan

* Menampilkan tagihan toko ke ORBfood (fee 5% / order)
* Menampilkan rekap transaksi perhari / perminggu / perbulan
* Bisa diunduh / dicetak
* Mempermudah kontrol pembayaran manual (transfer, bukti setor)

---

## 2️⃣ Struktur Halaman (Mobile-First)

```
┌─────────────────────────────┐
│ ORBfood Invoice Toko Bu Sari│
└─────────────────────────────┘
│ Filter: [Hari] [Minggu] [Bulan] │
└─────────────────────────────┘
│ Total Omzet: Rp 320.000          │
│ Fee ORB (5%): Rp 16.000          │
│ Status Setoran: Belum / Sudah     │
└─────────────────────────────┘
```

---

## 3️⃣ List Invoice (Card-Based)

**Tiap transaksi / order:**

```
┌─────────────────────────────┐
│ #ORD-2031  12 Des 2025      │
│ Rp 27.000                    │
│ Fee ORB: Rp 1.350            │
│ Status: Belum / Diterima     │
│ [Detail]                     │
└─────────────────────────────┘
```

* **Warna status**:

  * Belum → merah / oranye
  * Diterima → hijau
* **Detail tombol** → slide up sheet dengan rincian order (produk, qty, subtotal)

---

## 4️⃣ Tab Filter Ringkas

* **Hari / Minggu / Bulan**
* Pilih rentang → update list invoice
* Bisa **scroll horizontal** untuk waktu

```
[Hari Ini] [7 Hari] [30 Hari] [Custom]
```

* Tab aktif → underline tebal warna primary ORB
* Tab nonaktif → abu

---

## 5️⃣ Actions & CTA

* **Upload bukti transfer** → tombol besar & jelas
* **Download PDF / Cetak** → icon print / download di top-right
* **Refresh / Sync** → icon refresh kecil (opsional)

---

## 6️⃣ UX Rules

* **Ringkas & jelas**: user lihat total & status cukup dari 1 view
* **Mobile-friendly**: card tinggi ±100px, padding nyaman
* **Scrollable**: gunakan virtual list jika invoice banyak (>50)
* **No clutter**: jangan pakai chart berat di mobile awal

---

## 7️⃣ Optional (Future)

* **Badge notifikasi**: misal ada invoice baru belum dibayar
* **Search invoice**: cari by order id atau tanggal
* **Export CSV**: untuk laporan toko / admin

---

## 8️⃣ Komponen Teknis (Next.js + shadcn)

* `<Card />` → tiap invoice
* `<TabsList />` → filter hari/minggu/bulan
* `<Button />` → upload / download
* `<Sheet />` → detail order
* `<Badge />` → status invoice

---

Kalau mau, aku bisa buatkan **prompt AI untuk generate UI ORBfood Invoice ini lengkap** dengan:

* Layout mobile
* Warna & font ORBfood
* Komponen Tailwind / shadcn siap pakai

Apakah mau aku buatkan prompt itu sekarang?
