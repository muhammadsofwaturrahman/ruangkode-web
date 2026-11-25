# RuangKode

Platform kursus coding (Tugas Final Praktikum Pemrograman Web 2026, Project 4).
Dibangun dengan Next.js (App Router, JSX), Tailwind CSS, dan PostgreSQL dengan raw SQL (`pg`).

## Menjalankan

1. Buat database kosong bernama `platform_kursus` di PostgreSQL.
2. Jalankan `database.sql` (lewat pgAdmin Query Tool atau `psql -d platform_kursus -f database.sql`).
3. Salin `.env.example` menjadi `.env.local`, lalu isi `DATABASE_URL` dan `SESSION_SECRET`.
4. Pasang dependensi dan jalankan:

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Cek koneksi database di http://localhost:3000/api/health.

Font Plus Jakarta Sans dimuat dari Google Fonts lewat browser, jadi butuh internet saat halaman dibuka.

## Akun contoh

Semua akun memakai password `password123`.

| Role | Email |
| --- | --- |
| Admin | admin@ruangkode.com |
| Teacher | budi.teacher@ruangkode.com |
| Teacher (baru di-approve, memicu pesan Welcome Teacher) | siti.teacher@ruangkode.com |
| Student | andi.student@ruangkode.com |
| Student, pendaftar Teacher (pending) | rina.pending@ruangkode.com |

Pesan Welcome Teacher hanya muncul 24 jam setelah `approved_at`. Jika sudah lewat, jalankan ulang `database.sql`.

## Fitur

- Login dan register (pilihan Student atau Teacher; pendaftar Teacher berstatus pending sampai di-approve Admin).
- Beranda dengan 5 kursus terpopuler, pencarian, dan filter kategori.
- Katalog dengan kartu pintar (Ikuti kursus atau Lanjutkan belajar beserta progres) dan tombol hubungi pengajar.
- Halaman belajar berurutan, Mark as Done, tombol lanjut, dan forum diskusi per bab.
- Sertifikat otomatis saat progres 100% dengan kode unik yang bisa diverifikasi di `/certificates/<kode>`.
- Dashboard Teacher: CRUD kursus dan materi berurutan, pantau progres siswa.
- Dashboard Admin: CRUD pengguna (pagination dan filter role), verifikasi Teacher, CRUD kursus, CRUD kategori.
