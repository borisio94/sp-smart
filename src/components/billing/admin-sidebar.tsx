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
  MoreHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

/** Élément de navigation. */
type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

/** Onglets principaux affichés dans la barre du bas (mobile). */
const PRIMARY_ITEMS: NavItem[] = [
  { href: "/admin/billing", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/billing/documents", labelKey: "nav.documents", icon: FileText },
  { href: "/admin/billing/clients", labelKey: "nav.clients", icon: Users },
  { href: "/admin/billing/paiements", labelKey: "nav.payments", icon: CreditCard },
];

/** Entrées secondaires (panneau « Plus » sur mobile). */
const SECONDARY_ITEMS: NavItem[] = [
  { href: "/admin/billing/historique", labelKey: "nav.history", icon: History },
  { href: "/admin/billing/parametres", labelKey: "nav.settings", icon: Settings },
];

/** Toutes les entrées (barre latérale desktop). */
const ALL_ITEMS = [...PRIMARY_ITEMS, ...SECONDARY_ITEMS];

/** Un lien actif si l'URL courante correspond (exact pour le tableau de bord). */
function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/admin/billing" ? pathname === href : pathname.startsWith(href);
}

/* ───────────────────────── Barre latérale desktop ───────────────────────── */

function SidebarBody({ userEmail }: { userEmail: string }) {
  const t = useTranslations("Admin");
  const isActive = useIsActive();
  const initial = (userEmail.trim()[0] ?? "?").toUpperCase();

  return (
    <>
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
        {ALL_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-11 items-center gap-3 rounded-lg border-l-2 pr-3 pl-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
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

/* ───────────────────────── Barre d'onglets mobile ───────────────────────── */

/** Un onglet de la barre du bas (icône + libellé court). */
function TabButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const t = useTranslations("Admin");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-5" />
      <span className="max-w-full truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

/**
 * Navigation du module Billing :
 *  - Desktop (lg+) : barre latérale fixe à gauche.
 *  - Mobile : barre d'onglets fixe en bas (4 principaux + « Plus »),
 *    le bouton « Plus » ouvrant une feuille avec Historique, Paramètres
 *    et la déconnexion.
 */
export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const t = useTranslations("Admin");
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = SECONDARY_ITEMS.some((i) => isActive(i.href));

  return (
    <>
      {/* Barre latérale — desktop uniquement */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <SidebarBody userEmail={userEmail} />
      </aside>

      {/* En-tête mobile léger (titre uniquement) */}
      <div className="flex items-center gap-2.5 border-b border-border bg-card px-4 py-3 lg:hidden">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          SP
        </div>
        <p className="text-sm font-semibold">SP Smart</p>
      </div>

      {/* Feuille « Plus » (mobile) */}
      {moreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("nav.closeMenu")}
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <div className="space-y-1">
              {SECONDARY_ITEMS.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-5" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-2 px-1 text-xs text-muted-foreground">{userEmail}</p>
              <LogoutButton />
            </div>
          </div>
        </div>
      ) : null}

      {/* Barre d'onglets fixe en bas — mobile uniquement */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {PRIMARY_ITEMS.map((item) => (
          <TabButton key={item.href} item={item} active={isActive(item.href)} />
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label={t("nav.more")}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
            moreActive || moreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MoreHorizontal className="size-5" />
          <span>{t("nav.more")}</span>
        </button>
      </nav>
    </>
  );
}
