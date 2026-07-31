import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

import type {
  BillingDocument,
  DocumentLine,
  Organization,
  Client,
} from "../types";
import { DOCUMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS, factureTitleLabel } from "../format";
import { deductionsTotal, groupSections, hasNamedSections } from "../compute";
import { shortHash } from "../signature";
import {
  advancePosition,
  advancePositionAt,
  isAdvanceOnMarket,
  paidAdvances,
  shouldShowSettlement,
  type Settlement,
} from "../settlement";
import { amountToWords } from "../amountToWords";
import {
  PDF_COLORS,
  bandColor,
  pdfMoney,
  pdfNumber,
  pdfPercent,
  pdfDate,
  cleanField,
} from "./theme";

/**
 * Données nécessaires au rendu d'un document PDF (mise en page fidèle au
 * modèle Word SP Smart « devis.docx »). Toutes les valeurs proviennent de la
 * base (organisation + document) → fichier 100% paramétrable.
 */
export interface DocumentPDFData {
  document: BillingDocument;
  lines: DocumentLine[];
  organization: Organization;
  client: Client | null;
  categoryName: string | null;
  customTypeName: string | null; // nom du type perso (bandeau), si applicable
  logoData: string | null;
  watermarkData: string | null;
  signatureData: string | null;
  stampData: string | null;
  /** Tracé signé par le client depuis son lien privé (bucket « signatures »). */
  clientSignatureData: string | null;
  /**
   * Suivi du marché rattaché (devis / proforma) : permet d'afficher le reste à
   * payer sur l'ensemble, qu'une facture d'acompte ne porte pas à elle seule.
   * null quand le document n'est rattaché à aucune cotation.
   */
  settlement?: Settlement | null;
  /**
   * Acompte à imprimer sur une facture d'acompte (rang 1..n dans la séquence
   * des versements du marché). Une même facture porte tous les acomptes du
   * marché : ce paramètre dit lequel elle constate. Absent → le plus récent.
   */
  advanceRank?: number | null;
}

// Conversion millimètres → points PDF (1 pt = 1/72 pouce ; 1 pouce = 25,4 mm).
const MM_TO_PT = 72 / 25.4;
// Tailles physiques réelles des images apposées, pour un rendu fidèle au papier.
// On ne contraint que la largeur (le ratio intrinsèque de l'image est préservé).
const SIGNATURE_WIDTH = 55 * MM_TO_PT; // signature manuscrite ≈ 55 mm de large
const STAMP_SIZE = 40 * MM_TO_PT; // cachet rond ≈ 40 mm de diamètre

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 9,
    color: PDF_COLORS.text,
    paddingTop: 2,
    paddingBottom: 78, // place pour le pied de page fixe (3 lignes ≈ 62 pt + marge)
  },
  // ── En-tête : logo + nom + slogan, puis bande bleue ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 0,
    gap: 12,
  },
  // Logo agrandi de 30 % (96 → 125px). Les marges verticales négatives le font
  // déborder sans augmenter la hauteur de l'en-tête (contribution nette ~95px).
  logoImg: {
    width: 125,
    height: 125,
    objectFit: "contain",
    marginTop: -15,
    marginBottom: -15,
  },
  logoFallbackBox: {
    width: 125,
    height: 125,
    marginTop: -15,
    marginBottom: -15,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: { fontSize: 44, fontFamily: "Times-Bold", color: PDF_COLORS.corporate },
  headerTextWrap: { flex: 1, alignItems: "center", paddingRight: 125 },
  orgName: { fontSize: 21, fontFamily: "Times-Bold", color: PDF_COLORS.corporate },
  orgSlogan: {
    fontSize: 10.5,
    color: PDF_COLORS.text,
    textAlign: "center",
    marginTop: 4,
  },
  // Fin filet bleu clair sous l'en-tête (comme la maquette voulue).
  headerBand: { height: 2, marginTop: 2 },

  // ── Date ──
  dateLine: {
    paddingHorizontal: 28,
    marginTop: 12,
    fontSize: 10.5,
    textAlign: "right",
    color: PDF_COLORS.gray475,
  },
  // Ligne « Mode de règlement » sous la date (factures).
  payMethodLine: {
    paddingHorizontal: 28,
    marginTop: 2,
    fontSize: 10.5,
    textAlign: "right",
    color: PDF_COLORS.gray475,
  },

  // ── Bloc client ──
  clientBlock: { paddingHorizontal: 28, marginTop: 8 },
  clientRow: { flexDirection: "row", marginTop: 2 },
  clientLabel: { width: 78, fontSize: 10.5, fontFamily: "Times-Bold", color: PDF_COLORS.text },
  clientValue: { flex: 1, fontSize: 10.5, color: PDF_COLORS.text },

  // ── Bandeau titre (type à gauche, numéro à droite) ──
  band: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 28,
    marginTop: 16,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 3,
    borderWidth: 1,
  },
  bandTitle: {
    color: PDF_COLORS.corporate,
    fontSize: 14,
    fontFamily: "Times-Bold",
    letterSpacing: 1.5,
  },
  bandNumber: {
    color: PDF_COLORS.corporate,
    fontSize: 14,
    fontFamily: "Times-Bold",
    letterSpacing: 0.5,
  },

  // ── Objet : ligne sous le bandeau-titre, alignée à gauche ──
  subjectRow: { marginHorizontal: 28, marginTop: 10 },
  subjectText: { fontSize: 10.5, textAlign: "left", color: PDF_COLORS.text },
  subjectLabel: { fontFamily: "Times-Bold" },

  // ── Tableau ──
  table: { marginHorizontal: 28, marginTop: 14 },
  tHead: { flexDirection: "row" },
  tHeadCell: {
    color: PDF_COLORS.white,
    fontSize: 10.5,
    fontFamily: "Times-Bold",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: PDF_COLORS.hairline },
  tCell: { fontSize: 10.5, paddingVertical: 5.5, paddingHorizontal: 6, color: PDF_COLORS.bodyBlack },
  // Ligne forfaitaire (montant direct, sans qté/PU) : mise en évidence en gras.
  tCellFlat: { fontFamily: "Times-Bold" },
  // Ligne de synthèse qui clôt le tableau (reste à payer d'un acompte) :
  // bandeau vert plein, texte blanc — même traitement que le grand total.
  tCellStrong: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    color: PDF_COLORS.white,
    paddingVertical: 7,
  },
  // Bande de titre de section (compartiment) et ligne de sous-total.
  sectionBandRow: {
    backgroundColor: PDF_COLORS.bandBg,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.hairline,
  },
  sectionBandText: {
    fontSize: 10.5,
    fontFamily: "Times-Bold",
    color: PDF_COLORS.corporate,
    paddingVertical: 5,
    paddingHorizontal: 6,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtotalRow: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.tableAltRow,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.hairline,
  },
  subtotalLabel: {
    flex: 1,
    fontSize: 10.5,
    fontFamily: "Times-Bold",
    paddingVertical: 5,
    paddingHorizontal: 6,
    color: PDF_COLORS.text,
  },
  subtotalValue: {
    width: 84,
    fontSize: 10.5,
    fontFamily: "Times-Bold",
    paddingVertical: 5,
    paddingHorizontal: 6,
    textAlign: "right",
    color: PDF_COLORS.bodyBlack,
  },
  colDesignation: { flex: 1 },
  colUnit: { width: 58 },
  colQty: { width: 38, textAlign: "center" },
  colPrice: { width: 78, textAlign: "right" },
  colTotal: { width: 84, textAlign: "right" },
  // Tableau à deux colonnes : la place libérée par Unité/Qté/PU profite au
  // montant, dont l'en-tête « Montant (FCFA) » passerait sinon à la ligne.
  colTotalWide: { width: 120, textAlign: "right" },

  // ── Totaux : bloc étroit aligné à droite (libellé | [taux] | valeur) ──
  totalsWrap: { marginHorizontal: 28, marginTop: 2, alignItems: "flex-end" },
  totalsTable: { width: 260 },
  totalRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.hairline,
  },
  totalLabelCell: {
    flex: 1,
    fontSize: 10.5,
    fontFamily: "Times-Bold",
    paddingVertical: 5,
    paddingHorizontal: 6,
    color: PDF_COLORS.text,
  },
  totalRateCell: {
    width: 60,
    fontSize: 10.5,
    paddingVertical: 5,
    paddingHorizontal: 6,
    textAlign: "center",
    color: PDF_COLORS.bodyBlack,
  },
  totalValueCell: {
    width: 90,
    fontSize: 10.5,
    fontFamily: "Times-Bold",
    paddingVertical: 5,
    paddingHorizontal: 6,
    textAlign: "right",
    color: PDF_COLORS.bodyBlack,
  },
  grandRow: { flexDirection: "row", marginTop: 2 },
  grandLabelCell: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Times-Bold",
    paddingVertical: 7,
    paddingHorizontal: 6,
    color: PDF_COLORS.white,
  },
  grandValueCell: {
    width: 90,
    fontSize: 12,
    fontFamily: "Times-Bold",
    paddingVertical: 7,
    paddingHorizontal: 6,
    textAlign: "right",
    color: PDF_COLORS.white,
  },

  // ── Récapitulatif facture (acompte / déduction des acomptes) ──
  recapBox: {
    marginHorizontal: 28,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 3,
    overflow: "hidden",
  },
  recapHeader: {
    backgroundColor: PDF_COLORS.bandBg,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  recapHeaderText: { fontSize: 10.5, fontFamily: "Times-Bold", letterSpacing: 0.8 },
  recapBody: { backgroundColor: PDF_COLORS.white },
  recapRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.hairline,
  },
  recapLabel: { flex: 1, fontSize: 10.5, color: PDF_COLORS.text, paddingRight: 8 },
  recapValue: {
    width: 120,
    textAlign: "right",
    fontSize: 10.5,
    color: PDF_COLORS.bodyBlack,
  },
  recapStrongRow: { borderBottomWidth: 0, paddingVertical: 7 },
  recapStrongText: { fontFamily: "Times-Bold", color: PDF_COLORS.white, fontSize: 11.5 },

  // ── Free text ──
  freeText: { marginHorizontal: 28, marginTop: 14, fontSize: 10.5, lineHeight: 1.5 },

  // ── Montant en lettres ──
  words: {
    marginHorizontal: 28,
    marginTop: 16,
    fontSize: 10.5,
    color: PDF_COLORS.text,
  },
  // Montant en gras, en minuscules (pas de mise en majuscules).
  wordsStrong: { fontFamily: "Times-Bold" },

  // ── Conditions : encadré titré (bandeau couleur du type + corps) ──
  conditionsBox: {
    marginHorizontal: 28,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 3,
    overflow: "hidden",
  },
  conditionsHeader: {
    backgroundColor: PDF_COLORS.bandBg,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  conditionsHeaderText: { fontSize: 10.5, fontFamily: "Times-Bold", letterSpacing: 0.8 },
  conditionsBody: { paddingVertical: 8, paddingHorizontal: 10, backgroundColor: PDF_COLORS.white },
  condItem: { fontSize: 10.5, color: PDF_COLORS.text, lineHeight: 1.45, marginBottom: 2.5 },

  // ── Signatures ──
  signatures: {
    flexDirection: "row",
    marginHorizontal: 28,
    marginTop: 20,
    justifyContent: "space-between",
  },
  signBox: { width: 200, alignItems: "center" },
  signLabel: { fontSize: 10.5, fontFamily: "Times-Bold", color: PDF_COLORS.text },
  // Zone d'apposition (signature + cachet superposés) : hauteur = diamètre du
  // cachet, qui est l'élément le plus grand. Position relative pour ancrer les
  // deux images en absolu et créer le chevauchement réaliste.
  signStack: {
    marginTop: 6,
    width: 200,
    height: STAMP_SIZE,
    position: "relative",
  },
  // Signature placée vers le bas-gauche de la zone (la main signe puis on tamponne).
  signImageOverlap: {
    position: "absolute",
    top: 36,
    left: 2,
    width: SIGNATURE_WIDTH,
    objectFit: "contain",
  },
  // Cachet apposé à droite, chevauchant partiellement la signature.
  stampImageOverlap: {
    position: "absolute",
    top: 0,
    left: 80,
    width: STAMP_SIZE,
    height: STAMP_SIZE,
    objectFit: "contain",
  },
  // Signature seule : taille réelle, centrée dans le bloc.
  signImageAlone: { marginTop: 6, width: SIGNATURE_WIDTH, objectFit: "contain" },
  // Cachet seul : taille réelle, centré dans le bloc.
  stampImageAlone: {
    marginTop: 6,
    width: STAMP_SIZE,
    height: STAMP_SIZE,
    objectFit: "contain",
  },
  signSpacer: { height: 56 },
  // ── Signature électronique du client (apposée depuis le lien privé) ──
  clientSignImage: { marginTop: 6, width: SIGNATURE_WIDTH, objectFit: "contain" },
  clientSignMention: {
    marginTop: 2,
    fontSize: 7.5,
    textAlign: "center",
    color: PDF_COLORS.gray475,
  },

  // ── Pied de page (3 colonnes) ──
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PDF_COLORS.footerBg,
    paddingHorizontal: 24,
    paddingVertical: 9,
  },
  footerRule: { height: 3, marginBottom: 6 },
  footerCols: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  footerCol: { flex: 1 },
  footerLine: { fontSize: 8.5, color: PDF_COLORS.gray475, marginTop: 1.5 },

  // ── Filigrane : logo entreprise 500pt carré centré, opacité 0.06 ──
  watermark: {
    position: "absolute",
    top: 171,
    left: 47.5,
    width: 500,
    height: 500,
    opacity: 0.06,
    objectFit: "contain",
  },
  watermarkFallback: {
    position: "absolute",
    top: 171,
    left: 47.5,
    width: 500,
    height: 500,
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkFallbackText: {
    fontSize: 220,
    fontFamily: "Times-Bold",
    color: PDF_COLORS.corporate,
    opacity: 0.06,
  },
});

/** Découpe les modalités/délais en items (par ligne ou par « ; »). */
function toItems(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Une ligne du tableau, cellules déjà formatées pour l'impression.
 *
 * Cette indirection existe pour la facture d'acompte, dont le tableau n'est pas
 * la copie des lignes enregistrées mais une reconstitution (reste à verser,
 * acompte en négatif) : le même balisage imprime les deux cas.
 */
interface TableRowView {
  key: string;
  designation: string;
  /** Vide sur une ligne forfaitaire (aucune unité à annoncer). */
  unit: string;
  qty: string;
  price: string;
  total: string;
  /** Ligne forfaitaire : un montant, pas une quantité × un prix unitaire. */
  flat: boolean;
  /**
   * Ligne de synthèse qui clôt le tableau (bandeau vert, texte blanc) : le
   * reste à payer d'une facture d'acompte, qui tient lieu de total.
   */
  strong?: boolean;
}

/** Vue d'impression d'une ligne enregistrée. */
function toRowView(line: DocumentLine): TableRowView {
  const flat = Boolean(line.is_amount_only);
  return {
    key: line.id,
    designation: line.designation,
    unit: flat ? "" : cleanField(line.unit) ?? "",
    qty: flat ? "" : pdfNumber(line.quantity),
    price: flat ? "" : pdfNumber(line.unit_price),
    total: pdfNumber(line.line_total),
    flat,
  };
}

/**
 * Retire le préfixe « Acompte sur : » d'une désignation (posé à la création
 * d'une facture d'acompte, cf. `advanceDesignation` côté serveur). Le tableau
 * en trois lignes annonce l'acompte sur sa propre ligne : le préfixe ferait
 * doublon devant l'objet.
 */
function stripAdvancePrefix(value: string): string {
  return value.replace(/^\s*acompte\s+sur\s*:\s*/i, "").trim();
}

/**
 * Ligne du récapitulatif de règlement d'une facture.
 *  - `strong` : ligne de synthèse (solde / net à payer), bandeau vert plein.
 *  - `negative` : montant déduit (affiché en rouge).
 */
function RecapRow({
  label,
  value,
  strong,
  negative,
}: {
  label: string;
  value: string;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <View
      style={[
        styles.recapRow,
        strong
          ? { ...styles.recapStrongRow, backgroundColor: PDF_COLORS.totalGreen }
          : {},
      ]}
    >
      <Text style={[styles.recapLabel, strong ? styles.recapStrongText : {}]}>
        {label}
      </Text>
      <Text
        style={[
          styles.recapValue,
          strong
            ? styles.recapStrongText
            : negative
              ? { color: PDF_COLORS.redDiscount }
              : {},
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/** Composant principal du document PDF (mise en page « devis.docx »). */
export function DocumentPDF(data: DocumentPDFData) {
  const { document: doc, lines, organization: org, client } = data;
  const band = bandColor(doc.type);

  // Sections (« compartiments ») : regroupement des lignes + sous-totaux.
  const sectionGroups = groupSections(lines);
  const sectioned = hasNamedSections(lines);

  // ── Facture : deux dispositions (acompte / définitive) ──
  const isFacture = doc.type === "facture";
  const inv = isFacture ? doc.invoice_data : null;
  // Une facture « historique » saisie sans invoice_data retombe sur la mise en
  // page générique (pas de récapitulatif ni de libellés spécifiques).
  const hasInvoice = isFacture && inv !== null;
  const factureKind = inv?.kind ?? null;
  const invDeductions = inv?.deductions ?? [];
  const invDeducted = deductionsTotal(invDeductions);
  const invNet = Math.max(0, doc.total_amount - invDeducted); // net à payer (solde final)
  const invSoldeRestant = Math.max(0, doc.total_amount - (inv?.advance_amount ?? 0));
  // Taxe : les factures affichent « TVA », les autres documents « IR ».
  const taxLabel = isFacture ? "TVA" : "IR";

  // Libellé du document : pour un type « autre », on utilise l'intitulé libre
  // saisi dans le champ « Titre » ; une facture précise sa nature ; sinon le
  // libellé standard du type.
  const docLabel = data.customTypeName?.trim()
    ? data.customTypeName.trim()
    : doc.type === "autre"
      ? doc.title?.trim() || DOCUMENT_TYPE_LABELS.autre
      : isFacture
        ? factureTitleLabel(factureKind)
        : DOCUMENT_TYPE_LABELS[doc.type];

  // Le récapitulatif de règlement (acompte versé / déduction des acomptes) ne
  // s'affiche que si des données le justifient. La saisie simplifiée génère une
  // facture à ligne unique sans récapitulatif ; il reste disponible dès qu'un
  // acompte versé ou des acomptes à déduire sont renseignés.
  const showAcompteRecap =
    hasInvoice && factureKind === "acompte" && (inv?.advance_amount ?? 0) > 0;
  const showDeductionRecap =
    hasInvoice && factureKind === "definitive" && invDeductions.length > 0;
  const showRecap = showAcompteRecap || showDeductionRecap;

  // Suivi du marché : une facture rattachée à une cotation ne porte souvent
  // qu'une part de l'ensemble (acompte). On rappelle alors le montant du
  // marché et ce qui reste dû dessus — calculé, jamais saisi.
  const settlement = data.settlement ?? null;
  const isReceipt = doc.type === "recu";
  const showMarketRecap =
    (isFacture || isReceipt) &&
    shouldShowSettlement(settlement, doc.total_amount);
  // Détail des acomptes encaissés (montant + date de versement) : les acomptes
  // suivants s'enregistrent en paiements sur la facture initiale, qui doit donc
  // les rappeler tous. À défaut de détail (lien privé), on s'en tient au total.
  const marketAdvances = paidAdvances(settlement);
  // La ligne « présente facture » n'a de sens que sur une facture ne couvrant
  // qu'une part du marché : au montant plein elle répéterait le marché, et sur
  // un reçu le montant est déjà compté dans « déjà encaissé ». Dès que les
  // versements sont détaillés, on la retire aussi : la colonne se lit alors
  // comme une soustraction (marché − acomptes = reste dû), et un montant non
  // déduit au milieu donnerait l'illusion d'un double compte.
  const showThisDocLine =
    isFacture &&
    settlement !== null &&
    settlement.marketTotal > doc.total_amount &&
    marketAdvances.length === 0;

  // ── Facture d'acompte rattachée à un marché : tableau en trois lignes ──
  // Une seule facture d'acompte porte tout le marché : chaque versement s'y
  // enregistre, et elle s'imprime pour l'acompte demandé — le plus récent par
  // défaut. Le tableau tient en deux colonnes (Désignation | Montant) et trois
  // lignes :
  //   1. l'objet du marché, au montant qui restait à verser avant ce versement ;
  //   2. l'acompte constaté, en négatif (« Acompte de 25 % sur le devis … ») ;
  //   3. le reste à payer après ce versement (bandeau vert, tient lieu de total).
  // Le montant en lettres est celui de cet acompte, c'est-à-dire le montant
  // porté en négatif. Sans marché rattaché il n'y a rien à situer : le document
  // garde sa ligne forfaitaire unique.
  //
  // Reconstitution à l'impression uniquement : la ligne enregistrée — et donc le
  // total du document, sur lequel s'adossent paiements et statistiques — reste
  // inchangée.
  const isAdvanceInvoice =
    hasInvoice &&
    factureKind === "acompte" &&
    doc.body_mode === "table" &&
    !sectioned &&
    // Factures historiques saisies avec un « acompte versé » : elles portent
    // déjà leur propre récapitulatif, bâti sur d'autres montants.
    !showAcompteRecap;
  // Acompte imprimé : celui demandé (rang borné à la séquence réelle), sinon le
  // plus récent — c'est lui que l'on veut voir en ouvrant la facture.
  const advanceIndex =
    isAdvanceInvoice && marketAdvances.length > 0
      ? Math.min(
          Math.max(1, data.advanceRank ?? marketAdvances.length),
          marketAdvances.length,
        ) - 1
      : -1;
  const printedAdvance = advanceIndex >= 0 ? marketAdvances[advanceIndex] : null;
  // Montant constaté : celui du versement imprimé ; à défaut d'encaissement,
  // ce que la facture réclame.
  const advanceAmount = printedAdvance ? printedAdvance.amount : doc.total_amount;
  const advanceLayout =
    isAdvanceInvoice &&
    advanceAmount > 0 &&
    isAdvanceOnMarket(settlement, advanceAmount);
  // Rang de l'acompte et montants qui l'encadrent : lus sur les versements dès
  // qu'il en existe, sur la séquence des factures émises sinon.
  const advance = printedAdvance
    ? advancePositionAt(settlement, advanceIndex + 1)
    : advancePosition(settlement, doc.id, advanceAmount);
  // Titre : une facture d'acompte annonce son rang dans la séquence du marché
  // (« N° 1 », « N° 2 »…). Sans lui, tous les acomptes d'un même chantier
  // porteraient rigoureusement le même intitulé.
  // Récapitulatif du règlement : il s'arrête lui aussi à l'acompte imprimé. Une
  // facture datée du 12/03 qui listerait les versements de mai et de juin dirait
  // ce que personne ne pouvait savoir ce jour-là.
  const recapAdvances =
    advanceLayout && printedAdvance
      ? marketAdvances.slice(0, advanceIndex + 1)
      : marketAdvances;
  const recapRemaining =
    advanceLayout && printedAdvance
      ? advance.remainingAfter
      : (settlement?.remaining ?? 0);

  const advanceRankSuffix =
    advanceLayout && advance.rank !== null ? ` N° ${advance.rank}` : "";
  const typeLabel = `${docLabel}${advanceRankSuffix}`.toUpperCase();
  // Date affichée : celle du versement constaté quand la facture s'imprime pour
  // un acompte précis — la pièce dit ce qui s'est passé ce jour-là.
  const displayDate =
    advanceLayout && printedAdvance ? printedAdvance.date : doc.issue_date;
  // Mode de règlement : celui du versement constaté, à défaut celui saisi sur la
  // facture. `payment_method` vaut "" quand non précisé ("" est falsy).
  const payMethodKey =
    (advanceLayout ? printedAdvance?.method : null) || inv?.payment_method || null;
  const payMethod = payMethodKey ? PAYMENT_METHOD_LABELS[payMethodKey] : null;
  // Part de l'acompte dans le marché : toujours recalculée, jamais saisie.
  const advancePercent =
    settlement && settlement.marketTotal > 0
      ? (advanceAmount * 100) / settlement.marketTotal
      : null;
  const advanceQuotationRef =
    settlement?.quotationNumber ?? cleanField(inv?.devis_ref);
  const advanceLineLabel = [
    "Acompte",
    advancePercent !== null ? `de ${pdfPercent(advancePercent)} %` : null,
    advanceQuotationRef ? `sur le devis ${advanceQuotationRef}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const advanceRows: TableRowView[] = [
    {
      key: "advance-object",
      // Objet du MARCHÉ (celui de la cotation rattachée) : la désignation de la
      // facture ne porte que la part facturée, elle ne dirait pas ce que le
      // chantier couvre en entier.
      designation:
        cleanField(settlement?.quotationSubject) ||
        stripAdvancePrefix(lines[0]?.designation ?? "") ||
        cleanField(doc.subject) ||
        cleanField(doc.title) ||
        "Prestation",
      unit: "",
      qty: "",
      price: "",
      total: pdfNumber(advance.remainingBefore),
      flat: false,
    },
    {
      key: "advance-paid",
      designation: advanceLineLabel,
      unit: "",
      qty: "",
      price: "",
      // Signe moins : l'acompte se retranche de ce qui restait à verser.
      total: `- ${pdfNumber(advanceAmount)}`,
      flat: false,
    },
    {
      key: "advance-remaining",
      // Clôture de la soustraction : ce qui reste dû après ce versement.
      designation: "Reste à payer",
      unit: "",
      qty: "",
      price: "",
      total: pdfNumber(advance.remainingAfter),
      flat: false,
      strong: true,
    },
  ];

  // Lignes imprimées dans un tableau non sectionné : celles du document, ou les
  // trois lignes reconstituées d'une facture d'acompte.
  const bodyRows = advanceLayout ? advanceRows : lines.map(toRowView);
  // Tableau à deux colonnes (Désignation | Montant) : facture d'acompte, ou
  // tableau entièrement forfaitaire (une facture porte un montant et non une
  // quantité × un prix). Les colonnes Unité / Qté / PU n'auraient que des cases
  // vides, on les retire et la désignation occupe la place libérée.
  const amountOnlyTable =
    advanceLayout || (lines.length > 0 && lines.every((l) => l.is_amount_only));
  const totalColStyle = amountOnlyTable ? styles.colTotalWide : styles.colTotal;

  // Libellé du grand total (bandeau vert) selon le type/nature. Une facture
  // d'acompte au tableau reconstitué n'en a pas : sa troisième ligne (« Reste à
  // payer ») clôt déjà la soustraction et tient lieu de total. Libellés
  // volontairement courts : la cellule fait 170 pt et un texte plus long
  // passerait à la ligne.
  const ttcSuffix = doc.tax_rate > 0 ? "TTC" : "HT";
  const grandLabel = hasInvoice
    ? factureKind === "acompte"
      ? `NET À PAYER (${ttcSuffix})`
      : `MONTANT TOTAL (${ttcSuffix})`
    : sectioned
      ? "TOTAL GÉNÉRAL"
      : doc.tax_rate > 0
        ? "Total TTC"
        : "Total HT";

  // Sous-total matériel : inutile quand rien ne le sépare du grand total (il le
  // répéterait à l'identique). Il n'a de sens qu'en regard d'une main d'œuvre,
  // d'une remise ou d'une taxe — et jamais en mode sectionné, où chaque
  // compartiment porte déjà son propre total.
  const showMaterialsSubtotal =
    !sectioned &&
    (doc.labor_amount > 0 || doc.discount_amount > 0 || doc.tax_rate > 0);

  // Montant en lettres : base et formulation dépendent de la nature.
  //  - acompte avec acompte versé → montant de l'acompte
  //  - définitive avec déductions → net à payer (solde final)
  //  - sinon                      → total du document
  // Une facture d'acompte au tableau reconstitué énonce l'acompte qu'elle
  // constate — le montant porté en négatif au tableau, et non le reste à verser
  // qui clôt la colonne ni le total du document, qui ne vaut que pour le
  // premier acompte.
  const wordsAmount = advanceLayout
    ? advanceAmount
    : showAcompteRecap
      ? (inv?.advance_amount ?? 0)
      : showDeductionRecap
        ? invNet
        : doc.total_amount;
  const amountWords =
    !hasInvoice && doc.amount_in_words?.trim()
      ? doc.amount_in_words.trim()
      : amountToWords(wordsAmount);
  const wordsIntro = hasInvoice
    ? factureKind === "acompte"
      ? "Arrêtée la présente facture d'acompte à la somme de :"
      : "Arrêtée la présente facture définitive à la somme de :"
    : "Arrêté le présent document à la somme de :";

  // Champs nettoyés (jamais "A_REMPLIR" ni vide affiché sur un document client).
  const orgSlogan = cleanField(org.slogan);
  const subject = cleanField(doc.subject);
  const clRef = cleanField(doc.client_ref);
  const clAddress = cleanField(client?.address);
  const clPhone = cleanField(client?.phone);
  const clEmail = cleanField(client?.email);
  const clWhatsapp = cleanField(client?.whatsapp);
  const clNiu = cleanField(client?.niu);
  const devisRef = cleanField(inv?.devis_ref);
  // Contact = téléphone et/ou WhatsApp (regroupés sur une ligne).
  const clContact = [clPhone, clWhatsapp].filter(Boolean).join(" / ");

  // Pied de page : 3 colonnes
  const bankName = cleanField(org.bank_name);
  const bankAccount = cleanField(org.bank_account);
  const niu = cleanField(org.niu);
  const rccm = cleanField(org.rccm);
  const address = cleanField(org.address);
  const phone = cleanField(org.phone);
  const email = cleanField(org.email);
  const facebook = cleanField(org.facebook);

  const conditionItems = [...toItems(doc.payment_terms), ...toItems(doc.delivery_terms)];
  // L'encadré n'apparaît que s'il est activé (ou forcé pour un bon de commande)
  // ET qu'il a au moins une ligne à afficher.
  const showConditions =
    (doc.include_conditions || doc.type === "bon_commande") &&
    conditionItems.length > 0;

  return (
    <Document
      title={`${docLabel}${advanceRankSuffix} ${doc.number ?? ""}`.trim()}
      author={org.name}
    >
      <Page size="A4" style={styles.page}>
        {/* Filigrane EN PREMIER (arrière-plan) : logo entreprise ou monogramme SP */}
        {data.watermarkData ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={data.watermarkData} style={styles.watermark} fixed />
        ) : (
          <View style={styles.watermarkFallback} fixed>
            <Text style={styles.watermarkFallbackText}>SP</Text>
          </View>
        )}

        {/* En-tête (logo + nom + slogan + filet) répété sur CHAQUE page d'un
            document multi-pages : marqué `fixed` pour se redessiner en haut de
            toutes les pages, comme le pied de page. */}
        <View fixed>
          <View style={styles.header}>
            {data.logoData ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.logoData} style={styles.logoImg} />
            ) : (
              <View style={styles.logoFallbackBox}>
                <Text style={styles.logoFallbackText}>SP</Text>
              </View>
            )}
            <View style={styles.headerTextWrap}>
              <Text style={styles.orgName}>{org.name}</Text>
              {orgSlogan ? <Text style={styles.orgSlogan}>{orgSlogan}</Text> : null}
            </View>
          </View>
          <View style={[styles.headerBand, { backgroundColor: PDF_COLORS.corporateLight }]} />
        </View>

        {/* Date */}
        <Text style={styles.dateLine}>{pdfDate(displayDate)}</Text>

        {/* Mode de règlement (factures) */}
        {payMethod ? (
          <Text style={styles.payMethodLine}>Mode de règlement : {payMethod}</Text>
        ) : null}

        {/* Bloc client */}
        <View style={styles.clientBlock}>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Client :</Text>
            <Text style={styles.clientValue}>{client?.name ?? "—"}</Text>
          </View>
          {clRef ? (
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Réf client :</Text>
              <Text style={styles.clientValue}>{clRef}</Text>
            </View>
          ) : null}
          {clAddress ? (
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Adresse :</Text>
              <Text style={styles.clientValue}>{clAddress}</Text>
            </View>
          ) : null}
          {clContact ? (
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Contact :</Text>
              <Text style={styles.clientValue}>{clContact}</Text>
            </View>
          ) : null}
          {clEmail ? (
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Email :</Text>
              <Text style={styles.clientValue}>{clEmail}</Text>
            </View>
          ) : null}
          {clNiu ? (
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>NIU :</Text>
              <Text style={styles.clientValue}>{clNiu}</Text>
            </View>
          ) : null}
        </View>

        {/* Bandeau titre : type à gauche, numéro à droite (fond clair + bordure) */}
        <View
          style={[
            styles.band,
            { backgroundColor: PDF_COLORS.bandBg, borderColor: band },
          ]}
        >
          <Text style={styles.bandTitle}>{typeLabel}</Text>
          <Text style={styles.bandNumber}>{doc.number ?? ""}</Text>
        </View>

        {/* Objet du document (aligné à gauche, juste après le titre) */}
        {subject ? (
          <View style={styles.subjectRow}>
            <Text style={styles.subjectText}>
              <Text style={styles.subjectLabel}>Objet : </Text>
              {subject}
            </Text>
          </View>
        ) : null}

        {/* Référence du devis d'origine (factures) */}
        {devisRef ? (
          <View style={styles.subjectRow}>
            <Text style={styles.subjectText}>
              <Text style={styles.subjectLabel}>Réf. devis : </Text>
              {devisRef}
            </Text>
          </View>
        ) : null}

        {/* Corps : tableau ou texte libre */}
        {doc.body_mode === "table" ? (
          <>
            <View style={styles.table}>
              <View style={[styles.tHead, { backgroundColor: band }]}>
                <Text style={[styles.tHeadCell, styles.colDesignation]}>Désignation</Text>
                {amountOnlyTable ? null : (
                  <>
                    <Text style={[styles.tHeadCell, styles.colUnit]}>Unité</Text>
                    <Text style={[styles.tHeadCell, styles.colQty]}>Qté</Text>
                    <Text style={[styles.tHeadCell, styles.colPrice]}>PU (FCFA)</Text>
                  </>
                )}
                {/* « PT » (prix total) n'a pas de sens sur une facture d'acompte,
                    dont la deuxième ligne est une déduction : la colonne y
                    annonce un montant. */}
                <Text style={[styles.tHeadCell, totalColStyle]}>
                  {advanceLayout ? "Montant (FCFA)" : "PT (FCFA)"}
                </Text>
              </View>
              {sectioned
                ? sectionGroups.map((group, gi) => (
                    <View key={gi}>
                      {group.title ? (
                        <View style={styles.sectionBandRow} wrap={false}>
                          <Text style={styles.sectionBandText}>
                            {group.title.toUpperCase()}
                          </Text>
                        </View>
                      ) : null}
                      {group.lines.map((l, li) => (
                        <View
                          key={l.id}
                          style={[
                            styles.tRow,
                            { backgroundColor: li % 2 === 1 ? PDF_COLORS.tableAltRow : PDF_COLORS.white },
                          ]}
                          wrap={false}
                        >
                          <Text
                            style={[
                              styles.tCell,
                              styles.colDesignation,
                              l.is_amount_only ? styles.tCellFlat : {},
                            ]}
                          >
                            {l.designation}
                          </Text>
                          {amountOnlyTable ? null : (
                            <>
                              <Text style={[styles.tCell, styles.colUnit]}>
                                {l.is_amount_only ? "" : cleanField(l.unit) ?? ""}
                              </Text>
                              <Text style={[styles.tCell, styles.colQty]}>
                                {l.is_amount_only ? "" : pdfNumber(l.quantity)}
                              </Text>
                              <Text style={[styles.tCell, styles.colPrice]}>
                                {l.is_amount_only ? "" : pdfNumber(l.unit_price)}
                              </Text>
                            </>
                          )}
                          <Text
                            style={[
                              styles.tCell,
                              totalColStyle,
                              l.is_amount_only ? styles.tCellFlat : {},
                            ]}
                          >
                            {pdfNumber(l.line_total)}
                          </Text>
                        </View>
                      ))}
                      <View style={styles.subtotalRow} wrap={false}>
                        <Text style={styles.subtotalLabel}>Total {gi + 1}</Text>
                        <Text style={styles.subtotalValue}>{pdfNumber(group.subtotal)}</Text>
                      </View>
                    </View>
                  ))
                : bodyRows.map((r, i) => (
                    <View
                      key={r.key}
                      style={[
                        styles.tRow,
                        {
                          backgroundColor: r.strong
                            ? PDF_COLORS.totalGreen
                            : i % 2 === 1
                              ? PDF_COLORS.tableAltRow
                              : PDF_COLORS.white,
                        },
                      ]}
                      wrap={false}
                    >
                      <Text
                        style={[
                          styles.tCell,
                          styles.colDesignation,
                          r.flat ? styles.tCellFlat : {},
                          r.strong ? styles.tCellStrong : {},
                        ]}
                      >
                        {r.designation}
                      </Text>
                      {amountOnlyTable ? null : (
                        <>
                          <Text style={[styles.tCell, styles.colUnit]}>{r.unit}</Text>
                          <Text style={[styles.tCell, styles.colQty]}>{r.qty}</Text>
                          <Text style={[styles.tCell, styles.colPrice]}>{r.price}</Text>
                        </>
                      )}
                      <Text
                        style={[
                          styles.tCell,
                          totalColStyle,
                          r.flat ? styles.tCellFlat : {},
                          r.strong ? styles.tCellStrong : {},
                        ]}
                      >
                        {r.total}
                      </Text>
                    </View>
                  ))}
            </View>

            {/* Totaux : bloc étroit aligné à droite. Une facture d'acompte au
                tableau reconstitué n'en a pas — sa troisième ligne porte déjà le
                reste à payer, et le détail matériel/taxe de l'acompte donnerait
                une addition qui ne tombe pas juste face aux montants du marché. */}
            {advanceLayout ? null : (
            <View style={styles.totalsWrap}>
            <View style={styles.totalsTable}>
              {showMaterialsSubtotal ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabelCell}>Total matériel</Text>
                  <Text style={styles.totalValueCell}>{pdfNumber(doc.materials_subtotal)}</Text>
                </View>
              ) : null}
              {doc.labor_amount > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabelCell}>Main d&apos;œuvre</Text>
                  <Text style={styles.totalValueCell}>{pdfNumber(doc.labor_amount)}</Text>
                </View>
              ) : null}
              {doc.discount_amount > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabelCell}>Remise globale</Text>
                  <Text style={[styles.totalValueCell, { color: PDF_COLORS.redDiscount }]}>
                    - {pdfNumber(doc.discount_amount)}
                  </Text>
                </View>
              ) : null}
              {doc.tax_rate > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabelCell}>{taxLabel}</Text>
                  <Text style={styles.totalRateCell}>{doc.tax_rate} %</Text>
                  <Text style={styles.totalValueCell}>{pdfNumber(doc.tax_amount)}</Text>
                </View>
              ) : null}
              <View style={[styles.grandRow, { backgroundColor: PDF_COLORS.totalGreen }]}>
                {/* taux = 0 → total hors taxe (HT) ; taux > 0 → total toutes taxes (TTC) */}
                <Text style={styles.grandLabelCell}>{grandLabel}</Text>
                <Text style={styles.grandValueCell}>{pdfMoney(doc.total_amount)}</Text>
              </View>
            </View>
            </View>
            )}
          </>
        ) : (
          <Text style={styles.freeText}>{doc.body_text || ""}</Text>
        )}

        {/* Suivi du marché : ce que la facture représente sur la cotation
            d'origine, et ce qui reste dû sur l'ensemble. */}
        {showMarketRecap && settlement ? (
          <View style={[styles.recapBox, { borderColor: band }]}>
            <View style={[styles.recapHeader, { borderBottomColor: band }]}>
              <Text style={[styles.recapHeaderText, { color: band }]}>
                RÉCAPITULATIF DU RÈGLEMENT
              </Text>
            </View>
            <View style={styles.recapBody}>
              <RecapRow
                label={`Montant total du marché (${ttcSuffix})${
                  settlement.quotationNumber ? ` — ${settlement.quotationNumber}` : ""
                }`}
                value={pdfMoney(settlement.marketTotal)}
              />
              {showThisDocLine ? (
                <RecapRow
                  label="Présente facture"
                  value={pdfMoney(doc.total_amount)}
                />
              ) : null}
              {recapAdvances.length > 0 ? (
                recapAdvances.map((a, i) => (
                  <RecapRow
                    key={i}
                    label={`Acompte N° ${i + 1} versé le ${pdfDate(a.date)}${
                      a.method ? ` — ${PAYMENT_METHOD_LABELS[a.method]}` : ""
                    }`}
                    value={`- ${pdfMoney(a.amount)}`}
                    negative
                  />
                ))
              ) : settlement.settledTotal > 0 ? (
                <RecapRow
                  label="Déjà encaissé sur le marché"
                  value={`- ${pdfMoney(settlement.settledTotal)}`}
                  negative
                />
              ) : null}
              <RecapRow
                label="RESTE À PAYER SUR LE MARCHÉ"
                value={pdfMoney(recapRemaining)}
                strong
              />
            </View>
          </View>
        ) : null}

        {/* Récapitulatif de règlement (facture d'acompte / facture définitive) */}
        {showRecap && inv ? (
          <View style={[styles.recapBox, { borderColor: band }]}>
            <View style={[styles.recapHeader, { borderBottomColor: band }]}>
              <Text style={[styles.recapHeaderText, { color: band }]}>
                {factureKind === "acompte"
                  ? "RÉCAPITULATIF DU PAIEMENT"
                  : "DÉDUCTION DES ACOMPTES ET NET À PAYER"}
              </Text>
            </View>
            <View style={styles.recapBody}>
              {factureKind === "acompte" ? (
                <>
                  <RecapRow
                    label={`Montant Total du Marché (${ttcSuffix})`}
                    value={pdfMoney(doc.total_amount)}
                  />
                  {/* Montant saisi tel quel : aucun acompte n'est déduit d'un
                      pourcentage du marché. */}
                  <RecapRow
                    label="Acompte versé ce jour"
                    value={`- ${pdfMoney(inv.advance_amount)}`}
                    negative
                  />
                  <RecapRow
                    label="SOLDE RESTANT À PAYER"
                    value={pdfMoney(invSoldeRestant)}
                    strong
                  />
                </>
              ) : (
                <>
                  <RecapRow
                    label={`Montant Total du Chantier (${ttcSuffix})`}
                    value={pdfMoney(doc.total_amount)}
                  />
                  {invDeductions.map((d, i) => (
                    <RecapRow
                      key={i}
                      label={`Moins Acompte N° ${i + 1}${
                        d.date ? ` (versé le ${d.date})` : ""
                      }${d.reference ? ` — ${d.reference}` : ""}`}
                      value={`- ${pdfMoney(d.amount)}`}
                      negative
                    />
                  ))}
                  <RecapRow
                    label="NET À PAYER (SOLDE FINAL)"
                    value={pdfMoney(invNet)}
                    strong
                  />
                </>
              )}
            </View>
          </View>
        ) : null}

        {/* Montant en lettres (gras, en minuscules) */}
        <Text style={styles.words}>
          {wordsIntro}{" "}
          <Text style={styles.wordsStrong}>{amountWords.toLowerCase()}</Text>.
        </Text>

        {/* Encadré « conditions particulières » (optionnel / forcé sur BC) */}
        {showConditions ? (
          <View style={[styles.conditionsBox, { borderColor: band }]}>
            <View style={[styles.conditionsHeader, { borderBottomColor: band }]}>
              <Text style={[styles.conditionsHeaderText, { color: band }]}>
                CONDITIONS PARTICULIÈRES
              </Text>
            </View>
            <View style={styles.conditionsBody}>
              {conditionItems.map((item, i) => (
                <Text key={i} style={styles.condItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Signatures : Le client / Pour l'entreprise (+ signature/cachet si présents).
            `wrap={false}` : le bloc reste insécable (jamais coupé entre deux pages). */}
        <View style={styles.signatures} wrap={false}>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Le client</Text>
            {doc.signed_at && data.clientSignatureData ? (
              <>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={data.clientSignatureData} style={styles.clientSignImage} />
                <Text style={styles.clientSignMention}>
                  Signé électroniquement par {cleanField(doc.signed_by_name) ?? "—"}
                  {"\n"}
                  le {pdfDate(doc.signed_at)} — réf. {shortHash(doc.signature_doc_hash)}
                </Text>
              </>
            ) : (
              <View style={styles.signSpacer} />
            )}
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>{org.name}</Text>
            {doc.include_signature && (data.signatureData || data.stampData) ? (
              data.signatureData && data.stampData ? (
                // Signature + cachet : le cachet est apposé en chevauchant la signature.
                <View style={styles.signStack}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={data.signatureData} style={styles.signImageOverlap} />
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={data.stampData} style={styles.stampImageOverlap} />
                </View>
              ) : data.signatureData ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={data.signatureData} style={styles.signImageAlone} />
              ) : (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={data.stampData as string} style={styles.stampImageAlone} />
              )
            ) : (
              <View style={styles.signSpacer} />
            )}
          </View>
        </View>

        {/* Pied de page fixe : filet + 3 colonnes */}
        <View style={styles.footer} fixed>
          <View style={[styles.footerRule, { backgroundColor: band }]} />
          <View style={styles.footerCols}>
            <View style={styles.footerCol}>
              {bankName ? <Text style={styles.footerLine}>Banque : {bankName}</Text> : null}
              {bankAccount ? <Text style={styles.footerLine}>N° compte : {bankAccount}</Text> : null}
            </View>
            <View style={styles.footerCol}>
              {niu ? <Text style={styles.footerLine}>N° contribuable : {niu}</Text> : null}
              {rccm ? <Text style={styles.footerLine}>RC : {rccm}</Text> : null}
              {address ? <Text style={styles.footerLine}>Localisation : {address}</Text> : null}
            </View>
            <View style={styles.footerCol}>
              {phone ? <Text style={styles.footerLine}>contact : {phone}</Text> : null}
              {email ? <Text style={styles.footerLine}>email : {email}</Text> : null}
              {facebook ? <Text style={styles.footerLine}>facebook : {facebook}</Text> : null}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
