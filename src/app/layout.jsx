import "./globals.css";

export const metadata = {
  title: "RuangKode — Platform Kursus Coding",
  description: "Belajar pemrograman secara runut dan interaktif di RuangKode.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#0E0A1E] text-slate-100 antialiased selection:bg-[#F806CC]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}