# Panduan deployment Cloudflare PFI (tahap migrasi)

## Status

Worker tahap migrasi tersedia di `worker/index.js`. Endpoint yang sudah dipindahkan ke Worker:

- `GET /api/health`
- `GET /api/session` (profil D1, kelompok pengguna, dan riwayat hisab)
- `GET /api/posts` (laporan rukyat pending hanya terlihat oleh pemilik dan reviewer/admin; publik melihat laporan terverifikasi)
- `POST /api/posts` (postingan diskusi dan laporan rukyat terstruktur)
- `POST /api/posts/:id/photo` (validasi JPEG/PNG/WebP dan penyimpanan R2, maksimal 3 MB)
- `GET /api/photos/:id`
- `POST /api/posts/:id/like`
- `POST /api/posts/:id/comments`
- `GET /api/groups`
- `POST /api/groups/:id` (gabung/keluar kelompok)
- `POST /api/hisab`

Endpoint yang belum dipindahkan mencakup registrasi/login lokal (login tetap melalui Supabase Auth), pembaruan profil dan preferensi, pengajuan verifikasi anggota, seluruh moderasi/review, detail anggota dan koordinator kelompok, posting per kelompok, serta agenda kelompok. Endpoint yang belum tersedia mengembalikan HTTP 501.

**Jangan arahkan domain produksi ke Worker ini dan jangan merge/deploy sebagai pengganti Express dulu.** Masih diperlukan port endpoint yang tersisa, pengujian runtime, migrasi data SQLite lama, pemeriksaan hak akses, dan uji end-to-end.

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


## Laporan rukyat terstruktur (tambahan tahap 1)

Worker menerima `POST /api/posts` untuk pengguna yang token Supabase-nya valid. Untuk `type=rukyat`, judul, isi, kota, lintang, bujur, dan waktu pengamatan wajib valid. Cuaca, instrumen, kondisi visibilitas, serta elevasi disimpan sebagai metadata JSON pada kolom `posts.details`. Laporan baru berstatus `pending`; endpoint moderasi belum tersedia sehingga status tidak dapat diubah melalui Worker tahap ini.

UI `src/pages/Laporan.jsx` menyediakan formulir pengamatan dan pengisian koordinat melalui izin GPS perangkat. Foto dapat diunggah ke R2 melalui endpoint lampiran setelah laporan berhasil dibuat. UI `src/pages/PetaRukyat.jsx` hanya menampilkan koordinat dari laporan yang benar-benar tersimpan; belum berupa peta interaktif.

### Pemeriksaan yang masih wajib

- Jalankan test dan build dari branch ini.
- Uji D1 lokal dengan migration `0001_initial.sql`.
- Uji laporan tanpa token (harus 401), data koordinat invalid (harus 400), dan laporan valid (harus 201).
- Pastikan waktu yang dikirim adalah ISO UTC dan tampilan mengonversi ke zona waktu perangkat.
- Jangan deploy ke produksi sampai moderasi, endpoint lama yang tersisa, dan migrasi data selesai.


### Validasi posting ke kelompok

Saat membuat posting dengan `groupId`, Worker memeriksa bahwa kelompok tersebut benar-benar ada dan pengguna merupakan anggota kelompok. Admin dapat membuat posting ke kelompok tanpa membership biasa. Permintaan dengan kelompok yang tidak ada ditolak sebagai HTTP 400; pengguna yang bukan anggota ditolak sebagai HTTP 403.