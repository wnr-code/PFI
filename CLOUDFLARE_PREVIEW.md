# Cloudflare Workers Preview — PFI

Gunakan file konfigurasi khusus ini untuk Worker Preview yang terpisah dari Production.

## Cloudflare Workers Builds

Buat Worker/project baru bernama `pfi-preview` dari repository `wnr-code/PFI`, branch `preview/workers-build`.

Atur:

- Root directory: `/`
- Build command: `npm run build`
- Deploy command: `npx wrangler@4.165.0 deploy --config wrangler.preview.toml`
- Build variable `VITE_API_URL`: isi dengan satu garis miring `/`. Script build akan mempertahankannya dan frontend akan memakai API same-origin pada Worker Preview.
- Build variables `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`: gunakan URL dan publishable key Supabase yang sudah dipakai aplikasi.
- Worker runtime secrets: `SUPABASE_URL` dan `SUPABASE_ANON_KEY`. Isi melalui pengaturan Worker Preview, jangan commit nilainya ke repository.

## Resource Preview

- D1 binding: `falaq` → database `sanbok-pfi`.
- R2 binding: `r2falaq` → bucket `forumcgs`.

File ini sengaja tidak memuat binding Production. Jangan menambahkan database `pfi-falaq`, bucket `pfi-falaq-r2`, atau mengarahkan domain produksi ke Worker Preview.

## Tes setelah deployment

1. Buka URL `workers.dev` milik Worker Preview.
2. Buka `/api/health`; respons yang diharapkan memuat `status: "ok"` dan `runtime: "cloudflare-workers"`.
3. Buka `/api/groups`; pastikan direktori grup awal terbaca.
4. Lanjutkan tes login, pembuatan profil, posting, foto R2, dan hak akses dengan akun uji.

Konfigurasi ini tidak menjalankan migrasi D1. Database Preview harus sudah dimigrasikan secara terpisah.
