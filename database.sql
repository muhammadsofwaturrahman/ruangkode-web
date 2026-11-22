-- ==========================================================
-- DATABASE SCHEMA & SEED DATA: RUANGKODE PLATFORM KURSUS
-- File berada di root repository (di luar folder src/app)
-- Password semua akun dummy di bawah adalah: password123
-- (Sudah di-hash menggunakan bcryptjs 10 rounds)
-- ==========================================================

DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS content_progress CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS contents CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Tabel Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    teacher_status VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (teacher_status IN ('none', 'pending', 'approved', 'rejected')),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    nama_course VARCHAR(200) NOT NULL,
    deskripsi TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NULL,
    end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Contents (Materi Pembelajaran Berurutan)
CREATE TABLE contents (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    judul VARCHAR(200) NOT NULL,
    isi_materi TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Enrollments (Pendaftaran Student ke Course)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- 6. Tabel Content Progress (Pelacakan Materi Selesai / Mark as Done)
CREATE TABLE content_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, content_id)
);

-- 7. Tabel Comments (Forum Diskusi di Bawah Tiap Materi)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Certificates (Sertifikat Digital Otomatis saat Progres 100%)
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    certificate_code VARCHAR(50) UNIQUE NOT NULL,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- ==========================================================
-- SEED DUMMY DATA
-- Password plaintext untuk semua akun di bawah: password123
-- ==========================================================

INSERT INTO users (username, email, password, role, teacher_status, approved_at) VALUES
('Admin RuangKode', 'admin@ruangkode.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', 'none', NULL),
('Budi Santoso', 'budi.teacher@ruangkode.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'teacher', 'approved', NOW() - INTERVAL '5 days'),
('Siti Aminah', 'siti.teacher@ruangkode.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'teacher', 'approved', NOW() - INTERVAL '2 hours'),
('Andi Pratama', 'andi.student@ruangkode.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', 'none', NULL),
('Rina Calon Guru', 'rina.pending@ruangkode.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student', 'pending', NULL);

INSERT INTO categories (name, description) VALUES
('Web Development', 'Pengembangan aplikasi web modern frontend dan backend'),
('Data Science', 'Analisis data, machine learning, dan visualisasi data'),
('UI/UX Design', 'Perancangan antarmuka pengguna dan pengalaman pengguna'),
('Database & Cloud', 'Manajemen basis data relasional dan infrastruktur cloud');

INSERT INTO courses (nama_course, deskripsi, category_id, teacher_id, start_date, end_date) VALUES
('Fullstack Next.js & PostgreSQL', 'Belajar membangun aplikasi web modern dengan Next.js App Router, Tailwind CSS, dan Raw SQL PostgreSQL dari nol hingga deployment.', 1, 2, NULL, NULL),
('Fundamental SQL & Desain Database', 'Kuasai perancangan ERD, normalisasi tabel, dan penulisan query SQL tingkat lanjut di PostgreSQL.', 4, 2, '2026-11-01', '2026-12-31'),
('UI/UX Design dengan Tailwind CSS', 'Teknik merancang antarmuka web responsif, hierarki visual, dan komponen modern menggunakan Tailwind CSS.', 3, 3, NULL, NULL),
('Python untuk Data Science Pemula', 'Pengenalan pengolahan data tabular menggunakan Pandas, NumPy, dan dasar statistik.', 2, 3, '2026-11-15', '2027-01-15');

INSERT INTO contents (course_id, judul, isi_materi, order_index) VALUES
(1, 'Pengenalan Arsitektur Next.js App Router', 'Next.js App Router menggunakan pendekatan Server Components secara default sehingga query database aman dijalankan langsung di server tanpa mengekspos kredensial ke browser.', 1),
(1, 'Koneksi PostgreSQL dengan Raw SQL (pg)', 'Library node-postgres (pg) mengeksekusi query SQL mentah secara aman menggunakan parameterized queries ($1, $2) untuk mencegah celah keamanan SQL Injection.', 2),
(1, 'Autentikasi & Middleware di Next.js', 'Middleware berjalan di Edge Runtime sebelum halaman dimuat, membaca JWT dari HTTP-Only Cookie tanpa membuka koneksi TCP PostgreSQL secara langsung.', 3),
(2, 'Konsep Relasi Tabel & Foreign Key', 'Integritas referensial dalam basis data relasional dijaga menggunakan Primary Key dan Foreign Key dengan aturan ON DELETE CASCADE atau SET NULL.', 1),
(2, 'Query Agregasi: COUNT, SUM, dan GROUP BY', 'Fungsi agregasi digunakan untuk meringkas data, seperti menghitung jumlah siswa yang mendaftar pada setiap kursus populer.', 2),
(3, 'Prinsip Dasar Utility-First CSS', 'Tailwind CSS menyediakan kelas utilitas tingkat rendah untuk membangun antarmuka responsif langsung di dalam markup JSX.', 1);

INSERT INTO enrollments (student_id, course_id) VALUES
(4, 1),
(4, 2),
(5, 1);

INSERT INTO content_progress (student_id, content_id) VALUES
(4, 1);

INSERT INTO comments (content_id, user_id, comment_text) VALUES
(1, 4, 'Penjelasan mengenai Server Component sangat mudah dipahami!'),
(1, 2, 'Terima kasih Andi! Pastikan query SQL selalu dijalankan di server ya.');