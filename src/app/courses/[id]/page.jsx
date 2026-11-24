import { redirect } from "next/navigation";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";
import LearningClient from "./LearningClient";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params, searchParams }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id: courseId } = await params;
  const numericCourseId = Number(courseId);
  if (!Number.isInteger(numericCourseId) || numericCourseId <= 0) {
    redirect("/courses");
  }

  const resolvedParams = await searchParams;
  const activeContentId = resolvedParams?.materi ? Number(resolvedParams.materi) : null;

  // 1. Ambil detail kursus & cek otorisasi pendaftaran
  const courseRes = await pool.query(
    `SELECT c.id, c.nama_course, c.deskripsi, c.teacher_id, e.id AS enroll_id
     FROM courses c
     LEFT JOIN enrollments e ON e.course_id = c.id AND e.student_id = $1
     WHERE c.id = $2`,
    [session.id, numericCourseId]
  );

  const course = courseRes.rows[0];
  if (!course) {
    redirect("/courses");
  }

  const canAccess =
    !!course.enroll_id || course.teacher_id === session.id || session.role === "admin";
  if (!canAccess) {
    redirect("/courses");
  }

  // 2. Ambil daftar materi berurutan sesuai order_index
  const contentsRes = await pool.query(
    `SELECT id, judul, isi_materi, order_index
     FROM contents
     WHERE course_id = $1
     ORDER BY order_index ASC, id ASC`,
    [course.id]
  );
  const contents = contentsRes.rows;
  const activeContent = contents.find((c) => c.id === activeContentId) || contents[0] || null;

  // 3. Ambil progres belajar user khusus untuk kursus ini
  const progressRes = await pool.query(
    `SELECT cp.content_id
     FROM content_progress cp
     JOIN contents cnt ON cp.content_id = cnt.id
     WHERE cp.student_id = $1 AND cnt.course_id = $2`,
    [session.id, course.id]
  );
  const completedIds = progressRes.rows.map((r) => r.content_id);

  // 4. Cek / terbitkan sertifikat jika progres sudah 100% dan user terdaftar
  let certificateCode = null;
  if (course.enroll_id && contents.length > 0 && completedIds.length >= contents.length) {
    const existingCert = await pool.query(
      `SELECT certificate_code FROM certificates WHERE student_id = $1 AND course_id = $2`,
      [session.id, course.id]
    );

    if (existingCert.rows.length > 0) {
      certificateCode = existingCert.rows[0].certificate_code;
    } else {
      const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
      const generatedCode = `RK-${new Date().getFullYear()}-${course.id}-${session.id}-${randomPart}`;
      await pool.query(
        `INSERT INTO certificates (student_id, course_id, certificate_code)
         VALUES ($1, $2, $3)
         ON CONFLICT (student_id, course_id) DO NOTHING`,
        [session.id, course.id, generatedCode]
      );
      const refetchCert = await pool.query(
        `SELECT certificate_code FROM certificates WHERE student_id = $1 AND course_id = $2`,
        [session.id, course.id]
      );
      certificateCode = refetchCert.rows[0]?.certificate_code || null;
    }
  }

  // 5. Ambil komentar pada materi yang sedang dibuka
  let comments = [];
  if (activeContent) {
    const commentsRes = await pool.query(
      `SELECT cm.id, cm.comment_text, cm.created_at, u.username, u.role
       FROM comments cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.content_id = $1
       ORDER BY cm.created_at ASC`,
      [activeContent.id]
    );
    comments = commentsRes.rows;
  }

  return (
    <div className="min-h-screen bg-[#0E0A1E]">
      <Navbar user={session} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <LearningClient
          course={course}
          contents={contents}
          activeContent={activeContent}
          completedIds={completedIds}
          comments={comments}
          certificateCode={certificateCode}
        />
      </main>
    </div>
  );
}