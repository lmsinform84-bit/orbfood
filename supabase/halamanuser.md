
# 🧩 STRUKTUR HALAMAN USER ORBfood

> Prinsip: **sederhana, jelas, tidak bikin salah paham**

---

## 1️⃣ HALAMAN UTAMA (Home / Beranda)

### Tujuan

* Menampilkan toko & makanan
* Bukan marketplace besar
* Fokus lokal

### Wajib Ada

* Pilih wilayah (desa / dusun)
* Daftar toko **yang sedang buka**
* Pencarian sederhana (nama toko / menu)

### Opsional (kalau ringan)

* Filter kategori makanan

📌 **Jangan ada promo ribet / banner berat**

---

## 2️⃣ HALAMAN TOKO

### Tujuan

* User paham:

  * beli di mana
  * siapa tokonya
  * bagaimana cara bayarnya

### Wajib Ada

* Nama toko
* Status buka / tutup
* Alamat singkat
* Metode pembayaran yang diterima:

  * COD / Transfer / QRIS
* Daftar produk:

  * nama
  * harga
  * stok / tersedia

### Teknis

* Produk dari database
* Harga **readonly** (tidak editable user)

---

## 3️⃣ HALAMAN DETAIL PRODUK (OPSIONAL)

> Bisa digabung langsung di halaman toko

### Wajib Ada

* Nama produk
* Harga
* Deskripsi singkat
* Tombol:

  * **Tambah ke Keranjang**

---

## 4️⃣ HALAMAN KERANJANG (Cart)

### Ini HALAMAN KRITIS

### Wajib Ada

* Daftar produk:

  * nama
  * jumlah
  * subtotal
* Total harga
* Estimasi ongkir (jika ada)

### Input User

* Alamat pengantaran
* Catatan pesanan
* Pilih metode pembayaran:

  * COD / Transfer / QRIS

📌 Tampilkan teks jelas:

> **“Pembayaran dilakukan langsung ke toko, bukan melalui aplikasi.”**

---

## 5️⃣ HALAMAN KONFIRMASI PESANAN

### Tujuan

* Mencegah salah paham

### Wajib Ada

* Ringkasan order
* Metode pembayaran dipilih
* Total bayar
* Tombol:

  * **Buat Pesanan**

### Setelah submit

* Redirect ke halaman status order

---

## 6️⃣ HALAMAN STATUS PESANAN (REAL-TIME SEDERHANA)

### Wajib Ada

* Status order:

  * Menunggu diproses
  * Sedang diproses
  * Selesai
* Status pembayaran:

  * Belum dikonfirmasi
  * Sudah dikonfirmasi toko
* Info toko:

  * nama
  * kontak (WA)

📌 Jangan pakai tracking map

---

## 7️⃣ HALAMAN RIWAYAT PESANAN

### Wajib Ada

* List order sebelumnya:

  * tanggal
  * toko
  * total
  * status
* Klik untuk detail

---

## 8️⃣ HALAMAN PROFIL USER

### Wajib Ada

* Nama
* Nomor HP
* Alamat default
* Tombol logout

📌 **Tidak perlu saldo, wallet, dll**

---

## 9️⃣ HALAMAN LOGIN & REGISTER

### Wajib Ada

* Login email / OTP / password
* Register sederhana:

  * nama
  * nomor HP
* Tidak perlu verifikasi rumit

---



---

# 🧠 ALUR USER (RINGKAS)

```
Home
 ↓
Toko
 ↓
Keranjang
 ↓
Konfirmasi
 ↓
Status Order
 ↓
Riwayat
```

---



## 🧠 Prinsip UX ORBfood (PENTING)

* Selalu jelaskan:

  > “Pembayaran langsung ke toko”
* Jangan buat user merasa:

  > “Ini seperti ShopeeFood”
* UI = alat bantu, bukan janji layanan

---