import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "SELECT id, username, email, password, role, teacher_status FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
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
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + error.message },
      { status: 500 }
    );
  }
}