"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, ChevronDown } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DynamicIcon } from "@/components/dynamic-icon";
import { LanguageSwitcher } from "./language-switcher";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MAIN_LINKS, SERVICES_ICON, type ServiceLink } from "./nav-links";

/**
 * Menu mobile (tiroir latéral) — visible sous l'écran large.
 * Liens avec icônes, section Services repliable, CTA devis + langue en pied.
 */
export function MobileNav({ services }: { services: ServiceLink[] }) {
  const t = useTranslations("Nav");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const close = () => setOpen(false);

  // Style commun d'un lien de navigation (icône en pastille + libellé).
  const linkClass =
    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent";
  const iconWrap =
    "flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-brand";

  const HomeIcon = MAIN_LINKS[0].icon;

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

      <SheetContent side="right" className="flex w-[88%] max-w-sm flex-col p-0">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="text-base font-bold text-brand">SP Smart</SheetTitle>
        </SheetHeader>

        {/* Corps défilable */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {/* Accueil */}
          <Link href="/" onClick={close} className={linkClass}>
            <span className={iconWrap}>
              <HomeIcon className="size-4" />
            </span>
            {t("home")}
          </Link>

          {/* Services — repliable */}
          <button
            type="button"
            onClick={() => setServicesOpen((v) => !v)}
            aria-expanded={servicesOpen}
            className={cn(linkClass, "w-full")}
          >
            <span className={iconWrap}>
              <SERVICES_ICON className="size-4" />
            </span>
            <span className="flex-1 text-left">{t("services")}</span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                servicesOpen && "rotate-180",
              )}
            />
          </button>

          {servicesOpen ? (
            <div className="mb-1 ml-4 space-y-0.5 border-l border-border pl-3">
              {services.map((s) => (
                <Link
                  key={s.id}
                  href={`/services/${s.slug}`}
                  onClick={close}
                  className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <DynamicIcon name={s.icon} className="size-4 text-brand" />
                  {s.title}
                </Link>
              ))}
              <Link
                href="/services"
                onClick={close}
                className="flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-brand hover:bg-accent"
              >
                {t("allServices")}
              </Link>
            </div>
          ) : null}

          {/* Autres liens principaux (hors accueil) */}
          {MAIN_LINKS.filter((l) => l.key !== "home").map((l) => {
            const Icon = l.icon;
            return (
              <Link key={l.key} href={l.href} onClick={close} className={linkClass}>
                <span className={iconWrap}>
                  <Icon className="size-4" />
                </span>
                {t(l.key)}
              </Link>
            );
          })}
        </div>

        {/* Pied : CTA devis + langue */}
        <div className="border-t border-border p-4">
          <ButtonLink href="/devis" onClick={close} size="lg" className="w-full">
            {t("quote")}
          </ButtonLink>
          <div className="mt-3 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
