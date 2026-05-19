import { defineType, defineField } from "sanity";

/**
 * Texte multi-lignes bilingue (description courte, accroche).
 */
export const localeText = defineType({
  name: "localeText",
  title: "Texte long (FR / EN)",
  type: "object",
  fields: [
    defineField({
      name: "fr",
      title: "Français",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "en",
      title: "Anglais",
      type: "text",
      rows: 4,
    }),
  ],
});
