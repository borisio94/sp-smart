"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type HeroSlide = { url: string; alt: string };

/**
 * Diaporama de fond du hero : enchaîne les images en fondu automatique.
 * Reçoit des URLs déjà résolues (côté serveur) pour rester un simple
 * composant d'affichage. Respecte `prefers-reduced-motion` (pas de défilement
 * si l'utilisateur a désactivé les animations) et n'anime rien s'il n'y a
 * qu'une seule image.
 */
export function HeroSlideshow({
  slides,
  intervalMs = 5000,
}: {
  slides: HeroSlide[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;

  return (
    <div className="absolute inset-0 -z-10" aria-hidden>
      {slides.map((slide, i) => (
        <Image
          key={slide.url}
          src={slide.url}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="100vw"
          className={cn(
            "object-cover transition-opacity duration-1000 ease-in-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}
