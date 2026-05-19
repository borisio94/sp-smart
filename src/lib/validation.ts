import { z } from "zod";

// Champs communs
const name = z.string().trim().min(2, "Nom trop court").max(120);
const email = z.string().trim().email("Email invalide").max(160);
const phone = z
  .string()
  .trim()
  .min(6, "Téléphone invalide")
  .max(30)
  .regex(/^[0-9+()\s-]+$/, "Téléphone invalide");

export const devisSchema = z.object({
  name,
  email,
  phone,
  serviceId: z.string().trim().min(1, "Veuillez choisir un service"),
  description: z
    .string()
    .trim()
    .min(10, "Décrivez votre besoin (10 caractères min.)")
    .max(3000),
  captchaToken: z.string().optional(),
  // Anti-bot : champ caché qui doit rester vide
  company: z.string().max(0).optional(),
});

export const rdvSchema = z.object({
  name,
  email,
  phone,
  serviceId: z.string().trim().optional(),
  date: z.string().trim().min(1, "Date requise"),
  time: z.string().trim().min(1, "Heure requise"),
  message: z.string().trim().max(2000).optional(),
  captchaToken: z.string().optional(),
  company: z.string().max(0).optional(),
});

export const contactSchema = z.object({
  name,
  email,
  phone: phone.optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Sujet requis").max(160),
  message: z
    .string()
    .trim()
    .min(10, "Message trop court (10 caractères min.)")
    .max(3000),
  captchaToken: z.string().optional(),
  company: z.string().max(0).optional(),
});

export type DevisInput = z.infer<typeof devisSchema>;
export type RdvInput = z.infer<typeof rdvSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

/** `code` est une clé de traduction du namespace "Forms" côté client. */
export type ActionResult = { ok: boolean; code: string };
