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
        setError(data.error || "Email atau password salah.");
        return;
      }

      const role = data.user?.role;
      router.push(role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/profile");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi sebentar lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="max-w-sm">
        <h1 className="text-4xl">Masuk</h1>
        <p className="mt-2 text-muted">Lanjutkan belajar dari bab terakhir Anda.</p>

        {error && (
          <div role="alert" className="notice notice-err mt-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-8 text-sm text-muted">
          Belum punya akun?{" "}
          <Link href="/register" className="link font-medium">
            Daftar
          </Link>
        </p>
      </div>
    </main>
  );
}
