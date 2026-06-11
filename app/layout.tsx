import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const BASE = "https://mutualaid-seven.vercel.app";

export const viewport: Viewport = {
  themeColor: "#dc2626",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "MutualAid — The Anonymous First Responder Community",
    template: "%s | MutualAid",
  },
  description:
    "Anonymous reviews, salary data, and job opportunities for police, fire, EMS, dispatch, and public safety professionals across the United States.",
  keywords: [
    "first responder reviews",
    "police department reviews",
    "fire department salary",
    "EMS pay",
    "first responder jobs",
    "anonymous first responder forum",
    "public safety careers",
    "law enforcement culture",
  ],
  authors: [{ name: "MutualAid" }],
  creator: "MutualAid",
  publisher: "MutualAid",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "MutualAid",
    title: "MutualAid — The Anonymous First Responder Community",
    description: "Honest, anonymous reviews and discussions for first responders.",
    url: BASE,
  },
  twitter: {
    card: "summary_large_image",
    title: "MutualAid — Anonymous First Responder Community",
    description: "Reviews, salary data, and jobs for police, fire, EMS, and public safety.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
