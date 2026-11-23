import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// POST: Admin membuat user baru
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { username, email, password, role } = await request.json();
    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const teacherStatus = role === "teacher" ? "approved" : "none";
    const approvedAt = role === "teacher" ? new Date() : null;

    await pool.query(
      `INSERT INTO users (username, email, password, role, teacher_status, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [username.trim(), email.toLowerCase().trim(), hashed, role, teacherStatus, approvedAt]
    );

    return NextResponse.json({ message: "User berhasil ditambahkan." });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Admin Approve Teacher atau Edit User
export async function PATCH(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Aksi khusus: Approve pendaftar Teacher (mencatat approved_at = NOW())
    if (body.action === "approve_teacher") {
      await pool.query(
        `UPDATE users
         SET role = 'teacher', teacher_status = 'approved', approved_at = NOW()
         WHERE id = $1`,
        [body.userId]
      );
      return NextResponse.json({ message: "Teacher berhasil di-approve." });
    }

    // Aksi umum: Edit data user
    const { id, username, email, role, password } = body;
    if (!id || !username || !email || !role) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    if (password && password.trim().length > 0) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET username = $1, email = $2, role = $3, password = $4 WHERE id = $5`,
        [username.trim(), email.toLowerCase().trim(), role, hashed, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET username = $1, email = $2, role = $3 WHERE id = $4`,
        [username.trim(), email.toLowerCase().trim(), role, id]
      );
    }

    return NextResponse.json({ message: "Data user berhasil diperbarui." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Admin menghapus user (selain dirinya sendiri)
export async function DELETE(request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (id === session.id) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus akun sendiri." },
        { status: 400 }
      );
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return NextResponse.json({ message: "User berhasil dihapus." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}