import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "ruangkode-secret-key-minimal-32-karakter";
const encodedKey = new TextEncoder().encode(secretKey);

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;

  let user = null;
  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, encodedKey, {
        algorithms: ["HS256"],
      });
      user = payload;
    } catch {
      user = null;
    }
  }

  // 1. Proteksi halaman private (/profile, /admin, /teacher)
  const isProtected =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher");

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Proteksi khusus role Admin (/admin)
  if (pathname.startsWith("/admin") && user?.role !== "admin") {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // 3. Proteksi khusus role Teacher (/teacher) - hanya yang sudah di-approve
  if (pathname.startsWith("/teacher") && user?.role !== "teacher") {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // 4. Jika sudah login, cegah akses kembali ke /login atau /register
  if ((pathname === "/login" || pathname === "/register") && user) {
    if (user.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*", "/teacher/:path*", "/login", "/register"],
};