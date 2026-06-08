/**
 * Seed d'images professionnelles (libres de droits) dans Sanity.
 *
 * Télécharge des photos sous licence Unsplash (gratuites, usage commercial
 * autorisé, sans attribution obligatoire — https://unsplash.com/license),
 * les téléverse comme assets Sanity, puis les attache aux bons champs :
 *
 *   • homePage.heroImage         (image de fond du hero d'accueil)
 *   • aboutPage.image            (visuel page « À propos »)
 *   • service.heroImage + gallery (les 11 services, mappés par slug)
 *   • article.coverImage          (les 2 articles de blog existants)
 *   • membreEquipe.photo          (les 3 membres d'équipe, portraits génériques)
 *   • realisation (×3)            créées de toutes pièces avec images avant/après
 *                                 (la section portfolio était vide)
 *
 * Le responsive desktop/mobile est géré automatiquement par next/image +
 * urlForImage() : une seule image haute résolution suffit.
 *
 * Idempotent :
 *   - les champs déjà renseignés ne sont PAS écrasés (relance sans risque) ;
 *     forcer le remplacement avec FORCE=1.
 *   - les réalisations utilisent un _id stable « seed-realisation-* »
 *     (createOrReplace) : pas de doublons.
 *
 * Usage :
 *   npm run seed-images           # ne remplit que les champs vides
 *   FORCE=1 npm run seed-images   # réécrit aussi les champs déjà remplis
 *
 * Prérequis (.env.local), identiques au script d'import :
 *   - NEXT_PUBLIC_SANITY_PROJECT_ID
 *   - NEXT_PUBLIC_SANITY_DATASET
 *   - SANITY_API_WRITE_TOKEN  (rôle « Editor »)
 */

import { createClient } from "@sanity/client";
import { randomUUID } from "node:crypto";

// --- Configuration & vérifications (mêmes garde-fous que l'import) ---------
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01";
const token = process.env.SANITY_API_WRITE_TOKEN;
const FORCE = process.env.FORCE === "1";

function exit(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

if (!projectId || ["A_REMPLIR", "votre_project_id"].includes(projectId)) {
  exit("NEXT_PUBLIC_SANITY_PROJECT_ID manquant ou non renseigné dans .env.local");
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

// --- Banque de photos (IDs Unsplash vérifiés, licence libre) ---------------
// Chaque clé pointe vers un identifiant de photo Unsplash. La construction de
// l'URL (taille, recadrage) est faite par `srcLandscape` / `srcPortrait`.
const PHOTO = {
  // Sécurité / vidéosurveillance
  cctv: "1558002038-1055907df827",
  camera: "1557597774-9d273605dfa9",
  serrureConnectee: "1610433572201-110753c6cff9",
  clavierAlarme: "1563013544-824ae1b704d3",
  lecteurBadge: "1591488320449-011701bb6704",
  codeSecurite: "1487058792275-0ad4aaf24ca7",
  dataCenter: "1606857521015-7f9fcf423740",
  // Incendie
  detecteurFumee: "1574870111867-089730e5a72b",
  alarmeIncendie: "1582139329536-e7284fece509",
  // Portails / volets / domotique
  portail: "1605152276897-4f618f831968",
  garageMoteur: "1558618666-fcd25c85cd64",
  voletRoulant: "1597211833712-5e41faa202ea",
  maison: "1600585154340-be6161a56a0c",
  domotique: "1545209463-e2825498edbf",
  domotiqueTablette: "1558089687-f282ffcbc126",
  // Clôture
  cloture: "1610552050890-fe99536c2615",
  // Électricité
  electricienFils: "1521791136064-7986c2920216",
  electricienTravaux: "1581094794329-c8112a89af12",
  panneauElectrique: "1497435334941-8c899ee9e8e9",
  tableauElectrique: "1565608438257-fac3c27beb36",
  priseCablage: "1559302504-64aae6ca6b6d",
  cableReseau: "1473341304170-971dccb5ac1e",
  // Solaire
  solaireToit: "1466611653911-95081537e5b7",
  panneauxSolaires: "1509391366360-2e959784a276",
  panneauxChamp: "1559087867-ce4c91325525",
  installateurSolaire: "1592833159155-c62df1b65634",
  // Équipe / pro
  ingenieurCasque: "1581091226825-a6a2a5aee158",
  ingenieurChantier: "1581092160562-40aa08e78837",
  equipeReunion: "1556761175-b413da4baf72",
  equipeBureau: "1600880292203-757bb62b4baf",
  reunionBureau: "1542744173-8e7e53415bb0",
  // Portraits
  portraitHomme1: "1551836022-d5d88e9218df",
  portraitFemme1: "1494790108377-be9c29b29330",
  portraitHomme2: "1507003211169-0a1dd7228f2d",
} as const;

type PhotoKey = keyof typeof PHOTO;

/**
 * Surcharges Pexels (contexte africain). Pour les emplacements montrant des
 * personnes, on privilégie des photos de personnes noires/africaines, vérifiées
 * visuellement. Licence Pexels : gratuite, usage commercial, sans attribution
 * (https://www.pexels.com/license/). Les autres clés (objets : caméras,
 * panneaux, tableaux…) restent sur Unsplash, sans enjeu de représentation.
 */
const PEXELS: Partial<Record<PhotoKey, string>> = {
  ingenieurCasque: "2898199", // hero : électricien sur lignes électriques
  equipeReunion: "1367274", // « À propos » : équipe africaine en réunion
  electricienFils: "442154", // technicien africain au travail
  installateurSolaire: "8853502", // installateur solaire (visage non visible)
  portraitHomme1: "33844626", // portrait homme africain (costume)
  portraitFemme1: "29852895", // portrait femme africaine (corporate)
  portraitHomme2: "15946547", // portrait homme africain (studio)
};

/** URL Pexels avec recadrage. */
function pexels(id: string, w: number, h: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

/** URL paysage haute résolution (hero, cartes, galeries). */
function srcLandscape(key: PhotoKey, w = 1600, h = 1000): string {
  const px = PEXELS[key];
  if (px) return pexels(px, w, h);
  return `https://images.unsplash.com/photo-${PHOTO[key]}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}
/** URL carrée recadrée sur les visages (portraits d'équipe). */
function srcPortrait(key: PhotoKey, s = 800): string {
  const px = PEXELS[key];
  if (px) return pexels(px, s, s);
  return `https://images.unsplash.com/photo-${PHOTO[key]}?auto=format&fit=crop&crop=faces&w=${s}&h=${s}&q=80`;
}

// --- Téléversement d'assets (avec cache pour ne pas ré-uploader) -----------
const assetCache = new Map<string, string>();

/** Télécharge une image et la téléverse comme asset Sanity. Retourne l'_id. */
async function uploadAsset(url: string, filename: string): Promise<string> {
  const cached = assetCache.get(url);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Téléchargement échoué (${res.status}) : ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buffer, {
    filename,
    contentType: "image/jpeg",
  });
  assetCache.set(url, asset._id);
  console.log(`    ↑ asset téléversé : ${filename} (${Math.round(buffer.length / 1024)} Ko)`);
  return asset._id;
}

function newKey(): string {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

/** Construit une valeur de champ `image` à partir d'un asset. */
function imageValue(assetId: string) {
  return { _type: "image", asset: { _type: "reference", _ref: assetId } };
}

/** Construit un membre d'array `image` (avec _key) + alt optionnel. */
function imageMember(assetId: string, alt?: string) {
  return {
    _type: "image",
    _key: newKey(),
    asset: { _type: "reference", _ref: assetId },
    ...(alt ? { alt } : {}),
  };
}

// --- Mapping éditorial -----------------------------------------------------
type Locale = { fr: string; en: string };

/** Service : image principale + galerie (clés de PHOTO). */
const SERVICE_IMAGES: Record<
  string,
  { hero: PhotoKey; gallery: PhotoKey[]; alt: string }
> = {
  "portails-automatiques": {
    hero: "portail",
    gallery: ["garageMoteur", "maison"],
    alt: "Portail automatique",
  },
  "automatisation-portails": {
    hero: "garageMoteur",
    gallery: ["portail", "domotique"],
    alt: "Automatisation de portail",
  },
  "volets-et-grilles": {
    hero: "voletRoulant",
    gallery: ["maison", "priseCablage"],
    alt: "Volets roulants et grilles",
  },
  "automatisation-volets-grilles": {
    hero: "domotique",
    gallery: ["voletRoulant", "domotiqueTablette"],
    alt: "Automatisation des volets et grilles",
  },
  videosurveillance: {
    hero: "cctv",
    gallery: ["camera", "dataCenter"],
    alt: "Caméra de vidéosurveillance",
  },
  "securite-incendie": {
    hero: "detecteurFumee",
    gallery: ["alarmeIncendie", "panneauElectrique"],
    alt: "Détecteur de fumée — sécurité incendie",
  },
  "anti-intrusion": {
    hero: "clavierAlarme",
    gallery: ["serrureConnectee", "cctv"],
    alt: "Système anti-intrusion",
  },
  "cloture-electrique": {
    hero: "cloture",
    gallery: ["tableauElectrique", "cableReseau"],
    alt: "Clôture électrique de sécurité",
  },
  "controle-acces": {
    hero: "lecteurBadge",
    gallery: ["serrureConnectee", "codeSecurite"],
    alt: "Contrôle d'accès par badge",
  },
  "electricite-domestique": {
    hero: "tableauElectrique",
    gallery: ["electricienFils", "priseCablage"],
    alt: "Tableau électrique domestique",
  },
  "systemes-solaires": {
    hero: "solaireToit",
    gallery: ["panneauxSolaires", "installateurSolaire"],
    alt: "Système solaire photovoltaïque",
  },
};

/** Article (slug) → photo de couverture. */
const ARTICLE_COVERS: Record<string, PhotoKey> = {
  "5-conseils-securiser-entreprise": "codeSecurite",
  "pourquoi-energie-solaire": "panneauxChamp",
};

/** Membre d'équipe (nom) → portrait. */
const TEAM_PHOTOS: Record<string, PhotoKey> = {
  "Samuel Penda": "portraitHomme1",
  "Christelle Ngo": "portraitFemme1",
  "Boris Tanedjeu": "portraitHomme2",
};

/** Diaporama du hero d'accueil : images de fond qui défilent (paysage). */
const HERO_SLIDES: PhotoKey[] = [
  "ingenieurCasque", // électricien sur lignes électriques
  "cctv", // vidéosurveillance (sécurité)
  "solaireToit", // énergie solaire
  "tableauElectrique", // électricité
];

/** Réalisations-exemples à créer (la section était vide). */
const SAMPLE_REALISATIONS: Array<{
  id: string;
  serviceSlug: string;
  title: Locale;
  location: string;
  date: string;
  description: Locale;
  before: PhotoKey;
  after: PhotoKey[];
  featured: boolean;
}> = [
  {
    id: "seed-realisation-videosurveillance",
    serviceSlug: "videosurveillance",
    title: {
      fr: "Vidéosurveillance d'un site commercial",
      en: "CCTV for a commercial site",
    },
    location: "Douala",
    date: "2025-09-15",
    description: {
      fr: "Déploiement d'un réseau de caméras HD avec supervision centralisée.",
      en: "Deployment of an HD camera network with centralized monitoring.",
    },
    before: "maison",
    after: ["cctv", "camera"],
    featured: true,
  },
  {
    id: "seed-realisation-solaire",
    serviceSlug: "systemes-solaires",
    title: {
      fr: "Installation solaire résidentielle",
      en: "Residential solar installation",
    },
    location: "Yaoundé",
    date: "2025-07-02",
    description: {
      fr: "Pose de panneaux photovoltaïques et mise en service de l'onduleur.",
      en: "Photovoltaic panel installation and inverter commissioning.",
    },
    before: "maison",
    after: ["solaireToit", "installateurSolaire"],
    featured: true,
  },
  {
    id: "seed-realisation-portail",
    serviceSlug: "portails-automatiques",
    title: {
      fr: "Automatisation d'un portail coulissant",
      en: "Automation of a sliding gate",
    },
    location: "Douala",
    date: "2025-05-20",
    description: {
      fr: "Motorisation d'un portail avec télécommande et accès sécurisé.",
      en: "Gate motorization with remote control and secured access.",
    },
    before: "maison",
    after: ["portail", "garageMoteur"],
    featured: false,
  },
];

// --- Étapes ----------------------------------------------------------------

/** Met à jour un champ `image` d'un singleton, en respectant l'idempotence. */
async function seedSingletonImage(
  type: string,
  field: string,
  key: PhotoKey,
  label: string,
): Promise<boolean> {
  const doc: { _id: string; has: boolean } | null = await client.fetch(
    `*[_type==$type][0]{_id,"has":defined(${field})}`,
    { type },
  );
  if (!doc?._id) {
    console.log(`  ⚠ ${label} : document introuvable (ignoré)`);
    return false;
  }
  if (doc.has && !FORCE) {
    console.log(`  • ${label} : déjà rempli (ignoré, FORCE=1 pour écraser)`);
    return false;
  }
  const assetId = await uploadAsset(srcLandscape(key), `${field}-${key}.jpg`);
  await client.patch(doc._id).set({ [field]: imageValue(assetId) }).commit();
  console.log(`  ✓ ${label} : image attachée`);
  return true;
}

async function seedHeroSlideshow(): Promise<number> {
  console.log(`\n=== Diaporama hero (${HERO_SLIDES.length} images) ===`);
  const doc: { _id: string; has: boolean } | null = await client.fetch(
    `*[_type=="homePage"][0]{_id,"has":count(heroImages)>0}`,
  );
  if (!doc?._id) {
    console.log("  ⚠ homePage introuvable (ignoré)");
    return 0;
  }
  if (doc.has && !FORCE) {
    console.log("  • diaporama déjà rempli (ignoré, FORCE=1 pour écraser)");
    return 0;
  }
  const members = [];
  for (const key of HERO_SLIDES) {
    const assetId = await uploadAsset(srcLandscape(key, 1920, 1080), `hero-slide-${key}.jpg`);
    members.push(imageMember(assetId));
  }
  await client.patch(doc._id).set({ heroImages: members }).commit();
  console.log(`  ✓ ${members.length} image(s) ajoutée(s) au diaporama`);
  return members.length;
}

async function seedServices(): Promise<number> {
  console.log(`\n=== Services (${Object.keys(SERVICE_IMAGES).length}) ===`);
  let count = 0;
  for (const [slug, conf] of Object.entries(SERVICE_IMAGES)) {
    const doc: { _id: string; hasHero: boolean; hasGallery: boolean } | null =
      await client.fetch(
        `*[_type=="service" && slug.current==$slug][0]{_id,"hasHero":defined(heroImage),"hasGallery":count(gallery)>0}`,
        { slug },
      );
    if (!doc?._id) {
      console.log(`  ⚠ ${slug} : service introuvable (ignoré)`);
      continue;
    }
    const patch: Record<string, unknown> = {};
    if (!doc.hasHero || FORCE) {
      const assetId = await uploadAsset(srcLandscape(conf.hero), `${slug}-hero.jpg`);
      patch.heroImage = imageValue(assetId);
    }
    if (!doc.hasGallery || FORCE) {
      const members = [];
      for (const g of conf.gallery) {
        const assetId = await uploadAsset(srcLandscape(g, 1200, 800), `${slug}-${g}.jpg`);
        members.push(imageMember(assetId, conf.alt));
      }
      patch.gallery = members;
    }
    if (Object.keys(patch).length === 0) {
      console.log(`  • ${slug} : déjà complet (ignoré)`);
      continue;
    }
    await client.patch(doc._id).set(patch).commit();
    console.log(`  ✓ ${slug} : ${Object.keys(patch).join(" + ")}`);
    count++;
  }
  return count;
}

async function seedArticles(): Promise<number> {
  console.log(`\n=== Articles (${Object.keys(ARTICLE_COVERS).length}) ===`);
  let count = 0;
  for (const [slug, key] of Object.entries(ARTICLE_COVERS)) {
    const doc: { _id: string; has: boolean } | null = await client.fetch(
      `*[_type=="article" && slug.current==$slug][0]{_id,"has":defined(coverImage)}`,
      { slug },
    );
    if (!doc?._id) {
      console.log(`  ⚠ ${slug} : article introuvable (ignoré)`);
      continue;
    }
    if (doc.has && !FORCE) {
      console.log(`  • ${slug} : couverture déjà présente (ignoré)`);
      continue;
    }
    const assetId = await uploadAsset(srcLandscape(key, 1600, 900), `article-${slug}.jpg`);
    await client.patch(doc._id).set({ coverImage: imageValue(assetId) }).commit();
    console.log(`  ✓ ${slug} : couverture attachée`);
    count++;
  }
  return count;
}

async function seedTeam(): Promise<number> {
  console.log(`\n=== Équipe (${Object.keys(TEAM_PHOTOS).length}) ===`);
  let count = 0;
  for (const [name, key] of Object.entries(TEAM_PHOTOS)) {
    const doc: { _id: string; has: boolean } | null = await client.fetch(
      `*[_type=="membreEquipe" && name==$name][0]{_id,"has":defined(photo)}`,
      { name },
    );
    if (!doc?._id) {
      console.log(`  ⚠ ${name} : membre introuvable (ignoré)`);
      continue;
    }
    if (doc.has && !FORCE) {
      console.log(`  • ${name} : photo déjà présente (ignoré)`);
      continue;
    }
    const assetId = await uploadAsset(srcPortrait(key), `team-${key}.jpg`);
    await client.patch(doc._id).set({ photo: imageValue(assetId) }).commit();
    console.log(`  ✓ ${name} : portrait attaché`);
    count++;
  }
  return count;
}

async function seedRealisations(): Promise<number> {
  console.log(`\n=== Réalisations-exemples (${SAMPLE_REALISATIONS.length}) ===`);
  let count = 0;
  for (const r of SAMPLE_REALISATIONS) {
    // Le champ `service` est requis : on résout l'_id du service par slug.
    const serviceId: string | null = await client.fetch(
      `*[_type=="service" && slug.current==$slug][0]._id`,
      { slug: r.serviceSlug },
    );
    if (!serviceId) {
      console.log(`  ⚠ ${r.id} : service « ${r.serviceSlug} » introuvable (ignoré)`);
      continue;
    }
    // Idempotence : on ne réécrit pas une réalisation déjà seedée sans FORCE.
    const exists = await client.fetch(`defined(*[_id==$id][0]._id)`, { id: r.id });
    if (exists && !FORCE) {
      console.log(`  • ${r.id} : déjà créée (ignoré)`);
      continue;
    }

    const beforeAsset = await uploadAsset(srcLandscape(r.before, 1200, 800), `${r.id}-avant.jpg`);
    const afterMembers = [];
    for (const a of r.after) {
      const assetId = await uploadAsset(srcLandscape(a, 1200, 800), `${r.id}-${a}.jpg`);
      afterMembers.push(imageMember(assetId));
    }

    await client.createOrReplace({
      _id: r.id,
      _type: "realisation",
      title: { _type: "localeString", ...r.title },
      slug: { _type: "slug", current: r.id.replace("seed-realisation-", "realisation-") },
      service: { _type: "reference", _ref: serviceId },
      location: r.location,
      date: r.date,
      description: { _type: "localeText", ...r.description },
      beforeImages: [imageMember(beforeAsset)],
      afterImages: afterMembers,
      featured: r.featured,
    });
    console.log(`  ✓ ${r.id} : créée (${afterMembers.length} image(s) « après »)`);
    count++;
  }
  return count;
}

// --- Point d'entrée --------------------------------------------------------
async function main() {
  console.log(
    `\n────────────────────────────────────────────────────────\n` +
      ` Seed d'images SP Smart → Sanity\n` +
      ` Projet  : ${projectId}\n` +
      ` Dataset : ${dataset}\n` +
      ` Mode    : ${FORCE ? "FORCE (écrase l'existant)" : "incrémental (champs vides)"}\n` +
      `────────────────────────────────────────────────────────`,
  );

  // Mode ciblé : remplacer UNIQUEMENT le hero d'accueil par une photo choisie,
  // en 16:9, sans toucher au reste du contenu.
  //   HERO_KEY=ingenieurCasque npm run seed-images
  if (process.env.HERO_KEY) {
    const key = process.env.HERO_KEY as PhotoKey;
    if (!(key in PHOTO)) {
      exit(`HERO_KEY inconnue : « ${key} ». Clés valides : ${Object.keys(PHOTO).join(", ")}`);
    }
    const homeId: string | null = await client.fetch(`*[_type=="homePage"][0]._id`);
    if (!homeId) exit("Document homePage introuvable.");
    const assetId = await uploadAsset(srcLandscape(key, 1920, 1080), `home-hero-${key}.jpg`);
    await client.patch(homeId).set({ heroImage: imageValue(assetId) }).commit();
    console.log(`\n✓ Hero d'accueil remplacé par « ${key} » (1920×1080).\n`);
    return;
  }

  console.log(`\n=== Singletons ===`);
  const home = await seedSingletonImage("homePage", "heroImage", "ingenieurCasque", "Accueil — hero (repli)");
  const about = await seedSingletonImage("aboutPage", "image", "equipeReunion", "À propos — image");

  const heroSlides = await seedHeroSlideshow();
  const services = await seedServices();
  const articles = await seedArticles();
  const team = await seedTeam();
  const realisations = await seedRealisations();

  console.log(
    `\n────────────────────────────────────────────────────────\n` +
      ` ✓ Seed terminé.\n` +
      `   • Accueil hero      : ${home ? "mis à jour" : "inchangé"}\n` +
      `   • Diaporama hero    : ${heroSlides} image(s)\n` +
      `   • À propos image    : ${about ? "mis à jour" : "inchangé"}\n` +
      `   • Services          : ${services} mis à jour\n` +
      `   • Articles          : ${articles} couverture(s)\n` +
      `   • Équipe            : ${team} portrait(s)\n` +
      `   • Réalisations      : ${realisations} créée(s)\n` +
      `   • Assets uniques    : ${assetCache.size} téléversé(s)\n` +
      `────────────────────────────────────────────────────────\n` +
      ` Photos libres : Unsplash (https://unsplash.com/license) et\n` +
      ` Pexels (https://www.pexels.com/license/) — gratuites, usage\n` +
      ` commercial, sans attribution obligatoire. Visuels d'illustration :\n` +
      ` remplace-les par tes propres photos de chantier dans /studio.\n` +
      `────────────────────────────────────────────────────────`,
  );
}

main().catch((error) => {
  console.error("\n✗ Erreur fatale durant le seed :", error);
  process.exit(1);
});
