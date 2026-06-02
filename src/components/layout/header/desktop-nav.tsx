"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MAIN_LINKS, type ServiceLink } from "./nav-links";
import { buildServiceMenu } from "./service-menu";

/**
 * Navigation principale (écran large) avec méga-menu des services.
 */
export function DesktopNav({ services }: { services: ServiceLink[] }) {
  const t = useTranslations("Nav");
  const menu = buildServiceMenu(services.map((s) => s.slug));

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      <NavLink href="/">{t("home")}</NavLink>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium",
            "text-foreground/80 hover:bg-accent hover:text-brand transition-colors",
          )}
        >
          {t("services")}
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[40rem] p-4">
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            {menu.map((fam) => (
              <div key={fam.family}>
                <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`serviceFamily.${fam.family}`)}
                </p>
                <div className="space-y-0.5">
                  {fam.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.labelKey}
                        href={`/services/${item.slug}`}
                        className="flex items-center gap-2.5 rounded-md p-2 hover:bg-accent transition-colors"
                      >
                        <ItemIcon className="size-4 shrink-0 text-brand" />
                        <span className="text-sm font-medium">
                          {t(`serviceItems.${item.labelKey}`)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/services"
            className="mt-3 block rounded-md bg-muted px-3 py-2 text-center text-sm font-semibold text-brand hover:bg-accent"
          >
            {t("allServices")}
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>

      {MAIN_LINKS.filter((l) => l.key !== "home").map((l) => (
        <NavLink key={l.key} href={l.href}>
          {t(l.key)}
        </NavLink>
      ))}
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-brand transition-colors"
    >
      {children}
    </Link>
  );
}
