import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import { Toaster } from "@/components/ui/sonner";
import "../globals.css";

// Même police de marque que le site public.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Layout racine du groupe Admin (module Billing), non localisé.
 * Interface en français par défaut, structurée i18n-ready (namespace « Admin »).
 * Non indexable par les moteurs de recherche.
 */
export const metadata: Metadata = {
  title: "Billing — SP Smart Sarl",
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin verrouillé en français (le brief : « principalement en français »).
  setRequestLocale("fr");
  const messages = await getMessages({ locale: "fr" });

  return (
    <html
      lang="fr"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-muted/30 text-foreground"
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale="fr" messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
