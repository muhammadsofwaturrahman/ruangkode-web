import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createSession } from "@/lib/session";
import { isEmail } from "@/lib/validate";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const email = String(body?.email ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");
    const registerAs = body?.registerAs;

    if (!username || !email || !password || !registerAs) {
      return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
    }
    if (registerAs !== "student" && registerAs !== "teacher") {
      return NextResponse.json({ error: "Pilihan pendaftaran tidak valid." }, { status: 400 });
    }
    if (username.length > 100) {
      return NextResponse.json({ error: "Username maksimal 100 karakter." }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Semua pendaftar masuk sebagai 'student' terlebih dahulu.
    // Pendaftar lewat pilihan Teacher mendapat teacher_status 'pending' sampai di-approve Admin.
    const teacherStatus = registerAs === "teacher" ? "pending" : "none";

    const result = await pool.query(
      `INSERT INTO users (username, email, password, role, teacher_status)
       VALUES ($1, $2, $3, 'student', $4)
       RETURNING id, username, email, role, teacher_status`,
      [username, email, hashedPassword, teacherStatus]
    );

    const newUser = result.rows[0];
    await createSession(newUser);

    return NextResponse.json({ message: "Registrasi berhasil", user: newUser });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }
    console.error("register error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
