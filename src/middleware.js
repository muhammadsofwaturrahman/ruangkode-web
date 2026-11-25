import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "ruangkode-secret-key-minimal-32-karakter";
const encodedKey = new TextEncoder().encode(secretKey);

// Middleware hanya memeriksa apakah tanda masuk (JWT) valid. Ia berjalan di Edge dan
// tidak boleh membuka koneksi PostgreSQL. Pemeriksaan role dilakukan di tiap halaman
// dan route handler lewat getSession(), yang membaca role terbaru dari database.
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  let loggedIn = false;
  if (token) {
    try {
      await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
      loggedIn = true;
    } catch {
      loggedIn = false;
    }
  }

  const isProtected =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher");

  if (isProtected && !loggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && loggedIn) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*", "/teacher/:path*", "/login", "/register"],
};
