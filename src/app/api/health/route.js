import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/health : memastikan aplikasi bisa terhubung ke PostgreSQL via Raw SQL
export async function GET() {
  try {
    const { rows } = await pool.query(
      "SELECT NOW() AS waktu, current_database() AS database"
    );
    return Response.json({
      status: "ok",
      database: rows[0].database,
      waktu: rows[0].waktu,
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        pesan: "Gagal terhubung ke database",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}