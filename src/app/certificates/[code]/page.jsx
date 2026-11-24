import Link from "next/link";
import Image from "next/image";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }) {
  const session = await getSession();
  const { code } = await params;

  const certRes = await pool.query(
    `SELECT cert.certificate_code, cert.issued_at,
            u.username AS student_name, u.email AS student_email,
            c.id AS course_id, c.nama_course,
            cat.name AS category_name,
            t.username AS teacher_name
     FROM certificates cert
     JOIN users u ON cert.student_id = u.id
     JOIN courses c ON cert.course_id = c.id
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN users t ON c.teacher_id = t.id
     WHERE cert.certificate_code = $1`,
    [code]
  );

  const cert = certRes.rows[0];

  if (!cert) {
    return (
      <div className="min-h-screen bg-[#0E0A1E]">
        <Navbar user={session} />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="rounded-2xl border border-red-500/30 bg-[#120D26] p-8">
            <h1 className="text-xl font-bold text-white">Sertifikat Tidak Ditemukan</h1>
            <p className="mt-2 text-sm text-slate-400">
              Kode verifikasi <span className="font-mono text-amber-400">{code}</span> tidak
              terdaftar di sistem RuangKode.
            </p>
            <Link
              href="/courses"
              className="mt-6 inline-block rounded-lg bg-[#2E1A47] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#A91079]"
            >
              Kembali ke Katalog Kursus
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const formattedDate = new Date(cert.issued_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0E0A1E] print:bg-white">
      <div className="print:hidden">
        <Navbar user={session} />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 print:max-w-none print:p-0">
        {/* Baris Aksi (Disembunyikan saat Print/PDF) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={`/courses/${cert.course_id}`}
            className="text-sm font-semibold text-slate-400 transition hover:text-[#F806CC]"
          >
            ← Kembali ke Materi Kursus
          </Link>
          <PrintButton />
        </div>

        {/* Kartu Sertifikat */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400/50 bg-[#120D26] p-8 shadow-2xl shadow-[#A91079]/20 sm:p-12 print:rounded-none print:border-4 print:border-amber-600 print:bg-white print:text-slate-900 print:shadow-none">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#F806CC]/15 blur-3xl print:hidden" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl print:hidden" />

          {/* Header Sertifikat */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#2E1A47] pb-6 print:border-slate-300">
            <div className="flex items-center gap-3">
              <Image
                src="/images/bear-logo.jpg"
                alt="Logo RuangKode"
                width={44}
                height={44}
                unoptimized
                className="h-11 w-11 rounded-full border border-amber-400/40 object-cover"
              />
              <div>
                <span className="bg-gradient-to-r from-[#F806CC] via-[#A91079] to-[#F59E0B] bg-clip-text text-xl font-black text-transparent print:text-slate-900">
                  RuangKode
                </span>
                <p className="text-[11px] uppercase tracking-widest text-slate-400 print:text-slate-600">
                  Certificate of Completion
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-500">
                Kode Verifikasi
              </span>
              <span className="font-mono text-xs font-bold text-amber-400 print:text-slate-800">
                {cert.certificate_code}
              </span>
            </div>
          </div>

          {/* Isi Utama Sertifikat */}
          <div className="relative z-10 py-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-300 print:text-purple-700">
              Diberikan Kepada
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl print:text-slate-900">
              {cert.student_name}
            </h1>
            <p className="mt-1 text-xs text-slate-400 print:text-slate-600">
              {cert.student_email}
            </p>

            <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-slate-300 print:text-slate-700">
              Atas keberhasilannya menyelesaikan seluruh materi pembelajaran (100% progres) pada
              kursus:
            </p>

            <h2 className="mt-3 text-2xl font-extrabold text-amber-400 print:text-amber-700">
              {cert.nama_course}
            </h2>
            {cert.category_name && (
              <span className="mt-2 inline-block rounded-full border border-purple-500/30 bg-purple-950/50 px-3 py-0.5 text-xs font-semibold text-purple-300 print:border-slate-300 print:bg-slate-100 print:text-slate-700">
                Kategori: {cert.category_name}
              </span>
            )}
          </div>

          {/* Footer & Tanda Tangan */}
          <div className="relative z-10 mt-4 flex flex-wrap items-end justify-between gap-6 border-t border-[#2E1A47] pt-6 print:border-slate-300">
            <div>
              <span className="block text-[11px] text-slate-400 print:text-slate-500">
                Tanggal Diterbitkan
              </span>
              <span className="text-sm font-semibold text-white print:text-slate-900">
                {formattedDate}
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[11px] text-slate-400 print:text-slate-500">
                Instruktur Pengampu
              </span>
              <span className="text-sm font-bold text-white print:text-slate-900">
                {cert.teacher_name || "Tim Pengajar RuangKode"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}