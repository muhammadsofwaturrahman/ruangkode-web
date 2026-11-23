import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request) {
  try {
    const { username, email, password, registerAs } = await request.json();

    if (!username || !email || !password || !registerAs) {
      return NextResponse.json(
        { error: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain." },
        { status: 409 }
      );
    }

    // Hash password dengan bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // Aturan wajib: semua pendaftar masuk sebagai 'student' terlebih dahulu.
    // Jika daftar sebagai teacher, teacher_status = 'pending'.
    const role = "student";
    const teacherStatus = registerAs === "teacher" ? "pending" : "none";

    const result = await pool.query(
      `INSERT INTO users (username, email, password, role, teacher_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, teacher_status`,
      [username.trim(), email.toLowerCase().trim(), hashedPassword, role, teacherStatus]
    );

    const newUser = result.rows[0];
    await createSession(newUser);

    return NextResponse.json({
      message: "Registrasi berhasil",
      user: newUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + error.message },
      { status: 500 }
    );
  }
}