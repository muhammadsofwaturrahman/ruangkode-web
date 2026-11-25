import Link from "next/link";
import Image from "next/image";
import pool from "@/lib/db";
import CourseArt from "@/components/CourseArt";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 5 kursus terpopuler berdasarkan jumlah pendaftar (JOIN + COUNT + GROUP BY)
  const [popularRes, categoriesRes] = await Promise.all([
    pool.query(
      `SELECT c.id, c.nama_course, c.deskripsi,
              cat.name AS category_name,
              u.username AS teacher_name,
              COUNT(e.student_id) AS student_count
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN enrollments e ON c.id = e.course_id
       GROUP BY c.id, cat.name, u.username
       ORDER BY student_count DESC, c.created_at DESC
       LIMIT 5`
    ),
    pool.query("SELECT id, name FROM categories ORDER BY name ASC"),
  ]);

  const popular = popularRes.rows;

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <h1 className="max-w-2xl text-4xl sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            Belajar coding sampai <span className="text-pine">wisuda</span>, satu bab dalam satu waktu.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Materi disusun berurutan oleh pengajar, progres belajar tercatat otomatis, dan
            sertifikat terbit begitu seluruh bab selesai.
          </p>

          <form action="/courses" method="get" className="mt-9 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="home-search" className="sr-only">
                Cari kursus
              </label>
              <input
                id="home-search"
                name="search"
                type="search"
                placeholder="Cari kursus, misalnya SQL"
                className="field !h-12 !rounded-full !px-5"
              />
            </div>
            <div className="sm:w-48">
              <label htmlFor="home-category" className="sr-only">
                Kategori
              </label>
              <select id="home-category" name="category" defaultValue="" className="field !h-12 !rounded-full !px-5">
                <option value="">Semua kategori</option>
                {categoriesRes.rows.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary !h-12 !rounded-full !px-7">
              Cari
            </button>
          </form>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/courses" className="btn btn-outline !h-11 !rounded-full !px-6">
              Jelajahi katalog
            </Link>
            <Link href="/register" className="link self-center text-sm font-medium">
              Belum punya akun? Daftar gratis
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Image
            src="/images/graduation-bear.png"
            alt="Maskot RuangKode"
            width={677}
            height={1195}
            priority
            className="h-auto w-56 object-contain sm:w-64 lg:w-80"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-magenta">Pilihan peserta</p>
            <h2 className="mt-1 text-3xl">Kursus terpopuler</h2>
          </div>
          <Link href="/courses" className="link text-sm font-medium">
            Lihat semua kursus
          </Link>
        </div>

        {popular.length === 0 ? (
          <p className="py-10 text-muted">Belum ada kursus yang tersedia.</p>
        ) : (
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((course, index) => (
              <li key={course.id}>
                <Link
                  href={`/courses?search=${encodeURIComponent(course.nama_course)}`}
                  className="course-card group h-full"
                >
                  <div className="relative">
                    <CourseArt seed={course.id} className="h-44" />
                    <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm font-extrabold text-[#7a0f58]">
                      {index + 1}
                    </span>
                    <span className="absolute right-4 top-4 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {course.category_name || "Umum"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-xl group-hover:text-pine">{course.nama_course}</h3>
                    <p className="mb-5 mt-2 line-clamp-2 text-sm leading-6 text-muted">{course.deskripsi}</p>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 text-sm text-muted">
                      <span className="truncate">Pengajar: {course.teacher_name}</span>
                      <span className="shrink-0">
                        <span className="font-semibold text-ink">{course.student_count}</span> peserta
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
