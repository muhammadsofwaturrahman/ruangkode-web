
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-extrabold text-indigo-600 sm:text-5xl">Platform Kursus</h1>
      <p className="mt-4 text-slate-600">
        Setup proyek selesai. Cek koneksi database di{" "}
        <a href="/api/health" className="font-medium text-indigo-600 underline">
          /api/health
        </a>
        .
      </p>
    </main>
  );
}