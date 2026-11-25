// Pembersih HTML sederhana berbasis daftar putih (allowlist) untuk isi materi dari Rich Text Editor.
// Tanpa library tambahan: hanya tag yang diizinkan yang dibangun ulang, sisanya di-escape atau dibuang.
// Dipakai di server (sebelum disimpan) dan saat ditampilkan (lapisan pertahanan kedua).

const ALLOWED = new Set([
  "p", "br", "hr", "div", "strong", "b", "em", "i", "u", "s",
  "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "pre", "code",
  "a", "img", "table", "thead", "tbody", "tr", "th", "td",
]);
const VOID = new Set(["br", "hr", "img"]);

const escapeText = (s) =>
  s.replace(/&(?!#?[a-zA-Z0-9]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeAttr = (s) =>
  s
    .replace(/&(?!#?[a-zA-Z0-9]+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function safeUrl(value, allowMailto) {
  const v = String(value ?? "").replace(/[\u0000-\u001f\u007f\s]+/g, "");
  if (/^https?:\/\//i.test(v)) return v;
  if (allowMailto && /^mailto:/i.test(v)) return v;
  return null;
}

function readAttrs(raw) {
  const attrs = {};
  const re = /([a-zA-Z][a-zA-Z-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m;
  while ((m = re.exec(raw))) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

export function sanitizeHtml(input) {
  const html = String(input ?? "").replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, "");
  const tagRe = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^<>]*)?)\/?>/g;

  let out = "";
  let last = 0;
  const stack = [];
  let m;

  while ((m = tagRe.exec(html))) {
    out += escapeText(html.slice(last, m.index));
    last = tagRe.lastIndex;

    if (m[0].startsWith("<!--")) continue;

    const closing = m[1] === "/";
    const name = m[2].toLowerCase();
    if (!ALLOWED.has(name)) continue;

    if (closing) {
      if (VOID.has(name)) continue;
      const at = stack.lastIndexOf(name);
      if (at === -1) continue;
      while (stack.length > at) out += `</${stack.pop()}>`;
      continue;
    }

    const attrs = readAttrs(m[3] || "");
    if (name === "a") {
      const href = safeUrl(attrs.href, true);
      out += href
        ? `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">`
        : "<a>";
      stack.push("a");
    } else if (name === "img") {
      const src = safeUrl(attrs.src, false);
      if (src) out += `<img src="${escapeAttr(src)}" alt="${escapeAttr(attrs.alt || "")}" loading="lazy">`;
    } else if (VOID.has(name)) {
      out += `<${name}>`;
    } else {
      out += `<${name}>`;
      stack.push(name);
    }
  }

  out += escapeText(html.slice(last));
  while (stack.length) out += `</${stack.pop()}>`;
  return out;
}

const ENTITIES = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

// Teks polos dari HTML (untuk pratinjau dan pengecekan kosong).
export function htmlToText(html) {
  return String(html ?? "")
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s+/g, " ")
    .trim();
}

// Isi dianggap ada jika punya teks, gambar, tabel, atau garis pemisah.
export function hasContent(html) {
  return htmlToText(html) !== "" || /<(img|table|hr)[\s>]/i.test(String(html ?? ""));
}

const looksLikeHtml = (s) => /<\/?[a-zA-Z][^>]*>/.test(s);

function textToHtml(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${escapeText(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// Materi lama (teks polos) otomatis diubah jadi paragraf; materi baru (HTML) dibersihkan.
export function normalizeMateri(value) {
  const s = String(value ?? "");
  return sanitizeHtml(looksLikeHtml(s) ? s : textToHtml(s));
}
