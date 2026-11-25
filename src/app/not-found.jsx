import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
      <h1 className="text-4xl">Halaman tidak ditemukan</h1>
      <p className="mt-3 max-w-md text-muted">
        Alamat yang Anda buka tidak ada atau sudah dipindahkan.
      </p>
      <Link href="/courses" className="btn btn-primary mt-6">
        Buka katalog kursus
      </Link>
    </main>
  );
}
