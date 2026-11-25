import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { parseCourseInput } from "@/lib/validate";

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === "admin" ? session : null;
}

const forbidden = () => NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

// Admin boleh memilih pengajar mana pun yang berstatus teacher.
async function teacherExists(teacherId) {
  if (!Number.isInteger(teacherId) || teacherId <= 0) return false;
  const res = await pool.query("SELECT 1 FROM users WHERE id = $1 AND role = 'teacher'", [teacherId]);
  return res.rows.length > 0;
}

function handleDbError(error, fallback) {
  if (error.code === "23503") {
    return NextResponse.json({ error: "Kategori atau pengajar yang dipilih tidak valid." }, { status: 400 });
  }
  console.error("admin courses error:", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function POST(request) {
  if (!(await requireAdmin())) return forbidden();

  try {
    const body = await request.json();
    const parsed = parseCourseInput(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const teacherId = Number(body?.teacher_id);
    if (!(await teacherExists(teacherId))) {
      return NextResponse.json({ error: "Pilih pengajar untuk kursus ini." }, { status: 400 });
    }

    const { nama, deskripsi, categoryId, start, end } = parsed.value;
    await pool.query(
      `INSERT INTO courses (nama_course, deskripsi, category_id, teacher_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nama, deskripsi, categoryId, teacherId, start, end]
    );
    return NextResponse.json({ message: "Kursus berhasil dibuat." });
  } catch (error) {
    return handleDbError(error, "Gagal membuat kursus.");
  }
}

export async function PUT(request) {
  if (!(await requireAdmin())) return forbidden();

  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID kursus tidak valid." }, { status: 400 });
    }

    const parsed = parseCourseInput(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const teacherId = Number(body?.teacher_id);
    if (!(await teacherExists(teacherId))) {
      return NextResponse.json({ error: "Pilih pengajar untuk kursus ini." }, { status: 400 });
    }

    const { nama, deskripsi, categoryId, start, end } = parsed.value;
    const result = await pool.query(
      `UPDATE courses
       SET nama_course = $1, deskripsi = $2, category_id = $3, teacher_id = $4,
           start_date = $5, end_date = $6
       WHERE id = $7`,
      [nama, deskripsi, categoryId, teacherId, start, end, id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Kursus tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ message: "Kursus berhasil diperbarui." });
  } catch (error) {
    return handleDbError(error, "Gagal memperbarui kursus.");
  }
}

// Admin dapat menghapus kursus milik siapa pun.
export async function DELETE(request) {
  if (!(await requireAdmin())) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID kursus tidak valid." }, { status: 400 });
    }

    const result = await pool.query("DELETE FROM courses WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Kursus tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ message: "Kursus berhasil dihapus." });
  } catch (error) {
    return handleDbError(error, "Gagal menghapus kursus.");
  }
}
