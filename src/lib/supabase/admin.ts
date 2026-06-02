import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireSupabaseEnv, requireServiceRoleKey } from "./env";

/**
 * Client Supabase « administrateur » avec la clé service role.
 * ⚠️ CONTOURNE la RLS — à n'utiliser QUE côté serveur pour des opérations
 * privilégiées maîtrisées (ex. création d'un profil après invitation).
 * Jamais dans un composant client, jamais exposé au navigateur.
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabaseEnv();
  const serviceRoleKey = requireServiceRoleKey();

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
