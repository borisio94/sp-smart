"use server";

import { headers } from "next/headers";

import {
  devisSchema,
  rdvSchema,
  contactSchema,
  type ActionResult,
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import { sendEmail, emailTemplate } from "@/lib/email";
import { createSanityDocument } from "../../../sanity/lib/write-client";
import { sanityFetch } from "../../../sanity/lib/fetch";
import { siteSettingsQuery } from "../../../sanity/lib/queries";
import type { SiteSettings } from "../../../sanity/lib/types";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

function serviceRef(serviceId?: string) {
  return serviceId
    ? { _type: "reference" as const, _ref: serviceId }
    : undefined;
}

/* ------------------------- Devis ------------------------- */
export async function submitDevis(
  raw: unknown,
): Promise<ActionResult> {
  const parsed = devisSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "error" };
  const data = parsed.data;

  if (data.company) return { ok: true, code: "successDevis" }; // piège anti-bot

  const ip = await clientIp();
  if (!rateLimit(`devis:${ip}`, { limit: 3, windowMs: 60_000 }).ok) {
    return { ok: false, code: "rateLimited" };
  }
  if (!(await verifyCaptcha(data.captchaToken))) {
    return { ok: false, code: "captchaRequired" };
  }

  await createSanityDocument({
    _type: "demandeDevis",
    name: data.name,
    email: data.email,
    phone: data.phone,
    service: serviceRef(data.serviceId),
    description: data.description,
    status: "nouveau",
    createdAt: new Date().toISOString(),
  });

  await sendEmail({
    subject: `Nouvelle demande de devis — ${data.name}`,
    html: emailTemplate("Nouvelle demande de devis", [
      ["Nom", data.name],
      ["Email", data.email],
      ["Téléphone", data.phone],
      ["Service", data.serviceId],
      ["Besoin", data.description],
    ]),
    replyTo: data.email,
  });

  return { ok: true, code: "successDevis" };
}

/* ---------------------- Rendez-vous ---------------------- */
const WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

export async function submitRdv(raw: unknown): Promise<ActionResult> {
  const parsed = rdvSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "error" };
  const data = parsed.data;

  if (data.company) return { ok: true, code: "successRdv" };

  const ip = await clientIp();
  if (!rateLimit(`rdv:${ip}`, { limit: 3, windowMs: 60_000 }).ok) {
    return { ok: false, code: "rateLimited" };
  }
  if (!(await verifyCaptcha(data.captchaToken))) {
    return { ok: false, code: "captchaRequired" };
  }

  // Vérification de disponibilité (horaires Sanity)
  const settings = await sanityFetch<SiteSettings>(
    siteSettingsQuery,
    {},
    null,
  );
  const requested = new Date(`${data.date}T${data.time}`);
  if (Number.isNaN(requested.getTime())) {
    return { ok: false, code: "error" };
  }
  const dayName = WEEKDAYS[requested.getDay()];
  const hours = settings?.openingHours?.find((h) => h.day === dayName);
  if (hours?.closed || !hours) {
    return { ok: false, code: "closedDay" };
  }
  if (hours.open && hours.close) {
    if (data.time < hours.open || data.time > hours.close) {
      return { ok: false, code: "outsideHours" };
    }
  }

  await createSanityDocument({
    _type: "rendezVous",
    name: data.name,
    email: data.email,
    phone: data.phone,
    service: serviceRef(data.serviceId),
    requestedAt: requested.toISOString(),
    message: data.message,
    status: "nouveau",
    createdAt: new Date().toISOString(),
  });

  await sendEmail({
    subject: `Nouvelle demande de rendez-vous — ${data.name}`,
    html: emailTemplate("Nouvelle demande de rendez-vous", [
      ["Nom", data.name],
      ["Email", data.email],
      ["Téléphone", data.phone],
      ["Date", `${data.date} ${data.time}`],
      ["Message", data.message ?? "—"],
    ]),
    replyTo: data.email,
  });

  return { ok: true, code: "successRdv" };
}

/* ------------------------ Contact ------------------------ */
export async function submitContact(
  raw: unknown,
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "error" };
  const data = parsed.data;

  if (data.company) return { ok: true, code: "successContact" };

  const ip = await clientIp();
  if (!rateLimit(`contact:${ip}`, { limit: 5, windowMs: 60_000 }).ok) {
    return { ok: false, code: "rateLimited" };
  }
  if (!(await verifyCaptcha(data.captchaToken))) {
    return { ok: false, code: "captchaRequired" };
  }

  await sendEmail({
    subject: `Contact — ${data.subject}`,
    html: emailTemplate("Nouveau message de contact", [
      ["Nom", data.name],
      ["Email", data.email],
      ["Téléphone", data.phone || "—"],
      ["Sujet", data.subject],
      ["Message", data.message],
    ]),
    replyTo: data.email,
  });

  return { ok: true, code: "successContact" };
}
