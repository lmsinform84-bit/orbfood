# Setup Environment Variables

Buat file `.env.local` di root project dengan format berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Cara Mendapatkan Credentials:

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Buka **Settings** > **API**
4. Copy nilai berikut:
   - **Project URL** → paste sebagai `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → paste sebagai `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Contoh File .env.local:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example_key_here
```

## Catatan Penting:

- Jangan commit file `.env.local` ke git (sudah ada di .gitignore)
- File `.env.local` hanya untuk development lokal
- Untuk production, set environment variables di Vercel atau platform hosting Anda
- Pastikan tidak ada spasi sebelum atau sesudah `=`

## Troubleshooting:

Jika masih error:
1. Pastikan file `.env.local` ada di root project (sama level dengan `package.json`)
2. Restart development server setelah membuat/mengubah `.env.local`
3. Pastikan format benar (tidak ada spasi, tidak ada tanda kutip)
4. Pastikan URL dan key sudah benar dari Supabase Dashboard

