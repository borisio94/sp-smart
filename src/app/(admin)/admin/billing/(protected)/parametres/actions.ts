"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";
import { organizationSchema, type OrganizationInput } from "@/lib/billing/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

function nz(value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

/**
 * Met à jour les coordonnées de la boutique (table organizations).
 * Modifiable à tout moment depuis l'application — ces informations
 * alimentent l'en-tête et le pied de page des documents PDF.
 */
export async function updateOrganization(
  values: OrganizationInput,
): Promise<ActionResult> {
  const parsed = organizationSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  const { error } = await supabase
    .from("organizations")
    .update({
      name: v.name,
      legal_form: nz(v.legal_form),
      slogan: nz(v.slogan),
      niu: nz(v.niu),
      rccm: nz(v.rccm),
      capital: nz(v.capital),
      address: nz(v.address),
      phone: nz(v.phone),
      email: nz(v.email),
      website: nz(v.website),
      facebook: nz(v.facebook),
      bank_name: nz(v.bank_name),
      bank_account: nz(v.bank_account),
      bank_bic: nz(v.bank_bic),
      momo_mtn: nz(v.momo_mtn),
      momo_orange: nz(v.momo_orange),
      fiscal_regime: nz(v.fiscal_regime),
      default_tax_rate: v.default_tax_rate ?? 0,
      default_payment_terms: nz(v.default_payment_terms),
      default_delivery_terms: nz(v.default_delivery_terms),
    })
    .eq("id", profile.organization_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/billing/parametres");
  return { ok: true };
}
