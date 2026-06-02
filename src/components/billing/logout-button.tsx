"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/** Bouton de déconnexion : ferme la session Supabase puis renvoie au login. */
export function LogoutButton() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onLogout() {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/admin/billing/login");
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      disabled={pending}
      onClick={onLogout}
    >
      <LogOut className="size-4" />
      {t("nav.logout")}
    </Button>
  );
}
