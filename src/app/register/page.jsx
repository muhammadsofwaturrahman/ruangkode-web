"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OPTIONS = [
  {
    value: "student",
    title: "Student",
    desc: "Ikuti kursus dan pantau progres belajar.",
  },
  {
    value: "teacher",
    title: "Teacher",
    desc: "Buat kursus dan materi. Perlu verifikasi Admin.",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [registerAs, setRegisterAs] = useState("student");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
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
        body: JSON.stringify({ ...form, registerAs }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pendaftaran gagal.");
        return;
      }

      // Pendaftar langsung masuk sebagai student, termasuk yang memilih Teacher.
      router.push("/profile");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi sebentar lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="max-w-md">
        <h1 className="text-4xl">Buat akun</h1>
        <p className="mt-2 text-muted">Gratis, dan siap dipakai begitu Anda selesai mendaftar.</p>

        {error && (
          <div role="alert" className="notice notice-err mt-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <fieldset>
            <legend className="label">Daftar sebagai</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {OPTIONS.map((opt) => {
                const checked = registerAs === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`cursor-pointer rounded-md border p-3.5 transition-colors ${
                      checked ? "border-pine bg-mist" : "border-line bg-panel hover:border-pine"
                    }`}
                  >
                    <input
                      type="radio"
                      name="registerAs"
                      value={opt.value}
                      checked={checked}
                      onChange={() => setRegisterAs(opt.value)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-medium">{opt.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{opt.desc}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="username" className="label">
              Nama
            </label>
            <input
              id="username"
              type="text"
              required
              maxLength={100}
              autoComplete="name"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="field"
            />
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="field"
            />
            <p className="hint">Minimal 6 karakter.</p>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Mendaftarkan..." : "Buat akun"}
          </button>
        </form>

        <p className="mt-8 text-sm text-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="link font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
