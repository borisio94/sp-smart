"use client";

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

/**
 * Barre latérale de navigation du module Billing.
 * Utilise next/link (et non le Link i18n) car l'admin n'est pas localisé.
 */
export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const t = useTranslations("Admin");
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="px-5 py-6">
        <p className="text-sm font-semibold tracking-tight">SP Smart</p>
        <p className="text-xs text-muted-foreground">{t("nav.moduleName")}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
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
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <p className="truncate px-3 pb-2 text-xs text-muted-foreground">
          {userEmail}
        </p>
        <LogoutButton />
      </div>
    </aside>
  );
}
