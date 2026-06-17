import { z } from "zod";

/**
 * Schémas de validation du module Billing.
 * Source de vérité partagée client (RHF) ↔ serveur (actions).
 */

// ───────────── Authentification ─────────────
export const loginSchema = z.object({
  email: z.string().trim().email("Email invalide").max(160),
  password: z.string().min(8, "Mot de passe trop court (8 caractères min.)").max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Demande de réinitialisation : on ne saisit que l'email.
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email invalide").max(160),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Définition d'un nouveau mot de passe (changement volontaire ou récupération).
export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Mot de passe trop court (8 caractères min.)").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

// ───────────── Clients ─────────────
export const clientSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(160),
  type: z.enum(["particulier", "entreprise", "institution"]),
  email: z.union([z.string().trim().email("Email invalide").max(160), z.literal("")]),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  contact_person: z.string().trim().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;

// ───────────── Catégories ─────────────
export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Slug trop court")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Minuscules, chiffres et tirets uniquement"),
  name_fr: z.string().trim().min(2, "Nom (FR) requis").max(120),
  name_en: z.string().trim().min(2, "Nom (EN) requis").max(120),
  lucide_icon: z.string().trim().max(60).optional().or(z.literal("")),
  color: z.string().trim().max(20).optional().or(z.literal("")),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// ───────────── Type de document personnalisé ─────────────
export const customDocumentTypeSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(60),
  prefix: z
    .string()
    .trim()
    .min(2, "Code trop court")
    .max(6, "Code trop long (6 max)")
    .regex(/^[A-Za-z0-9]+$/, "Lettres et chiffres uniquement")
    .transform((s) => s.toUpperCase()),
});

export type CustomDocumentTypeInput = z.infer<typeof customDocumentTypeSchema>;

// ───────────── Documents ─────────────
export const documentLineSchema = z.object({
  designation: z.string().trim().min(1, "Désignation requise").max(400),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
  quantity: z.number({ message: "Quantité invalide" }).min(0, "Quantité invalide").max(1_000_000),
  unit_price: z.number({ message: "Prix invalide" }).min(0, "Prix invalide").max(1_000_000_000),
});

export type DocumentLineInput = z.infer<typeof documentLineSchema>;

export const documentSchema = z
  .object({
    type: z.enum(["devis", "proforma", "bon_commande", "facture", "recu", "autre"]),
    client_id: z.string().uuid("Client requis"),
    category_id: z.string().uuid("Catégorie requise").optional().or(z.literal("")),
    custom_type_id: z.string().uuid().optional().or(z.literal("")),
    issue_date: z.string().trim().min(1, "Date d'émission requise"),
    validity_date: z.string().trim().optional().or(z.literal("")),
    title: z.string().trim().max(200).optional().or(z.literal("")),
    subject: z.string().trim().max(300).optional().or(z.literal("")),
    client_ref: z.string().trim().max(120).optional().or(z.literal("")),
    body_mode: z.enum(["table", "text"]),
    body_text: z.string().trim().max(8000).optional().or(z.literal("")),
    lines: z.array(documentLineSchema).max(100),
    labor_amount: z
      .number({ message: "Montant invalide" })
      .min(0, "Montant invalide")
      .max(1_000_000_000),
    discount_amount: z
      .number({ message: "Remise invalide" })
      .min(0, "Remise invalide")
      .max(1_000_000_000),
    tax_rate: z.number().min(0, "Taux invalide").max(100, "Taux invalide"),
    payment_terms: z.string().trim().max(2000).optional().or(z.literal("")),
    delivery_terms: z.string().trim().max(2000).optional().or(z.literal("")),
    include_conditions: z.boolean(),
    notes_internes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine(
    (d) => d.body_mode !== "table" || d.lines.length > 0,
    { message: "Ajoutez au moins une ligne au tableau", path: ["lines"] },
  )
  .refine(
    (d) => d.body_mode !== "text" || (d.body_text && d.body_text.trim().length > 0),
    { message: "Le corps texte ne peut pas être vide", path: ["body_text"] },
  )
  .refine(
    (d) =>
      d.type !== "bon_commande" ||
      (d.payment_terms?.trim() ?? "") !== "" ||
      (d.delivery_terms?.trim() ?? "") !== "",
    {
      message:
        "Un bon de commande exige au moins une condition (modalités ou délais).",
      path: ["payment_terms"],
    },
  )
  .refine(
    // Un type personnalisé est stocké en type="autre" + custom_type_id.
    (d) => d.type !== "autre" || (d.custom_type_id?.trim() ?? "") !== "",
    {
      message: "Type personnalisé requis.",
      path: ["custom_type_id"],
    },
  );

export type DocumentInput = z.infer<typeof documentSchema>;

// ───────────── Paiements ─────────────
export const paymentSchema = z.object({
  amount: z
    .number({ message: "Montant invalide" })
    .refine((n) => n !== 0, "Le montant ne peut pas être nul")
    .refine((n) => Math.abs(n) <= 1_000_000_000, "Montant trop élevé"),
  method: z.enum([
    "especes",
    "momo_mtn",
    "momo_orange",
    "virement",
    "cheque",
    "carte",
  ]),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  received_at: z.string().trim().min(1, "Date requise"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

// ───────────── Saisie historique (document antérieur au site) ─────────────
export const historicalSchema = z.object({
  type: z.enum(["devis", "proforma", "bon_commande", "facture", "recu", "autre"]),
  number: z.string().trim().max(40).optional().or(z.literal("")),
  client_id: z.string().uuid("Client requis"),
  category_id: z.string().uuid("Catégorie requise").optional().or(z.literal("")),
  issue_date: z.string().trim().min(1, "Date requise"),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  total_amount: z.number({ message: "Montant invalide" }).min(0).max(1_000_000_000),
  status: z.enum(["brouillon", "envoye", "confirme", "termine", "annule"]),
  payment_status: z.enum([
    "non_paye",
    "acompte",
    "partiel",
    "paye_total",
    "rembourse",
  ]),
});

export type HistoricalInput = z.infer<typeof historicalSchema>;

// ───────────── Organisation (coordonnées de la boutique) ─────────────
const optText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const organizationSchema = z.object({
  name: z.string().trim().min(2, "Raison sociale requise").max(160),
  legal_form: optText(60),
  slogan: optText(240),
  niu: optText(60),
  rccm: optText(60),
  capital: optText(60),
  address: optText(400),
  phone: optText(60),
  email: z
    .union([z.string().trim().email("Email invalide").max(160), z.literal("")])
    .optional(),
  website: optText(160),
  facebook: optText(160),
  bank_name: optText(120),
  bank_account: optText(120),
  bank_bic: optText(60),
  momo_mtn: optText(60),
  momo_orange: optText(60),
  fiscal_regime: optText(60),
  default_tax_rate: z.number().min(0, "Taux invalide").max(100, "Taux invalide"),
  default_payment_terms: optText(2000),
  default_delivery_terms: optText(2000),
});

export type OrganizationInput = z.infer<typeof organizationSchema>;
