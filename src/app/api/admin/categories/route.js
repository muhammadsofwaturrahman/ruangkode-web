import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === "admin" ? session : null;
}

const forbidden = () => NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

export async function POST(request) {
  if (!(await requireAdmin())) return forbidden();

  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const description = String(body?.description ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Nama kategori wajib diisi." }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "Nama kategori maksimal 100 karakter." }, { status: 400 });
    }

    await pool.query("INSERT INTO categories (name, description) VALUES ($1, $2)", [
      name,
      description,
    ]);
    return NextResponse.json({ message: "Kategori berhasil ditambahkan." });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Nama kategori sudah ada." }, { status: 409 });
    }
    console.error("create category error:", error);
    return NextResponse.json({ error: "Gagal menambahkan kategori." }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!(await requireAdmin())) return forbidden();

  try {
    const body = await request.json();
    const id = Number(body?.id);
    const name = String(body?.name ?? "").trim();
    const description = String(body?.description ?? "").trim();

    if (!Number.isInteger(id) || !name) {
      return NextResponse.json({ error: "Nama kategori wajib diisi." }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "Nama kategori maksimal 100 karakter." }, { status: 400 });
    }

    const result = await pool.query(
      "UPDATE categories SET name = $1, description = $2 WHERE id = $3",
      [name, description, id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ message: "Kategori diperbarui." });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Nama kategori sudah ada." }, { status: 409 });
    }
    console.error("update category error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kategori." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin())) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID kategori tidak valid." }, { status: 400 });
    }

    // Kursus yang memakai kategori ini tidak ikut terhapus (category_id menjadi NULL).
    const result = await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ message: "Kategori dihapus." });
  } catch (error) {
    console.error("delete category error:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori." }, { status: 500 });
  }
}
