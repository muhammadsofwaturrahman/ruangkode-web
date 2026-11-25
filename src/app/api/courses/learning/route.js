import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body?.action;
    const contentId = Number(body?.content_id);

    if (!Number.isInteger(contentId) || contentId <= 0) {
      return NextResponse.json({ error: "ID materi wajib disertakan." }, { status: 400 });
    }

    // Ambil course_id materi, status pendaftaran user, dan apakah user pengajarnya.
    const accessCheck = await pool.query(
      `SELECT cnt.course_id,
              (e.id IS NOT NULL) AS is_enrolled,
              (c.teacher_id = $1) AS is_owner
       FROM contents cnt
       JOIN courses c ON cnt.course_id = c.id
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.student_id = $1
       WHERE cnt.id = $2`,
      [session.id, contentId]
    );

    const access = accessCheck.rows[0];
    const allowed = access && (access.is_enrolled || access.is_owner || session.role === "admin");
    if (!allowed) {
      return NextResponse.json(
        { error: "Anda harus mengikuti kursus ini terlebih dahulu." },
        { status: 403 }
      );
    }

    const courseId = access.course_id;

    if (action === "mark_as_done") {
      // Progres hanya dicatat untuk student yang terdaftar.
      if (!access.is_enrolled) {
        return NextResponse.json(
          { error: "Progres hanya dicatat untuk peserta yang mengikuti kursus." },
          { status: 403 }
        );
      }

      await pool.query(
        `INSERT INTO content_progress (student_id, content_id)
         VALUES ($1, $2)
         ON CONFLICT (student_id, content_id) DO NOTHING`,
        [session.id, contentId]
      );

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
          "SELECT certificate_code FROM certificates WHERE student_id = $1 AND course_id = $2",
          [session.id, courseId]
        );
        certificateCode = certRes.rows[0]?.certificate_code || null;
      }

      return NextResponse.json({
        message: certificateCode
          ? "Semua bab selesai. Sertifikat Anda sudah terbit."
          : "Bab ditandai selesai.",
        certificate_code: certificateCode,
      });
    }

    if (action === "comment") {
      const text = String(body?.comment_text ?? "").trim();
      if (!text) {
        return NextResponse.json({ error: "Komentar tidak boleh kosong." }, { status: 400 });
      }
      if (text.length > 2000) {
        return NextResponse.json({ error: "Komentar maksimal 2000 karakter." }, { status: 400 });
      }

      await pool.query(
        "INSERT INTO comments (content_id, user_id, comment_text) VALUES ($1, $2, $3)",
        [contentId, session.id, text]
      );

      return NextResponse.json({ message: "Komentar terkirim." });
    }

    return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
  } catch (error) {
    console.error("learning error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
