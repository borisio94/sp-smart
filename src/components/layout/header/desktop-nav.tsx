"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/dynamic-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MAIN_LINKS, type ServiceLink } from "./nav-links";

/**
 * Navigation principale (écran large) avec méga-menu des services.
 */
export function DesktopNav({ services }: { services: ServiceLink[] }) {
  const t = useTranslations("Nav");

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
        <DropdownMenuContent className="w-[34rem] p-3">
          <div className="grid grid-cols-2 gap-1">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/services/${s.slug}`}
                className="flex items-start gap-3 rounded-md p-3 hover:bg-accent transition-colors"
              >
                <DynamicIcon
                  name={s.icon}
                  className="mt-0.5 size-5 shrink-0 text-brand"
                />
                <span className="text-sm font-medium">{s.title}</span>
              </Link>
            ))}
          </div>
          <Link
            href="/services"
            className="mt-2 block rounded-md bg-muted px-3 py-2 text-center text-sm font-semibold text-brand hover:bg-accent"
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
