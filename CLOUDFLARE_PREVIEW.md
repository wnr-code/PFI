# Cloudflare Worker Preview — PFI

Gunakan **satu Worker saja: `pfi`**. Preview dibuat dari branch Git menggunakan fitur Worker Previews Cloudflare; jangan membuat Worker kedua bernama `pfi-preview`.

## Pengaturan Workers Builds

Hubungkan Worker `pfi` ke repository `wnr-code/PFI`.

- Production branch: `main` (sesuaikan dengan branch Production yang benar di Dashboard).
- Root directory: `/`
- Build command: `npm run build`
- Production deploy command: `npx wrangler@4.165.0 deploy`
- Preview command: `npx wrangler@4.165.0 preview`

Preview command membuat/memperbarui Preview untuk branch non-Production. Nama Preview secara default mengikuti nama branch Git.

## Domain Preview

Gunakan domain dasar yang sudah dipakai Worker: `pfi.cgs.my.id`.

Di Cloudflare Dashboard, buka Worker `pfi` → **Settings / Domains & Routes** (atau tab **Domains**) → Custom Domains. Aktifkan domain `pfi.cgs.my.id` untuk **Production and Preview**. Jangan mengganti domain Production.

Cloudflare membuat wildcard DNS dan sertifikat untuk hostname Preview. URL Preview akan berbentuk:

- `https://<nama-preview>.pfi.cgs.my.id`
- URL deployment tertentu: `https://<id-deployment>-<nama-preview>.pfi.cgs.my.id`

Jadi `https://*.pfi.cgs.my.id` adalah pola hostname, bukan URL yang dibuka persis dengan tanda bintang. Pastikan hostname Preview yang dihasilkan Cloudflare tampil di bagian Previews sebelum dipakai.

## Resource database dan foto

Konfigurasi root `wrangler.toml` memisahkan resource Production dan Preview:

| Binding | Production | Preview |
|---|---|---|
| D1 `falaq` | `pfi-falaq` | `sanbok-pfi` |
| R2 `r2falaq` | `pfi-falaq-r2` | `forumcgs` |

Jangan mengubah binding Production. Preview memakai resource yang sudah disiapkan dan dimigrasikan; jangan jalankan migrasi lagi tanpa pemeriksaan.

## Environment variables dan secrets

Build variables frontend:
- `VITE_API_URL=/`
- `VITE_SUPABASE_URL`: URL project Supabase yang digunakan aplikasi.
- `VITE_SUPABASE_ANON_KEY`: publishable key Supabase.

Pastikan Preview memakai API same-origin. Atur runtime secrets `SUPABASE_URL` dan `SUPABASE_ANON_KEY` melalui pengaturan Preview Worker, bukan di repository. Jika Dashboard mengelola nilai Preview secara terpisah, pastikan keduanya tersedia di Preview.

## Pemeriksaan setelah Preview dibuat

1. Buka URL Preview yang diberikan Cloudflare, bukan domain Production.
2. Uji `/api/health` dan `/api/groups`.
3. Uji login Google, profil, posting, komentar, likes, dan unggah foto.
4. Pastikan data uji masuk ke D1 `sanbok-pfi` dan foto ke R2 `forumcgs`.

Jangan mengarahkan domain Production ke Preview dan jangan menghapus resource Production.
