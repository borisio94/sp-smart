import { defineType, defineField } from "sanity";

/**
 * Bouton d'appel à l'action configurable (libellé bilingue + destination).
 */
export const ctaButton = defineType({
  name: "ctaButton",
  title: "Bouton d'action",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Libellé (FR / EN)",
      type: "localeString",
    }),
    defineField({
      name: "href",
      title: "Lien (chemin interne ou URL)",
      type: "string",
      description: "Ex : /devis  ou  https://...",
    }),
    defineField({
      name: "variant",
      title: "Style",
      type: "string",
      options: {
        list: [
          { title: "Principal", value: "primary" },
          { title: "Secondaire", value: "secondary" },
          { title: "Contour", value: "outline" },
        ],
        layout: "radio",
      },
      initialValue: "primary",
    }),
  ],
});
