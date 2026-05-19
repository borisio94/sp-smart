/**
 * Registre de tous les schémas Sanity du projet.
 */
import type { SchemaTypeDefinition } from "sanity";

// Types objets réutilisables (i18n FR/EN, SEO, etc.)
import { localeString } from "./objects/localeString";
import { localeText } from "./objects/localeText";
import { blockContent } from "./objects/blockContent";
import { localeBlockContent } from "./objects/localeBlockContent";
import { seo } from "./objects/seo";
import { openingHours } from "./objects/openingHours";
import { ctaButton } from "./objects/ctaButton";

// Documents
import { homePage } from "./documents/homePage";
import { aboutPage } from "./documents/aboutPage";
import { legalPage } from "./documents/legalPage";
import { siteSettings } from "./documents/siteSettings";
import { service } from "./documents/service";
import { realisation } from "./documents/realisation";
import { temoignage } from "./documents/temoignage";
import { promotion } from "./documents/promotion";
import { article } from "./documents/article";
import { categorieBlog } from "./documents/categorieBlog";
import { membreEquipe } from "./documents/membreEquipe";
import { partenaire } from "./documents/partenaire";
import { faq } from "./documents/faq";
import { demandeDevis } from "./documents/demandeDevis";
import { rendezVous } from "./documents/rendezVous";

export const schemaTypes: SchemaTypeDefinition[] = [
  // Objets
  localeString,
  localeText,
  blockContent,
  localeBlockContent,
  seo,
  openingHours,
  ctaButton,
  // Documents
  homePage,
  aboutPage,
  legalPage,
  siteSettings,
  service,
  realisation,
  temoignage,
  promotion,
  article,
  categorieBlog,
  membreEquipe,
  partenaire,
  faq,
  demandeDevis,
  rendezVous,
];
