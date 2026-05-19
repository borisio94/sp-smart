"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

import { pickLocale } from "@/lib/locale";
import { Container } from "@/components/layout/container";
import type { HomePage } from "../../../sanity/lib/types";

type Stat = NonNullable<NonNullable<HomePage>["stats"]>[number];

function StatItem({ stat, locale }: { stat: Stat; locale: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState("0");

  const raw = stat.value ?? "";
  const target = parseInt(raw.replace(/\D/g, ""), 10) || 0;
  const suffix = raw.replace(/[0-9]/g, "");

  useEffect(() => {
    if (!inView || target === 0) {
      // Animation de comptage déclenchée à l'apparition à l'écran : cas légitime
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(raw);
      return;
    }
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setDisplay(`${current}${suffix}`);
    }, 30);
    return () => clearInterval(timer);
  }, [inView, target, suffix, raw]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-bold text-brand sm:text-5xl">{display}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {pickLocale(stat.label, locale)}
      </p>
    </div>
  );
}

/**
 * Bande de chiffres clés avec animation au défilement.
 */
export function Stats({
  stats,
  locale,
}: {
  stats: Stat[];
  locale: string;
}) {
  if (!stats || stats.length === 0) return null;

  return (
    <section className="border-y bg-muted/30 py-14">
      <Container>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <StatItem key={i} stat={s} locale={locale} />
          ))}
        </div>
      </Container>
    </section>
  );
}
