import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { isEmail } from "@/lib/validate";

const ROLES = ["admin", "teacher", "student"];

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

const forbidden = () => NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

// POST: Admin membuat user baru
export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const email = String(body?.email ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");
    const role = body?.role;

    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
    }
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const isTeacher = role === "teacher";

    await pool.query(
      `INSERT INTO users (username, email, password, role, teacher_status, approved_at)
       VALUES ($1, $2, $3, $4, $5, CASE WHEN $6::boolean THEN NOW() ELSE NULL END)`,
      [username, email, hashed, role, isTeacher ? "approved" : "none", isTeacher]
    );

    return NextResponse.json({ message: "User berhasil ditambahkan." });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }
    console.error("admin create user error:", error);
    return NextResponse.json({ error: "Gagal menambahkan user." }, { status: 500 });
  }
}

// PATCH: Approve pendaftar Teacher, atau edit data user
export async function PATCH(request) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const body = await request.json();

    // Approve Teacher: role menjadi 'teacher' dan approved_at dicatat
    if (body.action === "approve_teacher") {
      const result = await pool.query(
        `UPDATE users
         SET role = 'teacher', teacher_status = 'approved', approved_at = NOW()
         WHERE id = $1 AND teacher_status = 'pending'`,
        [Number(body.userId)]
      );
      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: "Tidak ada pendaftar Teacher berstatus pending untuk user ini." },
          { status: 404 }
        );
      }
      return NextResponse.json({ message: "Teacher berhasil di-approve." });
    }

    // Edit data user
    const id = Number(body.id);
    const username = String(body?.username ?? "").trim();
    const email = String(body?.email ?? "").toLowerCase().trim();
    const role = body?.role;
    const password = String(body?.password ?? "").trim();

    if (!Number.isInteger(id) || !username || !email || !role) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }
    if (password && password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    }
    if (id === session.id && role !== "admin") {
      return NextResponse.json(
        { error: "Anda tidak dapat mengubah role akun Anda sendiri." },
        { status: 400 }
      );
    }

    const current = await pool.query("SELECT teacher_status FROM users WHERE id = $1", [id]);
    if (current.rows.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    // Jaga konsistensi role dan teacher_status
    const isTeacher = role === "teacher";
    let teacherStatus = "none";
    if (isTeacher) teacherStatus = "approved";
    else if (role === "student" && current.rows[0].teacher_status === "pending") {
      teacherStatus = "pending";
    }

    const hashed = password ? await bcrypt.hash(password, 10) : null;

    await pool.query(
      `UPDATE users
       SET username = $1, email = $2, role = $3, teacher_status = $4,
           approved_at = CASE WHEN $5::boolean THEN COALESCE(approved_at, NOW()) ELSE NULL END,
           password = COALESCE($6, password)
       WHERE id = $7`,
      [username, email, role, teacherStatus, isTeacher, hashed, id]
    );

    return NextResponse.json({ message: "Data user berhasil diperbarui." });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email sudah dipakai user lain." }, { status: 409 });
    }
    console.error("admin update user error:", error);
    return NextResponse.json({ error: "Gagal memperbarui user." }, { status: 500 });
  }
}

// DELETE: Admin menghapus user (selain dirinya sendiri)
export async function DELETE(request) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID user tidak valid." }, { status: 400 });
    }
    if (id === session.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri." }, { status: 400 });
    }

    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ message: "User berhasil dihapus." });
  } catch (error) {
    console.error("admin delete user error:", error);
    return NextResponse.json({ error: "Gagal menghapus user." }, { status: 500 });
  }
}
