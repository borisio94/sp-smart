import type { DocumentStatus } from "./types";

/**
 * Machine d'états des documents (cf. BILLING_BRIEF.md).
 *
 *   brouillon → envoye → confirme → termine
 *                 ↓         ↓
 *               annule    annule
 *
 * Transitions autorisées :
 *  - brouillon → envoye, annule
 *  - envoye    → confirme, annule, brouillon (retour édition)
 *  - confirme  → termine, annule
 *  - termine   → confirme (correction exceptionnelle, confirmation requise)
 *  - annule    → brouillon (ré-ouverture)
 */
export const STATUS_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  brouillon: ["envoye", "annule"],
  envoye: ["confirme", "annule", "brouillon"],
  confirme: ["termine", "annule"],
  termine: ["confirme"],
  annule: ["brouillon"],
};

/** Transitions exigeant une confirmation explicite (action sensible). */
export const CONFIRM_REQUIRED: ReadonlyArray<`${DocumentStatus}->${DocumentStatus}`> = [
  "termine->confirme", // correction d'un document déjà terminé
  "confirme->annule", // annulation d'un document confirmé
  "envoye->annule", // annulation d'un document envoyé
];

/** Renvoie les statuts atteignables depuis le statut courant. */
export function allowedTransitions(from: DocumentStatus): DocumentStatus[] {
  return STATUS_TRANSITIONS[from] ?? [];
}

/** Vérifie qu'une transition est autorisée. */
export function canTransition(
  from: DocumentStatus,
  to: DocumentStatus,
): boolean {
  return allowedTransitions(from).includes(to);
}

/** Indique si la transition demande une confirmation utilisateur. */
export function requiresConfirmation(
  from: DocumentStatus,
  to: DocumentStatus,
): boolean {
  return CONFIRM_REQUIRED.includes(`${from}->${to}`);
}

/**
 * Clé i18n du libellé d'action pour une transition donnée
 * (namespace Admin.status.action_*). Permet des verbes adaptés
 * plutôt que le simple nom du statut cible.
 */
export function transitionActionKey(
  from: DocumentStatus,
  to: DocumentStatus,
): string {
  // Cas spécifiques avec un verbe dédié
  if (from === "annule" && to === "brouillon") return "action_reopen";
  if (from === "envoye" && to === "brouillon") return "action_back_to_draft";
  if (from === "termine" && to === "confirme") return "action_correct";
  // Cas génériques (selon la cible)
  switch (to) {
    case "envoye":
      return "action_send";
    case "confirme":
      return "action_confirm";
    case "termine":
      return "action_complete";
    case "annule":
      return "action_cancel";
    default:
      return "action_send";
  }
}

/** Colonne timestamp à renseigner lors d'un passage vers ce statut (ou null). */
export function timestampField(
  to: DocumentStatus,
): "sent_at" | "confirmed_at" | "completed_at" | "cancelled_at" | null {
  switch (to) {
    case "envoye":
      return "sent_at";
    case "confirme":
      return "confirmed_at";
    case "termine":
      return "completed_at";
    case "annule":
      return "cancelled_at";
    default:
      return null;
  }
}
