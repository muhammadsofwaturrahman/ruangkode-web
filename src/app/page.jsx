import Link from "next/link";
import Image from "next/image";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  // Query 5 kursus terpopuler berdasarkan jumlah pendaftar (COUNT)
  const popularCoursesRes = await pool.query(
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
  );

  return (
    <div className="min-h-screen bg-[#0E0A1E]">
      <Navbar user={session} />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#2E1A47] py-14 lg:py-20">
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-[#A91079]/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/4 top-1/2 -z-10 h-80 w-80 rounded-full bg-[#F806CC]/10 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="text-center lg:col-span-7 lg:text-left">
              <span className="inline-block rounded-full border border-purple-500/30 bg-purple-950/40 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-300">
                RuangKode Learning Platform
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Kuasai Coding{" "}
                <span className="bg-gradient-to-r from-amber-400 via-[#F806CC] to-purple-400 bg-clip-text text-transparent">
                  Lebih Mudah.
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base text-slate-300 lg:mx-0">
                Pelajari pemrograman, basis data, dan perancangan sistem lewat materi terstruktur,
                pelacakan progres otomatis, serta diskusi langsung bersama pengajar.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
                <Link
                  href="/courses"
                  className="rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#F806CC]/20 transition hover:opacity-90"
                >
                  Eksplor Kursus
                </Link>
                {!session ? (
                  <Link
                    href="/register"
                    className="rounded-lg border border-[#2E1A47] bg-[#120D26] px-6 py-3 text-sm font-bold text-slate-200 transition hover:border-[#A91079] hover:bg-[#1C143B]"
                  >
                    Daftar Gratis
                  </Link>
                ) : (
                  <Link
                    href="/profile"
                    className="rounded-lg border border-[#2E1A47] bg-[#120D26] px-6 py-3 text-sm font-bold text-slate-200 transition hover:border-[#A91079] hover:bg-[#1C143B]"
                  >
                    Buka Profil Saya
                  </Link>
                )}
              </div>
            </div>

            {/* Maskot Beruang Memegang Laptop */}
            <div className="relative flex justify-center lg:col-span-5">
              <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#A91079]/35 via-[#F806CC]/20 to-amber-400/25 blur-3xl" />
              <Image
                src="/images/graduation-bear.jpg"
                  alt="Maskot RuangKode Bear"
                  width={340}
                  height={450}
                  priority
                  unoptimized
                  className="relative z-10 h-auto w-64 object-contain mix-blend-lighten sm:w-72"
              />
            </div>
          </div>
        </div>
      </section>

      {/* KURSUS TERPOPULER (TOP 5) */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-black text-white">Kursus Terpopuler</h2>
              <p className="mt-1 text-sm text-slate-400">
                Lima kelas dengan jumlah peserta terbanyak di RuangKode saat ini.
              </p>
            </div>
            <Link
              href="/courses"
              className="text-sm font-semibold text-purple-400 hover:text-[#F806CC] hover:underline"
            >
              Lihat Semua Katalog →
            </Link>
          </div>
          

          {popularCoursesRes.rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2E1A47] bg-[#120D26]/50 p-10 text-center text-sm text-slate-400">
              Belum ada kursus yang tersedia.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {popularCoursesRes.rows.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col rounded-2xl border border-[#2E1A47] bg-[#120D26] p-5 shadow-lg shadow-black/30 transition hover:border-[#A91079]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full border border-purple-500/30 bg-purple-950/50 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
                      {course.category_name || "Umum"}
                    </span>
                    <span className="text-xs font-bold text-amber-400">
                      {course.student_count} Siswa
                    </span>
                  </div>

                  <h3 className="line-clamp-1 text-lg font-bold text-white">
                    {course.nama_course}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-grow text-sm text-slate-400">
                    {course.deskripsi}
                  </p>

                  <div className="mt-4 border-t border-[#2E1A47] pt-3 text-xs text-slate-400">
                    Pengajar: <strong className="text-slate-200">{course.teacher_name}</strong>
                  </div>

                  <Link
                    href={`/courses?search=${encodeURIComponent(course.nama_course)}`}
                    className="mt-4 block rounded-lg bg-[#2E1A47] py-2.5 text-center text-xs font-bold text-white transition hover:bg-[#A91079]"
                  >
                    Lihat di Katalog →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}