# Referensi Perhitungan PFI

Dokumen di direktori ini menjadi bahan rujukan untuk menelusuri, menerapkan, dan menguji metode perhitungan dalam aplikasi PFI.

## Ad-Durrul Aniq

- **Berkas:** [`terjemah-ad-durrul-aniq.pdf`](./terjemah-ad-durrul-aniq.pdf)
- **Topik:** penentuan hilal serta gerhana Bulan dan Matahari dengan hisab.
- **SHA-256:** `9882edf5532948296307be40eb5cb88f8c2ca0ad2381b623c502ed1818e6a294`

## Aturan penggunaan dalam kode

1. Setiap rumus yang diterapkan dari kitab harus mencantumkan bab atau halaman sumber dalam komentar kode dan dokumentasi teknis.
2. Istilah, satuan, urutan koreksi, pembulatan, serta sistem waktu harus ditranskripsikan secara eksplisit; jangan menebak bagian yang ambigu.
3. Hasil implementasi harus diuji menggunakan contoh perhitungan dari kitab apabila tersedia.
4. Perbedaan antara hasil kitab, algoritme astronomi modern, dan kebijakan resmi harus ditampilkan secara transparan, bukan disamarkan.
5. Perubahan metode hisab wajib melalui pengujian regresi sebelum diterapkan ke Production.

Dokumen PDF disimpan sebagai sumber primer yang diberikan untuk pengembangan proyek. Keberadaannya di repositori tidak berarti seluruh perhitungan aplikasi saat ini telah diverifikasi terhadap setiap halaman kitab; verifikasi dilakukan bertahap dan harus dicatat dalam kode serta pengujian.
