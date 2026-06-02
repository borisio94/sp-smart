"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Coque cliente de l'en-tête (sticky). Reste sur fond blanc, puis applique
 * une ombre subtile et un léger voile translucide dès que la page défile —
 * effet d'en-tête professionnel des sites du secteur (Verisure, ADT…).
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background transition-shadow duration-300",
        scrolled
          ? "border-b border-transparent shadow-md supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur"
          : "border-b border-border/60",
      )}
    >
      {children}
    </header>
  );
}
