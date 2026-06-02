import { NextResponse } from "next/server";

import { getPublicStats, totalRealizations } from "@/lib/billing/public-stats";

// Mise en cache 1h (compteur public peu sensible à la fraîcheur).
export const revalidate = 3600;

/**
 * Endpoint public en lecture seule : compteurs de réalisations par catégorie.
 * N'expose jamais le chiffre d'affaires (RPC SECURITY DEFINER côté DB).
 */
export async function GET() {
  const stats = await getPublicStats();
  return NextResponse.json(
    {
      total: totalRealizations(stats),
      categories: stats,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
