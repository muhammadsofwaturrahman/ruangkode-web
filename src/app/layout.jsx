import "./globals.css";

export const metadata = {
  title: "Platform Kursus",
  description: "Platform kursus online: belajar, mengajar, dan memantau progres dalam satu tempat.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}