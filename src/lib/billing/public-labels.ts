/**
 * Libellés de la page publique d'un document partagé par lien privé
 * (/facture-privee/[token]).
 *
 * Cette route vit dans le groupe `(public)`, hors du routage localisé
 * `[locale]` : elle n'a donc pas de contexte next-intl (cf. layout racine
 * `lang="fr"`). Les libellés sont regroupés ici plutôt que dispersés dans le
 * JSX, pour rester au même endroit et pouvoir être traduits le jour où cette
 * page rejoindra le routage i18n.
 */
export const PUBLIC_DOC_LABELS = {
  unavailableTitle: "Document indisponible",
  unavailableText: "Ce lien n'est plus valide ou le document a été retiré.",
  recipient: "Destinataire",
  date: "Date",
  subject: "Objet",
  designation: "Désignation",
  quantity: "Qté",
  unitPrice: "P.U.",
  total: "Total",
  netToPay: "NET À PAYER",
  paymentTerms: "Modalités de paiement",
  marketTitle: "Suivi du marché",
  marketTotal: "Montant total du marché",
  marketSettled: "Déjà réglé",
  marketRemaining: "Reste à payer",
  marketAdvances: "Acomptes versés",
  marketAdvance: (index: number, date: string) => `Acompte N° ${index} du ${date}`,
  downloadPdf: "Télécharger en PDF",
  issuedBy: (org: string) => `Document émis par ${org}.`,

  // ── Bloc de signature ──
  signTitle: "Bon pour accord",
  signIntro:
    "Signez ci-dessous pour marquer votre accord sur ce document. Votre signature sera apposée sur le PDF.",
  signName: "Votre nom et prénom",
  signEmail: "Votre email (facultatif — pour recevoir l'exemplaire signé)",
  signDrawLabel: "Votre signature",
  signPlaceholder: "Signez ici avec le doigt ou la souris",
  signClear: "Effacer",
  signAccept: "J'accepte ce document et ses conditions.",
  signSubmit: "Signer le document",
  signPending: "Signature en cours…",
  signEmptyError: "Veuillez tracer votre signature.",
  signInvalid: "Veuillez corriger les champs signalés ci-dessus.",
  signSuccess: "Merci, votre signature a bien été enregistrée.",
  signGenericError: "La signature n'a pas pu être enregistrée. Réessayez.",
  signedBadge: (name: string, date: string) => `Signé par ${name} le ${date}`,
  signedNotice:
    "Ce document a été accepté et signé électroniquement. La signature figure sur le PDF.",
  signLegal:
    "Votre nom, la date, votre adresse IP et une empreinte du document sont enregistrés comme preuve de votre accord.",
} as const;
