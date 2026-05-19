"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SanityImage } from "@/components/sanity-image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SanityImageRef } from "../../sanity/lib/types";

type Img = SanityImageRef & { alt?: string };

/**
 * Galerie d'images avec visionneuse (lightbox) accessible.
 * Chargement différé des images, navigation précédent/suivant.
 */
export function GalleryLightbox({
  images,
  title,
}: {
  images: Img[];
  title: string;
}) {
  const valid = (images ?? []).filter((i) => i?.asset?._ref);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (valid.length === 0) return null;

  const show = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const move = (d: number) =>
    setIndex((i) => (i + d + valid.length) % valid.length);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {valid.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => show(i)}
            className="overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-brand"
            aria-label={`${title} — image ${i + 1}`}
          >
            <SanityImage
              image={img}
              alt={img?.alt ?? title}
              width={500}
              height={375}
              className="h-40 w-full object-cover transition-transform hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="relative">
            <SanityImage
              image={valid[index]}
              alt={valid[index]?.alt ?? title}
              width={1400}
              height={1000}
              className="h-auto w-full rounded-lg object-contain"
            />
            {valid.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label="Image précédente"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="Image suivante"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
