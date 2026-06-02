import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "../globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Layout racine du groupe public non localisé (lien privé de facture).
 * Pas indexable : ces pages contiennent des documents commerciaux privés.
 */
export const metadata: Metadata = {
  title: "Document — SP Smart Sarl",
  robots: { index: false, follow: false },
};

export default function PublicRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-muted/30 text-foreground">{children}</body>
    </html>
  );
}
