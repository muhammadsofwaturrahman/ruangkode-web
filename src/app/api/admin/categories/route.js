import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, description } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi." }, { status: 400 });
    }

    await pool.query(
      "INSERT INTO categories (name, description) VALUES ($1, $2)",
      [name.trim(), description?.trim() || ""]
    );
    return NextResponse.json({ message: "Kategori berhasil ditambahkan." });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Nama kategori sudah ada." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, name, description } = await request.json();
    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi." }, { status: 400 });
    }

    await pool.query(
      "UPDATE categories SET name = $1, description = $2 WHERE id = $3",
      [name.trim(), description?.trim() || "", id]
    );
    return NextResponse.json({ message: "Kategori diperbarui." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    return NextResponse.json({ message: "Kategori dihapus." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}