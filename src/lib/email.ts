import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "";
const fromEmail = process.env.RESEND_FROM_EMAIL || "";
const toEmail = process.env.RESEND_TO_EMAIL || "";

/** Vrai si l'envoi d'email est réellement configuré. */
export const canSendEmail =
  Boolean(apiKey) && apiKey !== "A_REMPLIR" && Boolean(fromEmail);

const resend = canSendEmail ? new Resend(apiKey) : null;

type Mail = {
  subject: string;
  html: string;
  /** Destinataire ; par défaut l'adresse admin (RESEND_TO_EMAIL). */
  to?: string;
  replyTo?: string;
};

/**
 * Envoie un email de façon tolérante : si Resend n'est pas configuré
 * ou échoue, on log et on renvoie false sans faire planter le formulaire.
 */
export async function sendEmail({
  subject,
  html,
  to,
  replyTo,
}: Mail): Promise<boolean> {
  const recipient = to || toEmail;
  if (!resend || !recipient) {
    console.warn(
      `[Email] Envoi non configuré. Email non envoyé : « ${subject} »`,
    );
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: recipient,
      subject,
      html,
      replyTo,
    });
    if (error) {
      console.error("[Email] Erreur Resend :", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Email] Échec de l'envoi :", error);
    return false;
  }
}

/** Petit gabarit HTML simple et lisible. */
export function emailTemplate(title: string, rows: [string, string][]): string {
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:bold;color:#0a1f44">${k}</td><td style="padding:6px 12px">${v}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
    <h2 style="color:#0052CC">${title}</h2>
    <table style="border-collapse:collapse;width:100%">${body}</table>
    <p style="color:#888;font-size:12px;margin-top:24px">SP Smart Sarl — message automatique</p>
  </div>`;
}
