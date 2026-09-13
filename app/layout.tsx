import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/ui/Toast";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { CyberDust } from "@/components/ui/CyberDust";
import { CommandPalette } from "@/components/ui/CommandPalette";

export const metadata: Metadata = {
  title: {
    default: "KuroStream — Premium Anime Streaming",
    template: "%s | KuroStream",
  },
  description:
    "Watch the latest and greatest anime in HD on KuroStream. Your premium destination for subbed and dubbed anime streaming.",
  keywords: ["anime", "streaming", "watch anime online", "subbed", "dubbed", "HD anime"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "KuroStream",
    title: "KuroStream — Premium Anime Streaming",
    description: "Watch the latest and greatest anime in HD on KuroStream.",
  },
  twitter: {
    card: "summary_large_image",
    title: "KuroStream — Premium Anime Streaming",
    description: "Watch the latest and greatest anime in HD on KuroStream.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KuroStream",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#09090c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-kuro-bg text-kuro-text antialiased relative">
        <QueryProvider>
          <CyberDust />
          <Navbar />
          <main className="min-h-screen relative z-10">{children}</main>
          <Footer />
          <CommandPalette />
          <ToastContainer />
        </QueryProvider>
      </body>
    </html>
  );
}
