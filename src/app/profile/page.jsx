import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // 1. Ambil data terbaru user
  const userRes = await pool.query(
    `SELECT id, username, email, role
     FROM users
     WHERE id = $1`,
    [session.id]
  );

  const user = userRes.rows[0];
  if (!user) {
    redirect("/login");
  }

  // 2. Ambil daftar kursus yang diikuti user beserta progres belajarnya
  const enrolledCoursesRes = await pool.query(
    `SELECT c.id, c.nama_course, c.deskripsi,
            cat.name AS category_name,
            t.username AS teacher_name,
            COUNT(DISTINCT cnt.id) AS total_materi,
            COUNT(DISTINCT cp.content_id) AS selesai_materi,
            cert.certificate_code
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN users t ON c.teacher_id = t.id
     LEFT JOIN contents cnt ON cnt.course_id = c.id
     LEFT JOIN content_progress cp ON cp.content_id = cnt.id AND cp.student_id = $1
     LEFT JOIN certificates cert ON cert.course_id = c.id AND cert.student_id = $1
     WHERE e.student_id = $1
     GROUP BY c.id, cat.name, t.username, cert.certificate_code, e.id
     ORDER BY e.id DESC`,
    [user.id]
  );

  // 3. Ambil daftar sertifikat yang sudah diterbitkan untuk user
  const certsRes = await pool.query(
    `SELECT cert.certificate_code, cert.issued_at,
            c.id AS course_id, c.nama_course,
            cat.name AS category_name
     FROM certificates cert
     JOIN courses c ON cert.course_id = c.id
     LEFT JOIN categories cat ON c.category_id = cat.id
     WHERE cert.student_id = $1
     ORDER BY cert.issued_at DESC`,
    [user.id]
  );

  const enrolledCourses = enrolledCoursesRes.rows;
  const certificates = certsRes.rows;

  const roleBadgeClass =
    user.role === "admin"
      ? "border-amber-400/40 bg-amber-500/15 text-amber-300"
      : user.role === "teacher"
      ? "border-purple-400/40 bg-purple-500/15 text-purple-300"
      : "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-300";

  return (
    <div className="min-h-screen bg-[#0E0A1E] text-slate-100">
      <Navbar user={session} />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        {/* KARTU PROFIL AKUN */}
        <section className="relative overflow-hidden rounded-2xl border border-[#2E1A47] bg-[#120D26] p-6 shadow-xl shadow-black/30 sm:p-8">
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#A91079]/15 blur-3xl" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white sm:text-3xl">
                  {user.username}
                </h1>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${roleBadgeClass}`}
                >
                  {user.role}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{user.email}</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
                >
                  Buka Dashboard Admin
                </Link>
              )}
              {user.role === "teacher" && (
                <Link
                  href="/teacher"
                  className="rounded-lg border border-purple-400/40 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300 transition hover:bg-purple-500/20"
                >
                  Buka Dashboard Teacher
                </Link>
              )}
              <Link
                href="/courses"
                className="rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#F806CC]/20 transition hover:opacity-90"
              >
                Eksplor Katalog Kursus
              </Link>
            </div>
          </div>

          {/* Ringkasan Statistik */}
          <div className="relative z-10 mt-6 grid gap-4 border-t border-[#2E1A47] pt-6 sm:grid-cols-2">
            <div className="rounded-xl border border-[#2E1A47] bg-[#0E0A1E] p-4">
              <span className="text-xs text-slate-400">Kursus Diikuti</span>
              <p className="mt-1 text-2xl font-black text-white">
                {enrolledCourses.length}
              </p>
            </div>
            <div className="rounded-xl border border-[#2E1A47] bg-[#0E0A1E] p-4">
              <span className="text-xs text-slate-400">Sertifikat Diraih</span>
              <p className="mt-1 text-2xl font-black text-amber-400">
                {certificates.length}
              </p>
            </div>
          </div>
        </section>

        {/* DAFTAR SERTIFIKAT KELULUSAN */}
        <section className="rounded-2xl border border-[#2E1A47] bg-[#120D26] p-6 shadow-lg shadow-black/25">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Sertifikat Kelulusan</h2>
              <p className="text-xs text-slate-400">
                Sertifikat otomatis terbit saat progres belajar pada sebuah kursus mencapai 100%.
              </p>
            </div>
          </div>

          {certificates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#2E1A47] bg-[#0E0A1E]/60 p-6 text-center text-sm text-slate-400">
              Belum ada sertifikat. Selesaikan 100% materi pada salah satu kursus untuk mendapatkan sertifikat.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {certificates.map((cert) => (
                <Link
                  key={cert.certificate_code}
                  href={`/certificates/${cert.certificate_code}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-amber-400/30 bg-[#0E0A1E] p-4 transition hover:border-amber-400"
                >
                  <div className="min-w-0">
                    {cert.category_name && (
                      <span className="inline-block rounded-full border border-purple-500/30 bg-purple-950/50 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                        {cert.category_name}
                      </span>
                    )}
                    <h3 className="mt-1.5 truncate text-sm font-bold text-white">
                      {cert.nama_course}
                    </h3>
                    <p className="mt-0.5 font-mono text-xs text-amber-400">
                      {cert.certificate_code}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Diterbitkan:{" "}
                      {new Date(cert.issued_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[#F806CC] transition group-hover:translate-x-0.5">
                    Buka →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* DAFTAR KURSUS YANG DIIKUTI */}
        <section className="rounded-2xl border border-[#2E1A47] bg-[#120D26] p-6 shadow-lg shadow-black/25">
          <h2 className="mb-4 text-lg font-bold text-white">Kursus Saya</h2>

          {enrolledCourses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#2E1A47] bg-[#0E0A1E]/60 p-8 text-center">
              <p className="text-sm text-slate-400">
                Anda belum mengikuti kursus apa pun.
              </p>
              <Link
                href="/courses"
                className="mt-4 inline-block rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] px-5 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                Cari Kursus Sekarang
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {enrolledCourses.map((course) => {
                const total = Number(course.total_materi);
                const selesai = Number(course.selesai_materi);
                const percent = total > 0 ? Math.round((selesai / total) * 100) : 0;

                return (
                  <div
                    key={course.id}
                    className="flex flex-col justify-between rounded-xl border border-[#2E1A47] bg-[#0E0A1E] p-5 transition hover:border-[#A91079]"
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="rounded-full border border-purple-500/30 bg-purple-950/50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
                          {course.category_name || "Umum"}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            percent === 100 ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {percent}% Selesai
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">
                        {course.nama_course}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {course.deskripsi}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Pengajar:{" "}
                        <span className="text-slate-300">{course.teacher_name}</span>
                      </p>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-[11px] text-slate-400">
                        <span>Progres Materi</span>
                        <span>
                          {selesai} / {total} bab
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1C143B]">
                        <div
                          className="h-full bg-gradient-to-r from-[#F806CC] to-emerald-400 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/courses/${course.id}`}
                          className="flex-1 rounded-lg bg-[#2E1A47] py-2 text-center text-xs font-bold text-white transition hover:bg-[#A91079]"
                        >
                          {percent === 100 ? "Ulas Kembali" : "Lanjutkan Belajar →"}
                        </Link>
                        {course.certificate_code && (
                          <Link
                            href={`/certificates/${course.certificate_code}`}
                            className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
                          >
                            Sertifikat
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}