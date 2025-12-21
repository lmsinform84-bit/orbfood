
# 🧾 ALUR INVOICE TAGIHAN TOKO → ORBFOOD

**(Model Periodik, Akumulasi Order, Manual Settlement)**

---

## 🎯 PRINSIP UTAMA

1. **Tagihan bukan per order**
2. **Invoice dibuka per periode**
3. **Fee 5% diakumulasi**
4. **Pembayaran dilakukan manual seperti yang sudah ada**
5. **Status jelas & tercatat**

---

## 0️⃣ PENGATURAN DASAR (ADMIN)

* Fee platform: **5%**
* Periode invoice:

  * Default: **7 hari**
  * Alternatif: Harian / Mingguan / Bulanan
* Sistem invoice:

  * **Satu invoice aktif per toko**
  * Invoice baru dibuat **setelah invoice lama lunas**

---

## 1️⃣ ORDER SELESAI → MASUK AKUMULASI INVOICE

Setiap order yang:

* Status: **selesai**
* Milik toko tertentu
* Belum masuk invoice lunas

➡️ Sistem:

* Hitung 5% dari `final_total`
* Tambahkan ke **invoice aktif toko**

### Contoh:s

Order #101 → Rp30.000
Fee 5% → Rp1.500
➡️ Ditambahkan ke invoice berjalan

---

## 2️⃣ STRUKTUR INVOICE (PER TOKO)

### Invoice Aktif

```
Invoice ID     : INV-2024-001
Periode        : 1 – 7 Juli 2024
Status         : BELUM LUNAS

Ringkasan:
- Total order  : 18
- Omzet toko  : Rp540.000
- Fee ORBfood : Rp27.000 (5%)
```

⚠️ **Order tidak ditampilkan satu-satu ke toko**
Hanya:

* Jumlah order
* Total omzet
* Total fee

(Detail order bisa dibuka jika perlu)

---

## 3️⃣ PERIODE BERAKHIR → INVOICE DITUTUP

Saat:

* Periode habis (misal hari ke-7)

➡️ Sistem:

* Mengunci invoice
* Status tetap **BELUM LUNAS**
* Membuka **invoice baru** untuk periode berikutnya

---

## 4️⃣ NOTIFIKASI KE TOKO (WAJIB ADA)

### Hari ke-5 (peringatan dini)

> Invoice ORBfood Anda sudah berjalan 5 hari.
> Agar tidak menumpuk, disarankan melakukan pembayaran.

### Hari ke-7 (jatuh tempo)

> Invoice ORBfood periode 1–7 Juli telah jatuh tempo.
> Total tagihan: Rp27.000

---

## 5️⃣ TOKO MELAKUKAN PEMBAYARAN

Toko:

* Transfer ke rekening / QRIS ORBfood
* Nominal **sesuai total invoice**

---

## 6️⃣ TOKO KONFIRMASI PEMBAYARAN

Di dashboard toko:

```
Invoice INV-2024-001
Total tagihan: Rp27.000

[ Upload bukti transfer ]
[ Konfirmasi pembayaran ]
```

➡️ Status invoice: **MENUNGGU VERIFIKASI**

---

## 7️⃣ ADMIN VERIFIKASI

Admin:

* Cek mutasi bank / QRIS eksternal
* Cocokkan nominal
* Klik **Tandai Lunas**

➡️ Status invoice: **LUNAS**

---

## 8️⃣ RESET TAGIHAN (OTOMATIS)

Saat invoice lunas:

* Invoice dipindahkan ke **History Pelunasan**
* Invoice aktif toko = **nol**
* Sistem membuka invoice baru untuk periode berikutnya

✔ Tidak ada dobel tagihan
✔ Tidak ada order nyangkut

---

## 9️⃣ UI/UX RINGKAS

### 🧑‍🍳 Dashboard Toko

* Banner:

  > Tagihan ORBfood periode ini: Rp27.000
* Tombol:

  * Lihat invoice
  * Upload bukti bayar

---

### 🧑‍💼 Dashboard Admin

* Tabel toko:

  * Nama toko
  * Invoice aktif
  * Status
  * Hari berjalan
* Tab:

  * Invoice aktif
  * Riwayat pelunasan

---

## 🔐 KEAMANAN & KEADILAN

* Tidak memotong uang toko
* Tidak tahan saldo
* Transparan
* Bisa diaudit manual
* Cocok QRIS statis

---

Persis seperti:

 **Bayar listrik / air / 