"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseEnv } from "./env";

/**
 * Client Supabase côté navigateur (composants « use client »).
 * Utilise la clé anon : tout accès est filtré par les politiques RLS.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
