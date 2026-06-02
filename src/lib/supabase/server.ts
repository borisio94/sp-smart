import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { requireSupabaseEnv } from "./env";

/**
 * Client Supabase côté serveur lié aux cookies de session (clé anon).
 * Respecte la RLS : ne voit que les données de l'organisation de l'utilisateur
 * authentifié. À utiliser dans les Server Components, Route Handlers et actions.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un Server Component (cookies en lecture seule) :
          // le rafraîchissement de session est assuré par le proxy.
        }
      },
    },
  });
}
