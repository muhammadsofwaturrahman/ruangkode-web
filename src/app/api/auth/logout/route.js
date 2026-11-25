import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT id, username, email, password, role, teacher_status FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];
    const isPasswordValid = user ? await bcrypt.compare(password, user.password) : false;

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
    }

    await createSession(user);

    return NextResponse.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        teacher_status: user.teacher_status,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
