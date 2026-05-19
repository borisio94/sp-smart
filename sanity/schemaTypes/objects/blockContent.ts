import { defineType, defineArrayMember } from "sanity";

/**
 * Contenu riche (Portable Text) : titres, paragraphes, listes, liens, images.
 * Réutilisé par les versions FR et EN de `localeBlockContent`.
 */
export const blockContent = defineType({
  name: "blockContent",
  title: "Contenu riche",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraphe", value: "normal" },
        { title: "Titre 2", value: "h2" },
        { title: "Titre 3", value: "h3" },
        { title: "Titre 4", value: "h4" },
        { title: "Citation", value: "blockquote" },
      ],
      lists: [
        { title: "Puces", value: "bullet" },
        { title: "Numérotée", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Gras", value: "strong" },
          { title: "Italique", value: "em" },
          { title: "Souligné", value: "underline" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Lien",
            fields: [
              {
                name: "href",
                type: "url",
                title: "URL",
                validation: (rule) =>
                  rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto", "tel"] }),
              },
              {
                name: "blank",
                type: "boolean",
                title: "Ouvrir dans un nouvel onglet",
                initialValue: false,
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      title: "Image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Texte alternatif (accessibilité / SEO)",
          validation: (rule) => rule.required(),
        },
      ],
    }),
  ],
});
