import { defineType, defineField } from "sanity";
import { UsersIcon } from "@sanity/icons";

/**
 * Partenaire ou marque (logos affichés sur le site).
 */
export const partenaire = defineType({
  name: "partenaire",
  title: "Partenaire",
  type: "document",
  icon: UsersIcon,
  fields: [
    defineField({
      name: "name",
      title: "Nom",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "url", title: "Lien (optionnel)", type: "url" }),
    defineField({
      name: "order",
      title: "Ordre d'affichage",
      type: "number",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Ordre d'affichage",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: { select: { title: "name", media: "logo" } },
});
