"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar({ user }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-extrabold text-indigo-600">
            RuangKode
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 sm:flex">
            <Link href="/" className="hover:text-indigo-600">
              Beranda
            </Link>
            <Link href="/courses" className="hover:text-indigo-600">
              Katalog Kursus
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="font-semibold text-indigo-600">
                Dashboard Admin
              </Link>
            )}
            {user?.role === "teacher" && (
              <Link href="/teacher" className="font-semibold text-indigo-600">
                Dashboard Teacher
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/profile"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Profil ({user.username})
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-50 px-3.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-semibold text-slate-700 hover:text-indigo-600"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}