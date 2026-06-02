"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";
import { clientSchema, type ClientInput } from "@/lib/billing/validation";

/** Résultat standard d'une action (code = clé i18n ou message). */
export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

/** Normalise une chaîne vide en null pour la base. */
function nz(value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

/** Crée un client dans l'organisation de l'utilisateur. */
export async function createClient(values: ClientInput): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: profile.organization_id,
      name: v.name,
      type: v.type,
      email: nz(v.email),
      phone: nz(v.phone),
      whatsapp: nz(v.whatsapp),
      address: nz(v.address),
      contact_person: nz(v.contact_person),
      notes: nz(v.notes),
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/clients");
  return { ok: true, id: data.id };
}

/** Met à jour un client existant. */
export async function updateClient(
  id: string,
  values: ClientInput,
): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  const { error } = await supabase
    .from("clients")
    .update({
      name: v.name,
      type: v.type,
      email: nz(v.email),
      phone: nz(v.phone),
      whatsapp: nz(v.whatsapp),
      address: nz(v.address),
      contact_person: nz(v.contact_person),
      notes: nz(v.notes),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/clients");
  revalidatePath(`/admin/billing/clients/${id}`);
  return { ok: true, id };
}

/** Supprime un client (les documents liés conservent client_id = null via FK). */
export async function deleteClient(id: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/clients");
  return { ok: true };
}
