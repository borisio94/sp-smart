import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { sendEmail, emailTemplate } from "@/lib/email";
import { clientSignatureSchema } from "@/lib/billing/validation";
import {
  canonicalSignedContent,
  isSignableType,
  shortHash,
} from "@/lib/billing/signature";
import { DOCUMENT_TYPE_LABELS, formatMoney } from "@/lib/billing/format";
import type { DocumentType } from "@/lib/billing/types";

export const runtime = "nodejs";

/** Statuts depuis lesquels un client peut signer (un brouillon n'est pas final). */
const SIGNABLE_STATUSES = ["envoye", "confirme", "termine"];

/** Signature des 8 premiers octets d'un fichier PNG valide. */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

/** IP du client derrière le proxy Vercel (repli sur une valeur neutre). */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "inconnue";
}

/**
 * Enregistre la signature électronique du client sur un document partagé par
 * lien privé.
 *
 * Aucune écriture n'est ouverte au rôle anon : tout passe ici, avec la clé
 * service role, après vérification du token, du statut et de l'anti-spam.
 * L'empreinte SHA-256 du contenu signé est stockée avec la signature : elle
 * rend toute modification ultérieure du document détectable.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  // 1) Anti-abus : 5 tentatives par minute et par IP.
  const limited = rateLimit(`sign:${clientIp(request)}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return fail("Trop de tentatives. Réessayez dans un instant.", 429);
  }

  // 2) Validation des données saisies.
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail("Requête invalide.", 400);
  }
  const parsed = clientSignatureSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Données invalides.", 400);
  }
  const input = parsed.data;

  if (!(await verifyCaptcha(input.captchaToken))) {
    return fail("Vérification anti-robot échouée.", 400);
  }

  // 3) Le tracé doit être un vrai PNG (et pas un data URL arbitraire).
  const base64 = input.signature.slice("data:image/png;base64,".length);
  const png = Buffer.from(base64, "base64");
  if (png.length < 100 || !png.subarray(0, 8).equals(PNG_MAGIC)) {
    return fail("Signature invalide.", 400);
  }

  // 4) Document ciblé par le token.
  const admin = createSupabaseAdminClient();
  const { data: doc, error: loadError } = await admin
    .from("documents")
    .select(
      "id, type, number, issue_date, body_mode, body_text, total_amount, payment_terms, delivery_terms, status, signature_required, signed_at, client:clients(name), lines:document_lines(position, designation, quantity, unit_price, line_total)",
    )
    .eq("share_token", token)
    .maybeSingle();

  if (loadError || !doc) return fail("Document introuvable.", 404);
  if (doc.status === "annule") return fail("Document indisponible.", 404);
  if (!doc.signature_required || !isSignableType(doc.type)) {
    return fail("Ce document n'est pas ouvert à la signature.", 403);
  }
  if (doc.signed_at) {
    return fail("Ce document a déjà été signé.", 409);
  }
  if (!SIGNABLE_STATUSES.includes(doc.status)) {
    return fail("Ce document n'a pas encore été finalisé par son émetteur.", 409);
  }

  // 5) Empreinte du contenu signé (preuve d'intégrité).
  // La relation intégrée est typée en tableau par supabase-js : on prend
  // le premier élément (la jointure sur client_id ne renvoie qu'une ligne).
  const clientRel = doc.client as unknown as
    | { name: string }
    | { name: string }[]
    | null;
  const client = Array.isArray(clientRel) ? (clientRel[0] ?? null) : clientRel;
  const lines = (doc.lines ?? []) as {
    position: number;
    designation: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
  const canonical = canonicalSignedContent({
    number: doc.number,
    issue_date: doc.issue_date,
    client_name: client?.name ?? null,
    body_mode: doc.body_mode,
    body_text: doc.body_text,
    total_amount: doc.total_amount,
    payment_terms: doc.payment_terms,
    delivery_terms: doc.delivery_terms,
    lines,
  });
  const hash = createHash("sha256").update(canonical, "utf8").digest("hex");

  // 6) Dépôt du tracé dans le bucket privé.
  const path = `${doc.id}.png`;
  const { error: uploadError } = await admin.storage
    .from("signatures")
    .upload(path, png, { contentType: "image/png", upsert: true });
  if (uploadError) {
    console.error("[Signature] Échec de l'upload :", uploadError);
    return fail("La signature n'a pas pu être enregistrée. Réessayez.", 500);
  }

  // 7) Enregistrement. La condition `signed_at is null` rend l'opération
  //    idempotente même si deux requêtes arrivent en même temps.
  const signedAt = new Date().toISOString();
  const update: Record<string, unknown> = {
    signed_at: signedAt,
    signed_by_name: input.name,
    signed_by_email: input.email || null,
    client_signature_url: path,
    signature_ip: clientIp(request),
    signature_user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    signature_doc_hash: hash,
  };
  // La signature du client vaut confirmation du document envoyé.
  if (doc.status === "envoye") {
    update.status = "confirme";
    update.confirmed_at = signedAt;
  }

  const { data: updated, error: updateError } = await admin
    .from("documents")
    .update(update)
    .eq("id", doc.id)
    .is("signed_at", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[Signature] Échec de l'enregistrement :", updateError);
    return fail("La signature n'a pas pu être enregistrée. Réessayez.", 500);
  }
  if (!updated) return fail("Ce document a déjà été signé.", 409);

  // 8) Notification interne (tolérante : un échec d'email ne casse rien).
  const typeLabel = DOCUMENT_TYPE_LABELS[doc.type as DocumentType] ?? doc.type;
  await sendEmail({
    subject: `Document signé par le client — ${doc.number ?? typeLabel}`,
    html: emailTemplate("Signature client reçue", [
      ["Document", `${typeLabel} ${doc.number ?? ""}`.trim()],
      ["Client", client?.name ?? "—"],
      ["Signé par", input.name],
      ["Email", input.email || "—"],
      ["Montant", formatMoney(doc.total_amount)],
      ["Référence d'intégrité", shortHash(hash)],
    ]),
    replyTo: input.email || undefined,
  });

  revalidatePath(`/facture-privee/${token}`);
  revalidatePath(`/admin/billing/documents/${doc.id}`);
  revalidatePath("/admin/billing/documents");

  return Response.json({ ok: true });
}
