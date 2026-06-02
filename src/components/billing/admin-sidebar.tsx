"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  History,
  Settings,
  Menu,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

/** Élément de navigation de la barre latérale admin. */
type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/billing", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/billing/documents", labelKey: "nav.documents", icon: FileText },
  { href: "/admin/billing/clients", labelKey: "nav.clients", icon: Users },
  { href: "/admin/billing/paiements", labelKey: "nav.payments", icon: CreditCard },
  { href: "/admin/billing/historique", labelKey: "nav.history", icon: History },
  { href: "/admin/billing/parametres", labelKey: "nav.settings", icon: Settings },
];

/** Contenu interne de la barre (liens + pied). Réutilisé desktop & tiroir. */
function SidebarBody({
  userEmail,
  onNavigate,
}: {
  userEmail: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations("Admin");
  const pathname = usePathname();

  // Initiale de l'utilisateur pour l'avatar du pied de page.
  const initial = (userEmail.trim()[0] ?? "?").toUpperCase();

  return (
    <>
      {/* En-tête : monogramme SP + nom du module */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
          SP
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">SP Smart</p>
          <p className="truncate text-xs text-muted-foreground">{t("nav.moduleName")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/admin/billing"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                // Barre d'accent à gauche (border-l) + min-h-11 (~44px tactile).
                "group relative flex min-h-11 items-center gap-3 rounded-lg border-l-2 pr-3 pl-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {/* Icône dans une pastille */}
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Pied : avatar (initiale) + email + déconnexion */}
      <div className="mt-2 border-t border-border px-3 py-4">
        <div className="mb-3 flex items-center gap-2.5 px-1">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-brand">
            {initial}
          </div>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {userEmail}
          </p>
        </div>
        <LogoutButton />
      </div>
    </>
  );
}

/**
 * Navigation du module Billing :
 *  - Desktop (lg+) : barre latérale fixe à gauche.
 *  - Mobile : barre supérieure avec bouton hamburger + tiroir coulissant.
 */
export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const t = useTranslations("Admin");
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Barre latérale fixe — desktop uniquement */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <SidebarBody userEmail={userEmail} />
      </aside>

      {/* Barre supérieure — mobile uniquement */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("nav.openMenu")}
          className="flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
        <div>
          <p className="text-sm font-semibold leading-tight">SP Smart</p>
          <p className="text-[11px] leading-tight text-muted-foreground">
            {t("nav.moduleName")}
          </p>
        </div>
      </div>

      {/* Tiroir mobile + fond */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("nav.closeMenu")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-card shadow-xl">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("nav.closeMenu")}
                className="flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarBody userEmail={userEmail} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
