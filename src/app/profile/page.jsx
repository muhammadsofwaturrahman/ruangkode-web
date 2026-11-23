import { redirect } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Ambil data user terbaru langsung dari database + cek kondisi approved_at < 24 jam
  const userRes = await pool.query(
    `SELECT id, username, email, role, teacher_status, approved_at,
            (role = 'teacher' AND approved_at IS NOT NULL AND approved_at >= NOW() - INTERVAL '24 hours') AS is_new_teacher
     FROM users
     WHERE id = $1`,
    [session.id]
  );

  const user = userRes.rows[0];
  if (!user) redirect("/login");

 // Query kursus yang diikuti oleh user (sebagai Student)
  const enrolledRes = await pool.query(
    `SELECT c.id, c.nama_course, cat.name AS category_name,
            COUNT(DISTINCT cnt.id) AS total_materi,
            COUNT(DISTINCT cp.content_id) AS selesai_materi
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN contents cnt ON cnt.course_id = c.id
     LEFT JOIN content_progress cp ON cp.content_id = cnt.id AND cp.student_id = $1
     WHERE e.student_id = $1
     GROUP BY c.id, cat.name, e.enrolled_at
     ORDER BY e.enrolled_at DESC`,
    [user.id]
  );

  // Jika Teacher: query kursus yang diajarkan beserta jumlah siswa & rata-rata progres
  let taughtCourses = [];
  if (user.role === "teacher") {
    const taughtRes = await pool.query(
      `SELECT c.id, c.nama_course, cat.name AS category_name,
              COUNT(DISTINCT e.student_id) AS total_students,
              COUNT(DISTINCT cnt.id) AS total_materi
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN enrollments e ON e.course_id = c.id
       LEFT JOIN contents cnt ON cnt.course_id = c.id
       WHERE c.teacher_id = $1
       GROUP BY c.id, cat.name
       ORDER BY c.created_at DESC`,
      [user.id]
    );
    taughtCourses = taughtRes.rows;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Alert Welcome Teacher (Muncul jika di-approve kurang dari 24 jam) */}
        {user.is_new_teacher && (
          <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
            <h2 className="text-base font-bold">
              Selamat Datang, Pengajar Baru RuangKode!
            </h2>
            <p className="mt-1 text-sm">
              Akun Anda telah disetujui oleh Admin sebagai <strong>Teacher</strong>. Anda sekarang
              dapat mulai membuat kursus dan materi pembelajaran melalui{" "}
              <Link href="/teacher" className="font-semibold underline">
                Dashboard Teacher
              </Link>
              .
            </p>
          </div>
        )}

        {/* Badge Status Pending Teacher */}
        {user.teacher_status === "pending" && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <span className="inline-block rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold uppercase text-amber-900">
              Pending Verification
            </span>
            <p className="mt-1.5 text-sm font-medium">
              Akun Pengajar Anda sedang menunggu verifikasi Admin. Sambil menunggu, Anda tetap
              dapat mengikuti kursus sebagai Student.
            </p>
          </div>
        )}

        {/* Kartu Informasi Profil */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{user.username}</h1>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase text-indigo-700">
                  Role: {user.role}
                </span>
              </div>
            </div>

            {user.role === "teacher" && (
              <Link
                href="/teacher"
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Kelola Kursus Saya
              </Link>
            )}
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Buka Dashboard Admin
              </Link>
            )}
          </div>
        </div>

        {/* Bagian Khusus Teacher: Kursus yang Diajarkan */}
        {user.role === "teacher" && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Kursus yang Anda Ajarkan ({taughtCourses.length})
            </h2>
            {taughtCourses.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                Anda belum membuat kursus apa pun.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {taughtCourses.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <span className="text-xs font-semibold text-indigo-600">
                      {c.category_name || "Umum"}
                    </span>
                    <h3 className="mt-1 font-bold text-slate-900">{c.nama_course}</h3>
                    <div className="mt-3 flex gap-4 text-xs text-slate-600">
                      <span>Total Siswa: <strong>{c.total_students}</strong></span>
                      <span>Total Materi: <strong>{c.total_materi}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bagian Student: Kursus yang Diikuti & Progress */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            Kursus yang Diikuti ({enrolledRes.rows.length})
          </h2>
          {enrolledRes.rows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-sm text-slate-600">Anda belum mengikuti kursus apa pun.</p>
              <Link
                href="/courses"
                className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Jelajahi Katalog Kursus
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {enrolledRes.rows.map((item) => {
                const total = Number(item.total_materi);
                const selesai = Number(item.selesai_materi);
                const percent = total > 0 ? Math.round((selesai / total) * 100) : 0;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <span className="text-xs font-semibold text-indigo-600">
                      {item.category_name || "Umum"}
                    </span>
                    <h3 className="mt-1 font-bold text-slate-900">{item.nama_course}</h3>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-600">
                        <span>Progres Belajar</span>
                        <span className="font-semibold">
                          {percent}% ({selesai}/{total} materi)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      href={`/courses/${item.id}`}
                      className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline"
                    >
                      Lanjutkan Belajar →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}