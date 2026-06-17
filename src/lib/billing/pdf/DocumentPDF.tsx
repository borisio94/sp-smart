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
import { DOCUMENT_TYPE_LABELS } from "../format";
import { amountToWords } from "../amountToWords";
import {
  PDF_COLORS,
  bandColor,
  pdfMoney,
  pdfNumber,
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
  colDesignation: { flex: 1 },
  colUnit: { width: 58 },
  colQty: { width: 38, textAlign: "center" },
  colPrice: { width: 78, textAlign: "right" },
  colTotal: { width: 84, textAlign: "right" },

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

/** Composant principal du document PDF (mise en page « devis.docx »). */
export function DocumentPDF(data: DocumentPDFData) {
  const { document: doc, lines, organization: org, client } = data;
  const band = bandColor(doc.type);
  // Libellé du document : pour un type « autre », on utilise l'intitulé libre
  // saisi dans le champ « Titre » ; sinon le libellé standard du type.
  const docLabel = data.customTypeName?.trim()
    ? data.customTypeName.trim()
    : doc.type === "autre"
      ? doc.title?.trim() || DOCUMENT_TYPE_LABELS.autre
      : DOCUMENT_TYPE_LABELS[doc.type];
  const typeLabel = docLabel.toUpperCase();
  const amountWords = doc.amount_in_words?.trim() || amountToWords(doc.total_amount);

  // Champs nettoyés (jamais "A_REMPLIR" ni vide affiché sur un document client).
  const orgSlogan = cleanField(org.slogan);
  const subject = cleanField(doc.subject);
  const clRef = cleanField(doc.client_ref);
  const clAddress = cleanField(client?.address);
  const clPhone = cleanField(client?.phone);
  const clEmail = cleanField(client?.email);
  const clWhatsapp = cleanField(client?.whatsapp);
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
      title={`${docLabel} ${doc.number ?? ""}`.trim()}
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
        <Text style={styles.dateLine}>{pdfDate(doc.issue_date)}</Text>

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

        {/* Corps : tableau ou texte libre */}
        {doc.body_mode === "table" ? (
          <>
            <View style={styles.table}>
              <View style={[styles.tHead, { backgroundColor: band }]}>
                <Text style={[styles.tHeadCell, styles.colDesignation]}>Désignation</Text>
                <Text style={[styles.tHeadCell, styles.colUnit]}>Unité</Text>
                <Text style={[styles.tHeadCell, styles.colQty]}>Qté</Text>
                <Text style={[styles.tHeadCell, styles.colPrice]}>PU (FCFA)</Text>
                <Text style={[styles.tHeadCell, styles.colTotal]}>PT (FCFA)</Text>
              </View>
              {lines.map((l, i) => (
                <View
                  key={l.id}
                  style={[
                    styles.tRow,
                    { backgroundColor: i % 2 === 1 ? PDF_COLORS.tableAltRow : PDF_COLORS.white },
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.tCell, styles.colDesignation]}>{l.designation}</Text>
                  <Text style={[styles.tCell, styles.colUnit]}>{cleanField(l.unit) ?? ""}</Text>
                  <Text style={[styles.tCell, styles.colQty]}>{pdfNumber(l.quantity)}</Text>
                  <Text style={[styles.tCell, styles.colPrice]}>{pdfNumber(l.unit_price)}</Text>
                  <Text style={[styles.tCell, styles.colTotal]}>{pdfNumber(l.line_total)}</Text>
                </View>
              ))}
            </View>

            {/* Totaux : bloc étroit aligné à droite */}
            <View style={styles.totalsWrap}>
            <View style={styles.totalsTable}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelCell}>Total matériel</Text>
                <Text style={styles.totalValueCell}>{pdfNumber(doc.materials_subtotal)}</Text>
              </View>
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
                  <Text style={styles.totalLabelCell}>IR</Text>
                  <Text style={styles.totalRateCell}>{doc.tax_rate} %</Text>
                  <Text style={styles.totalValueCell}>{pdfNumber(doc.tax_amount)}</Text>
                </View>
              ) : null}
              <View style={[styles.grandRow, { backgroundColor: PDF_COLORS.totalGreen }]}>
                {/* IR = 0 → total hors taxe (HT) ; IR > 0 → total toutes taxes (TTC) */}
                <Text style={styles.grandLabelCell}>{doc.tax_rate > 0 ? "Total TTC" : "Total HT"}</Text>
                <Text style={styles.grandValueCell}>{pdfMoney(doc.total_amount)}</Text>
              </View>
            </View>
            </View>
          </>
        ) : (
          <Text style={styles.freeText}>{doc.body_text || ""}</Text>
        )}

        {/* Montant en lettres (gras, en minuscules) */}
        <Text style={styles.words}>
          Arrêté le présent document à la somme de :{" "}
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
            <View style={styles.signSpacer} />
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
