import type { DocumentStatus } from "./types";

/**
 * Machine d'états des documents (cf. BILLING_BRIEF.md).
 *
 *   brouillon → envoye → confirme → en_cours → termine
 *                 ↓         ↓          ↓
 *               annule    annule     annule
 *
 * « en_cours » marque le chantier en pleine réalisation : le marché est
 * confirmé, les travaux ont démarré, la livraison n'est pas faite. Le passage
 * par ce statut reste FACULTATIF — un petit travail peut aller de « confirme »
 * directement à « termine ».
 *
 * Transitions autorisées :
 *  - brouillon → envoye, annule
 *  - envoye    → confirme, annule, brouillon (retour édition)
 *  - confirme  → en_cours, termine, annule
 *  - en_cours  → termine, confirme (correction), annule
 *  - termine   → confirme (correction exceptionnelle, confirmation requise)
 *  - annule    → brouillon (ré-ouverture)
 */
export const STATUS_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  brouillon: ["envoye", "annule"],
  envoye: ["confirme", "annule", "brouillon"],
  confirme: ["en_cours", "termine", "annule"],
  en_cours: ["termine", "confirme", "annule"],
  termine: ["confirme"],
  annule: ["brouillon"],
};

/** Transitions exigeant une confirmation explicite (action sensible). */
export const CONFIRM_REQUIRED: ReadonlyArray<`${DocumentStatus}->${DocumentStatus}`> = [
  "termine->confirme", // correction d'un document déjà terminé
  "confirme->annule", // annulation d'un document confirmé
  "envoye->annule", // annulation d'un document envoyé
  "en_cours->annule", // annulation d'un chantier déjà démarré
  "en_cours->confirme", // retour en arrière sur un chantier démarré
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
  if (from === "en_cours" && to === "confirme") return "action_back_to_confirmed";
  // Cas génériques (selon la cible)
  switch (to) {
    case "envoye":
      return "action_send";
    case "confirme":
      return "action_confirm";
    case "en_cours":
      return "action_start";
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
):
  | "sent_at"
  | "confirmed_at"
  | "started_at"
  | "completed_at"
  | "cancelled_at"
  | null {
  switch (to) {
    case "envoye":
      return "sent_at";
    case "confirme":
      return "confirmed_at";
    case "en_cours":
      return "started_at";
    case "termine":
      return "completed_at";
    case "annule":
      return "cancelled_at";
    default:
      return null;
  }
}

/**
 * Ordre du cycle de vie, hors « annule » qui en sort. Sert à reconnaître un
 * RETOUR EN ARRIÈRE, pour lequel les jalons déjà posés n'ont plus lieu d'être.
 */
const STATUS_ORDER: DocumentStatus[] = [
  "brouillon",
  "envoye",
  "confirme",
  "en_cours",
  "termine",
];

/** Position dans le cycle. « annule » se place au-delà de tout : on n'en revient qu'en arrière. */
function cycleIndex(status: DocumentStatus): number {
  return status === "annule" ? STATUS_ORDER.length : STATUS_ORDER.indexOf(status);
}

/**
 * Colonnes d'horodatage à EFFACER lors d'une transition.
 *
 * Reculer dans le cycle — annuler un démarrage de chantier, rouvrir un
 * document terminé — doit remettre le compteur à zéro : garder un
 * `started_at` sur un document repassé en « confirmé » laisserait une trace
 * fausse dans le suivi, et le prochain démarrage ne se daterait pas
 * correctement. On efface donc les jalons de tous les statuts postérieurs à
 * la cible.
 *
 * Avancer n'efface jamais rien.
 */
export function clearedTimestamps(
  from: DocumentStatus,
  to: DocumentStatus,
): string[] {
  const fromIdx = cycleIndex(from);
  const toIdx = cycleIndex(to);
  if (toIdx < 0 || fromIdx < 0 || toIdx >= fromIdx) return [];

  const cleared = STATUS_ORDER.slice(toIdx + 1)
    .map((s) => timestampField(s))
    .filter((f): f is Exclude<ReturnType<typeof timestampField>, null> => f !== null);

  // Rouvrir un document annulé lève aussi la date d'annulation.
  if (from === "annule") cleared.push("cancelled_at");

  return cleared;
}
