import { Pool } from "pg";

// Pool disimpan di globalThis agar tidak dibuat berulang saat hot reload di mode development.
// Hanya boleh diimpor dari kode server (Server Component, Server Action, Route Handler).
// DILARANG mengimpor file ini di dalam src/middleware.js.
const pool =
  globalThis.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalThis.pgPool = pool;
}

export default pool;