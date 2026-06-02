/**
 * Import en masse du contenu services + FAQ dans Sanity.
 *
 * Lit `services-content.json` à la racine et :
 *   1) Supprime toutes les FAQ existantes dont l'_id commence par "faq-"
 *      (préserve les FAQ créées à la main dans Studio sans ce préfixe).
 *   2) Crée chaque FAQ du JSON avec un _id stable = la clé JSON.
 *   3) Pour chaque service : supprime tout document service portant le
 *      même `slug.current`, puis le recrée avec ses références FAQ.
 *
 * Idempotent : peut être relancé plusieurs fois sans créer de doublons.
 *
 * Usage :
 *   npm run import-content
 *
 * Prérequis (`.env.local`) :
 *   - NEXT_PUBLIC_SANITY_PROJECT_ID
 *   - NEXT_PUBLIC_SANITY_DATASET
 *   - SANITY_API_WRITE_TOKEN  (droits "Editor" sur https://manage.sanity.io)
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

// --- Types décrivant le contenu source ------------------------------------
type LocaleStr = { fr: string; en?: string };
type LocaleText = { fr: string; en?: string };

type JsonFaq = {
  _key: string;
  category?: string;
  order?: number;
  question: LocaleStr;
  answer: LocaleText;
};

type JsonAdvantage = {
  _key?: string;
  title: LocaleStr;
  description: LocaleText;
  icon?: string;
};

type JsonService = {
  _key: string;
  slug: string;
  icon?: string;
  order?: number;
  title: LocaleStr;
  shortDescription: LocaleText;
  longDescription: { fr: string; en: string };
  features?: LocaleStr[];
  advantages?: JsonAdvantage[];
  faqRefs?: string[];
  seo?: {
    metaTitle?: LocaleStr;
    metaDescription?: LocaleText;
    keywords?: string[];
  };
};

type JsonContent = {
  services: JsonService[];
  faqs: JsonFaq[];
};

// --- Configuration & vérifications ----------------------------------------
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01";
const token = process.env.SANITY_API_WRITE_TOKEN;

function exit(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

if (!projectId || ["A_REMPLIR", "votre_project_id"].includes(projectId)) {
  exit(
    "NEXT_PUBLIC_SANITY_PROJECT_ID manquant ou non renseigné dans .env.local",
  );
}
if (!token || ["A_REMPLIR", "votre_token_ecriture"].includes(token)) {
  exit(
    "SANITY_API_WRITE_TOKEN manquant ou non renseigné dans .env.local.\n" +
      "  Génère un token sur https://manage.sanity.io > API > Tokens (rôle Editor).",
  );
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

// --- Outils ---------------------------------------------------------------
/** Génère une clé courte unique pour les _key d'éléments d'array. */
function newKey(): string {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

/**
 * Convertit un texte brut (paragraphes séparés par `\n\n`) en Portable Text :
 * un bloc {_type:"block", style:"normal"} par paragraphe.
 */
function textToPortableText(text: string): Array<Record<string, unknown>> {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      _type: "block",
      _key: newKey(),
      style: "normal",
      markDefs: [],
      children: [
        { _type: "span", _key: newKey(), text: paragraph, marks: [] },
      ],
    }));
}

// --- Étape 1 : purge des FAQ existantes "faq-*" ----------------------------
async function purgeFaqs(): Promise<number> {
  console.log("\n=== Étape 1 : nettoyage des FAQ existantes (préfixe « faq- ») ===");
  const allIds: string[] = await client.fetch(`*[_type == "faq"]._id`);
  const toDelete = allIds.filter((id) => id.startsWith("faq-"));
  if (toDelete.length === 0) {
    console.log("  (aucune FAQ à supprimer)");
    return 0;
  }
  for (const id of toDelete) {
    await client.delete(id);
    console.log(`  ✓ Supprimé : ${id}`);
  }
  console.log(`  → ${toDelete.length} FAQ(s) supprimée(s).`);
  return toDelete.length;
}

// --- Étape 2 : (re)création des FAQ ---------------------------------------
async function createFaqs(faqs: JsonFaq[]): Promise<Map<string, string>> {
  console.log(`\n=== Étape 2 : création des FAQ (${faqs.length}) ===`);
  const mapping = new Map<string, string>();
  for (const f of faqs) {
    const doc = {
      _id: f._key, // _id stable basé sur la clé JSON (ex : "faq-portails-1")
      _type: "faq",
      question: { _type: "localeString", ...f.question },
      answer: { _type: "localeText", ...f.answer },
      category: f.category ?? "general",
      order: f.order ?? 0,
    };
    const created = await client.createOrReplace(doc);
    mapping.set(f._key, created._id);
    console.log(
      `  ✓ FAQ créée : ${created._id} — « ${f.question.fr.slice(0, 70)}${
        f.question.fr.length > 70 ? "…" : ""
      } »`,
    );
  }
  return mapping;
}

// --- Étape 3 : (re)création des services -----------------------------------
async function createServices(
  services: JsonService[],
  faqMapping: Map<string, string>,
): Promise<{ created: number; orphanRefs: string[] }> {
  console.log(`\n=== Étape 3 : création des services (${services.length}) ===`);
  const orphanRefs: string[] = [];
  let createdCount = 0;

  for (const s of services) {
    // a) Écraser proprement : supprimer tout service existant au même slug.
    const existing: { _id: string }[] = await client.fetch(
      `*[_type == "service" && slug.current == $slug]{ _id }`,
      { slug: s.slug },
    );
    for (const ex of existing) {
      await client.delete(ex._id);
      console.log(`  ↻ Service existant supprimé : ${ex._id} (slug ${s.slug})`);
    }

    // b) Résoudre les références FAQ.
    const faqRefs = (s.faqRefs ?? [])
      .map((key) => {
        const ref = faqMapping.get(key);
        if (!ref) {
          orphanRefs.push(`${s.slug} → ${key}`);
          return null;
        }
        return { _type: "reference", _key: newKey(), _ref: ref };
      })
      .filter((v): v is { _type: string; _key: string; _ref: string } => v !== null);

    // c) Avantages : array d'objets advantageItem.
    const advantages = (s.advantages ?? []).map((a) => ({
      _type: "advantageItem",
      _key: a._key ?? newKey(),
      title: { _type: "localeString", ...a.title },
      description: { _type: "localeText", ...a.description },
      ...(a.icon ? { icon: a.icon } : {}),
    }));

    // d) Caractéristiques : array de localeString.
    const features = (s.features ?? []).map((f) => ({
      _type: "localeString",
      _key: newKey(),
      ...f,
    }));

    // e) Description longue : Portable Text bilingue.
    const longDescription = {
      _type: "localeBlockContent",
      fr: textToPortableText(s.longDescription.fr),
      en: textToPortableText(s.longDescription.en),
    };

    // f) SEO (optionnel).
    const seo = s.seo
      ? {
          _type: "seo",
          ...(s.seo.metaTitle && {
            metaTitle: { _type: "localeString", ...s.seo.metaTitle },
          }),
          ...(s.seo.metaDescription && {
            metaDescription: { _type: "localeText", ...s.seo.metaDescription },
          }),
          ...(s.seo.keywords?.length && { keywords: s.seo.keywords }),
        }
      : undefined;

    // g) Document final.
    const doc = {
      _type: "service",
      title: { _type: "localeString", ...s.title },
      slug: { _type: "slug", current: s.slug },
      ...(s.icon && { icon: s.icon }),
      ...(typeof s.order === "number" && { order: s.order }),
      shortDescription: { _type: "localeText", ...s.shortDescription },
      longDescription,
      features,
      advantages,
      faq: faqRefs,
      ...(seo && { seo }),
    };
    const created = await client.create(doc);
    createdCount++;
    console.log(
      `  ✓ Service créé : ${created._id} — ${s.title.fr} ` +
        `(${advantages.length} avantage(s), ${features.length} caractéristique(s), ` +
        `${faqRefs.length} FAQ liée(s))`,
    );
  }
  return { created: createdCount, orphanRefs };
}

// --- Point d'entrée -------------------------------------------------------
async function main() {
  console.log(
    `\n────────────────────────────────────────────────────────\n` +
      ` Import du contenu SP Smart → Sanity\n` +
      ` Projet  : ${projectId}\n` +
      ` Dataset : ${dataset}\n` +
      `────────────────────────────────────────────────────────`,
  );

  const jsonPath = resolve(process.cwd(), "services-content.json");
  console.log(`\nLecture du fichier : ${jsonPath}`);
  const raw = readFileSync(jsonPath, "utf-8");
  const content: JsonContent = JSON.parse(raw);
  console.log(
    `  → ${content.services.length} service(s), ${content.faqs.length} FAQ.`,
  );

  const deletedFaqs = await purgeFaqs();
  const mapping = await createFaqs(content.faqs);
  const { created: createdServices, orphanRefs } = await createServices(
    content.services,
    mapping,
  );

  console.log(
    `\n────────────────────────────────────────────────────────\n` +
      ` ✓ Import terminé.\n` +
      `   • ${deletedFaqs} FAQ supprimée(s) (nettoyage).\n` +
      `   • ${content.faqs.length} FAQ (re)créée(s).\n` +
      `   • ${createdServices} service(s) (re)créé(s).\n` +
      `────────────────────────────────────────────────────────`,
  );

  if (orphanRefs.length > 0) {
    console.warn(
      `\n⚠ ${orphanRefs.length} référence(s) FAQ introuvable(s) (ignorée(s)) :`,
    );
    for (const ref of orphanRefs) console.warn(`   - ${ref}`);
  }
  console.log();
}

main().catch((error) => {
  console.error("\n✗ Erreur fatale durant l'import :", error);
  process.exit(1);
});
