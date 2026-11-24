"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Navbar({ user }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#2E1A47] bg-[#0E0A1E]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/images/bear-logo.jpg"
              alt="Logo RuangKode"
              width={34}
              height={34}
              className="h-8 w-8 rounded-full border border-[#2E1A47] object-cover"
            />
            <span className="bg-gradient-to-r from-[#F806CC] via-[#A91079] to-[#F59E0B] bg-clip-text text-xl font-black text-transparent">
              RuangKode
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-300 sm:flex">
            <Link href="/" className="transition hover:text-[#F806CC]">
              Beranda
            </Link>
            <Link href="/courses" className="transition hover:text-[#F806CC]">
              Katalog Kursus
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="font-semibold text-amber-400 hover:underline">
                Dashboard Admin
              </Link>
            )}
            {user?.role === "teacher" && (
              <Link href="/teacher" className="font-semibold text-purple-400 hover:underline">
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
                className="rounded-lg border border-[#2E1A47] bg-[#120D26] px-3.5 py-1.5 text-sm font-medium text-slate-200 transition hover:border-[#A91079] hover:bg-[#1C143B]"
              >
                Profil ({user.username})
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-red-500/30 bg-red-950/40 px-3.5 py-1.5 text-sm font-semibold text-red-400 transition hover:bg-red-900/50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:text-[#F806CC]"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-[#F806CC]/20 transition hover:opacity-90"
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