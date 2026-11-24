"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherClient({ categories, courses, contents, students }) {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // State Form Course
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    nama_course: "",
    deskripsi: "",
    category_id: categories[0]?.id || "",
    start_date: "",
    end_date: "",
  });

  // State Form Materi (Content)
  const [editingContent, setEditingContent] = useState(null);
  const [contentForm, setContentForm] = useState({
    judul: "",
    isi_materi: "",
    order_index: 1,
  });

  function notify(msg, isErr = false) {
    if (isErr) {
      setError(msg);
      setMessage("");
    } else {
      setMessage(msg);
      setError("");
    }
    router.refresh();
  }

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0] || null;
  const activeContents = activeCourse
    ? contents.filter((cnt) => cnt.course_id === activeCourse.id)
    : [];
  const activeStudents = activeCourse
    ? students.filter((st) => st.course_id === activeCourse.id)
    : [];

  // --- HANDLER COURSE ---
  async function handleSaveCourse(e) {
    e.preventDefault();
    const method = editingCourse ? "PUT" : "POST";
    const payload = editingCourse ? { id: editingCourse.id, ...courseForm } : courseForm;

    const res = await fetch("/api/teacher/courses", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error, true);

    setEditingCourse(null);
    setCourseForm({
      nama_course: "",
      deskripsi: "",
      category_id: categories[0]?.id || "",
      start_date: "",
      end_date: "",
    });
    notify(data.message);
  }

  async function handleDeleteCourse(id) {
    if (!confirm("Hapus kursus ini beserta seluruh materinya?")) return;
    const res = await fetch(`/api/teacher/courses?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return notify(data.error, true);

    if (selectedCourseId === id) setSelectedCourseId(null);
    notify(data.message);
  }

  // --- HANDLER MATERI ---
  async function handleSaveContent(e) {
    e.preventDefault();
    if (!activeCourse) return;

    const method = editingContent ? "PUT" : "POST";
    const payload = editingContent
      ? { id: editingContent.id, ...contentForm }
      : { course_id: activeCourse.id, ...contentForm };

    const res = await fetch("/api/teacher/contents", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error, true);

    setEditingContent(null);
    setContentForm({
      judul: "",
      isi_materi: "",
      order_index: activeContents.length + 2,
    });
    notify(data.message);
  }

  async function handleDeleteContent(id) {
    if (!confirm("Hapus materi ini?")) return;
    const res = await fetch(`/api/teacher/contents?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return notify(data.error, true);
    notify(data.message);
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* BAGIAN 1: FORM COURSE & DAFTAR COURSE MILIK TEACHER */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#2E1A47] bg-[#120D26] p-5 shadow-lg shadow-black/30">
          <h2 className="mb-4 text-base font-bold text-white">
            {editingCourse ? "Edit Kursus" : "Buat Kursus Baru"}
          </h2>
          <form onSubmit={handleSaveCourse} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Nama Kursus</label>
              <input
                type="text"
                required
                value={courseForm.nama_course}
                onChange={(e) => setCourseForm({ ...courseForm, nama_course: e.target.value })}
                placeholder="Contoh: Algoritma & Struktur Data"
                className="w-full rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#A91079] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Kategori</label>
              <select
                value={courseForm.category_id}
                onChange={(e) => setCourseForm({ ...courseForm, category_id: e.target.value })}
                className="w-full rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-3 py-2 text-sm text-white focus:border-[#A91079] focus:outline-none"
              >
                <option value="" className="bg-[#120D26] text-white">
                  -- Pilih Kategori --
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#120D26] text-white">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Deskripsi</label>
              <textarea
                rows={3}
                required
                value={courseForm.deskripsi}
                onChange={(e) => setCourseForm({ ...courseForm, deskripsi: e.target.value })}
                placeholder="Ringkasan materi yang akan dipelajari..."
                className="w-full rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#A91079] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Mulai (Opsional)
                </label>
                <input
                  type="date"
                  value={courseForm.start_date}
                  onChange={(e) => setCourseForm({ ...courseForm, start_date: e.target.value })}
                  className="w-full rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-2.5 py-2 text-xs text-white focus:border-[#A91079] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Selesai (Opsional)
                </label>
                <input
                  type="date"
                  value={courseForm.end_date}
                  onChange={(e) => setCourseForm({ ...courseForm, end_date: e.target.value })}
                  className="w-full rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-2.5 py-2 text-xs text-white focus:border-[#A91079] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] py-2 text-sm font-bold text-white transition hover:opacity-90"
              >
                {editingCourse ? "Update Kursus" : "Simpan Kursus"}
              </button>
              {editingCourse && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCourse(null);
                    setCourseForm({
                      nama_course: "",
                      deskripsi: "",
                      category_id: categories[0]?.id || "",
                      start_date: "",
                      end_date: "",
                    });
                  }}
                  className="rounded-lg border border-[#2E1A47] px-3 py-2 text-sm text-slate-300 hover:bg-[#1C143B]"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Daftar Kursus Milik Teacher */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-base font-bold text-white">
            Kursus Anda ({courses.length}) — Klik kartu untuk kelola materi
          </h2>

          {courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2E1A47] bg-[#120D26]/60 p-8 text-center text-sm text-slate-400">
              Anda belum membuat kursus. Gunakan form di samping untuk membuat kursus pertama Anda.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {courses.map((course) => {
                const isSelected = activeCourse?.id === course.id;
                return (
                  <div
                    key={course.id}
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setEditingContent(null);
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-[#F806CC] bg-[#1C143B] shadow-lg shadow-[#F806CC]/10"
                        : "border-[#2E1A47] bg-[#120D26] hover:border-[#A91079]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full border border-purple-500/30 bg-purple-950/50 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
                        {course.category_name || "Umum"}
                      </span>
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingCourse(course);
                            setCourseForm({
                              nama_course: course.nama_course,
                              deskripsi: course.deskripsi,
                              category_id: course.category_id || "",
                              start_date: course.start_date || "",
                              end_date: course.end_date || "",
                            });
                          }}
                          className="rounded border border-[#2E1A47] bg-[#0E0A1E] px-2 py-1 text-xs font-medium text-slate-300 hover:border-amber-400/50 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="rounded border border-red-500/30 bg-red-950/40 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-900/50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-2.5 font-bold text-white">{course.nama_course}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{course.deskripsi}</p>

                    <div className="mt-3 flex items-center justify-between border-t border-[#2E1A47] pt-2.5 text-xs text-slate-400">
                      <span>{course.total_materi} Materi</span>
                      <span className="font-semibold text-amber-400">
                        {course.total_students} Siswa Terdaftar
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BAGIAN 2: KELOLA MATERI BERURUTAN & MONITORING SISWA */}
      {activeCourse && (
        <div className="rounded-2xl border border-[#2E1A47] bg-[#120D26] p-6 shadow-xl shadow-black/30">
          <div className="mb-6 border-b border-[#2E1A47] pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Kursus Aktif
            </span>
            <h2 className="mt-0.5 text-xl font-black text-white">{activeCourse.nama_course}</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Kolom Kiri: Form & Daftar Materi Berurutan */}
            <div>
              <h3 className="mb-3 text-base font-bold text-white">
                {editingContent ? "Edit Materi" : "Tambah Materi Pembelajaran"}
              </h3>
              <form
                onSubmit={handleSaveContent}
                className="mb-6 space-y-3 rounded-xl border border-[#2E1A47] bg-[#0E0A1E] p-4"
              >
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Judul Bab / Materi
                    </label>
                    <input
                      type="text"
                      required
                      value={contentForm.judul}
                      onChange={(e) => setContentForm({ ...contentForm, judul: e.target.value })}
                      placeholder="Contoh: Pengenalan Dasar"
                      className="w-full rounded-lg border border-[#2E1A47] bg-[#120D26] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#A91079] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">Urutan</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={contentForm.order_index}
                      onChange={(e) =>
                        setContentForm({ ...contentForm, order_index: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#2E1A47] bg-[#120D26] px-3 py-2 text-sm text-white focus:border-[#A91079] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Isi Materi</label>
                  <textarea
                    rows={4}
                    required
                    value={contentForm.isi_materi}
                    onChange={(e) =>
                      setContentForm({ ...contentForm, isi_materi: e.target.value })
                    }
                    placeholder="Tulis penjelasan materi pembelajaran secara lengkap di sini..."
                    className="w-full rounded-lg border border-[#2E1A47] bg-[#120D26] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#A91079] focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    {editingContent ? "Simpan Materi" : "Tambah Materi"}
                  </button>
                  {editingContent && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingContent(null);
                        setContentForm({
                          judul: "",
                          isi_materi: "",
                          order_index: activeContents.length + 1,
                        });
                      }}
                      className="rounded-lg border border-[#2E1A47] px-3 py-2 text-sm text-slate-300 hover:bg-[#1C143B]"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <h4 className="mb-3 text-sm font-bold text-slate-200">
                Daftar Materi ({activeContents.length})
              </h4>
              {activeContents.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada materi pada kursus ini.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeContents.map((cnt) => (
                    <div
                      key={cnt.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-[#2E1A47] bg-[#0E0A1E] p-3.5"
                    >
                      <div>
                        <span className="text-xs font-bold text-amber-400">
                          Bab #{cnt.order_index}
                        </span>
                        <h5 className="text-sm font-semibold text-white">{cnt.judul}</h5>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                          {cnt.isi_materi}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => {
                            setEditingContent(cnt);
                            setContentForm({
                              judul: cnt.judul,
                              isi_materi: cnt.isi_materi,
                              order_index: cnt.order_index,
                            });
                          }}
                          className="rounded border border-[#2E1A47] bg-[#120D26] px-2 py-1 text-xs font-medium text-slate-300 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteContent(cnt.id)}
                          className="rounded border border-red-500/30 bg-red-950/40 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-900/50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kolom Kanan: Monitoring Siswa & Progres Belajar */}
            <div>
              <h3 className="mb-3 text-base font-bold text-white">
                Monitoring Progres Siswa ({activeStudents.length})
              </h3>
              {activeStudents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#2E1A47] bg-[#0E0A1E]/60 p-6 text-center text-sm text-slate-500">
                  Belum ada siswa yang mendaftar pada kursus ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeStudents.map((st) => {
                    const total = Number(st.total_materi);
                    const selesai = Number(st.selesai_materi);
                    const percent = total > 0 ? Math.round((selesai / total) * 100) : 0;

                    return (
                      <div
                        key={st.student_id}
                        className="rounded-xl border border-[#2E1A47] bg-[#0E0A1E] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{st.username}</div>
                            <div className="text-xs text-slate-400">{st.email}</div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              percent === 100
                                ? "border border-emerald-500/30 bg-emerald-950/50 text-emerald-400"
                                : "border border-purple-500/30 bg-purple-950/50 text-purple-300"
                            }`}
                          >
                            {percent}% Selesai
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-xs text-slate-400">
                            <span>Materi diselesaikan</span>
                            <span>
                              {selesai} / {total} bab
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[#1C143B]">
                            <div
                              className="h-full bg-gradient-to-r from-[#F806CC] to-emerald-400 transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}