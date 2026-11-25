import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Backdrop from "@/components/Backdrop";
import { getSession } from "@/lib/session";

export const metadata = {
  title: {
    default: "RuangKode: Platform Kursus Coding",
    template: "%s | RuangKode",
  },
  description: "Belajar pemrograman secara runut, dengan progres yang tercatat dan sertifikat saat selesai.",
};

// Dijalankan sebelum halaman tampil agar tidak berkedip. Bawaan: mode gelap.
const themeScript = `try{var t=localStorage.getItem("theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export default async function RootLayout({ children }) {
  const session = await getSession();
  const user = session
    ? { id: session.id, username: session.username, role: session.role }
    : null;

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        <Backdrop />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar user={user} />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
