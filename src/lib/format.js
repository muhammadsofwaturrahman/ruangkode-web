const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Untuk kolom DATE yang dibaca dari SQL sebagai teks "YYYY-MM-DD" (kolom::text).
// Diformat manual agar tidak bergeser satu hari akibat zona waktu server/browser.
export function formatDateOnly(value) {
  if (!value) return "";
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} ${BULAN[m - 1]} ${y}`;
}

// Untuk kolom TIMESTAMP yang dibaca pg sebagai objek Date.
export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

export function percentOf(done, total) {
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  return Math.min(100, Math.round(((Number(done) || 0) / t) * 100));
}
