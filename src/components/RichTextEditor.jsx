"use client";

import { useEffect, useRef } from "react";
import { normalizeMateri } from "@/lib/sanitize";

// Editor teks kaya (mini Word) tanpa library: contentEditable + toolbar.
// Mendukung tebal, miring, heading, daftar, tautan, gambar (lewat URL), dan tabel.
export default function RichTextEditor({ value, onChange, label = "Isi materi" }) {
  const ref = useRef(null);
  const lastEmitted = useRef(null);

  // Sinkronkan isi editor hanya bila nilai berubah dari luar (misal saat memilih materi untuk diedit).
  useEffect(() => {
    const el = ref.current;
    if (!el || value === lastEmitted.current) return;
    el.innerHTML = normalizeMateri(value);
    lastEmitted.current = value;
  }, [value]);

  function emit() {
    const html = ref.current.innerHTML;
    lastEmitted.current = html;
    onChange(html);
  }

  function run(command, arg) {
    ref.current.focus();
    document.execCommand(command, false, arg);
    emit();
  }

  function addLink() {
    const url = window.prompt("Alamat tautan (https://...)");
    if (url) run("createLink", url.trim());
  }

  function addImage() {
    const url = window.prompt("Alamat gambar (https://...)");
    if (url) run("insertImage", url.trim());
  }

  function addTable() {
    const rows = Number(window.prompt("Jumlah baris (tidak termasuk judul kolom)", "2"));
    const cols = Number(window.prompt("Jumlah kolom", "3"));
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1 || rows > 20 || cols > 8) {
      return;
    }
    const head = Array.from({ length: cols }, (_, i) => `<th>Kolom ${i + 1}</th>`).join("");
    const cells = Array.from({ length: cols }, () => "<td><br></td>").join("");
    const body = Array.from({ length: rows }, () => `<tr>${cells}</tr>`).join("");
    run("insertHTML", `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><p><br></p>`);
  }

  const tools = [
    { label: "B", title: "Tebal", className: "font-extrabold", action: () => run("bold") },
    { label: "I", title: "Miring", className: "italic", action: () => run("italic") },
    { label: "H2", title: "Judul besar", action: () => run("formatBlock", "h2") },
    { label: "H3", title: "Judul kecil", action: () => run("formatBlock", "h3") },
    { label: "P", title: "Paragraf biasa", action: () => run("formatBlock", "p") },
    { label: "• Daftar", title: "Daftar poin", action: () => run("insertUnorderedList") },
    { label: "1. Daftar", title: "Daftar angka", action: () => run("insertOrderedList") },
    { label: "Tautan", title: "Sisipkan tautan", action: addLink },
    { label: "Gambar", title: "Sisipkan gambar dari URL", action: addImage },
    { label: "Tabel", title: "Sisipkan tabel", action: addTable },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-line focus-within:border-pine">
      <div className="flex flex-wrap gap-1 border-b border-line bg-mist p-1.5" role="toolbar" aria-label="Format teks">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            // mencegah editor kehilangan seleksi saat tombol diklik
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.action}
            className={`h-8 rounded px-2.5 text-xs text-ink transition-colors hover:bg-panel ${t.className || "font-semibold"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Tulis materi di sini..."
        onFocus={() => document.execCommand("defaultParagraphSeparator", false, "p")}
        onInput={emit}
        onPaste={(e) => {
          // tempel sebagai teks polos agar format dari situs lain tidak ikut masuk
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        className="rich min-h-[220px] bg-panel px-4 py-3 text-ink outline-none"
      />
    </div>
  );
}
