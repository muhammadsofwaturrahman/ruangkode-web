import { NextResponse } from "next/server";
import crypto from "crypto";
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

    // Pastikan user berhak mengakses materi dan ambil course_id-nya
    const accessCheck = await pool.query(
      `SELECT cnt.id, cnt.course_id
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

    const courseId = accessCheck.rows[0].course_id;

    if (action === "mark_as_done") {
      await pool.query(
        `INSERT INTO content_progress (student_id, content_id)
         VALUES ($1, $2)
         ON CONFLICT (student_id, content_id) DO NOTHING`,
        [session.id, Number(content_id)]
      );

      // Hitung total materi & materi selesai pada kursus ini
      const statsRes = await pool.query(
        `SELECT COUNT(DISTINCT cnt.id) AS total_materi,
                COUNT(DISTINCT cp.content_id) AS selesai_materi
         FROM contents cnt
         LEFT JOIN content_progress cp
           ON cp.content_id = cnt.id AND cp.student_id = $1
         WHERE cnt.course_id = $2`,
        [session.id, courseId]
      );

      const total = Number(statsRes.rows[0]?.total_materi || 0);
      const selesai = Number(statsRes.rows[0]?.selesai_materi || 0);

      let certificateCode = null;
      if (total > 0 && selesai === total) {
        const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
        const generatedCode = `RK-${new Date().getFullYear()}-${courseId}-${session.id}-${randomPart}`;

        await pool.query(
          `INSERT INTO certificates (student_id, course_id, certificate_code)
           VALUES ($1, $2, $3)
           ON CONFLICT (student_id, course_id) DO NOTHING`,
          [session.id, courseId, generatedCode]
        );

        const certRes = await pool.query(
          `SELECT certificate_code FROM certificates WHERE student_id = $1 AND course_id = $2`,
          [session.id, courseId]
        );
        certificateCode = certRes.rows[0]?.certificate_code || null;
      }

      return NextResponse.json({
        message: certificateCode
          ? "Selamat! Semua materi selesai dan sertifikat Anda telah diterbitkan."
          : "Materi ditandai selesai.",
        certificate_code: certificateCode,
      });
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