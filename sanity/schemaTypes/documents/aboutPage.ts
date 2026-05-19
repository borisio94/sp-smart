import { defineType, defineField } from "sanity";
import { UsersIcon } from "@sanity/icons";

/**
 * Page « À propos » (document unique / singleton).
 * Histoire, mission, valeurs. L'équipe et les partenaires proviennent
 * de leurs propres documents.
 */
export const aboutPage = defineType({
  name: "aboutPage",
  title: "Page À propos",
  type: "document",
  icon: UsersIcon,
  groups: [
    { name: "contenu", title: "Contenu", default: true },
    { name: "sections", title: "Titres de sections" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Titre de la page (FR / EN)",
      type: "localeString",
      group: "contenu",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Introduction / Histoire (FR / EN)",
      type: "localeBlockContent",
      group: "contenu",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      group: "contenu",
      options: { hotspot: true },
    }),
    defineField({
      name: "missionTitle",
      title: "Titre « Mission » (FR / EN)",
      type: "localeString",
      group: "contenu",
    }),
    defineField({
      name: "missionText",
      title: "Mission (FR / EN)",
      type: "localeText",
      group: "contenu",
    }),
    defineField({
      name: "values",
      title: "Valeurs",
      type: "array",
      group: "contenu",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "icon", title: "Icône (Lucide)", type: "string" }),
            defineField({
              name: "title",
              title: "Titre (FR / EN)",
              type: "localeString",
            }),
            defineField({
              name: "description",
              title: "Description (FR / EN)",
              type: "localeText",
            }),
          ],
          preview: { select: { title: "title.fr" } },
        },
      ],
    }),
    defineField({
      name: "teamTitle",
      title: "Titre section Équipe (FR / EN)",
      type: "localeString",
      group: "sections",
    }),
    defineField({
      name: "partnersTitle",
      title: "Titre section Partenaires (FR / EN)",
      type: "localeString",
      group: "sections",
    }),
    defineField({ name: "seo", title: "Référencement", type: "seo", group: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Page À propos" }) },
});
