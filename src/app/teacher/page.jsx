import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import TeacherClient from "./TeacherClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Teacher" };

export default async function TeacherPage() {
  const session = await getSession();
  if (!session) {
    redirect("/api/auth/logout");
  }

  // Ambil role terbaru & cek apakah baru di-approve (< 24 jam)
  const userRes = await pool.query(
    `SELECT role,
            (approved_at IS NOT NULL AND approved_at > NOW() - INTERVAL '24 hours') AS is_new_teacher
     FROM users
     WHERE id = $1`,
    [session.id]
  );
  const currentUser = userRes.rows[0];

  if (!currentUser || currentUser.role !== "teacher") {
    redirect("/profile");
  }

  // 1. Kategori untuk dropdown
  const categoriesRes = await pool.query("SELECT id, name FROM categories ORDER BY name ASC");

  // 2. Kursus milik teacher ini
  const coursesRes = await pool.query(
    `SELECT c.id, c.nama_course, c.deskripsi, c.category_id,
            c.start_date::text AS start_date, c.end_date::text AS end_date,
            cat.name AS category_name,
            COUNT(DISTINCT e.student_id) AS total_students,
            COUNT(DISTINCT cnt.id) AS total_materi
     FROM courses c
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     LEFT JOIN contents cnt ON cnt.course_id = c.id
     WHERE c.teacher_id = $1
     GROUP BY c.id, cat.name
     ORDER BY c.created_at DESC, c.id DESC`,
    [session.id]
  );

  const courses = coursesRes.rows.map((c) => ({
    ...c,
    start_date: c.start_date || "",
    end_date: c.end_date || "",
    total_students: Number(c.total_students),
    total_materi: Number(c.total_materi),
  }));

  // 3. Semua materi pada kursus milik teacher ini
  const contentsRes = await pool.query(
    `SELECT cnt.id, cnt.course_id, cnt.judul, cnt.isi_materi, cnt.order_index
     FROM contents cnt
     JOIN courses c ON cnt.course_id = c.id
     WHERE c.teacher_id = $1
     ORDER BY cnt.course_id ASC, cnt.order_index ASC, cnt.id ASC`,
    [session.id]
  );

  // 4. Siswa dan progres per kursus
  const studentsRes = await pool.query(
    `SELECT e.course_id, u.id AS student_id, u.username, u.email,
            COUNT(DISTINCT cnt.id) AS total_materi,
            COUNT(DISTINCT cp.content_id) AS selesai_materi
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     JOIN users u ON e.student_id = u.id
     LEFT JOIN contents cnt ON cnt.course_id = c.id
     LEFT JOIN content_progress cp ON cp.content_id = cnt.id AND cp.student_id = u.id
     WHERE c.teacher_id = $1
     GROUP BY e.course_id, u.id
     ORDER BY e.course_id ASC, u.username ASC`,
    [session.id]
  );

  const students = studentsRes.rows.map((s) => ({
    course_id: s.course_id,
    student_id: s.student_id,
    username: s.username,
    email: s.email,
    total_materi: Number(s.total_materi),
    selesai_materi: Number(s.selesai_materi),
  }));

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      {currentUser.is_new_teacher && (
        <div role="status" className="notice notice-ok mb-8">
          <p className="font-medium">Selamat datang, Teacher. Akun Anda baru saja disetujui Admin.</p>
          <p className="mt-0.5 text-muted">
            Silakan mulai membuat kursus pertama dan menyusun materi pembelajaran Anda di bawah ini.
          </p>
        </div>
      )}

      <h1 className="text-4xl">Dashboard Teacher</h1>
      <p className="mt-2 max-w-xl text-muted">
        Buat kursus, susun materi berurutan, dan pantau progres belajar siswa Anda.
      </p>

      <TeacherClient
        categories={categoriesRes.rows}
        courses={courses}
        contents={contentsRes.rows}
        students={students}
      />
    </main>
  );
}