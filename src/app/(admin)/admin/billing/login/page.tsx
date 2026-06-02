import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/billing/login-form";

/**
 * Page de connexion au module Billing.
 * Hors de l'AuthGuard (groupe (protected)) pour éviter toute boucle de redirection.
 */
export default async function BillingLoginPage() {
  const t = await getTranslations("Admin");
  const configured = hasSupabaseEnv();

  // Déjà connecté → on file directement au tableau de bord.
  if (configured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/admin/billing");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("login.title")}</CardTitle>
          <CardDescription>{t("login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {configured ? (
            <LoginForm />
          ) : (
            <p className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
              {t("login.notConfigured")}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
