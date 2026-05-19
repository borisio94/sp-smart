import { defineType, defineField } from "sanity";

/**
 * Métadonnées de référencement (SEO) d'une page ou d'un document.
 * Si vide, le site utilise des valeurs par défaut (titre, description courte).
 */
export const seo = defineType({
  name: "seo",
  title: "Référencement (SEO)",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "metaTitle",
      title: "Titre SEO (FR / EN)",
      description: "55-60 caractères conseillés.",
      type: "localeString",
    }),
    defineField({
      name: "metaDescription",
      title: "Description SEO (FR / EN)",
      description: "150-160 caractères conseillés.",
      type: "localeText",
    }),
    defineField({
      name: "keywords",
      title: "Mots-clés",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "ogImage",
      title: "Image de partage (réseaux sociaux)",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "noIndex",
      title: "Masquer cette page des moteurs de recherche",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
