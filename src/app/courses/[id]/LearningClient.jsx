"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { percentOf } from "@/lib/format";
import { normalizeMateri } from "@/lib/sanitize";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LearningClient({
  course,
  contents,
  activeContent,
  completedIds,
  comments,
  certificateCode,
  canTrackProgress,
}) {
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!activeContent) {
    return (
      <div>
        <Link href="/courses" className="link text-sm">
          Kembali ke katalog
        </Link>
        <h1 className="mt-4 text-3xl">{course.nama_course}</h1>
        <p className="mt-3 text-muted">Pengajar belum menambahkan materi untuk kursus ini.</p>
      </div>
    );
  }

  const currentIndex = contents.findIndex((c) => c.id === activeContent.id);
  const nextContent = contents[currentIndex + 1] || null;
  const isCompleted = completedIds.includes(activeContent.id);
  const progressPercent = percentOf(completedIds.length, contents.length);

  async function post(payload) {
    const res = await fetch("/api/courses/learning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Terjadi kesalahan.");
    return data;
  }

  async function handleMarkAsDone() {
    setError("");
    setBtnLoading(true);
    try {
      await post({ action: "mark_as_done", content_id: activeContent.id });
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBtnLoading(false);
    }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentText.trim()) return;

    setError("");
    setSending(true);
    try {
      await post({
        action: "comment",
        content_id: activeContent.id,
        comment_text: commentText,
      });
      setCommentText("");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-14">
      {/* Daftar bab */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <Link href="/courses" className="link text-sm">
          Kembali ke katalog
        </Link>
        <h2 className="mt-4 text-xl leading-snug">{course.nama_course}</h2>

        {canTrackProgress && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-muted">Progres</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="progress" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {completedIds.length} dari {contents.length} bab selesai
            </p>
          </div>
        )}

        {certificateCode && (
          <Link
            href={`/certificates/${certificateCode}`}
            className="mt-5 block rounded-md border border-pine bg-mist px-3.5 py-3 text-sm"
          >
            <span className="block font-medium text-pine-deep">Kursus selesai</span>
            <span className="link">Lihat sertifikat</span>
          </Link>
        )}

        <ol className="mt-6 border-t border-line">
          {contents.map((c) => {
            const isActive = c.id === activeContent.id;
            const isDone = completedIds.includes(c.id);

            return (
              <li key={c.id} className="border-b border-line">
                <Link
                  href={`/courses/${course.id}?materi=${c.id}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-start gap-3 px-2 py-3 text-sm transition-colors ${
                    isActive ? "bg-mist font-medium text-pine-deep" : "hover:bg-panel"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                      isDone ? "bg-pine text-white" : "border border-line text-muted"
                    }`}
                  >
                    {isDone ? <CheckIcon /> : c.order_index}
                  </span>
                  <span className="min-w-0 leading-snug">{c.judul}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Materi dan diskusi */}
      <section className="min-w-0">
        <p className="text-sm text-muted">Bab {activeContent.order_index}</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">{activeContent.judul}</h1>

        <article
          className="materi rich mt-8"
          dangerouslySetInnerHTML={{ __html: normalizeMateri(activeContent.isi_materi) }}
        />

        {error && (
          <div role="alert" className="notice notice-err mt-8">
            {error}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          {canTrackProgress &&
            (isCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-pine">
                <CheckIcon /> Bab ini sudah selesai
              </span>
            ) : (
              <button
                type="button"
                onClick={handleMarkAsDone}
                disabled={btnLoading}
                className="btn btn-primary"
              >
                {btnLoading ? "Menyimpan..." : "Tandai selesai"}
              </button>
            ))}

          {nextContent && (
            <Link
              href={`/courses/${course.id}?materi=${nextContent.id}`}
              className={`btn ${canTrackProgress && !isCompleted ? "btn-outline" : "btn-primary"}`}
            >
              Lanjutkan: {nextContent.judul}
            </Link>
          )}

          {!nextContent && certificateCode && (
            <Link href={`/certificates/${certificateCode}`} className="btn btn-primary">
              Lihat sertifikat
            </Link>
          )}
        </div>

        {/* Diskusi */}
        <div className="mt-14">
          <h2 className="text-2xl">Diskusi bab ini</h2>

          <form onSubmit={handleCommentSubmit} className="mt-5">
            <label htmlFor="comment" className="sr-only">
              Komentar
            </label>
            <textarea
              id="comment"
              required
              rows={3}
              maxLength={2000}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Tulis pertanyaan atau tanggapan Anda"
              className="field"
            />
            <button type="submit" disabled={sending} className="btn btn-outline btn-sm mt-3">
              {sending ? "Mengirim..." : "Kirim komentar"}
            </button>
          </form>

          {comments.length === 0 ? (
            <p className="mt-8 text-sm text-muted">Belum ada diskusi. Mulai dengan satu pertanyaan.</p>
          ) : (
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {comments.map((comment) => (
                <li key={comment.id} className="py-4">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium">{comment.username}</span>
                    {comment.role !== "student" && (
                      <span className="badge">{comment.role === "admin" ? "Admin" : "Pengajar"}</span>
                    )}
                    <span className="text-muted">{comment.date_label}</span>
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed">
                    {comment.comment_text}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
