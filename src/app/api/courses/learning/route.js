import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, content_id, comment_text } = await request.json();
    if (!content_id) {
      return NextResponse.json({ error: "ID materi wajib disertakan." }, { status: 400 });
    }

    // Pastikan user berhak mengakses materi (sudah enroll, pengajar kursus, atau admin)
    const accessCheck = await pool.query(
      `SELECT cnt.id
       FROM contents cnt
       JOIN courses c ON cnt.course_id = c.id
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.student_id = $1
       WHERE cnt.id = $2 AND (e.id IS NOT NULL OR c.teacher_id = $1 OR $3 = 'admin')`,
      [session.id, Number(content_id), session.role]
    );

    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Anda harus mengikuti kursus ini terlebih dahulu." },
        { status: 403 }
      );
    }

    if (action === "mark_as_done") {
      await pool.query(
        `INSERT INTO content_progress (student_id, content_id)
         VALUES ($1, $2)
         ON CONFLICT (student_id, content_id) DO NOTHING`,
        [session.id, Number(content_id)]
      );

      return NextResponse.json({ message: "Materi ditandai selesai." });
    }

    if (action === "comment") {
      if (!comment_text?.trim()) {
        return NextResponse.json(
          { error: "Komentar tidak boleh kosong." },
          { status: 400 }
        );
      }

      await pool.query(
        `INSERT INTO comments (content_id, user_id, comment_text)
         VALUES ($1, $2, $3)`,
        [Number(content_id), session.id, comment_text.trim()]
      );

      return NextResponse.json({ message: "Komentar terkirim." });
    }

    return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}