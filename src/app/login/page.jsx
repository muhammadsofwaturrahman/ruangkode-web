"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login gagal");
        setLoading(false);
        return;
      }

      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
      router.refresh();
    } catch {
      setError("Gagal menghubungi server.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-2xl font-extrabold text-indigo-600">
            RuangKode
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Masuk ke Akun Anda</h1>
          <p className="mt-1 text-sm text-slate-500">
            Lanjutkan belajar atau kelola kelas Anda
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@ruangkode.com"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}