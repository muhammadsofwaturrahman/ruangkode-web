import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";
import TeacherClient from "./TeacherClient";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    redirect("/profile");
  }

  // 1. Ambil daftar kategori
  const categoriesRes = await pool.query(
    "SELECT id, name FROM categories ORDER BY name ASC"
  );

  // 2. Ambil daftar kursus milik teacher ini
  const coursesRes = await pool.query(
    `SELECT c.id, c.nama_course, c.deskripsi, c.category_id, c.start_date, c.end_date,
            cat.name AS category_name,
            COUNT(DISTINCT e.student_id) AS total_students,
            COUNT(DISTINCT cnt.id) AS total_materi
     FROM courses c
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     LEFT JOIN contents cnt ON cnt.course_id = c.id
     WHERE c.teacher_id = $1
     GROUP BY c.id, cat.name
     ORDER BY c.created_at DESC`,
    [session.id]
  );

  const courses = coursesRes.rows.map((c) => ({
    ...c,
    start_date: c.start_date ? new Date(c.start_date).toISOString().split("T")[0] : "",
    end_date: c.end_date ? new Date(c.end_date).toISOString().split("T")[0] : "",
  }));

  // 3. Ambil semua materi untuk kursus milik teacher ini
  const contentsRes = await pool.query(
    `SELECT cnt.id, cnt.course_id, cnt.judul, cnt.isi_materi, cnt.order_index
     FROM contents cnt
     JOIN courses c ON cnt.course_id = c.id
     WHERE c.teacher_id = $1
     ORDER BY cnt.course_id ASC, cnt.order_index ASC, cnt.id ASC`,
    [session.id]
  );

  // 4. Ambil daftar siswa & progres per kursus milik teacher ini
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

  return (
    <div className="min-h-screen bg-[#0E0A1E] text-slate-100">
      <Navbar user={session} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Teacher Workspace
          </span>
          <h1 className="mt-1 text-2xl font-black text-white">Dashboard Teacher</h1>
          <p className="text-sm text-slate-400">
            Buat dan kelola kursus, susun materi pembelajaran berurutan, serta pantau progres siswa.
          </p>
        </div>

        <TeacherClient
          categories={categoriesRes.rows}
          courses={courses}
          contents={contentsRes.rows}
          students={studentsRes.rows}
        />
      </main>
    </div>
  );
}