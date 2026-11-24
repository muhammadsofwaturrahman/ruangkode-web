"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CoursesClient({
  courses,
  categories,
  currentSearch,
  currentCategory,
  isLoggedIn,
}) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [category, setCategory] = useState(currentCategory);
  const [loadingId, setLoadingId] = useState(null);

  function applyFilter(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    router.push(qs ? `/courses?${qs}` : "/courses");
  }

  async function handleEnroll(courseId) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setLoadingId(courseId);
    try {
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mendaftar kursus.");
        return;
      }

      router.push(`/courses/${courseId}`);
      router.refresh();
    } catch {
      alert("Gagal menghubungi server.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      {/* Form Pencarian & Filter Kategori */}
      <form onSubmit={applyFilter} className="mb-8 grid gap-3 sm:grid-cols-12">
        <div className="sm:col-span-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul atau topik kursus..."
            className="w-full rounded-lg border border-[#2E1A47] bg-[#120D26] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#A91079] focus:outline-none"
          />
        </div>
        <div className="sm:col-span-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-[#2E1A47] bg-[#120D26] px-4 py-2.5 text-sm text-white focus:border-[#A91079] focus:outline-none"
          >
            <option value="" className="bg-[#120D26]">
              Semua Kategori
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[#120D26]">
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] py-2.5 text-sm font-bold text-white transition hover:opacity-90 sm:col-span-2"
        >
          Terapkan
        </button>
      </form>

      {/* Daftar Kursus */}
      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2E1A47] bg-[#120D26]/60 py-12 text-center text-sm text-slate-400">
          Tidak ada kursus yang sesuai dengan filter pencarian Anda.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const total = Number(course.total_materi);
            const selesai = Number(course.completed_materi || 0);
            const percent = total > 0 ? Math.round((selesai / total) * 100) : 0;

            return (
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

                {(course.start_date || course.end_date) && (
                  <p className="mt-2.5 text-[11px] text-amber-400/90">
                    Periode: {course.start_date || "-"} s/d {course.end_date || "-"}
                  </p>
                )}

                {course.is_enrolled && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span>Progres Belajar</span>
                      <span className="font-semibold text-emerald-400">
                        {percent}% ({selesai}/{total} bab)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1C143B]">
                      <div
                        className="h-full bg-gradient-to-r from-[#F806CC] to-emerald-400 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 border-t border-[#2E1A47] pt-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Pengajar: <strong className="text-slate-200">{course.teacher_name}</strong>
                    </span>
                    <span>{total} Bab</span>
                  </div>

                  <div className="flex gap-2">
                    {course.is_enrolled ? (
                      <Link
                        href={`/courses/${course.id}`}
                        className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-center text-xs font-bold text-white transition hover:bg-emerald-500"
                      >
                        Lanjutkan Belajar →
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={loadingId === course.id}
                        className="flex-1 rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] py-2.5 text-center text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {loadingId === course.id ? "Memproses..." : "Ikuti Kursus"}
                      </button>
                    )}
                    <a
                      href={`mailto:${course.teacher_email}?subject=${encodeURIComponent(
                        "Tanya Kursus: " + course.nama_course
                      )}`}
                      className="rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-3 py-2.5 text-center text-xs font-medium text-slate-300 transition hover:border-amber-400/50 hover:text-white"
                      title="Email Pengajar"
                    >
                      Hubungi
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}