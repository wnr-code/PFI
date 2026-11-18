# Panduan deployment Cloudflare PFI (tahap migrasi)

## Status

Worker tahap 1 tersedia di `worker/index.js`. Endpoint yang sudah dipindahkan:

- `GET /api/health`
- `GET /api/session`
- `GET /api/posts` (baca daftar posting)
- `GET /api/groups`
- `GET /api/photos/:id` (baca objek yang metadata dan object key-nya tersedia di D1/R2)
- `POST /api/hisab` (perhitungan dengan Astronomy Engine dan penyimpanan riwayat bagi pengguna terautentikasi)

Endpoint lain sengaja mengembalikan HTTP 501 sampai implementasi Worker-nya selesai. **Jangan arahkan domain produksi ke Worker ini dan jangan merge/deploy sebagai pengganti Express dulu**, karena fitur tulis posting, upload foto, moderasi, grup, agenda, komentar, dan likes belum dimigrasikan.

## Persiapan Cloudflare

1. Pastikan D1 database `pfi-falaq` dan R2 bucket `pfi-falaq-r2` memang milik proyek ini.
2. Pastikan database ID di `wrangler.toml` cocok dengan dashboard Cloudflare akun yang akan digunakan.
3. Atur Worker secrets:
   - `SUPABASE_URL`: URL proyek Supabase.
   - `SUPABASE_ANON_KEY`: publishable/anon key yang sesuai proyek (bukan service_role key).
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

UI `src/pages/Laporan.jsx` menyediakan formulir pengamatan dan pengisian koordinat melalui izin GPS perangkat. Foto belum dapat diunggah pada tahap ini. UI `src/pages/PetaRukyat.jsx` hanya menampilkan koordinat dari laporan yang benar-benar tersimpan; belum berupa peta interaktif.

### Pemeriksaan yang masih wajib

- Jalankan test dan build dari branch ini.
- Uji D1 lokal dengan migration `0001_initial.sql`.
- Uji laporan tanpa token (harus 401), data koordinat invalid (harus 400), dan laporan valid (harus 201).
- Pastikan waktu yang dikirim adalah ISO UTC dan tampilan mengonversi ke zona waktu perangkat.
- Jangan deploy ke produksi sampai upload R2, moderasi, semua endpoint lama, dan migrasi data selesai.
