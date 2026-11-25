import Link from "next/link";
import pool from "@/lib/db";
import { formatDate } from "@/lib/format";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sertifikat" };

export default async function CertificatePage({ params }) {
  const { code } = await params;

  // Halaman ini sengaja publik: siapa pun dapat memeriksa keaslian sertifikat dari kodenya.
  const certRes = await pool.query(
    `SELECT cert.certificate_code, cert.issued_at,
            u.username AS student_name,
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
      <main className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <h1 className="text-3xl">Sertifikat tidak ditemukan</h1>
        <p className="mt-3 max-w-lg text-muted">
          Kode <span className="font-mono text-ink">{code}</span> tidak terdaftar di RuangKode.
          Periksa kembali penulisan kodenya.
        </p>
        <Link href="/courses" className="btn btn-primary mt-6">
          Buka katalog kursus
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/courses/${cert.course_id}`} className="link text-sm">
          Kembali ke kursus
        </Link>
        <PrintButton />
      </div>

      <div className="certificate">
        <div className="certificate-inner text-center">
          <p className="font-serif text-xl font-semibold tracking-tight text-pine-deep">RuangKode</p>

          <h1 className="mt-10 text-3xl sm:text-4xl">Sertifikat Penyelesaian</h1>

          <p className="mt-9 text-muted">Diberikan kepada</p>
          <p className="mt-2 font-serif text-4xl sm:text-5xl">{cert.student_name}</p>

          <p className="mx-auto mt-8 max-w-md text-muted">
            yang telah menyelesaikan seluruh bab pada kursus
          </p>
          <p className="mt-2 font-serif text-2xl text-pine-deep sm:text-3xl">{cert.nama_course}</p>
          {cert.category_name && <p className="mt-1 text-sm text-muted">{cert.category_name}</p>}

          <div className="mt-14 grid gap-6 border-t border-line pt-6 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted">Tanggal terbit</p>
              <p className="mt-0.5 font-medium">{formatDate(cert.issued_at)}</p>
            </div>
            <div>
              <p className="text-muted">Pengajar</p>
              <p className="mt-0.5 font-medium">{cert.teacher_name || "Tim RuangKode"}</p>
            </div>
            <div>
              <p className="text-muted">Kode verifikasi</p>
              <p className="mt-0.5 break-all font-mono font-medium">{cert.certificate_code}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted print:hidden">
        Keaslian sertifikat ini dapat diperiksa kapan saja dengan membuka alamat
        /certificates/{cert.certificate_code}.
      </p>
    </main>
  );
}
