import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const courseId = Number(body?.course_id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json({ error: "ID kursus tidak valid." }, { status: 400 });
    }

    const course = await pool.query("SELECT id, teacher_id FROM courses WHERE id = $1", [courseId]);
    if (course.rows.length === 0) {
      return NextResponse.json({ error: "Kursus tidak ditemukan." }, { status: 404 });
    }
    if (course.rows[0].teacher_id === session.id) {
      return NextResponse.json(
        { error: "Anda adalah pengajar kursus ini, tidak perlu mendaftar." },
        { status: 400 }
      );
    }

    const inserted = await pool.query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, course_id) DO NOTHING
       RETURNING id`,
      [session.id, courseId]
    );

    if (inserted.rows.length === 0) {
      return NextResponse.json({ error: "Anda sudah terdaftar di kursus ini." }, { status: 409 });
    }

    return NextResponse.json({ message: "Berhasil mengikuti kursus." });
  } catch (error) {
    console.error("enroll error:", error);
    return NextResponse.json({ error: "Gagal mendaftar kursus." }, { status: 500 });
  }
}
