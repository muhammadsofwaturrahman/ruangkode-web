"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [registerAs, setRegisterAs] = useState("student");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ username, email, password, registerAs }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registrasi gagal");
        setLoading(false);
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setError("Gagal menghubungi server.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-2xl font-extrabold text-indigo-600">
            RuangKode
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Buat Akun Baru</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pilih peran pendaftaran Anda di bawah ini
          </p>
        </div>

        {/* Pilihan 2 Jalur Registrasi */}
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRegisterAs("student")}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              registerAs === "student"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Register as Student
          </button>
          <button
            type="button"
            onClick={() => setRegisterAs("teacher")}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              registerAs === "teacher"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Register as Teacher
          </button>
        </div>

        {registerAs === "teacher" && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            Pendaftar <strong>Teacher</strong> akan masuk sebagai Student terlebih dahulu sambil
            menunggu persetujuan (Approve) dari Admin.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama Lengkap</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: Muhammad Sofwaturrohman"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading
              ? "Mendaftarkan..."
              : registerAs === "teacher"
              ? "Daftar sebagai Teacher"
              : "Daftar sebagai Student"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}