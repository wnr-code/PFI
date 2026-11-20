# PFI — Platform Falak Indonesia

Ruang observasi digital untuk hisab awal bulan, simulasi hilal, peta rukyat, dan kolaborasi komunitas pengamat di Indonesia.

## Informasi proyek

- Dibuat/diperbarui: **19 November 2026**
- Dibuat oleh: **AEP**
- GitHub: [https://github.com/wnr-code/PFI](https://github.com/wnr-code/PFI)
- Maintainer / pengelola repository: [@wnr-code](https://github.com/wnr-code)
- Dukung pengembang: [https://trakteer.id/lanteraku/tip](https://trakteer.id/lanteraku/tip)

## Sub-proyek

- **Undangan pernikahan digital** (Cloudflare Workers + D1, terpisah dari aplikasi falak): lihat [`undangan/README.md`](undangan/README.md).

## Arsitektur data

- Supabase hanya digunakan untuk autentikasi Google dan pengelolaan sesi identitas.
- Cloudflare Worker menangani API aplikasi.
- Cloudflare D1 menyimpan data terstruktur.
- Cloudflare R2 menyimpan foto dan berkas pengguna.

## Pengembangan lokal

```bash
npm install
npm run build
npm run test:all
npm run dev
```

## Lisensi dan kontribusi

Silakan gunakan GitHub Issues pada repository utama untuk laporan masalah, usulan fitur, dan kontribusi kode.
