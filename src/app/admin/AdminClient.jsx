"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateOnly } from "@/lib/format";

const TABS = [
  { id: "users", label: "Pengguna" },
  { id: "courses", label: "Kursus" },
  { id: "categories", label: "Kategori" },
];

const ROLE_LABEL = { admin: "Admin", teacher: "Teacher", student: "Student" };

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

function Flash({ flash }) {
  if (!flash) return null;
  return (
    <div
      role={flash.error ? "alert" : "status"}
      className={`notice mb-6 ${flash.error ? "notice-err" : "notice-ok"}`}
    >
      {flash.text}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Pengguna                                                          */
/* ---------------------------------------------------------------- */

const EMPTY_USER = { username: "", email: "", password: "", role: "student" };

function UsersSection({ users, page, totalPages, roleFilter, currentAdminId, pendingTeachers }) {
  const router = useRouter();
  const [flash, setFlash] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);

  function notify(text, error = false) {
    setFlash({ text, error });
    if (!error) router.refresh();
  }

  async function handleSave(e) {
    e.preventDefault();
    const { ok, data } = editing
      ? await send("/api/admin/users", "PATCH", { id: editing.id, ...form })
      : await send("/api/admin/users", "POST", form);
    if (!ok) return notify(data.error || "Gagal menyimpan user.", true);

    setEditing(null);
    setForm(EMPTY_USER);
    notify(data.message);
  }

  async function handleApprove(userId) {
    const { ok, data } = await send("/api/admin/users", "PATCH", {
      action: "approve_teacher",
      userId,
    });
    if (!ok) return notify(data.error || "Gagal meng-approve Teacher.", true);
    notify(data.message);
  }

  async function handleDelete(user) {
    if (!confirm(`Hapus akun ${user.username}? Data yang terkait dengan akun ini ikut terhapus.`)) {
      return;
    }
    const { ok, data } = await send(`/api/admin/users?id=${user.id}`, "DELETE");
    if (!ok) return notify(data.error || "Gagal menghapus user.", true);
    notify(data.message);
  }

  function startEdit(user) {
    setEditing(user);
    setForm({ username: user.username, email: user.email, password: "", role: user.role });
    setFlash(null);
  }

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY_USER);
  }

  const query = (p, role) => {
    const params = new URLSearchParams({ tab: "users", page: String(p) });
    if (role) params.set("role", role);
    return `/admin?${params.toString()}`;
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[19rem_1fr]">
      <div>
        <div className="panel">
          <h2 className="text-xl">{editing ? `Edit ${editing.username}` : "Tambah pengguna"}</h2>
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div>
              <label htmlFor="u-name" className="label">
                Username
              </label>
              <input
                id="u-name"
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="u-email" className="label">
                Email
              </label>
              <input
                id="u-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="u-pass" className="label">
                Password
              </label>
              <input
                id="u-pass"
                type="password"
                required={!editing}
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field"
              />
              {editing && <p className="hint">Kosongkan jika tidak ingin mengubah password.</p>}
            </div>
            <div>
              <label htmlFor="u-role" className="label">
                Role
              </label>
              <select
                id="u-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={editing?.id === currentAdminId}
                className="field"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              {editing?.id === currentAdminId && (
                <p className="hint">Role akun Anda sendiri tidak dapat diubah.</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-primary flex-1">
                {editing ? "Simpan perubahan" : "Tambah pengguna"}
              </button>
              {editing && (
                <button type="button" onClick={cancelEdit} className="btn btn-outline">
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="min-w-0">
        <Flash flash={flash} />

        {pendingTeachers > 0 && (
          <div className="notice notice-warn mb-6">
            {pendingTeachers} pendaftar Teacher menunggu verifikasi. Mereka tampil paling atas pada
            daftar di bawah.
          </div>
        )}

        <form method="get" action="/admin" className="mb-4 flex items-end gap-3">
          <input type="hidden" name="tab" value="users" />
          <div className="w-48">
            <label htmlFor="role-filter" className="label">
              Filter role
            </label>
            <select id="role-filter" name="role" defaultValue={roleFilter} className="field">
              <option value="">Semua role</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <button type="submit" className="btn btn-outline">
            Terapkan
          </button>
        </form>

        <div className="overflow-x-auto border-y border-line">
          <table className="table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Role</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-muted">
                    Tidak ada pengguna dengan filter ini.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="font-medium">{u.username}</div>
                    <div className="text-muted">{u.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-muted">{ROLE_LABEL[u.role]}</span>
                    {u.teacher_status === "pending" && (
                      <span className="badge badge-warn ml-2">Menunggu verifikasi</span>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-2">
                      {u.teacher_status === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleApprove(u.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Approve
                        </button>
                      )}
                      <button type="button" onClick={() => startEdit(u)} className="btn btn-outline btn-sm">
                        Edit
                      </button>
                      {u.id !== currentAdminId && (
                        <button type="button" onClick={() => handleDelete(u)} className="btn btn-danger btn-sm">
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={query(page - 1, roleFilter)} className="btn btn-outline btn-sm">
                Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link href={query(page + 1, roleFilter)} className="btn btn-outline btn-sm">
                Berikutnya
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Kursus                                                            */
/* ---------------------------------------------------------------- */

const EMPTY_COURSE = {
  nama_course: "",
  deskripsi: "",
  category_id: "",
  teacher_id: "",
  start_date: "",
  end_date: "",
};

function CoursesSection({ courses, categories, teachers }) {
  const router = useRouter();
  const [flash, setFlash] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);

  function notify(text, error = false) {
    setFlash({ text, error });
    if (!error) router.refresh();
  }

  async function handleSave(e) {
    e.preventDefault();
    const { ok, data } = editing
      ? await send("/api/admin/courses", "PUT", { id: editing.id, ...form })
      : await send("/api/admin/courses", "POST", form);
    if (!ok) return notify(data.error || "Gagal menyimpan kursus.", true);

    setEditing(null);
    setForm(EMPTY_COURSE);
    notify(data.message);
  }

  async function handleDelete(course) {
    if (!confirm(`Hapus kursus "${course.nama_course}" beserta seluruh materi dan progres peserta?`)) {
      return;
    }
    const { ok, data } = await send(`/api/admin/courses?id=${course.id}`, "DELETE");
    if (!ok) return notify(data.error || "Gagal menghapus kursus.", true);
    if (editing?.id === course.id) {
      setEditing(null);
      setForm(EMPTY_COURSE);
    }
    notify(data.message);
  }

  function startEdit(course) {
    setEditing(course);
    setForm({
      nama_course: course.nama_course,
      deskripsi: course.deskripsi,
      category_id: course.category_id ? String(course.category_id) : "",
      teacher_id: course.teacher_id ? String(course.teacher_id) : "",
      start_date: course.start_date || "",
      end_date: course.end_date || "",
    });
    setFlash(null);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[19rem_1fr]">
      <div>
        <div className="panel">
          <h2 className="text-xl">{editing ? "Edit kursus" : "Tambah kursus"}</h2>
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div>
              <label htmlFor="c-name" className="label">
                Nama kursus
              </label>
              <input
                id="c-name"
                type="text"
                required
                maxLength={200}
                value={form.nama_course}
                onChange={(e) => setForm({ ...form, nama_course: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="c-teacher" className="label">
                Pengajar
              </label>
              <select
                id="c-teacher"
                required
                value={form.teacher_id}
                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                className="field"
              >
                <option value="">Pilih pengajar</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="c-cat" className="label">
                Kategori
              </label>
              <select
                id="c-cat"
                required
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
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
              <label htmlFor="c-desc" className="label">
                Deskripsi
              </label>
              <textarea
                id="c-desc"
                rows={4}
                required
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                className="field"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="c-start" className="label">
                  Mulai
                </label>
                <input
                  id="c-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="c-end" className="label">
                  Selesai
                </label>
                <input
                  id="c-end"
                  type="date"
                  min={form.start_date || undefined}
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="field"
                />
              </div>
            </div>
            <p className="hint">Kosongkan tanggal untuk kursus tanpa batas waktu.</p>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-primary flex-1">
                {editing ? "Simpan perubahan" : "Tambah kursus"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(EMPTY_COURSE);
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
        <Flash flash={flash} />
        {courses.length === 0 ? (
          <p className="text-muted">Belum ada kursus.</p>
        ) : (
          <ul className="border-t border-line">
            {courses.map((course) => {
              const hasPeriod = course.start_date || course.end_date;
              return (
                <li key={course.id} className="border-b border-line py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-pine">{course.category_name || "Tanpa kategori"}</p>
                      <h3 className="mt-0.5 text-xl">{course.nama_course}</h3>
                      <p className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                        <span>Pengajar: {course.teacher_name}</span>
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
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEdit(course)} className="btn btn-outline btn-sm">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(course)} className="btn btn-danger btn-sm">
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
  );
}

/* ---------------------------------------------------------------- */
/* Kategori                                                          */
/* ---------------------------------------------------------------- */

function CategoriesSection({ categories }) {
  const router = useRouter();
  const [flash, setFlash] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  function notify(text, error = false) {
    setFlash({ text, error });
    if (!error) router.refresh();
  }

  async function handleSave(e) {
    e.preventDefault();
    const { ok, data } = editing
      ? await send("/api/admin/categories", "PUT", { id: editing.id, ...form })
      : await send("/api/admin/categories", "POST", form);
    if (!ok) return notify(data.error || "Gagal menyimpan kategori.", true);

    setEditing(null);
    setForm({ name: "", description: "" });
    notify(data.message);
  }

  async function handleDelete(cat) {
    const warning =
      cat.total_courses > 0
        ? `Kategori "${cat.name}" dipakai ${cat.total_courses} kursus. Kursus tersebut akan menjadi tanpa kategori. Lanjutkan?`
        : `Hapus kategori "${cat.name}"?`;
    if (!confirm(warning)) return;

    const { ok, data } = await send(`/api/admin/categories?id=${cat.id}`, "DELETE");
    if (!ok) return notify(data.error || "Gagal menghapus kategori.", true);
    notify(data.message);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[19rem_1fr]">
      <div>
        <div className="panel">
          <h2 className="text-xl">{editing ? "Edit kategori" : "Tambah kategori"}</h2>
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div>
              <label htmlFor="k-name" className="label">
                Nama kategori
              </label>
              <input
                id="k-name"
                type="text"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mobile Development"
                className="field"
              />
            </div>
            <div>
              <label htmlFor="k-desc" className="label">
                Deskripsi
              </label>
              <textarea
                id="k-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="field"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-primary flex-1">
                {editing ? "Simpan perubahan" : "Tambah kategori"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm({ name: "", description: "" });
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
        <Flash flash={flash} />
        <div className="overflow-x-auto border-y border-line">
          <table className="table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Kursus</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-muted">
                    Belum ada kategori.
                  </td>
                </tr>
              )}
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div className="font-medium">{cat.name}</div>
                    <div className="text-muted">{cat.description || "Tanpa deskripsi"}</div>
                  </td>
                  <td>{cat.total_courses}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(cat);
                          setForm({ name: cat.name, description: cat.description || "" });
                          setFlash(null);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(cat)} className="btn btn-danger btn-sm">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export default function AdminClient({
  tab,
  stats,
  currentAdminId,
  users,
  page,
  totalPages,
  roleFilter,
  courses,
  teachers,
  categories,
}) {
  return (
    <div className="mt-10">
      <dl className="flex flex-wrap gap-x-12 gap-y-4 border-y border-line py-5">
        <div>
          <dt className="text-sm text-muted">Pengguna</dt>
          <dd className="mt-0.5 font-serif text-3xl">{stats.totalUsers}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Kursus</dt>
          <dd className="mt-0.5 font-serif text-3xl">{stats.totalCourses}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Menunggu verifikasi</dt>
          <dd className="mt-0.5 font-serif text-3xl">{stats.pendingTeachers}</dd>
        </div>
      </dl>

      <nav aria-label="Bagian dashboard" className="mt-8 mb-8 flex gap-7 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${
              tab === t.id
                ? "border-pine font-medium text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "users" && (
        <UsersSection
          users={users}
          page={page}
          totalPages={totalPages}
          roleFilter={roleFilter}
          currentAdminId={currentAdminId}
          pendingTeachers={stats.pendingTeachers}
        />
      )}
      {tab === "courses" && (
        <CoursesSection courses={courses} categories={categories} teachers={teachers} />
      )}
      {tab === "categories" && <CategoriesSection categories={categories} />}
    </div>
  );
}
