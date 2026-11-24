import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const { course_id } = await request.json();
    if (!course_id) {
      return NextResponse.json({ error: "ID kursus wajib disertakan." }, { status: 400 });
    }

    const existing = await pool.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2",
      [session.id, Number(course_id)]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Anda sudah terdaftar di kursus ini." }, { status: 409 });
    }

    await pool.query(
      "INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)",
      [session.id, Number(course_id)]
    );

    return NextResponse.json({ message: "Berhasil mengikuti kursus." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}