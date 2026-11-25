"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

function NavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`border-b-2 py-1 text-sm transition-colors ${
        active
          ? "border-pine font-medium text-ink"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar({ user }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="border-b border-line print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/bear-logo.png"
            alt=""
            width={56}
            height={56}
            className="h-8 w-auto"
          />
          <span className="text-xl font-extrabold tracking-tight">RuangKode</span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="order-last flex w-full items-center gap-6 sm:order-none sm:w-auto sm:flex-1"
        >
          <NavLink href="/" active={isActive("/")}>
            Beranda
          </NavLink>
          <NavLink href="/courses" active={isActive("/courses")}>
            Katalog
          </NavLink>
          {user?.role === "admin" && (
            <NavLink href="/admin" active={isActive("/admin")}>
              Dashboard Admin
            </NavLink>
          )}
          {user?.role === "teacher" && (
            <NavLink href="/teacher" active={isActive("/teacher")}>
              Dashboard Teacher
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/profile"
                className={`text-sm ${
                  isActive("/profile") ? "font-medium text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {user.username}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted transition-colors hover:text-ink">
                Masuk
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
