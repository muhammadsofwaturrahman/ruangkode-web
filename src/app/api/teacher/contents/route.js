import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { normalizeMateri, hasContent } from "@/lib/sanitize";

async function requireTeacher() {
  const session = await getSession();
  return session && session.role === "teacher" ? session : null;
}

const forbidden = () => NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

function parseOrder(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

// POST: Tambah materi baru ke kursus milik Teacher
export async function POST(request) {
  const session = await requireTeacher();
  if (!session) return forbidden();

  try {
    const body = await request.json();
    const courseId = Number(body?.course_id);
    const judul = String(body?.judul ?? "").trim();
    const isi = normalizeMateri(String(body?.isi_materi ?? "").trim());

    if (!Number.isInteger(courseId) || !judul || !hasContent(isi)) {
      return NextResponse.json(
        { error: "Kursus, judul materi, dan isi materi wajib diisi." },
        { status: 400 }
      );
    }
    if (isi.length > 100000) {
      return NextResponse.json({ error: "Isi materi terlalu panjang." }, { status: 400 });
    }
    if (judul.length > 200) {
      return NextResponse.json({ error: "Judul materi maksimal 200 karakter." }, { status: 400 });
    }

    // Pastikan kursus benar-benar milik teacher yang sedang login
    const courseCheck = await pool.query(
      "SELECT id FROM courses WHERE id = $1 AND teacher_id = $2",
      [courseId, session.id]
    );
    if (courseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin menambah materi pada kursus ini." },
        { status: 403 }
      );
    }

    // Jika urutan tidak diisi, letakkan di akhir
    let order = parseOrder(body?.order_index);
    if (order === null) {
      const max = await pool.query(
        "SELECT COALESCE(MAX(order_index), 0) + 1 AS next FROM contents WHERE course_id = $1",
        [courseId]
      );
      order = Number(max.rows[0].next);
    }

    await pool.query(
      `INSERT INTO contents (course_id, judul, isi_materi, order_index)
       VALUES ($1, $2, $3, $4)`,
      [courseId, judul, isi, order]
    );

    return NextResponse.json({ message: "Materi berhasil ditambahkan." });
  } catch (error) {
    console.error("create content error:", error);
    return NextResponse.json({ error: "Gagal menambahkan materi." }, { status: 500 });
  }
}

// PUT: Edit materi milik sendiri
export async function PUT(request) {
  const session = await requireTeacher();
  if (!session) return forbidden();

  try {
    const body = await request.json();
    const id = Number(body?.id);
    const judul = String(body?.judul ?? "").trim();
    const isi = normalizeMateri(String(body?.isi_materi ?? "").trim());
    const order = parseOrder(body?.order_index);

    if (!Number.isInteger(id) || !judul || !hasContent(isi)) {
      return NextResponse.json({ error: "Data materi tidak lengkap." }, { status: 400 });
    }
    if (order === null) {
      return NextResponse.json({ error: "Urutan materi harus berupa angka 1 atau lebih." }, { status: 400 });
    }
    if (isi.length > 100000) {
      return NextResponse.json({ error: "Isi materi terlalu panjang." }, { status: 400 });
    }
    if (judul.length > 200) {
      return NextResponse.json({ error: "Judul materi maksimal 200 karakter." }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE contents cnt
       SET judul = $1, isi_materi = $2, order_index = $3
       FROM courses c
       WHERE cnt.course_id = c.id AND cnt.id = $4 AND c.teacher_id = $5`,
      [judul, isi, order, id, session.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ message: "Materi berhasil diperbarui." });
  } catch (error) {
    console.error("update content error:", error);
    return NextResponse.json({ error: "Gagal memperbarui materi." }, { status: 500 });
  }
}

// DELETE: Hapus materi milik sendiri
export async function DELETE(request) {
  const session = await requireTeacher();
  if (!session) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID materi tidak valid." }, { status: 400 });
    }

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
    console.error("delete content error:", error);
    return NextResponse.json({ error: "Gagal menghapus materi." }, { status: 500 });
  }
}
