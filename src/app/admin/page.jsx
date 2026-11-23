import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const page = Math.max(1, Number(resolvedParams?.page) || 1);
  const limit = 6;
  const offset = (page - 1) * limit;

  // Query total users untuk pagination
  const countRes = await pool.query("SELECT COUNT(*) FROM users");
  const totalUsers = Number(countRes.rows[0].count);
  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

  // Query users dengan urutan pendaftar teacher pending paling atas
  const usersRes = await pool.query(
    `SELECT id, username, email, role, teacher_status, approved_at, created_at
     FROM users
     ORDER BY CASE WHEN teacher_status = 'pending' THEN 0 ELSE 1 END, id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  // Query seluruh kategori
  const categoriesRes = await pool.query(
    "SELECT id, name, description FROM categories ORDER BY id ASC"
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={session} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-sm text-slate-500">
            Kelola pengguna, verifikasi pendaftaran Teacher, dan master kategori kursus.
          </p>
        </div>

        <AdminClient
          currentAdminId={session.id}
          users={usersRes.rows}
          categories={categoriesRes.rows}
          page={page}
          totalPages={totalPages}
        />
      </main>
    </div>
  );
}