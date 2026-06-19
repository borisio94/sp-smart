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
  Organization,
  Client,
  MaintenanceReportData,
} from "../types";
import { DOCUMENT_TYPE_LABELS } from "../format";
import { INTERVENTION_TYPE_LABELS, emptyReport } from "../templates";
import { PDF_COLORS, bandColor, pdfNumber, pdfDate, cleanField } from "./theme";

/**
 * Données nécessaires au rendu PDF d'un rapport de maintenance. Mise en page
 * dédiée (sections techniques), réutilisant l'en-tête, le pied de page et les
 * blocs marque/signature des documents commerciaux pour une charte cohérente.
 */
export interface ReportPDFData {
  document: BillingDocument;
  organization: Organization;
  client: Client | null;
  logoData: string | null;
  watermarkData: string | null;
  signatureData: string | null;
  stampData: string | null;
}

// Conversion millimètres → points PDF (cf. DocumentPDF).
const MM_TO_PT = 72 / 25.4;
const SIGNATURE_WIDTH = 55 * MM_TO_PT;
const STAMP_SIZE = 40 * MM_TO_PT;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 9,
    color: PDF_COLORS.text,
    paddingTop: 2,
    paddingBottom: 78,
  },
  // ── En-tête (identique aux documents commerciaux) ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 0,
    gap: 12,
  },
  logoImg: { width: 125, height: 125, objectFit: "contain", marginTop: -15, marginBottom: -15 },
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
  orgSlogan: { fontSize: 10.5, color: PDF_COLORS.text, textAlign: "center", marginTop: 4 },
  headerBand: { height: 2, marginTop: 2 },

  dateLine: { paddingHorizontal: 28, marginTop: 12, fontSize: 10.5, textAlign: "right", color: PDF_COLORS.gray475 },

  // ── Bloc client ──
  clientBlock: { paddingHorizontal: 28, marginTop: 8 },
  clientRow: { flexDirection: "row", marginTop: 2 },
  clientLabel: { width: 78, fontSize: 10.5, fontFamily: "Times-Bold", color: PDF_COLORS.text },
  clientValue: { flex: 1, fontSize: 10.5, color: PDF_COLORS.text },

  // ── Bandeau titre ──
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
    backgroundColor: PDF_COLORS.bandBg,
  },
  bandTitle: { color: PDF_COLORS.corporate, fontSize: 14, fontFamily: "Times-Bold", letterSpacing: 1.5 },
  bandNumber: { color: PDF_COLORS.corporate, fontSize: 14, fontFamily: "Times-Bold", letterSpacing: 0.5 },

  // ── Sections ──
  section: { marginHorizontal: 28, marginTop: 14 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    letterSpacing: 0.6,
    paddingBottom: 3,
    marginBottom: 6,
    borderBottomWidth: 1,
  },
  // Grille « libellé : valeur » (informations d'intervention)
  infoRow: { flexDirection: "row", marginTop: 2.5 },
  infoLabel: { width: 130, fontSize: 10.5, fontFamily: "Times-Bold", color: PDF_COLORS.text },
  infoValue: { flex: 1, fontSize: 10.5, color: PDF_COLORS.text },

  // Paragraphe (constat, tests, observations)
  paragraph: { fontSize: 10.5, lineHeight: 1.5, color: PDF_COLORS.text },

  // ── Tableaux ──
  table: { marginTop: 2 },
  tHead: { flexDirection: "row" },
  tHeadCell: { color: PDF_COLORS.white, fontSize: 10, fontFamily: "Times-Bold", paddingVertical: 5, paddingHorizontal: 6 },
  tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: PDF_COLORS.hairline },
  tCell: { fontSize: 10, paddingVertical: 5, paddingHorizontal: 6, color: PDF_COLORS.bodyBlack },

  // ── Signatures ──
  signatures: { flexDirection: "row", marginHorizontal: 28, marginTop: 24, justifyContent: "space-between" },
  signBox: { width: 200, alignItems: "center" },
  signLabel: { fontSize: 10.5, fontFamily: "Times-Bold", color: PDF_COLORS.text },
  signStack: { marginTop: 6, width: 200, height: STAMP_SIZE, position: "relative" },
  signImageOverlap: { position: "absolute", top: 36, left: 2, width: SIGNATURE_WIDTH, objectFit: "contain" },
  stampImageOverlap: { position: "absolute", top: 0, left: 80, width: STAMP_SIZE, height: STAMP_SIZE, objectFit: "contain" },
  signImageAlone: { marginTop: 6, width: SIGNATURE_WIDTH, objectFit: "contain" },
  stampImageAlone: { marginTop: 6, width: STAMP_SIZE, height: STAMP_SIZE, objectFit: "contain" },
  signSpacer: { height: 56 },

  // ── Pied de page ──
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: PDF_COLORS.footerBg, paddingHorizontal: 24, paddingVertical: 9 },
  footerRule: { height: 3, marginBottom: 6 },
  footerCols: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  footerCol: { flex: 1 },
  footerLine: { fontSize: 8.5, color: PDF_COLORS.gray475, marginTop: 1.5 },

  // ── Filigrane ──
  watermark: { position: "absolute", top: 171, left: 47.5, width: 500, height: 500, opacity: 0.06, objectFit: "contain" },
  watermarkFallback: { position: "absolute", top: 171, left: 47.5, width: 500, height: 500, alignItems: "center", justifyContent: "center" },
  watermarkFallbackText: { fontSize: 220, fontFamily: "Times-Bold", color: PDF_COLORS.corporate, opacity: 0.06 },
});

/** Renvoie true si la chaîne contient au moins un caractère utile. */
function has(v: string | null | undefined): boolean {
  return (v ?? "").trim() !== "";
}

/** Composant PDF d'un rapport de maintenance. */
export function ReportPDF(data: ReportPDFData) {
  const { document: doc, organization: org, client } = data;
  const band = bandColor("rapport_maintenance");
  const r: MaintenanceReportData = doc.report_data ?? emptyReport();

  const docLabel = doc.title?.trim() || DOCUMENT_TYPE_LABELS.rapport_maintenance;
  const typeLabel = docLabel.toUpperCase();

  // Champs nettoyés.
  const orgSlogan = cleanField(org.slogan);
  const clAddress = cleanField(client?.address);
  const clPhone = cleanField(client?.phone);
  const clWhatsapp = cleanField(client?.whatsapp);
  const clContact = [clPhone, clWhatsapp].filter(Boolean).join(" / ");

  // Pied de page.
  const bankName = cleanField(org.bank_name);
  const bankAccount = cleanField(org.bank_account);
  const niu = cleanField(org.niu);
  const rccm = cleanField(org.rccm);
  const address = cleanField(org.address);
  const phone = cleanField(org.phone);
  const email = cleanField(org.email);
  const facebook = cleanField(org.facebook);

  // Lignes de tableau effectivement renseignées.
  const equipments = (r.equipments ?? []).filter(
    (e) => has(e.designation) || has(e.brand_model) || has(e.serial) || has(e.location),
  );
  const operations = (r.operations ?? []).filter((o) => has(o.description));
  const parts = (r.parts ?? []).filter((p) => has(p.designation));

  const horaires = [r.start_time, r.end_time].filter((v) => has(v)).join(" → ");

  return (
    <Document title={`${docLabel} ${doc.number ?? ""}`.trim()} author={org.name}>
      <Page size="A4" style={styles.page}>
        {/* Filigrane */}
        {data.watermarkData ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={data.watermarkData} style={styles.watermark} fixed />
        ) : (
          <View style={styles.watermarkFallback} fixed>
            <Text style={styles.watermarkFallbackText}>SP</Text>
          </View>
        )}

        {/* En-tête (répété sur chaque page) */}
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
        </View>

        {/* Bandeau titre */}
        <View style={[styles.band, { borderColor: band }]}>
          <Text style={styles.bandTitle}>{typeLabel}</Text>
          <Text style={styles.bandNumber}>{doc.number ?? ""}</Text>
        </View>

        {/* Informations sur l'intervention */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: band, borderBottomColor: band }]}>
            INFORMATIONS SUR L&apos;INTERVENTION
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nature :</Text>
            <Text style={styles.infoValue}>
              {INTERVENTION_TYPE_LABELS[r.intervention_type] ?? "—"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Site / lieu :</Text>
            <Text style={styles.infoValue}>{r.site || "—"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date d&apos;intervention :</Text>
            <Text style={styles.infoValue}>{r.intervention_date || "—"}</Text>
          </View>
          {has(horaires) ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Horaires :</Text>
              <Text style={styles.infoValue}>{horaires}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Technicien(s) :</Text>
            <Text style={styles.infoValue}>{r.technicians || "—"}</Text>
          </View>
        </View>

        {/* Objet de l'intervention */}
        {has(r.request) ? (
          <View style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, { color: band, borderBottomColor: band }]}>
              OBJET DE L&apos;INTERVENTION
            </Text>
            <Text style={styles.paragraph}>{r.request}</Text>
          </View>
        ) : null}

        {/* Équipements concernés */}
        {equipments.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: band, borderBottomColor: band }]}>
              ÉQUIPEMENTS CONCERNÉS
            </Text>
            <View style={styles.table}>
              <View style={[styles.tHead, { backgroundColor: band }]}>
                <Text style={[styles.tHeadCell, { flex: 1 }]}>Désignation</Text>
                <Text style={[styles.tHeadCell, { width: 110 }]}>Marque / Modèle</Text>
                <Text style={[styles.tHeadCell, { width: 90 }]}>N° série</Text>
                <Text style={[styles.tHeadCell, { width: 100 }]}>Emplacement</Text>
              </View>
              {equipments.map((e, i) => (
                <View
                  key={i}
                  style={[styles.tRow, { backgroundColor: i % 2 === 1 ? PDF_COLORS.tableAltRow : PDF_COLORS.white }]}
                  wrap={false}
                >
                  <Text style={[styles.tCell, { flex: 1 }]}>{e.designation || "—"}</Text>
                  <Text style={[styles.tCell, { width: 110 }]}>{e.brand_model || "—"}</Text>
                  <Text style={[styles.tCell, { width: 90 }]}>{e.serial || "—"}</Text>
                  <Text style={[styles.tCell, { width: 100 }]}>{e.location || "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Constat / diagnostic */}
        {has(r.diagnosis) ? (
          <View style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, { color: band, borderBottomColor: band }]}>
              CONSTAT / DIAGNOSTIC
            </Text>
            <Text style={styles.paragraph}>{r.diagnosis}</Text>
          </View>
        ) : null}

        {/* Travaux réalisés */}
        {operations.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: band, borderBottomColor: band }]}>
              TRAVAUX RÉALISÉS
            </Text>
            <View style={styles.table}>
              <View style={[styles.tHead, { backgroundColor: band }]}>
                <Text style={[styles.tHeadCell, { flex: 1 }]}>Opération</Text>
                <Text style={[styles.tHeadCell, { width: 110 }]}>Statut</Text>
                <Text style={[styles.tHeadCell, { width: 80 }]}>Durée</Text>
              </View>
              {operations.map((o, i) => (
                <View
                  key={i}
                  style={[styles.tRow, { backgroundColor: i % 2 === 1 ? PDF_COLORS.tableAltRow : PDF_COLORS.white }]}
                  wrap={false}
                >
                  <Text style={[styles.tCell, { flex: 1 }]}>{o.description || "—"}</Text>
                  <Text style={[styles.tCell, { width: 110 }]}>{o.status || "—"}</Text>
                  <Text style={[styles.tCell, { width: 80 }]}>{o.duration || "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Pièces & fournitures */}
        {parts.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: band, borderBottomColor: band }]}>
              PIÈCES & FOURNITURES UTILISÉES
            </Text>
            <View style={styles.table}>
              <View style={[styles.tHead, { backgroundColor: band }]}>
                <Text style={[styles.tHeadCell, { flex: 1 }]}>Désignation</Text>
                <Text style={[styles.tHeadCell, { width: 80, textAlign: "right" }]}>Quantité</Text>
              </View>
              {parts.map((p, i) => (
                <View
                  key={i}
                  style={[styles.tRow, { backgroundColor: i % 2 === 1 ? PDF_COLORS.tableAltRow : PDF_COLORS.white }]}
                  wrap={false}
                >
                  <Text style={[styles.tCell, { flex: 1 }]}>{p.designation || "—"}</Text>
                  <Text style={[styles.tCell, { width: 80, textAlign: "right" }]}>{pdfNumber(p.quantity)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Tests & vérifications */}
        {has(r.tests) || has(r.conformity) ? (
          <View style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, { color: band, borderBottomColor: band }]}>
              TESTS & VÉRIFICATIONS
            </Text>
            {has(r.tests) ? <Text style={styles.paragraph}>{r.tests}</Text> : null}
            {has(r.conformity) ? (
              <View style={[styles.infoRow, { marginTop: 4 }]}>
                <Text style={styles.infoLabel}>Conformité :</Text>
                <Text style={styles.infoValue}>{r.conformity}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Observations & recommandations */}
        {has(r.observations) ? (
          <View style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, { color: band, borderBottomColor: band }]}>
              OBSERVATIONS & RECOMMANDATIONS
            </Text>
            <Text style={styles.paragraph}>{r.observations}</Text>
          </View>
        ) : null}

        {/* Conclusion */}
        {has(r.final_state) || has(r.next_maintenance) ? (
          <View style={styles.section} wrap={false}>
            <Text style={[styles.sectionTitle, { color: band, borderBottomColor: band }]}>
              CONCLUSION
            </Text>
            {has(r.final_state) ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>État final :</Text>
                <Text style={styles.infoValue}>{r.final_state}</Text>
              </View>
            ) : null}
            {has(r.next_maintenance) ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prochaine maintenance :</Text>
                <Text style={styles.infoValue}>{r.next_maintenance}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Signatures : réception client / technicien (+ signature/cachet) */}
        <View style={styles.signatures} wrap={false}>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Le client (réception)</Text>
            <View style={styles.signSpacer} />
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Le technicien — {org.name}</Text>
            {doc.include_signature && (data.signatureData || data.stampData) ? (
              data.signatureData && data.stampData ? (
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

        {/* Pied de page fixe */}
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
