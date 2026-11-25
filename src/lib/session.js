import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import pool from "@/lib/db";

const secretKey = process.env.SESSION_SECRET || "ruangkode-secret-key-minimal-32-karakter";
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(user) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari
  // JWT hanya menyimpan id. Role dan status selalu dibaca ulang dari database
  // supaya perubahan (misalnya Teacher di-approve Admin) langsung berlaku.
  const session = await new SignJWT({ id: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

// Mengembalikan data user terbaru, atau null jika belum login / akun sudah dihapus.
// cache() membuat query ini hanya berjalan sekali per request.
export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  let payload;
  try {
    ({ payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] }));
  } catch {
    return null;
  }

  const id = Number(payload.id);
  if (!Number.isInteger(id)) return null;

  const { rows } = await pool.query(
    "SELECT id, username, email, role, teacher_status FROM users WHERE id = $1",
    [id]
  );
  return rows[0] || null;
});

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
