<p align="center">
  <img src="./rasengan-banner.svg" alt="Bryan, Web Developer" width="100%" />
</p>

## Tentang Saya

Web developer dengan fokus pada pengembangan aplikasi bisnis berbasis web, mencakup perancangan basis data, alur kerja dan hak akses pengguna, pelaporan, keamanan, serta pengujian. Sisi server saya bangun dengan **Laravel** dan **MySQL**, sedangkan antarmuka dengan **TypeScript**, **Tailwind CSS**, HTML, dan CSS.

Dalam setiap proyek, saya mengutamakan keandalan dan keamanan data: validasi input, pengendalian akses berbasis peran, pengujian otomatis sebelum rilis, serta kesiapan operasional seperti pencadangan data dan konfigurasi produksi.

<p align="center">
  <img src="./naruto3-stack.svg" alt="Keahlian: PHP, Laravel, MySQL, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, Git" width="100%" />
</p>

<p align="center"><img src="./divider-chakra.svg" alt="" width="100%" /></p>

## Project

<p align="center">
  <img src="./project-keuangan.svg" alt="Sistem Keuangan Kantor: aplikasi pencatatan keuangan dengan empat peran" width="100%" />
</p>

**Sistem Keuangan Kantor** adalah aplikasi produksi untuk pencatatan keuangan kantor. Repositorinya private karena memuat logika dan data operasional, tetapi garis besar rancangannya sebagai berikut.

| Area | Penjelasan |
|---|---|
| **Peran pengguna** | Empat peran: admin, finance, staf, dan pimpinan. Staf hanya melihat transaksinya sendiri, finance mencatat dan menyetujui, pimpinan memantau, admin mengelola akun. |
| **Alur transaksi** | Uang masuk dan uang keluar melalui persetujuan finance, dengan nomor referensi otomatis, kategori, departemen, dan anggaran per departemen. Saldo awal terbawa antar bulan. |
| **Dokumen** | Laporan PDF dan Excel dengan rumus Excel asli (bukan angka tempelan), buku kas, serta bukti kas siap cetak lengkap dengan terbilang dan kolom tanda tangan. |
| **Keamanan** | Bukti transaksi disimpan privat, password sementara dari admin dengan kewajiban ganti saat login pertama, header keamanan, pembatasan laju, dan penguncian data pada proses yang bersamaan. |
| **Kualitas** | Lebih dari 500 tes otomatis yang dijalankan pada SQLite dan MySQL, termasuk tes hak akses untuk setiap peran. |
| **Kesiapan operasional** | Backup terenkripsi terjadwal beserta pemantauannya, serta konfigurasi produksi yang dipisahkan dari kode (berkas `.env` tidak ikut repositori). |

<p align="center">
  <img src="./project-porto.svg" alt="web-porto: web portofolio pribadi berbasis TypeScript" width="100%" />
</p>

**[web-porto](https://github.com/bryanrumuy/web-porto)** adalah web portofolio pribadi berbasis TypeScript.

<p align="center"><img src="./divider-chakra.svg" alt="" width="100%" /></p>

## Fokus Teknis

<p align="center">
  <img src="./fokus-teknis.svg" alt="Fokus teknis: keamanan aplikasi web, pengujian otomatis, operasional dan deployment" width="100%" />
</p>

- **Keamanan aplikasi web**: pengendalian akses per peran, validasi dan sanitasi input, manajemen sesi, serta pemeriksaan kerentanan dependensi.
- **Pengujian otomatis**: tes fitur, tes hak akses untuk setiap peran, dan tes keamanan yang dijalankan sebelum kode dirilis.
- **Operasional dan deployment**: menyiapkan konfigurasi produksi, backup terenkripsi, dan pemantauan untuk dijalankan pada server terkelola.

## Cara Kerja

1. **Pahami proses bisnisnya** sebelum menulis kode, termasuk siapa melakukan apa dan siapa boleh melihat apa.
2. **Tulis tes untuk perilaku penting**, terutama hak akses dan perhitungan keuangan.
3. **Periksa keamanan sebelum rilis**, bukan sesudahnya.
4. **Dokumentasikan keputusan** supaya aplikasi mudah dirawat orang lain.

<p align="center">
  <img src="./footer-rasengan.svg" alt="Terima kasih sudah berkunjung" width="100%" />
</p>
