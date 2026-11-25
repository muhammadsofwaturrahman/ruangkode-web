"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { percentOf } from "@/lib/format";
import CourseArt from "@/components/CourseArt";

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
  const [error, setError] = useState("");

  function applyFilter(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    router.push(qs ? `/courses?${qs}` : "/courses");
  }

  function resetFilter() {
    setSearch("");
    setCategory("");
    router.push("/courses");
  }

  async function handleEnroll(courseId) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setError("");
    setLoadingId(courseId);
    try {
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mendaftar kursus.");
        return;
      }

      router.push(`/courses/${courseId}`);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi sebentar lagi.");
    } finally {
      setLoadingId(null);
    }
  }

  const isFiltered = Boolean(currentSearch || currentCategory);

  return (
    <div className="mt-8">
      <form onSubmit={applyFilter} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Cari kursus
          </label>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul atau topik"
            className="field"
          />
        </div>
        <div className="sm:w-52">
          <label htmlFor="category" className="sr-only">
            Kategori
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="field"
          >
            <option value="">Semua kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Terapkan
        </button>
      </form>

      {error && (
        <div role="alert" className="notice notice-err mt-5">
          {error}
        </div>
      )}

      <div className="mt-8 flex items-baseline justify-between border-b border-line pb-3 text-sm text-muted">
        <span>{courses.length} kursus</span>
        {isFiltered && (
          <button type="button" onClick={resetFilter} className="link">
            Hapus filter
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <p className="py-12 text-muted">Tidak ada kursus yang cocok dengan pencarian Anda.</p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const percent = percentOf(course.completed_materi, course.total_materi);
            const hasPeriod = course.start_label || course.end_label;

            return (
              <li key={course.id} className="course-card group">
                <div className="relative">
                  <CourseArt seed={course.id} className="h-40" />
                  <span className="absolute right-4 top-4 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {course.category_name || "Umum"}
                  </span>
                  {course.is_enrolled && percent === 100 && (
                    <span className="absolute left-4 top-4 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-[#4a2a00]">
                      🎓 Lulus
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-xl">{course.nama_course}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{course.deskripsi}</p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>Pengajar: {course.teacher_name}</span>
                    <span>{course.total_materi} bab</span>
                    <span>{course.student_count} peserta</span>
                  </p>
                  {hasPeriod && (
                    <p className="mt-1 text-xs text-muted">
                      Periode {course.start_label || "?"} sampai {course.end_label || "?"}
                    </p>
                  )}

                  <div className="mt-auto flex flex-col gap-3 pt-5">
                    {course.is_enrolled && (
                      <div>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-muted">
                            {course.completed_materi} dari {course.total_materi} bab selesai
                          </span>
                          <span className="font-semibold">{percent}%</span>
                        </div>
                        <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                          <span style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )}

                    {course.is_enrolled ? (
                      <Link href={`/courses/${course.id}`} className="btn btn-primary !rounded-full">
                        Lanjutkan belajar
                      </Link>
                    ) : course.is_owner ? (
                      <Link href={`/courses/${course.id}`} className="btn btn-outline !rounded-full">
                        Buka materi
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEnroll(course.id)}
                        disabled={loadingId === course.id}
                        className="btn btn-primary !rounded-full"
                      >
                        {loadingId === course.id ? "Memproses..." : "Ikuti kursus"}
                      </button>
                    )}

                    <a
                      href={`mailto:${course.teacher_email}?subject=${encodeURIComponent(
                        "Pertanyaan tentang kursus " + course.nama_course
                      )}`}
                      className="link text-center text-sm"
                    >
                      Hubungi pengajar
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
