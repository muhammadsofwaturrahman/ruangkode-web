import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";
import CoursesClient from "./CoursesClient";

export const dynamic = "force-dynamic";

export default async function CoursesPage({ searchParams }) {
  const session = await getSession();
  const resolvedParams = await searchParams;
  const search = resolvedParams?.search?.trim() || "";
  const categoryId = resolvedParams?.category || "";

  const categoriesRes = await pool.query("SELECT id, name FROM categories ORDER BY name ASC");

  const queryParams = [];
  let queryStr = `
    SELECT c.id, c.nama_course, c.deskripsi, c.start_date, c.end_date,
           cat.name AS category_name, cat.id AS category_id,
           u.username AS teacher_name, u.email AS teacher_email,
           COUNT(DISTINCT cnt.id) AS total_materi,
           (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS student_count
  `;

  if (session) {
    queryParams.push(session.id);
    queryStr += `,
      EXISTS(SELECT 1 FROM enrollments WHERE student_id = $1 AND course_id = c.id) AS is_enrolled,
      COUNT(DISTINCT cp.content_id) AS completed_materi
    `;
  } else {
    queryStr += `, false AS is_enrolled, 0 AS completed_materi`;
  }

  queryStr += `
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.teacher_id = u.id
    LEFT JOIN contents cnt ON c.id = cnt.course_id
  `;

  if (session) {
    queryStr += ` LEFT JOIN content_progress cp ON cp.content_id = cnt.id AND cp.student_id = $1`;
  }

  const whereClauses = [];
  if (search) {
    queryParams.push(`%${search}%`);
    whereClauses.push(
      `(c.nama_course ILIKE $${queryParams.length} OR c.deskripsi ILIKE $${queryParams.length})`
    );
  }
  if (categoryId && !Number.isNaN(Number(categoryId))) {
    queryParams.push(Number(categoryId));
    whereClauses.push(`c.category_id = $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    queryStr += ` WHERE ` + whereClauses.join(" AND ");
  }

  queryStr += `
    GROUP BY c.id, cat.name, cat.id, u.username, u.email
    ORDER BY c.created_at DESC
  `;

  const coursesRes = await pool.query(queryStr, queryParams);

  const courses = coursesRes.rows.map((c) => ({
    ...c,
    start_date: c.start_date ? new Date(c.start_date).toLocaleDateString("id-ID") : null,
    end_date: c.end_date ? new Date(c.end_date).toLocaleDateString("id-ID") : null,
  }));

  return (
    <div className="min-h-screen bg-[#0E0A1E]">
      <Navbar user={session} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Eksplorasi Materi
          </span>
          <h1 className="mt-1 text-3xl font-black text-white">Katalog Kursus</h1>
          <p className="mt-1 text-sm text-slate-400">
            Cari kelas sesuai minat Anda, pantau progres belajar, atau hubungi pengajar langsung.
          </p>
        </div>

        <CoursesClient
          courses={courses}
          categories={categoriesRes.rows}
          currentSearch={search}
          currentCategory={categoryId}
          isLoggedIn={!!session}
        />
      </main>
    </div>
  );
}