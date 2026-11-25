import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatDateOnly } from "@/lib/format";
import CoursesClient from "./CoursesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Katalog Kursus" };

export default async function CoursesPage({ searchParams }) {
  const session = await getSession();
  const resolvedParams = await searchParams;
  const search = String(resolvedParams?.search ?? "").trim();
  const categoryId = String(resolvedParams?.category ?? "").trim();

  const categoriesRes = await pool.query("SELECT id, name FROM categories ORDER BY name ASC");

  const queryParams = [];
  let queryStr = `
    SELECT c.id, c.nama_course, c.deskripsi,
           c.start_date::text AS start_date, c.end_date::text AS end_date,
           cat.name AS category_name,
           u.username AS teacher_name, u.email AS teacher_email,
           COUNT(DISTINCT cnt.id) AS total_materi,
           (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS student_count
  `;

  if (session) {
    queryParams.push(session.id);
    queryStr += `,
      EXISTS(SELECT 1 FROM enrollments WHERE student_id = $1 AND course_id = c.id) AS is_enrolled,
      (c.teacher_id = $1) AS is_owner,
      COUNT(DISTINCT cp.content_id) AS completed_materi
    `;
  } else {
    queryStr += `, false AS is_enrolled, false AS is_owner, 0 AS completed_materi`;
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
  if (categoryId && Number.isInteger(Number(categoryId))) {
    queryParams.push(Number(categoryId));
    whereClauses.push(`c.category_id = $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    queryStr += ` WHERE ` + whereClauses.join(" AND ");
  }

  queryStr += `
    GROUP BY c.id, cat.name, u.username, u.email
    ORDER BY c.created_at DESC
  `;

  const coursesRes = await pool.query(queryStr, queryParams);

  const courses = coursesRes.rows.map((c) => ({
    id: c.id,
    nama_course: c.nama_course,
    deskripsi: c.deskripsi,
    category_name: c.category_name,
    teacher_name: c.teacher_name,
    teacher_email: c.teacher_email,
    total_materi: Number(c.total_materi),
    completed_materi: Number(c.completed_materi),
    student_count: Number(c.student_count),
    is_enrolled: c.is_enrolled,
    is_owner: c.is_owner,
    start_label: formatDateOnly(c.start_date),
    end_label: formatDateOnly(c.end_date),
  }));

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="text-4xl">Katalog kursus</h1>
      <p className="mt-2 max-w-xl text-muted">
        Pilih kelas sesuai minat, ikuti secara berurutan, atau hubungi pengajarnya langsung.
      </p>

      <CoursesClient
        courses={courses}
        categories={categoriesRes.rows}
        currentSearch={search}
        currentCategory={categoryId}
        isLoggedIn={!!session}
      />
    </main>
  );
}
