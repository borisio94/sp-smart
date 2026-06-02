import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "./types";

/**
 * Récupère le profil métier de l'utilisateur authentifié (id, organisation, rôle).
 * Mémoïsé par requête (React cache) pour éviter les appels redondants.
 * Renvoie null si non connecté ou profil absent.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, organization_id, full_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
});

/**
 * Variante stricte : lève une erreur si l'utilisateur n'est pas authentifié.
 * À utiliser dans les actions serveur (le layout protège déjà les pages).
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Non authentifié.");
  }
  return profile;
}
