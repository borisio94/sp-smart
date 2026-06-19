import type { DocumentType, MaintenanceReportData } from "./types";

/**
 * Modèles professionnels pré-remplis du module Billing.
 *
 * Objectif : ne jamais partir d'une page blanche. Chaque type de document
 * dispose d'une structure type (objet, conditions de paiement, délais/garantie)
 * que l'utilisateur insère d'un clic puis ajuste. Aucun montant ni donnée
 * client ici : uniquement la trame rédactionnelle.
 */

// ───────────── Documents commerciaux ─────────────
export interface DocumentTemplate {
  subject?: string;
  payment_terms?: string;
  delivery_terms?: string;
  /** Affiche l'encadré « Conditions particulières » sur le PDF. */
  include_conditions?: boolean;
}

/**
 * Trame par type de document standard. « autre » et « rapport_maintenance »
 * n'utilisent pas cette table (le rapport a son propre squelette ci-dessous).
 */
export const DOCUMENT_TEMPLATES: Partial<Record<DocumentType, DocumentTemplate>> = {
  devis: {
    subject: "Étude et proposition chiffrée pour…",
    payment_terms:
      "Acompte de 50 % à la commande, solde à la livraison.\n" +
      "Devis gratuit et sans engagement.\n" +
      "Offre valable 30 jours à compter de la date d'émission.",
    delivery_terms:
      "Délai d'exécution : à convenir après acceptation du devis.\n" +
      "Garantie : 12 mois pièces et main d'œuvre sur l'installation.",
    include_conditions: true,
  },
  proforma: {
    subject: "Facture proforma pour…",
    payment_terms:
      "Facture proforma — ne tient pas lieu de facture définitive.\n" +
      "Règlement à réception de la facture définitive.\n" +
      "Offre valable 30 jours.",
    delivery_terms:
      "Délai de livraison : à convenir.\n" +
      "Marchandise disponible sous réserve de stock au moment de la commande.",
    include_conditions: true,
  },
  bon_commande: {
    subject: "Commande de matériel / fournitures auprès de…",
    payment_terms:
      "Règlement selon les conditions convenues avec le fournisseur.\n" +
      "Merci de confirmer la disponibilité, le prix et le délai de livraison.",
    delivery_terms:
      "Livraison à l'adresse indiquée par SP Smart Sarl.\n" +
      "Bon pour accord — la signature vaut engagement ferme de commande.",
    include_conditions: true,
  },
  facture: {
    subject: "Facture relative à…",
    payment_terms:
      "Règlement à réception de la facture.\n" +
      "Moyens acceptés : espèces, virement, Mobile Money (MTN / Orange).\n" +
      "Tout retard de paiement pourra entraîner des pénalités.",
    delivery_terms:
      "Prestations et fournitures livrées conformément au devis accepté.\n" +
      "Garantie : 12 mois sur l'installation.",
    include_conditions: true,
  },
  recu: {
    subject: "Reçu de paiement pour…",
    payment_terms:
      "Le présent reçu atteste du paiement mentionné ci-dessus.\n" +
      "À conserver comme justificatif.",
    delivery_terms: "",
    include_conditions: true,
  },
};

// ───────────── Rapport de maintenance ─────────────
/** Rapport vierge (édition d'un rapport existant ou état initial). */
export function emptyReport(): MaintenanceReportData {
  return {
    intervention_type: "preventive",
    site: "",
    intervention_date: "",
    start_time: "",
    end_time: "",
    technicians: "",
    equipments: [],
    request: "",
    diagnosis: "",
    operations: [],
    parts: [],
    tests: "",
    conformity: "",
    observations: "",
    final_state: "",
    next_maintenance: "",
  };
}

/**
 * Structure professionnelle pré-remplie d'un rapport de maintenance : trame
 * rédactionnelle dans les zones de texte et une première ligne dans chaque
 * tableau, pour guider la rédaction (SP Smart — sécurité & électricité).
 */
export function reportSkeleton(): MaintenanceReportData {
  return {
    intervention_type: "preventive",
    site: "",
    intervention_date: "",
    start_time: "",
    end_time: "",
    technicians: "",
    equipments: [{ designation: "", brand_model: "", serial: "", location: "" }],
    request: "",
    diagnosis:
      "État constaté à l'arrivée :\n" +
      "Anomalies / pannes identifiées :\n" +
      "Causes probables :",
    operations: [{ description: "", status: "Réalisée", duration: "" }],
    parts: [{ designation: "", quantity: 1 }],
    tests:
      "Tests effectués et résultats :\n" +
      "Mesures relevées (tension, courant, isolement…) :\n" +
      "Conformité :",
    conformity: "Conforme",
    observations:
      "Points de vigilance :\n" +
      "Travaux complémentaires recommandés :",
    final_state: "Opérationnel",
    next_maintenance: "",
  };
}

/** Indique si un rapport est encore « vierge » (aucune saisie utilisateur). */
export function isReportEmpty(r: MaintenanceReportData | null | undefined): boolean {
  if (!r) return true;
  const texts = [
    r.site,
    r.intervention_date,
    r.start_time,
    r.end_time,
    r.technicians,
    r.request,
    r.diagnosis,
    r.tests,
    r.observations,
    r.next_maintenance,
  ];
  const hasText = texts.some((v) => (v ?? "").trim() !== "");
  const hasRows =
    (r.equipments?.length ?? 0) > 0 ||
    (r.operations?.length ?? 0) > 0 ||
    (r.parts?.length ?? 0) > 0;
  return !hasText && !hasRows;
}

/** Libellés des natures d'intervention (ordre d'affichage du sélecteur). */
export const INTERVENTION_TYPE_LABELS: Record<
  MaintenanceReportData["intervention_type"],
  string
> = {
  preventive: "Maintenance préventive",
  corrective: "Maintenance corrective",
  curative: "Maintenance curative",
  installation: "Installation / mise en service",
  controle: "Contrôle / vérification",
};
