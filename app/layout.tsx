import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "MutualAid — The Anonymous First Responder Community",
    template: "%s | MutualAid",
  },
  description:
    "Anonymous reviews, honest discussions, and job opportunities for police, fire, EMS, dispatch, and public safety professionals across the United States.",
  keywords: [
    "first responder reviews",
    "police department reviews",
    "fire department reviews",
    "EMS reviews",
    "first responder jobs",
    "anonymous first responder forum",
  ],
  openGraph: {
    type: "website",
    siteName: "MutualAid",
    title: "MutualAid — The Anonymous First Responder Community",
    description: "Honest, anonymous reviews and discussions for first responders.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
