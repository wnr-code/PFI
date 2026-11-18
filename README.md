# Pusat Falak Indonesia (PFI)

**Menghubungkan Ilmu, Mengamati Semesta, Menyatukan Umat.**

PFI adalah ruang digital untuk pembelajaran ilmu falak, perhitungan awal bulan Hijriah, astronomi, komunitas, dan dokumentasi pengamatan hilal di Indonesia.

## Fitur aplikasi
- Dashboard informasi falak dan astronomi.
- Hisab awal bulan Hijriah.
- Simulasi astronomi dan fase Bulan.
- Kalender Hijriah.
- Peta dan laporan rukyat.
- Komunitas, diskusi, dan berbagi informasi.
- Profil pengamat serta alur verifikasi laporan.

## Teknologi
- React + Vite untuk antarmuka.
- Cloudflare Workers untuk API (migrasi bertahap).
- Cloudflare D1 untuk data aplikasi.
- Cloudflare R2 untuk penyimpanan berkas/foto.
- Supabase Auth untuk autentikasi pengguna.

## Status pengembangan
Proyek sedang dalam proses migrasi backend ke Cloudflare. Worker pada branch pengembangan baru mencakup sebagian endpoint. **Jangan gunakan Worker migrasi sebagai backend produksi sebelum seluruh endpoint, upload R2, moderasi, migrasi data, dan pengujian integrasi selesai.**

Lihat [panduan deployment dan status migrasi](CLOUDFLARE_DEPLOYMENT.md).

## Pengembangan
Jalankan `npm ci` lalu `npm run dev` untuk pengembangan lokal.
Untuk pemeriksaan, jalankan `npm run build` dan `npm test`.
Jangan pernah menyimpan service-role key, token privat, atau rahasia server ke dalam kode frontend maupun repository.

## Identitas proyek dan dukungan
- GitHub: https://github.com/wnr-code/PFI
- Maintainer / pengelola repository: [@wnr-code](https://github.com/wnr-code)
- Dukung pengembangan PFI: https://trakteer.id/lanteraku/tip

Kontribusi kode dan pengembangan proyek dapat dilakukan melalui repository GitHub. Sebagian pengembangan dibantu oleh perangkat AI; keputusan arsitektur, peninjauan, pengujian, dan pengelolaan rilis tetap menjadi tanggung jawab maintainer proyek.

---
**Pusat Falak Indonesia — PFI**