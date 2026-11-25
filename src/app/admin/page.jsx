import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Admin" };

const PAGE_SIZE = 8;
const TABS = ["users", "courses", "categories"];
const ROLES = ["admin", "teacher", "student"];

export default async function AdminPage({ searchParams }) {
  const session = await getSession();
  if (!session) {
    redirect("/api/auth/logout");
  }
  if (session.role !== "admin") {
    redirect("/profile");
  }

  const resolvedParams = await searchParams;
  const tab = TABS.includes(resolvedParams?.tab) ? resolvedParams.tab : "users";
  const page = Math.max(1, Number(resolvedParams?.page) || 1);
  const roleFilter = ROLES.includes(resolvedParams?.role) ? resolvedParams.role : "";

  // Ringkasan (query agregasi)
  const statsRes = await pool.query(
    `SELECT (SELECT COUNT(*) FROM users) AS total_users,
            (SELECT COUNT(*) FROM courses) AS total_courses,
            (SELECT COUNT(*) FROM users WHERE teacher_status = 'pending') AS pending_teachers`
  );
  const stats = {
    totalUsers: Number(statsRes.rows[0].total_users),
    totalCourses: Number(statsRes.rows[0].total_courses),
    pendingTeachers: Number(statsRes.rows[0].pending_teachers),
  };

  let users = [];
  let totalPages = 1;
  let courses = [];
  let teachers = [];
  let categories = [];

  if (tab === "users") {
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM users WHERE ($1::text = '' OR role = $1::text)",
      [roleFilter]
    );
    totalPages = Math.max(1, Math.ceil(Number(countRes.rows[0].count) / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);

    // Pendaftar Teacher yang masih pending tampil paling atas
    const usersRes = await pool.query(
      `SELECT id, username, email, role, teacher_status
       FROM users
       WHERE ($1::text = '' OR role = $1::text)
       ORDER BY CASE WHEN teacher_status = 'pending' THEN 0 ELSE 1 END, id ASC
       LIMIT $2 OFFSET $3`,
      [roleFilter, PAGE_SIZE, (currentPage - 1) * PAGE_SIZE]
    );
    users = usersRes.rows;
  }

  if (tab === "courses") {
    const coursesRes = await pool.query(
      `SELECT c.id, c.nama_course, c.deskripsi, c.category_id, c.teacher_id,
              c.start_date::text AS start_date, c.end_date::text AS end_date,
              cat.name AS category_name, u.username AS teacher_name,
              (SELECT COUNT(*) FROM contents WHERE course_id = c.id) AS total_materi,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS total_students
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.teacher_id = u.id
       ORDER BY c.created_at DESC, c.id DESC`
    );
    courses = coursesRes.rows.map((c) => ({
      ...c,
      total_materi: Number(c.total_materi),
      total_students: Number(c.total_students),
    }));

    const teachersRes = await pool.query(
      "SELECT id, username FROM users WHERE role = 'teacher' ORDER BY username ASC"
    );
    teachers = teachersRes.rows;
  }

  if (tab === "courses" || tab === "categories") {
    const categoriesRes = await pool.query(
      `SELECT cat.id, cat.name, cat.description, COUNT(c.id) AS total_courses
       FROM categories cat
       LEFT JOIN courses c ON c.category_id = cat.id
       GROUP BY cat.id
       ORDER BY cat.name ASC`
    );
    categories = categoriesRes.rows.map((c) => ({ ...c, total_courses: Number(c.total_courses) }));
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="text-4xl">Dashboard Admin</h1>
      <p className="mt-2 max-w-xl text-muted">
        Kelola pengguna, verifikasi pendaftar Teacher, kursus, dan kategori.
      </p>

      <AdminClient
        tab={tab}
        stats={stats}
        currentAdminId={session.id}
        users={users}
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        roleFilter={roleFilter}
        courses={courses}
        teachers={teachers}
        categories={categories}
      />
    </main>
  );
}
