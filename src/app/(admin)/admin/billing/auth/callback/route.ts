import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Callback d'authentification Supabase (flux PKCE).
 * Le lien envoyé par email (réinitialisation de mot de passe, lien magique)
 * pointe ici avec un `code` à échanger contre une session (pose des cookies).
 * On redirige ensuite vers `next` (par défaut : le tableau de bord).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin/billing";

  if (code && hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code absent ou invalide → retour au login avec un indicateur d'erreur.
  return NextResponse.redirect(`${origin}/admin/billing/login?error=auth`);
}
