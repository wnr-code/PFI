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

## Status implementasi

- **Sudah tersedia:** koreksi data hilal halaman 41–43, meliputi tinggi geosentris, paralaks, refraksi, dip, semidiameter, tinggi toposentris, elongasi, muktsul, beda azimut, beda tinggi, dan jarak sudut.
- **Masih hibrida:** nilai Nurul Hilal saat ini memakai fraksi fase Astronomy Engine. Rumus dan tabel anomali kitab (`A` dan `m`) belum ditranskripsi penuh, sehingga keluaran ini wajib diberi label ephemeris hibrida dan tidak boleh diklaim sebagai Nurul Hilal tabel asli kitab.
- **Sudah diuji:** contoh akhir Ramadan 1434 H di Trianggulasi Palengkung, Banyuwangi, halaman 39–43; aljabar rantai koreksi, elongasi toposentris, beda tinggi, dan jarak sudut juga memiliki pemeriksaan regresi.
- **Jejak keluaran:** laporan mempertahankan nilai awal `hc`, `HP`, `P`, nilai antara `hc − P`, status penerapan koreksi lanjutan, setiap komponen koreksi, elongasi, beda azimut/tinggi, jarak sudut, muktsul, serta perkiraan Bulan terbenam.
- **Ephemeris dasar:** masih memakai Astronomy Engine agar model dapat digunakan untuk tanggal dan lokasi umum secara stabil.
- **Belum selesai:** transkripsi seluruh tabel tahun/bulan dan delapan ta’dil ijtimak halaman 223 dan seterusnya.
- **Belum selesai:** metode gerhana Matahari global/lokal dan gerhana Bulan dari tabel kitab.
- **Batas perbandingan:** selisih antarmodel pada UI hanya diagnostik. Selisih tersebut bukan skor akurasi atau keputusan bahwa suatu model benar/salah karena definisi koreksi tingginya tidak identik.
- **Gerhana modern:** status LIVE memakai waktu kontak Astronomy Engine dan ketinggian benda langit untuk lokasi pengguna; ilustrasi tidak menjadi sumber data ilmiah.

Bagian yang belum selesai tidak boleh diberi label sebagai implementasi penuh Ad-Durrul Aniq. Setiap tahap berikutnya harus memiliki data tabel terstruktur, rujukan halaman, dan pengujian terhadap contoh kitab sebelum ditampilkan sebagai hasil resmi model kitab.
