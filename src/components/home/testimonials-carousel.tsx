"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import { pickLocale } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { SanityImage } from "@/components/sanity-image";
import type { Testimonial } from "../../../sanity/lib/types";

/**
 * Carrousel de témoignages clients.
 */
export function TestimonialsCarousel({
  testimonials,
  locale,
  title,
}: {
  testimonials: Testimonial[];
  locale: string;
  title: string;
}) {
  const [index, setIndex] = useState(0);
  if (!testimonials || testimonials.length === 0) return null;

  const count = testimonials.length;
  const current = testimonials[index];
  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);

  return (
    <Section>
      <SectionHeader title={title} />
      <div className="relative mx-auto max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.figure
            key={current._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border bg-background p-8 text-center shadow-sm"
          >
            <div className="mb-4 flex justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < (current.rating ?? 5)
                      ? "size-5 fill-brand text-brand"
                      : "size-5 text-muted-foreground/30"
                  }
                />
              ))}
            </div>
            <blockquote className="text-lg italic text-foreground/90">
              “{pickLocale(current.text, locale)}”
            </blockquote>
            <figcaption className="mt-6 flex items-center justify-center gap-3">
              {current.photo?.asset?._ref && (
                <SanityImage
                  image={current.photo}
                  alt={current.name ?? ""}
                  width={48}
                  height={48}
                  className="size-12 rounded-full object-cover"
                />
              )}
              <div className="text-left">
                <p className="font-semibold">{current.name}</p>
                <p className="text-sm text-muted-foreground">
                  {pickLocale(current.role, locale)}
                </p>
              </div>
            </figcaption>
          </motion.figure>
        </AnimatePresence>

        {count > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Précédent"
              onClick={() => go(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Suivant"
              onClick={() => go(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}
