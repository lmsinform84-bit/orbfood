

# 🧾 C. DETAIL INVOICE (VERSI FINAL & BENAR)

**Route (contoh):**
`/admin/stores/[id]/invoices/[invoice_id]`

---

## 🎯 Tujuan Halaman

* Melihat **ringkasan kewajiban fee toko**
* Memverifikasi **bukti pembayaran manual**
* Menentukan **tutup periode & buka periode baru**

---

## 🧱 STRUKTUR HALAMAN

---

## 1️⃣ Header Invoice

**Informasi statis (read-only):**

* ID Invoice
* Nama toko
* Status invoice:

  * 🟡 Menunggu pembayaran
  * 🔵 Menunggu verifikasi
  * 🟢 Lunas
* Periode:

  * Dari: tanggal periode dimulai
  * Sampai: tanggal invoice dibuat
* Tanggal invoice dibuat

---

## 2️⃣ Ringkasan Periode (Read-only)

### Data yang ditampilkan:

* Jumlah order dalam periode
* Total omzet (estimasi)
* **Fee ORB (5%)**
* Catatan sistem:

  > “Fee dihitung dari seluruh pesanan selesai dalam periode ini”

⚠️ Tidak bisa diedit oleh siapa pun.

---

## 3️⃣ Status Pembayaran (Section Dinamis)

### 🟡 Kondisi: **Menunggu Pembayaran**

**Artinya:**

* Toko **belum mengklaim sudah membayar**
* Belum ada bukti apa pun

**Yang tampil:**

* Pesan info:

  > “Menunggu toko melakukan pembayaran dan mengunggah bukti transfer”
* Tidak ada tombol admin

**Yang terjadi di sistem:**

* Periode tetap **AKTIF**
* Order terus masuk
* Fee terus terakumulasi

---

### 🔵 Kondisi: **Menunggu Verifikasi**

**Artinya:**

* Toko **mengklaim sudah membayar**
* Bukti pembayaran sudah diupload oleh toko

### Yang tampil:

* **Preview bukti pembayaran** (gambar/PDF)
* Info:

  * Tanggal upload
  * Catatan toko (opsional)

### Aksi Admin:

1. **✔️ Konfirmasi Pembayaran**
2. **❌ Tolak Bukti**

---

### Jika admin klik ✔️ *Konfirmasi Pembayaran*

**Yang TERJADI:**

* Status invoice → 🟢 **LUNAS**
* Periode lama → **DITUTUP**
* Sistem otomatis:

  * Membuat **periode baru**
  * Reset akumulasi fee
* Invoice jadi **read-only**
* Toko bisa menerima order ke periode baru

---

### Jika admin klik ❌ *Tolak Bukti*

**Yang TERJADI:**

* Status invoice → 🟡 **Menunggu Pembayaran**
* Bukti pembayaran:

  * Tetap tersimpan (audit)
  * Ditandai “ditolak”
* Toko diberi notifikasi:

  > “Bukti pembayaran ditolak, silakan upload ulang”

---

### 🟢 Kondisi: **LUNAS**

**Artinya:**

* Pembayaran diverifikasi
* Periode sudah ditutup

**Yang tampil:**

* Ringkasan final periode
* Tanggal pelunasan
* Admin yang mengonfirmasi

**Aksi:**

* ❌ Tidak ada aksi
* Semua data **terkunci permanen**

---

## 4️⃣ Log Aktivitas (Audit Trail)

*(Sangat penting, tapi sering dilupakan)*

Menampilkan kronologi:

* Invoice dibuat
* Bukti pembayaran diupload
* Bukti ditolak / diterima
* Invoice dilunasi
* Periode baru dimulai

➡️ Read-only, tidak bisa dihapus.
\
---

## 🧠 RINGKASAN LOGIKA FINAL

| Aksi              | Dampak Sistem                     |
| ----------------- | --------------------------------- |
| Toko upload bukti | Invoice → Menunggu Verifikasi     |
| Admin konfirmasi  | Invoice → Lunas, periode ditutup  |
| Admin tolak       | Invoice kembali ke menunggu bayar |
| Invoice lunas     | Periode baru dibuat               |
