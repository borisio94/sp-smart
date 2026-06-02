import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";

/**
 * Client Supabase « public » (clé anon, sans session ni cookies).
 * Pour les pages publiques : compteur de réalisations, facture partagée par token.
 * N'accède qu'aux fonctions/données autorisées au rôle anon (RPC SECURITY DEFINER).
 * Renvoie null si Supabase n'est pas configuré (le site public reste fonctionnel).
 */
export function createSupabasePublicClient() {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
