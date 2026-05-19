import { defineType, defineField } from "sanity";

/**
 * Chaîne de texte bilingue (titre, libellé court).
 * FR = obligatoire (langue par défaut). EN = optionnel (secondaire).
 */
export const localeString = defineType({
  name: "localeString",
  title: "Texte (FR / EN)",
  type: "object",
  fields: [
    defineField({
      name: "fr",
      title: "Français",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "en",
      title: "Anglais",
      type: "string",
    }),
  ],
});
