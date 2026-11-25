const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value) {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

export function isValidDate(value) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// Validasi input kursus yang dipakai bersama oleh route Teacher dan Admin.
export function parseCourseInput(body) {
  const nama = String(body?.nama_course ?? "").trim();
  const deskripsi = String(body?.deskripsi ?? "").trim();
  const categoryId = Number(body?.category_id);
  const start = body?.start_date ? String(body.start_date) : null;
  const end = body?.end_date ? String(body.end_date) : null;

  if (!nama) return { error: "Nama kursus wajib diisi." };
  if (nama.length > 200) return { error: "Nama kursus maksimal 200 karakter." };
  if (!deskripsi) return { error: "Deskripsi kursus wajib diisi." };
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { error: "Pilih kategori kursus." };
  }
  if (start && !isValidDate(start)) return { error: "Format tanggal mulai tidak valid." };
  if (end && !isValidDate(end)) return { error: "Format tanggal selesai tidak valid." };
  if (start && end && end < start) {
    return { error: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai." };
  }

  return { value: { nama, deskripsi, categoryId, start, end } };
}
