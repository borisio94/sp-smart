import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/billing/admin-sidebar";

/**
 * AuthGuard du module Billing : protège toutes les pages SAUF /login.
 * Sans session valide → redirection vers la page de connexion.
 */
export default async function BillingProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pas de config Supabase → impossible de s'authentifier : on renvoie au login.
  if (!hasSupabaseEnv()) {
    redirect("/admin/billing/login");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/billing/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar userEmail={user.email ?? ""} />
      <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</div>
    </div>
  );
}
