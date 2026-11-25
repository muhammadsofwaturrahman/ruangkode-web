import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { parseCourseInput } from "@/lib/validate";

async function requireTeacher() {
  const session = await getSession();
  return session && session.role === "teacher" ? session : null;
}

const forbidden = () =>
  NextResponse.json({ error: "Akses ditolak. Khusus Teacher." }, { status: 403 });

function handleDbError(error, fallback) {
  if (error.code === "23503") {
    return NextResponse.json({ error: "Kategori yang dipilih tidak valid." }, { status: 400 });
  }
  console.error("teacher courses error:", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// POST: Buat kursus baru (nama teacher otomatis dari akun yang login)
export async function POST(request) {
  const session = await requireTeacher();
  if (!session) return forbidden();

  try {
    const parsed = parseCourseInput(await request.json());
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const { nama, deskripsi, categoryId, start, end } = parsed.value;
    await pool.query(
      `INSERT INTO courses (nama_course, deskripsi, category_id, teacher_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nama, deskripsi, categoryId, session.id, start, end]
    );

    return NextResponse.json({ message: "Kursus berhasil dibuat." });
  } catch (error) {
    return handleDbError(error, "Gagal membuat kursus.");
  }
}

// PUT: Edit kursus milik sendiri
export async function PUT(request) {
  const session = await requireTeacher();
  if (!session) return forbidden();

  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Data kursus tidak lengkap." }, { status: 400 });
    }

    const parsed = parseCourseInput(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const { nama, deskripsi, categoryId, start, end } = parsed.value;
    const result = await pool.query(
      `UPDATE courses
       SET nama_course = $1, deskripsi = $2, category_id = $3, start_date = $4, end_date = $5
       WHERE id = $6 AND teacher_id = $7`,
      [nama, deskripsi, categoryId, start, end, id, session.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Kursus tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Kursus berhasil diperbarui." });
  } catch (error) {
    return handleDbError(error, "Gagal memperbarui kursus.");
  }
}

// DELETE: Hapus kursus milik sendiri
export async function DELETE(request) {
  const session = await requireTeacher();
  if (!session) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID kursus tidak valid." }, { status: 400 });
    }

    const result = await pool.query("DELETE FROM courses WHERE id = $1 AND teacher_id = $2", [
      id,
      session.id,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Kursus tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Kursus berhasil dihapus." });
  } catch (error) {
    return handleDbError(error, "Gagal menghapus kursus.");
  }
}
