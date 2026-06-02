import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { PublicCategoryStat } from "./types";

/**
 * Récupère les compteurs publics de réalisations (RPC anon, SECURITY DEFINER).
 * Ne renvoie jamais le chiffre d'affaires. Tolérant : [] si non configuré/erreur.
 */
export async function getPublicStats(): Promise<PublicCategoryStat[]> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_public_category_stats");
  if (error || !data) return [];
  return data as PublicCategoryStat[];
}

/** Total cumulé de réalisations, toutes catégories actives confondues. */
export function totalRealizations(stats: PublicCategoryStat[]): number {
  return stats.reduce((acc, s) => acc + (s.realized_count ?? 0), 0);
}

/**
 * Correspondance entre le slug de service (Sanity, site public) et le slug de
 * catégorie (Supabase, module billing). Les deux jeux de slugs diffèrent :
 * cette table fait le pont pour afficher le bon compteur sur chaque page service.
 * (Jointure de données, pas du contenu en dur.)
 */
export const SERVICE_TO_CATEGORY_SLUG: Record<string, string> = {
  "portails-automatiques": "motorisation-portails",
  "volets-et-grilles": "motorisation-volets",
  videosurveillance: "videosurveillance",
  "securite-incendie": "securite-incendie",
  "anti-intrusion": "anti-intrusion",
  "cloture-electrique": "cloture-electrique",
  "controle-acces": "controle-acces",
  "electricite-domestique": "electricite",
  "systemes-solaires": "solaire",
};

/** Compteur de réalisations pour un slug de service donné (0 si inconnu). */
export function realizationsForService(
  stats: PublicCategoryStat[],
  serviceSlug: string,
): number {
  const categorySlug = SERVICE_TO_CATEGORY_SLUG[serviceSlug];
  if (!categorySlug) return 0;
  return stats.find((s) => s.slug === categorySlug)?.realized_count ?? 0;
}

/** Forme d'un document partagé publiquement (RPC get_document_by_token). */
export interface PublicDocument {
  id: string;
  type: string;
  number: string | null;
  issue_date: string;
  validity_date: string | null;
  title: string | null;
  subject: string | null;
  body_mode: string;
  body_text: string | null;
  materials_subtotal: number;
  labor_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_in_words: string | null;
  payment_terms: string | null;
  delivery_terms: string | null;
  status: string;
  payment_status: string;
  client_name: string | null;
  organization_name: string | null;
}

export interface PublicDocumentLine {
  position: number;
  designation: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

/** Récupère un document public par son token (null si absent/annulé). */
export async function getPublicDocument(
  token: string,
): Promise<{ document: PublicDocument; lines: PublicDocumentLine[] } | null> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_document_by_token", {
    p_token: token,
  });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;

  const document = (Array.isArray(data) ? data[0] : data) as PublicDocument;

  const { data: linesData } = await supabase.rpc("get_document_lines_by_token", {
    p_token: token,
  });
  const lines = (linesData as PublicDocumentLine[] | null) ?? [];

  return { document, lines };
}
