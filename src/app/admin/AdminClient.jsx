"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminClient({ currentAdminId, users, categories, page, totalPages }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // State Form User (Create / Edit)
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
  });

  // State Form Kategori (Create / Edit)
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: "", description: "" });

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

  // --- HANDLER USER ---
  async function handleApproveTeacher(userId) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve_teacher", userId }),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error, true);
    notify("Teacher berhasil di-approve dan waktu approved_at dicatat!");
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    const method = editingUser ? "PATCH" : "POST";
    const payload = editingUser ? { id: editingUser.id, ...userForm } : userForm;

    const res = await fetch("/api/admin/users", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error, true);

    setEditingUser(null);
    setUserForm({ username: "", email: "", password: "", role: "student" });
    notify(data.message);
  }

  async function handleDeleteUser(id) {
    if (!confirm("Yakin ingin menghapus user ini?")) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return notify(data.error, true);
    notify(data.message);
  }

  // --- HANDLER KATEGORI ---
  async function handleSaveCategory(e) {
    e.preventDefault();
    const method = editingCat ? "PUT" : "POST";
    const payload = editingCat ? { id: editingCat.id, ...catForm } : catForm;

    const res = await fetch("/api/admin/categories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error, true);

    setEditingCat(null);
    setCatForm({ name: "", description: "" });
    notify(data.message);
  }

  async function handleDeleteCategory(id) {
    if (!confirm("Hapus kategori ini?")) return;
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return notify(data.error, true);
    notify(data.message);
  }

  return (
    <div>
      {/* Tab Navigasi */}
      <div className="mb-6 flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("users")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === "users"
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Manajemen User & Verifikasi Teacher
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === "categories"
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Manajemen Kategori
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Tambah / Edit User */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-900">
              {editingUser ? `Edit User: ${editingUser.username}` : "Tambah User Baru"}
            </h2>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Password {editingUser && "(kosongkan jika tidak diubah)"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {editingUser ? "Simpan Perubahan" : "Tambah User"}
                </button>
                {editingUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setUserForm({ username: "", email: "", password: "", role: "student" });
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tabel Daftar User + Pagination */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role / Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{u.username}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-700">
                          {u.role}
                        </span>
                        {u.teacher_status === "pending" && (
                          <span className="ml-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            Pending Teacher
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {u.teacher_status === "pending" && (
                          <button
                            onClick={() => handleApproveTeacher(u.id)}
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Approve Teacher
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserForm({
                              username: u.username,
                              email: u.email,
                              password: "",
                              role: u.role,
                            });
                          }}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        {u.id !== currentAdminId && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
              <span>
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin?page=${page - 1}`}
                    className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50"
                  >
                    Sebelumnya
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin?page=${page + 1}`}
                    className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50"
                  >
                    Berikutnya
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY MANAGEMENT */}
      {activeTab === "categories" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-900">
              {editingCat ? "Edit Kategori" : "Tambah Kategori Baru"}
            </h2>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="Contoh: Mobile Development"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Deskripsi</label>
                <textarea
                  rows={3}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {editingCat ? "Update Kategori" : "Simpan Kategori"}
                </button>
                {editingCat && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null);
                      setCatForm({ name: "", description: "" });
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nama Kategori</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{cat.name}</td>
                    <td className="px-4 py-3 text-slate-600">{cat.description || "-"}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingCat(cat);
                          setCatForm({ name: cat.name, description: cat.description || "" });
                        }}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}