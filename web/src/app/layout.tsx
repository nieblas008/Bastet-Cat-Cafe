import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { SITE_URL } from "@/lib/format";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Bastet Cat Café · Café y refugio felino en Tijuana", template: "%s · Bastet Cat Café" },
  description: "Café de especialidad y refugio felino en Tijuana. Ven por el café, quédate por los michis: todos los gatos del café están en adopción.",
  openGraph: { type: "website", locale: "es_MX", siteName: "Bastet Cat Café" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#B90062" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${bricolage.variable} ${figtree.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
