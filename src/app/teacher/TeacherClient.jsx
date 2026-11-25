"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateOnly, percentOf } from "@/lib/format";
import { hasContent, htmlToText } from "@/lib/sanitize";
import RichTextEditor from "@/components/RichTextEditor";

async function send(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    // respons bukan JSON
  }
  return { ok: res.ok, data };
}

export default function TeacherClient({ categories, courses, contents, students }) {
  const router = useRouter();
  const emptyCourse = {
    nama_course: "",
    deskripsi: "",
    category_id: "",
    start_date: "",
    end_date: "",
  };
  const emptyContent = { judul: "", isi_materi: "", order_index: "" };

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? null);
  const [flash, setFlash] = useState(null);

  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState(emptyCourse);

  const [editingContent, setEditingContent] = useState(null);
  const [contentForm, setContentForm] = useState(emptyContent);

  function notify(text, error = false) {
    setFlash({ text, error });
    if (!error) router.refresh();
  }

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0] || null;
  const activeContents = activeCourse
    ? contents.filter((cnt) => cnt.course_id === activeCourse.id)
    : [];
  const activeStudents = activeCourse
    ? students.filter((st) => st.course_id === activeCourse.id)
    : [];

  /* Kursus */
  async function handleSaveCourse(e) {
    e.preventDefault();
    const { ok, data } = editingCourse
      ? await send("/api/teacher/courses", "PUT", { id: editingCourse.id, ...courseForm })
      : await send("/api/teacher/courses", "POST", courseForm);
    if (!ok) return notify(data.error || "Gagal menyimpan kursus.", true);

    setEditingCourse(null);
    setCourseForm(emptyCourse);
    notify(data.message);
  }

  async function handleDeleteCourse(course) {
    if (!confirm(`Hapus kursus "${course.nama_course}" beserta seluruh materi dan progres siswa?`)) {
      return;
    }
    const { ok, data } = await send(`/api/teacher/courses?id=${course.id}`, "DELETE");
    if (!ok) return notify(data.error || "Gagal menghapus kursus.", true);

    if (selectedCourseId === course.id) setSelectedCourseId(null);
    if (editingCourse?.id === course.id) {
      setEditingCourse(null);
      setCourseForm(emptyCourse);
    }
    notify(data.message);
  }

  function startEditCourse(course) {
    setEditingCourse(course);
    setCourseForm({
      nama_course: course.nama_course,
      deskripsi: course.deskripsi,
      category_id: course.category_id ? String(course.category_id) : "",
      start_date: course.start_date || "",
      end_date: course.end_date || "",
    });
    setFlash(null);
  }

  /* Materi */
  async function handleSaveContent(e) {
    e.preventDefault();
    if (!activeCourse) return;
    if (!hasContent(contentForm.isi_materi)) {
      return notify("Isi materi wajib diisi.", true);
    }

    const { ok, data } = editingContent
      ? await send("/api/teacher/contents", "PUT", { id: editingContent.id, ...contentForm })
      : await send("/api/teacher/contents", "POST", { course_id: activeCourse.id, ...contentForm });
    if (!ok) return notify(data.error || "Gagal menyimpan materi.", true);

    setEditingContent(null);
    setContentForm(emptyContent);
    notify(data.message);
  }

  async function handleDeleteContent(cnt) {
    if (!confirm(`Hapus materi "${cnt.judul}"?`)) return;
    const { ok, data } = await send(`/api/teacher/contents?id=${cnt.id}`, "DELETE");
    if (!ok) return notify(data.error || "Gagal menghapus materi.", true);
    if (editingContent?.id === cnt.id) {
      setEditingContent(null);
      setContentForm(emptyContent);
    }
    notify(data.message);
  }

  return (
    <div className="mt-10">
      {flash && (
        <div
          role={flash.error ? "alert" : "status"}
          className={`notice mb-8 ${flash.error ? "notice-err" : "notice-ok"}`}
        >
          {flash.text}
        </div>
      )}

      {/* Kursus */}
      <div className="grid gap-10 lg:grid-cols-[19rem_1fr]">
        <div>
          <div className="panel">
            <h2 className="text-xl">{editingCourse ? "Edit kursus" : "Buat kursus"}</h2>
            <form onSubmit={handleSaveCourse} className="mt-5 space-y-4">
              <div>
                <label htmlFor="t-name" className="label">
                  Nama kursus
                </label>
                <input
                  id="t-name"
                  type="text"
                  required
                  maxLength={200}
                  value={courseForm.nama_course}
                  onChange={(e) => setCourseForm({ ...courseForm, nama_course: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="t-cat" className="label">
                  Kategori
                </label>
                <select
                  id="t-cat"
                  required
                  value={courseForm.category_id}
                  onChange={(e) => setCourseForm({ ...courseForm, category_id: e.target.value })}
                  className="field"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="t-desc" className="label">
                  Deskripsi
                </label>
                <textarea
                  id="t-desc"
                  rows={4}
                  required
                  value={courseForm.deskripsi}
                  onChange={(e) => setCourseForm({ ...courseForm, deskripsi: e.target.value })}
                  placeholder="Apa yang akan dipelajari siswa"
                  className="field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="t-start" className="label">
                    Mulai
                  </label>
                  <input
                    id="t-start"
                    type="date"
                    value={courseForm.start_date}
                    onChange={(e) => setCourseForm({ ...courseForm, start_date: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="t-end" className="label">
                    Selesai
                  </label>
                  <input
                    id="t-end"
                    type="date"
                    min={courseForm.start_date || undefined}
                    value={courseForm.end_date}
                    onChange={(e) => setCourseForm({ ...courseForm, end_date: e.target.value })}
                    className="field"
                  />
                </div>
              </div>
              <p className="hint">Kosongkan tanggal untuk kursus tanpa batas waktu.</p>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingCourse ? "Simpan perubahan" : "Simpan kursus"}
                </button>
                {editingCourse && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCourse(null);
                      setCourseForm(emptyCourse);
                    }}
                    className="btn btn-outline"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="text-2xl">Kursus Anda</h2>

          {courses.length === 0 ? (
            <p className="mt-4 max-w-md text-muted">
              Anda belum punya kursus. Isi formulir di samping untuk membuat kursus pertama, lalu
              tambahkan materinya.
            </p>
          ) : (
            <ul className="mt-4 border-t border-line">
              {courses.map((course) => {
                const isSelected = activeCourse?.id === course.id;
                const hasPeriod = course.start_date || course.end_date;
                return (
                  <li
                    key={course.id}
                    className={`border-b border-line py-5 pl-4 ${
                      isSelected ? "border-l-2 border-l-pine" : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-pine">{course.category_name || "Tanpa kategori"}</p>
                        <h3 className="mt-0.5 text-xl">{course.nama_course}</h3>
                        <p className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                          <span>{course.total_materi} bab</span>
                          <span>{course.total_students} peserta</span>
                          {hasPeriod && (
                            <span>
                              Periode {formatDateOnly(course.start_date) || "?"} sampai{" "}
                              {formatDateOnly(course.end_date) || "?"}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setEditingContent(null);
                            setContentForm(emptyContent);
                          }}
                          disabled={isSelected}
                          className="btn btn-primary btn-sm"
                        >
                          {isSelected ? "Sedang dikelola" : "Kelola materi"}
                        </button>
                        <button type="button" onClick={() => startEditCourse(course)} className="btn btn-outline btn-sm">
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDeleteCourse(course)} className="btn btn-danger btn-sm">
                          Hapus
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Materi dan progres siswa */}
      {activeCourse && (
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="text-3xl">{activeCourse.nama_course}</h2>

          <div className="mt-8 grid gap-12 lg:grid-cols-2">
            <div>
              <h3 className="text-xl">{editingContent ? "Edit materi" : "Tambah materi"}</h3>
              <form onSubmit={handleSaveContent} className="panel mt-4 space-y-4">
                <div className="grid grid-cols-[1fr_6rem] gap-3">
                  <div>
                    <label htmlFor="m-judul" className="label">
                      Judul bab
                    </label>
                    <input
                      id="m-judul"
                      type="text"
                      required
                      maxLength={200}
                      value={contentForm.judul}
                      onChange={(e) => setContentForm({ ...contentForm, judul: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label htmlFor="m-urut" className="label">
                      Urutan
                    </label>
                    <input
                      id="m-urut"
                      type="number"
                      min={1}
                      required={!!editingContent}
                      value={contentForm.order_index}
                      onChange={(e) => setContentForm({ ...contentForm, order_index: e.target.value })}
                      placeholder={String(activeContents.length + 1)}
                      className="field"
                    />
                  </div>
                </div>
                <div>
                  <span className="label">Isi materi</span>
                  <RichTextEditor
                    value={contentForm.isi_materi}
                    onChange={(html) => setContentForm({ ...contentForm, isi_materi: html })}
                  />
                  <p className="hint">Gambar disisipkan lewat alamat URL (https://...).</p>
                  <p className="hint">Kosongkan urutan untuk menaruh bab ini di akhir.</p>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingContent ? "Simpan materi" : "Tambah materi"}
                  </button>
                  {editingContent && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingContent(null);
                        setContentForm(emptyContent);
                      }}
                      className="btn btn-outline"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <h3 className="mt-10 text-xl">Daftar materi</h3>
              {activeContents.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Belum ada materi pada kursus ini.</p>
              ) : (
                <ol className="mt-3 border-t border-line">
                  {activeContents.map((cnt) => (
                    <li key={cnt.id} className="flex items-start justify-between gap-4 border-b border-line py-4">
                      <div className="min-w-0">
                        <p className="text-sm text-muted">Bab {cnt.order_index}</p>
                        <p className="font-medium">{cnt.judul}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{htmlToText(cnt.isi_materi)}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingContent(cnt);
                            setContentForm({
                              judul: cnt.judul,
                              isi_materi: cnt.isi_materi,
                              order_index: String(cnt.order_index),
                            });
                            setFlash(null);
                          }}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDeleteContent(cnt)} className="btn btn-danger btn-sm">
                          Hapus
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div>
              <h3 className="text-xl">Progres siswa</h3>
              {activeStudents.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Belum ada siswa yang mengikuti kursus ini.</p>
              ) : (
                <ul className="mt-4 border-t border-line">
                  {activeStudents.map((st) => {
                    const percent = percentOf(st.selesai_materi, st.total_materi);
                    return (
                      <li key={st.student_id} className="border-b border-line py-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">{st.username}</p>
                            <p className="truncate text-sm text-muted">{st.email}</p>
                          </div>
                          <p className="shrink-0 text-sm">
                            <span className="font-medium">{percent}%</span>
                          </p>
                        </div>
                        <div className="progress mt-3">
                          <span style={{ width: `${percent}%` }} />
                        </div>
                        <p className="mt-1.5 text-xs text-muted">
                          {st.selesai_materi} dari {st.total_materi} bab selesai
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
