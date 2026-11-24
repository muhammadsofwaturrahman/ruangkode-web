"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LearningClient({
  course,
  contents,
  activeContent,
  completedIds,
  comments,
}) {
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  if (!activeContent) {
    return (
      <div className="rounded-2xl border border-dashed border-[#2E1A47] bg-[#120D26]/60 p-10 text-center text-sm text-slate-400">
        Belum ada materi pembelajaran yang ditambahkan untuk kursus{" "}
        <strong className="text-white">{course.nama_course}</strong>.
      </div>
    );
  }

  const currentIndex = contents.findIndex((c) => c.id === activeContent.id);
  const nextContent = contents[currentIndex + 1] || null;
  const isCompleted = completedIds.includes(activeContent.id);
  const progressPercent =
    contents.length > 0 ? Math.round((completedIds.length / contents.length) * 100) : 0;

  async function handleMarkAsDone() {
    setBtnLoading(true);
    try {
      const res = await fetch("/api/courses/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_as_done", content_id: activeContent.id }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert("Terjadi kesalahan server.");
    } finally {
      setBtnLoading(false);
    }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await fetch("/api/courses/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          content_id: activeContent.id,
          comment_text: commentText,
        }),
      });

      if (res.ok) {
        setCommentText("");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert("Gagal mengirim komentar.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* SIDEBAR DAFTAR MATERI */}
      <aside className="h-fit rounded-2xl border border-[#2E1A47] bg-[#120D26] p-4 lg:col-span-4">
        <Link
          href="/courses"
          className="mb-3 inline-block text-xs font-semibold text-slate-400 hover:text-[#F806CC]"
        >
          ← Kembali ke Katalog
        </Link>
        <h2 className="text-sm font-bold text-white">{course.nama_course}</h2>

        <div className="mt-3 mb-4">
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Progres Kelas</span>
            <span className="font-bold text-amber-400">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1C143B]">
            <div
              className="h-full bg-gradient-to-r from-[#F806CC] to-emerald-400 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2 border-t border-[#2E1A47] pt-3">
          {contents.map((c) => {
            const isActive = c.id === activeContent.id;
            const isDone = completedIds.includes(c.id);

            return (
              <Link
                key={c.id}
                href={`/courses/${course.id}?materi=${c.id}`}
                className={`flex items-center gap-3 rounded-xl border p-3 text-xs font-medium transition ${
                  isActive
                    ? "border-[#A91079] bg-[#2E1A47] text-white"
                    : "border-transparent bg-[#0E0A1E] text-slate-300 hover:bg-[#1C143B]"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : "border border-slate-600 text-slate-400"
                  }`}
                >
                  {isDone ? "✓" : c.order_index}
                </div>
                <div className="min-w-0 flex-grow">
                  <span className="block text-[10px] font-normal text-slate-400">
                    Bab #{c.order_index}
                  </span>
                  <span className="block truncate">{c.judul}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* KONTEN MATERI & DISKUSI */}
      <section className="space-y-6 lg:col-span-8">
        <div className="rounded-2xl border border-[#2E1A47] bg-[#120D26] p-6 shadow-xl shadow-black/30">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#2E1A47] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Bab #{activeContent.order_index}
              </span>
              <h1 className="mt-0.5 text-2xl font-black text-white">{activeContent.judul}</h1>
            </div>

            {isCompleted ? (
              <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-950/50 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
                ✓ Selesai Dipelajari
              </span>
            ) : (
              <button
                onClick={handleMarkAsDone}
                disabled={btnLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {btnLoading ? "Menyimpan..." : "Tandai Selesai (Mark as Done)"}
              </button>
            )}
          </div>

          <article className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {activeContent.isi_materi}
          </article>

          {nextContent && (
            <div className="mt-8 flex justify-end border-t border-[#2E1A47] pt-4">
              <Link
                href={`/courses/${course.id}?materi=${nextContent.id}`}
                className="rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-90"
              >
                Bab Berikutnya: {nextContent.judul} →
              </Link>
            </div>
          )}
        </div>

        {/* FORUM DISKUSI PER MATERI */}
        <div className="rounded-2xl border border-[#2E1A47] bg-[#120D26] p-6">
          <h3 className="mb-4 text-base font-bold text-white">Forum Diskusi Materi</h3>

          <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3">
            <textarea
              required
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Tuliskan pertanyaan atau tanggapan Anda tentang bab ini..."
              className="w-full rounded-lg border border-[#2E1A47] bg-[#0E0A1E] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#A91079] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
            >
              Kirim Komentar
            </button>
          </form>

          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500">
                Belum ada diskusi pada bab ini. Jadilah yang pertama bertanya!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-xl border border-[#2E1A47] bg-[#0E0A1E] p-3.5"
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{comment.username}</span>
                    <span className="rounded border border-purple-500/30 bg-purple-950/50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-300">
                      {comment.role}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-500">
                      {new Date(comment.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-slate-300">
                    {comment.comment_text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}