"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mendaftar.");
        return;
      }

      router.push("/login");
    } catch {
      setError("Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0E0A1E] px-4 py-12 text-slate-100">
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#A91079]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#2E1A47] bg-[#120D26] p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/images/bear-logo.jpg"
              alt="Logo RuangKode"
              width={36}
              height={36}
              unoptimized
              className="h-9 w-9 rounded-full border border-[#2E1A47] object-cover"
            />
            <span className="bg-gradient-to-r from-[#F806CC] via-[#A91079] to-[#F59E0B] bg-clip-text text-2xl font-black text-transparent">
              RuangKode
            </span>
          </Link>
          <h1 className="mt-4 text-xl font-bold text-white">Buat Akun Baru</h1>
          <p className="mt-1 text-xs text-slate-400">
            Mulai perjalanan belajar coding Anda di RuangKode.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Username</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Nama lengkap atau panggilan"
              className="w-full rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#A91079] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#A91079] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#A91079] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Daftar Sebagai</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-3.5 py-2.5 text-sm text-white focus:border-[#A91079] focus:outline-none"
            >
              <option value="student" className="bg-[#120D26]">
                Student (Pelajar)
              </option>
              <option value="teacher" className="bg-[#120D26]">
                Teacher (Pengajar — perlu verifikasi Admin)
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] py-2.5 text-sm font-bold text-white shadow-lg shadow-[#F806CC]/20 transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-[#F806CC] hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}