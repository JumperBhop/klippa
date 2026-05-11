import type { Metadata } from "next";
import "./globals.css";
import Cursor from "@/components/Cursor";
import MeshBackground from "@/components/MeshBackground";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Klippa — Video rein, virale Shorts raus",
  description: "Lade ein Video hoch. KI analysiert, schneidet und erstellt virale Short-Clips automatisch.",
  openGraph: {
    title: "Klippa",
    description: "Video rein, virale Shorts raus.",
    siteName: "Klippa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="min-h-full bg-void antialiased">
        <MeshBackground />
        <Cursor />
        <ScrollReveal />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
