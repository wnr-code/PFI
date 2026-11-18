# Panduan deployment Cloudflare PFI (tahap migrasi)

## Status

Worker tahap migrasi tersedia di `worker/index.js`. Endpoint yang sudah dipindahkan:

- `GET /api/health`
- `GET /api/session` (profil D1, kelompok pengguna, dan riwayat hisab)
- `PUT /api/profile` dan `PUT /api/preferences`
- `POST /api/hisab`
- `GET /api/posts` dan `POST /api/posts`
- `POST /api/posts/:id/photo` dan `GET /api/photos/:id` (R2; JPEG/PNG/WebP maksimal 3 MB)
- `POST /api/posts/:id/like` dan `POST /api/posts/:id/comments`
- `GET /api/groups`, `POST /api/groups/:id`
- `GET /api/groups/:id/members`, `GET /api/groups/:id/posts`, `POST /api/groups/:id/coordinator`
- `POST /api/verification`
- `GET /api/moderation` dan `POST /api/moderation/:entity/:id`
- `GET /api/agendas`, `GET /api/agendas/:id`, `POST /api/agendas`, `DELETE /api/agendas/:id`

Laporan rukyat berstatus `pending` hanya dapat dilihat oleh pemiliknya dan reviewer/admin. Pengunjung umum hanya melihat laporan rukyat yang sudah `verified`.

**Jangan arahkan domain produksi ke Worker ini dan jangan merge/deploy sebagai pengganti Express dulu.** Seluruh endpoint di atas baru dipindahkan secara statis; belum ada bukti tes runtime. Migrasi data SQLite lama, pemeriksaan hak akses end-to-end, dan uji beban juga belum dilakukan.

## Persiapan Cloudflare

1. Pastikan D1 database `pfi-falaq` dan R2 bucket `pfi-falaq-r2` memang milik proyek ini.
2. Pastikan database ID di `wrangler.toml` cocok dengan dashboard Cloudflare akun yang akan digunakan.
3. Atur Worker runtime variables/secrets secara terpisah dari Vite build variables:
   - `SUPABASE_URL`: URL proyek Supabase.
   - `SUPABASE_ANON_KEY`: publishable/anon key yang sesuai proyek (bukan service_role key).
   Variabel `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `VITE_API_URL` hanya untuk proses build frontend; variabel `VITE_*` tidak otomatis tersedia di runtime Worker.
4. Jangan pernah menaruh Supabase service-role key di frontend atau repository.
5. Konfigurasi OAuth Google dan URL callback tetap dilakukan pada Supabase Auth.

## Pengujian lokal

Jalankan dari root repository:

```sh
npm ci
npm test
npm run build
npx wrangler d1 migrations apply pfi-falaq --local
npx wrangler dev
```

Buka endpoint `/api/health` pada alamat lokal Wrangler. Uji login dan hisab setelah secrets tersedia di lingkungan lokal. Jangan jalankan migrasi remote sebelum migrasi lokal dan backup ditinjau.

## Deployment (belum untuk produksi)

Setelah seluruh endpoint selesai dipindahkan dan semua pengujian lulus:

```sh
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler d1 migrations apply pfi-falaq --remote
npm run build
npx wrangler deploy
```

Perintah migrasi remote mengubah database Cloudflare. Buat backup dan review skema terlebih dahulu.

## Catatan autentikasi

Worker memvalidasi access token dengan endpoint Supabase Auth `/auth/v1/user`, lalu menyimpan profil aplikasi di D1. Role otorisasi dibaca dari D1, bukan dari `user_metadata` yang dapat diubah pengguna. Role awal adalah `observer`; penetapan reviewer/admin harus dilakukan melalui proses admin terkontrol setelah mekanisme administrasi tersedia.

## Catatan konfigurasi frontend

File `.env.production` berisi URL dan publishable key Supabase untuk proses build Vite. Publishable/anon key memang bukan secret, tetapi jangan pernah memasukkan service-role key atau credential privat ke variabel `VITE_*`. API memakai same-origin URL secara default.


## Catatan laporan rukyat dan komunitas

UI `src/pages/Laporan.jsx` menyediakan formulir laporan dengan koordinat GPS, waktu, cuaca, instrumen, visibilitas, elevasi, dan unggahan foto. Foto dipindahkan ke R2 setelah laporan tersimpan. Halaman komunitas mengarahkan laporan rukyat ke formulir khusus agar data wajib tidak terlewat.

### Validasi posting ke kelompok

Saat membuat posting dengan `groupId`, Worker memeriksa bahwa kelompok tersebut benar-benar ada dan pengguna merupakan anggota kelompok. Admin dapat membuat posting ke kelompok tanpa membership biasa. Permintaan dengan kelompok yang tidak ada ditolak sebagai HTTP 400; pengguna yang bukan anggota ditolak sebagai HTTP 403.