# Audit & Roadmap Migrasi PFI ke Cloudflare

Tanggal audit: 2026-11-19  
Repository: https://github.com/wnr-code/PFI  
Branch kerja: `audit/cloudflare-workers-migration`

## Temuan baseline sebelum migrasi

Bagian ini mencatat kondisi awal saat audit dimulai, bukan seluruh kondisi branch saat ini.

## Ringkasan temuan terverifikasi

1. **Runtime backend belum kompatibel dengan Workers.** `package.json` menjalankan Express melalui `server/start.mjs`; `server/database.mjs` menggunakan `node:sqlite`, `node:fs`, dan `node:path`. Wrangler config saat ini hanya mendeklarasikan binding D1/R2, tetapi tidak menunjuk entrypoint Worker yang mengimplementasikan API.
2. **Dua sistem autentikasi tidak tersambung.** Frontend `src/lib/api.js` memperoleh access token Supabase dan mengirim `Authorization: Bearer ...`; backend `server/api.mjs` tidak memvalidasi bearer token, malah membaca cookie `pfi_session` yang dibuat oleh endpoint login lokal. Akibatnya kontrak autentikasi frontend dan backend tidak cocok. UI mengandalkan Supabase session sementara API mengharapkan akun di tabel lokal.
3. **Skema D1 tidak sesuai dengan backend saat ini.** `schema.sql` mendefinisikan `users`, `groups`, `group_members`, `agendas`, dan `reports`. Database yang dibuat `server/database.mjs` memakai `accounts`, `sessions`, `calculations`, `posts`, `photos`, `likes`, `comments`, `memberships`, `reviews`, `group_coordinators`, dan `agendas`.
4. **Upload foto belum memakai R2.** Backend menyimpan bytes foto pada kolom BLOB `photos.original` di SQLite. Binding R2 di Wrangler belum dipakai dalam jalur upload.
5. **Peta rukyat memuat data contoh lokal.** `src/pages/PetaRukyat.jsx` memiliki array contoh dua laporan, sehingga belum membuktikan peta berbasis data laporan nyata.
6. **Build/deploy belum terbukti.** Konfigurasi proyek mengandung `[pages]` dan binding Worker, tetapi script build berjalan dengan esbuild khusus dan API dev masih Express. Belum ada bukti CI atau pengujian terhadap runtime Workers/D1/R2.
7. **Keamanan perlu ditinjau ulang saat migrasi.** Middleware backend memakai `X-PFI-Request` sebagai pembatas permintaan mutasi, session cookie lokal, throttle berbasis Map in-memory, dan validasi berbasis Express. Semua ini harus dipindah ke strategi Worker: autentikasi token terverifikasi, kontrol akses per-resource, proteksi CSRF/origin untuk cookie (bila dipakai), rate limiting yang tidak mengandalkan Map per-isolate, dan batas ukuran upload R2.
8. **Tata kelola peran perlu dibakukan.** Role backend mencakup `observer` dan `reviewer`; UI serta schema D1 lama menyebut `member`, `koordinator`, `admin`. Matriks izin perlu diputuskan dan ditegakkan di sisi server, bukan dari metadata user yang dapat diedit klien.

## Perbaikan audit lanjutan pada branch kerja

- Worker memvalidasi access token melalui endpoint Supabase Auth dan mengambil role/status verifikasi dari profil D1; metadata role dari browser tidak dipercaya.
- Akses laporan rukyat pending dibatasi ke pemilik dan reviewer/admin. Catatan verifikasi tidak dikirim ke publik.
- Akses postingan, komentar, like, anggota kelompok, dan foto grup dibatasi dengan pemeriksaan keanggotaan. Data email anggota tidak diekspos ke daftar anggota.
- Cache offline hanya menyimpan postingan publik yang bukan milik grup dan laporan rukyat yang sudah terverifikasi. Peta nasional juga hanya menampilkan rukyat terverifikasi.
- Metadata rukyat mewajibkan koordinat numerik dalam rentang bumi, waktu ISO dengan zona waktu, serta elevasi yang valid; waktu dinormalisasi ke UTC.
- Upload R2 membatasi ukuran, memeriksa signature JPEG/PNG/WebP, dan menyimpan metadata/hash tanpa membuka objek privat.
- UI login/registrasi, preferensi, pengajuan verifikasi, antrean moderasi reviewer/admin, like, komentar, foto privat dengan bearer token, dan agenda telah dihubungkan ke endpoint yang tersedia.
- Hisab saat ini hanya menerima metode MABIMS. Posisi hilal dihitung pada sunset lokal; tinggi memakai koordinat topocentric dengan refraction normal dan elongasi geocentric. Tampilan membedakan pemenuhan kriteria dari klaim hilal benar-benar terlihat.
- Dashboard memakai peristiwa astronomi dinamis, bukan tanggal contoh lama. Kalender tetap menandai Umm al-Qura sebagai referensi, bukan penetapan resmi Indonesia.

## Fitur UI yang masih perlu diselesaikan

- UI sudah mendukung pembuatan kelompok oleh admin, bergabung/keluar, dan diskusi privat kelompok. Direktori anggota, penunjukan koordinator melalui UI, agenda kelompok, dan moderasi khusus kelompok masih perlu diselesaikan.
- Pembuatan dan pengelolaan agenda kelompok belum memiliki formulir UI lengkap.
- Peta rukyat saat ini berupa daftar koordinat dan tautan peta, belum peta interaktif.
- Preferensi notifikasi sudah tersimpan, tetapi pengiriman push/email otomatis belum diaktifkan.
- Lokasi hisab yang tersedia masih berupa daftar titik acuan proyek; perlu diverifikasi/ditambah dari data geospasial resmi dan dapat diperluas dengan input koordinat pengamat.
- Hisab yang tampil menghitung lokasi terpilih; belum menghitung keputusan nasional multi-titik pada seluruh titik observasi MABIMS.

## Status validasi dan pekerjaan yang belum selesai

- Tes tambahan telah ditulis untuk otorisasi grup, metadata rukyat, waktu sunset, dan elongasi Bulan.
- **CI untuk head terbaru belum terkonfirmasi.** Run sukses yang sebelumnya tercatat berasal dari commit lama; jangan menyatakan branch terbaru lulus build/test sebelum workflow terbaru terlihat sukses.
- Belum ada uji integrasi terhadap D1/R2 aktual, OAuth end-to-end, migrasi data SQLite lama, backup/restore, atau uji beban.
- Fixture sanity-check Syawal 1443 (1 Mei 2022) telah ditambahkan dengan rentang pembanding publik Kemenag; tetap perlu validasi independen yang lebih luas untuk beberapa bulan, lokasi, dan kondisi dekat ambang MABIMS sebelum hasil dipakai sebagai rujukan operasional.
- Akun admin pertama harus ditetapkan melalui prosedur operator yang terkontrol di D1; tidak ada endpoint self-service untuk menaikkan role. Prosedur bootstrap admin perlu didokumentasikan sebelum produksi.
- Rate limiting terdistribusi, observability, backup terjadwal, dan prosedur rollback masih perlu disiapkan.

## Keputusan arsitektur target

- React 19 + Vite dipertahankan.
- API dipindahkan ke Cloudflare Worker (modul `fetch(request, env, ctx)`).
- D1 menjadi sumber data relasional utama.
- R2 untuk foto dan dokumen; D1 hanya menyimpan metadata/object key/hash.
- Satu otoritas autentikasi. Rekomendasi migrasi: Supabase Auth boleh dipertahankan sementara sebagai identity provider, Worker wajib memverifikasi access token di server sebelum membuat/mengambil profil D1. Evaluasi penggantian provider hanya setelah seluruh route dan alur UI termigrasi. Jangan menggabungkan Supabase Auth dengan sistem password/session lokal.
- D1 migrations versioned; jangan memakai `schema.sql` sebagai skema kedua yang tak terhubung.
- Deploy Worker + static assets terintegrasi dari satu konfigurasi Wrangler; hapus ketergantungan Express/node:sqlite pada production path.
- Jangan menyimpan rahasia OAuth/JWT dalam variabel `VITE_*`. Publishable/anon key yang memang publik boleh berada di frontend, tetapi semua secret ada di Worker secrets.

## Urutan implementasi yang aman

### P0 — Kontrak dan keamanan
- Dokumentasikan seluruh endpoint dan request/response.
- Tetapkan satu identitas pengguna dan satu sumber role.
- Implementasikan validasi bearer JWT di Worker (issuer, audience, signature/JWKS, expiry).
- Terapkan otorisasi per laporan, grup, agenda, moderation, komentar, foto.
- Tambahkan migrasi D1 berdasarkan skema operasional aktual, bukan hanya skema awal yang tak cocok.

### P1 — Port backend
- Port route `/health`, `/session`, `/hisab`, `/posts`, `/photos`, `/groups`, `/agendas`, `/verification`, `/moderation` secara bertahap ke Worker.
- Ganti SQL synchronous dengan D1 prepared statements.
- Ganti throttle in-memory dengan Cloudflare Rate Limiting binding atau layanan terdistribusi yang sesuai.
- Pindahkan foto dari BLOB ke R2; gunakan object key acak, validasi MIME dan signature, limit ukuran, dan authorization saat download.
- Pastikan transaksi multi-statement memakai D1 batch/transaction pattern yang didukung.

### P2 — Frontend dan pengalaman
- Ubah API helper agar base URL same-origin dan kontrak bearer token konsisten.
- Tambahkan status loading/error/retry yang jelas; offline cache hanya sebagai cache, bukan sumber kebenaran.
- Ganti data contoh peta rukyat dengan endpoint laporan yang terverifikasi/terfilter.
- Pastikan laporan memiliki status pending/verified/revision, lokasi, koordinat, waktu lokal dan UTC, instrumen, cuaca, metadata foto, serta jejak verifikasi.
- Selesaikan validasi perhitungan astronomi dengan fixture independen dan dokumentasikan skala waktu, zona waktu, koordinat, metode, parameter, dan versi engine.

### P3 — verifikasi sebelum rilis
- Unit tests untuk helper, auth, role, hisab.
- Integration tests D1/R2 menggunakan runtime lokal Workers.
- E2E tests untuk pendaftaran/login, hisab, kirim laporan, upload, moderasi, komunitas, dan offline.
- Build, lint/typecheck (tambahkan bila belum ada), dependency audit, dan pemeriksaan secrets.
- Uji migrasi data/rollback dan backup sebelum deploy produksi.

## Batasan audit saat ini

Audit ini berbasis pembacaan source code, tes unit yang ditambahkan, dan status workflow yang dapat diakses. Belum ada bukti uji integrasi D1/R2, E2E, migrasi D1 remote, atau deployment produksi. CI untuk head terkini belum terkonfirmasi; karena itu belum ada klaim bahwa seluruh fitur siap produksi.
