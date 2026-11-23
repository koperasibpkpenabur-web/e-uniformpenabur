import './globals.css';

export const metadata = {
  title: 'Kanvas PENABUR - Pemesanan Seragam Sekolah',
  description: 'Aplikasi Pemesanan Seragam Sekolah Resmi Siswa BPK PENABUR Jakarta',
  manifest: './manifest.json',
  icons: {
    icon: './kanvas-logo-only.png',
    apple: './apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kanvas PENABUR',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0F2C59',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-slate-950 min-h-screen text-slate-800 antialiased selection:bg-amber-500 selection:text-white">
        <main className="min-h-screen w-full flex justify-center items-center md:py-6 sm:p-2">
          {/* Mobile Shell Frame */}
          <div className="w-full max-w-[440px] min-h-screen md:min-h-[850px] md:max-h-[920px] md:rounded-[40px] md:shadow-[0_25px_80px_rgba(0,0,0,0.7)] md:border-[8px] md:border-slate-800 bg-[#F8FAFC] flex flex-col relative overflow-hidden">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
