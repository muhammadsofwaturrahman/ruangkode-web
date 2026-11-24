import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// POST: Buat kursus baru
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Akses ditolak. Khusus Teacher." }, { status: 403 });
  }

  try {
    const { nama_course, deskripsi, category_id, start_date, end_date } = await request.json();

    if (!nama_course?.trim() || !deskripsi?.trim()) {
      return NextResponse.json(
        { error: "Nama kursus dan deskripsi wajib diisi." },
        { status: 400 }
      );
    }

    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return NextResponse.json(
        { error: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai." },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO courses (nama_course, deskripsi, category_id, teacher_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        nama_course.trim(),
        deskripsi.trim(),
        category_id ? Number(category_id) : null,
        session.id,
        start_date || null,
        end_date || null,
      ]
    );

    return NextResponse.json({ message: "Kursus berhasil dibuat." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit kursus milik sendiri
export async function PUT(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  try {
    const { id, nama_course, deskripsi, category_id, start_date, end_date } = await request.json();

    if (!id || !nama_course?.trim() || !deskripsi?.trim()) {
      return NextResponse.json({ error: "Data kursus tidak lengkap." }, { status: 400 });
    }

    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return NextResponse.json(
        { error: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE courses
       SET nama_course = $1, deskripsi = $2, category_id = $3, start_date = $4, end_date = $5
       WHERE id = $6 AND teacher_id = $7`,
      [
        nama_course.trim(),
        deskripsi.trim(),
        category_id ? Number(category_id) : null,
        start_date || null,
        end_date || null,
        Number(id),
        session.id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Kursus tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Kursus berhasil diperbarui." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus kursus milik sendiri
export async function DELETE(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    const result = await pool.query(
      "DELETE FROM courses WHERE id = $1 AND teacher_id = $2",
      [id, session.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Kursus tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Kursus berhasil dihapus." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}