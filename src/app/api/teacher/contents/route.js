import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// POST: Tambah materi baru ke dalam kursus milik Teacher
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  try {
    const { course_id, judul, isi_materi, order_index } = await request.json();

    if (!course_id || !judul?.trim() || !isi_materi?.trim()) {
      return NextResponse.json(
        { error: "Kursus, judul materi, dan isi materi wajib diisi." },
        { status: 400 }
      );
    }

    // Pastikan kursus benar-benar milik teacher yang sedang login
    const courseCheck = await pool.query(
      "SELECT id FROM courses WHERE id = $1 AND teacher_id = $2",
      [Number(course_id), session.id]
    );
    if (courseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin menambah materi pada kursus ini." },
        { status: 403 }
      );
    }

    await pool.query(
      `INSERT INTO contents (course_id, judul, isi_materi, order_index)
       VALUES ($1, $2, $3, $4)`,
      [Number(course_id), judul.trim(), isi_materi.trim(), Number(order_index) || 1]
    );

    return NextResponse.json({ message: "Materi berhasil ditambahkan." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit materi
export async function PUT(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  try {
    const { id, judul, isi_materi, order_index } = await request.json();

    if (!id || !judul?.trim() || !isi_materi?.trim()) {
      return NextResponse.json({ error: "Data materi tidak lengkap." }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE contents cnt
       SET judul = $1, isi_materi = $2, order_index = $3
       FROM courses c
       WHERE cnt.course_id = c.id AND cnt.id = $4 AND c.teacher_id = $5`,
      [judul.trim(), isi_materi.trim(), Number(order_index) || 1, Number(id), session.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ message: "Materi berhasil diperbarui." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus materi
export async function DELETE(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    const result = await pool.query(
      `DELETE FROM contents cnt
       USING courses c
       WHERE cnt.course_id = c.id AND cnt.id = $1 AND c.teacher_id = $2`,
      [id, session.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ message: "Materi berhasil dihapus." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}