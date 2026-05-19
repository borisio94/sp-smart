import type { StructureResolver } from "sanity/structure";

/**
 * Organisation du menu de l'administration (en français).
 * `siteSettings` est un singleton : un seul document, pas de liste.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Contenu")
    .items([
      S.listItem()
        .title("Page d'accueil")
        .id("homePage")
        .child(S.document().schemaType("homePage").documentId("homePage")),
      S.listItem()
        .title("Page À propos")
        .id("aboutPage")
        .child(S.document().schemaType("aboutPage").documentId("aboutPage")),
      S.documentTypeListItem("legalPage").title("Pages légales"),
      S.listItem()
        .title("Paramètres du site")
        .id("siteSettings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
      S.divider(),
      S.documentTypeListItem("service").title("Services"),
      S.documentTypeListItem("realisation").title("Réalisations"),
      S.documentTypeListItem("promotion").title("Promotions"),
      S.documentTypeListItem("temoignage").title("Témoignages"),
      S.divider(),
      S.documentTypeListItem("article").title("Articles (blog)"),
      S.documentTypeListItem("categorieBlog").title("Catégories de blog"),
      S.divider(),
      S.documentTypeListItem("membreEquipe").title("Équipe"),
      S.documentTypeListItem("partenaire").title("Partenaires"),
      S.documentTypeListItem("faq").title("FAQ"),
      S.divider(),
      S.documentTypeListItem("demandeDevis").title("Demandes de devis"),
      S.documentTypeListItem("rendezVous").title("Rendez-vous"),
    ]);
