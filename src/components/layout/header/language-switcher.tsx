"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Globe, Check } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Sélecteur de langue FR/EN qui conserve la page courante.
 */
export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  function switchTo(next: string) {
    if (next === locale) return;
    // Conserve les segments dynamiques de l'URL courante
    router.replace(
      // @ts-expect-error -- pathname typé strict, navigation interne sûre
      { pathname, params },
      { locale: next },
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" aria-label={t("label")} />}
      >
        <Globe className="size-4" />
        <span className="ml-1 uppercase">{locale}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchTo(loc)}
            className="justify-between"
          >
            {t(loc)}
            {loc === locale && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
