"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DynamicIcon } from "@/components/dynamic-icon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MAIN_LINKS, type ServiceLink } from "./nav-links";

/**
 * Menu mobile (tiroir latéral) — visible sous l'écran large.
 */
export function MobileNav({ services }: { services: ServiceLink[] }) {
  const t = useTranslations("Nav");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={tc("menu")}
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-brand">{tc("menu")}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 px-4 pb-6">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            {t("home")}
          </Link>

          <p className="mt-3 px-3 text-xs font-semibold uppercase text-muted-foreground">
            {t("services")}
          </p>
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/services/${s.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <DynamicIcon name={s.icon} className="size-4 text-brand" />
              {s.title}
            </Link>
          ))}
          <Link
            href="/services"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-semibold text-brand hover:bg-accent"
          >
            {t("allServices")}
          </Link>

          <p className="mt-3 px-3 text-xs font-semibold uppercase text-muted-foreground">
            {t("contact")}
          </p>
          {MAIN_LINKS.filter(
            (l) => l.key !== "home",
          ).map((l) => (
            <Link
              key={l.key}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {t(l.key)}
            </Link>
          ))}

          <ButtonLink
            href="/devis"
            onClick={() => setOpen(false)}
            className="mt-4"
          >
            {t("quote")}
          </ButtonLink>
        </div>
      </SheetContent>
    </Sheet>
  );
}
