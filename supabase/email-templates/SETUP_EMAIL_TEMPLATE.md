# Setup Custom Email Template di Supabase

## 🎯 Tujuan
Mengganti email konfirmasi default Supabase dengan template custom ORBfood yang sesuai tema web (orange-red gradient).

## 📋 Prerequisites
- Akses ke Supabase Dashboard
- File template: `confirm-email.html`

## 🔧 Langkah-langkah Setup

### Step 1: Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project ORBfood Anda
3. Di sidebar kiri, klik **Authentication**

### Step 2: Buka Email Templates
1. Di menu Authentication, klik **Email Templates**
2. Anda akan melihat daftar template email:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

### Step 3: Edit Template "Confirm signup"
1. Klik pada template **"Confirm signup"**
2. Anda akan melihat editor dengan 2 tab:
   - **Subject** (untuk subject email)
   - **Body** (untuk body email)

### Step 4: Update Subject Email
1. Klik tab **Subject**
2. Ganti dengan:
   ```
   Konfirmasi Email Anda - ORBfood
   ```
3. Atau bisa lebih kreatif:
   ```
   🍽️ Selamat Datang di ORBfood - Konfirmasi Email Anda
   ```

### Step 5: Update Body Email (PENTING!)
1. Klik tab **Body**
2. **HAPUS SEMUA** konten yang ada (default template)
3. Buka file `confirm-email.html` di folder `supabase/email-templates/`
4. **COPY SEMUA** isi file HTML tersebut
5. **PASTE** ke editor Body di Supabase Dashboard

### Step 6: Verifikasi Variable Supabase
Pastikan variable berikut **TIDAK DIUBAH**:
- `{{ .Email }}` - Email user yang mendaftar
- `{{ .ConfirmationURL }}` - URL untuk konfirmasi email
- `{{ .SiteURL }}` - URL website Anda (opsional)
- `{{ .RedirectTo }}` - URL redirect setelah konfirmasi (opsional)

**PENTING**: Format variable Supabase adalah `{{ .VariableName }}` dengan:
- Dua kurung kurawal `{{ }}`
- Titik di depan nama variable `.`
- Nama variable dengan huruf kapital di awal

### Step 7: Save Template
1. Klik tombol **Save** di kanan atas editor
2. Tunggu sampai muncul notifikasi "Template saved successfully"

### Step 8: Test Email Template
1. Daftar user baru sebagai pelanggan
2. Cek email inbox (dan spam folder jika perlu)
3. Verifikasi bahwa email menggunakan template custom:
   - ✅ Header dengan gradient orange-red
   - ✅ Logo/icon ORBfood
   - ✅ Button "Konfirmasi Email" dengan styling custom
   - ✅ Footer dengan informasi ORBfood
4. Klik link konfirmasi dan pastikan redirect berfungsi

## 🎨 Customisasi Template

### Mengubah Warna
Template menggunakan gradient orange-red. Untuk mengubah:
1. Cari `background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%)`
2. Ganti dengan warna yang diinginkan:
   - Orange: `#ea580c`
   - Red: `#dc2626`

### Mengubah Logo
1. Cari `🍽️ ORBfood` di header
2. Ganti dengan:
   - Emoji lain: `🏪`, `🍕`, `🍔`, dll
   - Atau upload logo dan gunakan `<img>` tag

### Mengubah Teks
Semua teks bisa diubah sesuai kebutuhan, **KECUALI** variable Supabase.

## ⚠️ Troubleshooting

### Email masih menggunakan template default
**Solusi:**
1. Pastikan sudah klik **Save** setelah paste template
2. Clear cache browser
3. Coba daftar user baru lagi
4. Cek apakah template yang di-save sudah benar (buka lagi editor)

### Variable tidak ter-replace
**Solusi:**
1. Pastikan format variable benar: `{{ .VariableName }}`
2. Jangan ada spasi di dalam kurung kurawal
3. Pastikan menggunakan titik di depan nama variable

### Email tidak terkirim
**Solusi:**
1. Cek SMTP settings di **Authentication** → **Settings** → **SMTP Settings**
2. Pastikan SMTP sudah dikonfigurasi dengan benar
3. Cek email spam folder
4. Verifikasi email sender di Supabase

### Template tidak responsive
**Solusi:**
1. Pastikan menggunakan table-based layout (sudah ada di template)
2. Test di berbagai email client (Gmail, Outlook, dll)
3. Gunakan inline CSS (sudah ada di template)

## 📝 Checklist Setup

- [ ] Login ke Supabase Dashboard
- [ ] Buka Authentication → Email Templates
- [ ] Edit template "Confirm signup"
- [ ] Update Subject email
- [ ] Copy-paste template custom ke Body
- [ ] Verifikasi variable Supabase tidak diubah
- [ ] Save template
- [ ] Test dengan registrasi user baru
- [ ] Verifikasi email menggunakan template custom
- [ ] Test link konfirmasi berfungsi

## 🔍 Verifikasi Setup

Setelah setup, test dengan:
1. Daftar user baru sebagai pelanggan
2. Cek email yang diterima
3. Verifikasi:
   - ✅ Subject: "Konfirmasi Email Anda - ORBfood"
   - ✅ Body: Menggunakan template custom dengan gradient orange-red
   - ✅ Button "Konfirmasi Email" terlihat dan berfungsi
   - ✅ Link konfirmasi valid dan redirect ke website

## 📚 Referensi

- [Supabase Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Email Variables](https://supabase.com/docs/guides/auth/auth-email-templates#variables)

## 💡 Tips

1. **Backup Template Default**: Sebelum mengubah, copy template default untuk backup
2. **Test di Multiple Email Clients**: Test di Gmail, Outlook, Yahoo untuk memastikan kompatibilitas
3. **Mobile-Friendly**: Template sudah responsive, tapi test di mobile juga
4. **Branding**: Sesuaikan warna dan logo dengan brand ORBfood
5. **Language**: Template menggunakan Bahasa Indonesia, sesuaikan jika perlu

---

**Catatan**: Setelah setup, semua email konfirmasi registrasi akan menggunakan template custom ini. Pastikan template sudah di-test dengan baik sebelum digunakan di production.
