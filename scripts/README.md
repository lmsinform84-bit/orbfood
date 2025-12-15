# Scripts untuk Setup Admin

## Script: create-admin.js

Script otomatis untuk membuat admin user langsung tanpa perlu manual di Dashboard.

### Prerequisites:

1. Install dotenv:
```bash
npm install dotenv
```

2. Tambahkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Service Role Key bisa ditemukan di:**
- Supabase Dashboard > Settings > API
- Scroll ke bawah, ada "service_role" key
- ⚠️ **JANGAN** share atau commit key ini ke public!

### Cara Penggunaan:

#### Method 1: Via npm script (Recommended)

```bash
# Dengan default values
npm run create-admin

# Atau dengan custom values
node scripts/create-admin.js admin@example.com "Admin Name" "SecurePassword123"
```

#### Method 2: Edit langsung di script

Edit file `scripts/create-admin.js`, ubah:
```javascript
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_NAME = 'Admin User';
const ADMIN_PASSWORD = 'SecurePassword123';
```

Lalu jalankan:
```bash
node scripts/create-admin.js
```

### Output:

Script akan:
1. ✅ Create user di `auth.users`
2. ✅ Auto-confirm email
3. ✅ Create profile di `public.users` dengan role `admin`
4. ✅ Print credentials untuk login

### Troubleshooting:

**Error: SUPABASE_SERVICE_ROLE_KEY tidak ditemukan**
- Pastikan sudah tambahkan ke `.env.local`
- Pastikan nama variable benar (tanpa typo)

**Error: User already exists**
- Script akan continue dan update profile menjadi admin
- Jika masih error, hapus user dulu di Dashboard

**Error: Permission denied**
- Pastikan menggunakan `service_role` key, bukan `anon` key
- Service role key ada di Dashboard > Settings > API

### Security:

- ⚠️ **JANGAN** commit `.env.local` ke git
- ⚠️ **JANGAN** share `service_role` key
- ⚠️ Gunakan password yang kuat
- ✅ Hapus `.env.local` setelah setup jika di-shared environment

