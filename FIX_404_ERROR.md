# 🔧 Fix 404 Error - Font dan JS Files

## Masalah:
- `e4af272ccee01ff0-s.p.woff2:1 Failed to load resource: 404`
- `main-app.js:1 Failed to load resource: 404`

## Penyebab:
1. **Multiple dev server running** - Banyak proses `next dev` yang berjalan bersamaan
2. **Corrupted cache** - Cache Next.js (.next folder) rusak
3. **Port conflict** - Multiple server menggunakan port yang sama

## ✅ Solusi (Sudah Diterapkan):

### 1. Kill semua proses Next.js
```bash
pkill -f "next dev"
```

### 2. Clear semua cache
```bash
rm -rf .next node_modules/.cache
```

### 3. Restart dev server
```bash
npm run dev
```

## 📋 Langkah Manual:

Jika masih error, lakukan langkah berikut:

### Step 1: Stop semua dev server
```bash
# Kill semua proses next
pkill -f "next dev"

# Atau kill manual berdasarkan PID
# Check PID: ps aux | grep "next dev"
# Kill: kill -9 <PID>
```

### Step 2: Clear cache
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules cache (optional)
rm -rf node_modules/.cache

# Clear npm cache (optional, jika perlu)
npm cache clean --force
```

### Step 3: Restart dev server
```bash
npm run dev
```

### Step 4: Hard refresh browser
- Tekan `Ctrl + Shift + R` (Linux/Windows)
- Atau `Cmd + Shift + R` (Mac)
- Atau clear browser cache manual

## 🔍 Troubleshooting:

### Masih error setelah restart?

1. **Check port 3000 tidak digunakan:**
   ```bash
   lsof -i :3000
   # Atau
   netstat -tulpn | grep 3000
   ```

2. **Gunakan port lain:**
   ```bash
   PORT=3001 npm run dev
   ```

3. **Check apakah node_modules lengkap:**
   ```bash
   npm install
   ```

4. **Rebuild dari scratch:**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run dev
   ```

## 💡 Tips:

- **Jangan jalankan multiple `npm run dev`** di terminal yang berbeda
- **Selalu stop server** sebelum restart (Ctrl+C)
- **Clear cache** jika ada perubahan di config atau font
- **Hard refresh browser** setelah restart server

## ⚠️ Jika Error Font Terus Muncul:

Font error biasanya tidak critical, tapi jika mengganggu:

1. **Check font loading di layout.tsx:**
   ```tsx
   const inter = Inter({ subsets: ['latin'] });
   ```

2. **Atau disable font optimization sementara:**
   ```tsx
   const inter = Inter({ 
     subsets: ['latin'],
     display: 'swap',
   });
   ```

3. **Atau gunakan system font:**
   ```tsx
   // Remove font import, use system font
   body {
     font-family: system-ui, -apple-system, sans-serif;
   }
   ```

---

**Status:** ✅ Cache sudah di-clear, restart dev server sekarang.

