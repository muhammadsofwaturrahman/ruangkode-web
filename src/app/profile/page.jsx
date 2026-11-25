import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatDate, percentOf } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil" };

const ROLE_LABEL = { admin: "Admin", teacher: "Teacher", student: "Student" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    // Cookie masih ada tetapi akun sudah dihapus: bersihkan cookie lalu ke halaman login.
    redirect("/api/auth/logout");
  }

  // 1. Data akun. Logika "Welcome Teacher": approved_at kurang dari 24 jam yang lalu.
  const userRes = await pool.query(
    `SELECT id, username, email, role, teacher_status,
            (approved_at IS NOT NULL AND approved_at > NOW() - INTERVAL '24 hours') AS is_new_teacher
     FROM users
     WHERE id = $1`,
    [session.id]
  );
  const user = userRes.rows[0];

  // 2. Kursus yang diikuti beserta progresnya
  const enrolledCoursesRes = await pool.query(
    `SELECT c.id, c.nama_course,
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

  // 3. Sertifikat yang sudah terbit
  const certsRes = await pool.query(
    `SELECT cert.certificate_code, cert.issued_at, c.nama_course
     FROM certificates cert
     JOIN courses c ON cert.course_id = c.id
     WHERE cert.student_id = $1
     ORDER BY cert.issued_at DESC`,
    [user.id]
  );

  // 4. Khusus Teacher: kursus yang diajar beserta progres tiap siswa
  let taught = [];
  if (user.role === "teacher") {
    const taughtRes = await pool.query(
      `SELECT c.id AS course_id, c.nama_course,
              (SELECT COUNT(*) FROM contents WHERE course_id = c.id) AS total_materi,
              u.id AS student_id, u.username,
              COUNT(DISTINCT cp.content_id) AS selesai_materi
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       LEFT JOIN users u ON u.id = e.student_id
       LEFT JOIN contents cnt ON cnt.course_id = c.id
       LEFT JOIN content_progress cp ON cp.content_id = cnt.id AND cp.student_id = u.id
       WHERE c.teacher_id = $1
       GROUP BY c.id, u.id
       ORDER BY c.created_at DESC, u.username ASC`,
      [user.id]
    );

    const byCourse = new Map();
    for (const row of taughtRes.rows) {
      if (!byCourse.has(row.course_id)) {
        byCourse.set(row.course_id, {
          id: row.course_id,
          nama_course: row.nama_course,
          total_materi: Number(row.total_materi),
          students: [],
        });
      }
      if (row.student_id) {
        const course = byCourse.get(row.course_id);
        course.students.push({
          id: row.student_id,
          username: row.username,
          percent: percentOf(row.selesai_materi, course.total_materi),
        });
      }
    }
    taught = [...byCourse.values()].map((c) => ({
      ...c,
      average: c.students.length
        ? Math.round(c.students.reduce((sum, s) => sum + s.percent, 0) / c.students.length)
        : 0,
    }));
  }

  const enrolledCourses = enrolledCoursesRes.rows;
  const certificates = certsRes.rows;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      {user.teacher_status === "pending" && (
        <div role="status" className="notice notice-warn mb-8">
          <p className="font-medium">Akun Pengajar Anda sedang menunggu verifikasi Admin.</p>
          <p className="mt-0.5 text-muted">
            Sementara itu Anda tetap bisa mengikuti kursus sebagai student.
          </p>
        </div>
      )}

      {user.role === "teacher" && user.is_new_teacher && (
        <div role="status" className="notice notice-ok mb-8">
          <p className="font-medium">Selamat datang, Teacher. Akun Anda baru saja disetujui Admin.</p>
          <p className="mt-0.5 text-muted">
            Mulai dengan membuat kursus pertama Anda di{" "}
            <Link href="/teacher" className="link">
              dashboard Teacher
            </Link>
            .
          </p>
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-4xl">{user.username}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-muted">
            <span>{user.email}</span>
            <span className="badge">{ROLE_LABEL[user.role]}</span>
            {user.teacher_status === "pending" && <span className="badge badge-warn">Menunggu verifikasi</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user.role === "admin" && (
            <Link href="/admin" className="btn btn-outline">
              Dashboard Admin
            </Link>
          )}
          {user.role === "teacher" && (
            <Link href="/teacher" className="btn btn-outline">
              Dashboard Teacher
            </Link>
          )}
          <Link href="/courses" className="btn btn-primary">
            Buka katalog
          </Link>
        </div>
      </header>

      <dl className="mt-10 flex gap-12 border-y border-line py-5">
        <div>
          <dt className="text-sm text-muted">Kursus diikuti</dt>
          <dd className="mt-0.5 font-serif text-3xl">{enrolledCourses.length}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Sertifikat</dt>
          <dd className="mt-0.5 font-serif text-3xl">{certificates.length}</dd>
        </div>
        {user.role === "teacher" && (
          <div>
            <dt className="text-sm text-muted">Kursus diajar</dt>
            <dd className="mt-0.5 font-serif text-3xl">{taught.length}</dd>
          </div>
        )}
      </dl>

      {/* Teacher: kursus yang diajar dan progres siswa */}
      {user.role === "teacher" && (
        <section className="mt-14">
          <h2 className="text-2xl">Kursus yang Anda ajar</h2>

          {taught.length === 0 ? (
            <p className="mt-4 text-muted">
              Anda belum membuat kursus.{" "}
              <Link href="/teacher" className="link">
                Buat kursus pertama
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 border-t border-line">
              {taught.map((course) => (
                <li key={course.id} className="border-b border-line py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-xl">{course.nama_course}</h3>
                    <p className="text-sm text-muted">
                      {course.students.length} peserta, rata-rata progres{" "}
                      <span className="font-medium text-ink">{course.average}%</span>
                    </p>
                  </div>

                  {course.students.length === 0 ? (
                    <p className="mt-3 text-sm text-muted">Belum ada peserta.</p>
                  ) : (
                    <ul className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-2">
                      {course.students.map((s) => (
                        <li key={s.id}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span>{s.username}</span>
                            <span className="text-muted">{s.percent}%</span>
                          </div>
                          <div className="progress">
                            <span style={{ width: `${s.percent}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Kursus yang diikuti */}
      {(user.role !== "teacher" || enrolledCourses.length > 0) && (
        <section className="mt-14">
          <h2 className="text-2xl">Kursus yang Anda ikuti</h2>

          {enrolledCourses.length === 0 ? (
            <div className="mt-4 text-muted">
              <p>Anda belum mengikuti kursus apa pun.</p>
              <Link href="/courses" className="btn btn-primary mt-4">
                Cari kursus
              </Link>
            </div>
          ) : (
            <ul className="mt-4 border-t border-line">
              {enrolledCourses.map((course) => {
                const total = Number(course.total_materi);
                const selesai = Number(course.selesai_materi);
                const percent = percentOf(selesai, total);

                return (
                  <li
                    key={course.id}
                    className="grid gap-5 border-b border-line py-6 md:grid-cols-[1fr_15rem] md:gap-10"
                  >
                    <div>
                      <p className="text-sm font-medium text-pine">{course.category_name || "Umum"}</p>
                      <h3 className="mt-1 text-xl">{course.nama_course}</h3>
                      <p className="mt-1 text-sm text-muted">Pengajar: {course.teacher_name}</p>
                    </div>
                    <div>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-muted">
                          {selesai} dari {total} bab
                        </span>
                        <span className="font-medium">{percent}%</span>
                      </div>
                      <div className="progress">
                        <span style={{ width: `${percent}%` }} />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link href={`/courses/${course.id}`} className="btn btn-outline btn-sm flex-1">
                          {percent === 100 ? "Tinjau kembali" : "Lanjutkan belajar"}
                        </Link>
                        {course.certificate_code && (
                          <Link
                            href={`/certificates/${course.certificate_code}`}
                            className="btn btn-primary btn-sm"
                          >
                            Sertifikat
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Sertifikat */}
      <section className="mt-14">
        <h2 className="text-2xl">Sertifikat</h2>
        {certificates.length === 0 ? (
          <p className="mt-4 max-w-xl text-muted">
            Belum ada sertifikat. Sertifikat terbit otomatis saat seluruh bab pada sebuah kursus
            selesai.
          </p>
        ) : (
          <ul className="mt-4 border-t border-line">
            {certificates.map((cert) => (
              <li
                key={cert.certificate_code}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-4"
              >
                <div>
                  <p className="font-medium">{cert.nama_course}</p>
                  <p className="mt-0.5 font-mono text-sm text-muted">{cert.certificate_code}</p>
                </div>
                <div className="flex items-baseline gap-5 text-sm">
                  <span className="text-muted">Terbit {formatDate(cert.issued_at)}</span>
                  <Link href={`/certificates/${cert.certificate_code}`} className="link font-medium">
                    Buka
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
