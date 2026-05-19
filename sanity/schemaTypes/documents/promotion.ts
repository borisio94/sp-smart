import { defineType, defineField } from "sanity";
import { TagIcon } from "@sanity/icons";

/**
 * Promotion / offre commerciale (durée limitée, code promo, bannière home).
 */
export const promotion = defineType({
  name: "promotion",
  title: "Promotion",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      title: "Titre (FR / EN)",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description (FR / EN)",
      type: "localeText",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "services",
      title: "Services concernés",
      type: "array",
      of: [{ type: "reference", to: [{ type: "service" }] }],
    }),
    defineField({
      name: "startDate",
      title: "Date de début",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "Date de fin",
      type: "datetime",
      validation: (rule) =>
        rule.required().min(rule.valueOfField("startDate")),
    }),
    defineField({
      name: "discountType",
      title: "Type de remise",
      type: "string",
      options: {
        list: [
          { title: "Pourcentage", value: "percent" },
          { title: "Montant fixe", value: "amount" },
        ],
        layout: "radio",
      },
    }),
    defineField({ name: "discountValue", title: "Valeur de la remise", type: "number" }),
    defineField({ name: "promoCode", title: "Code promo", type: "string" }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "homeBanner",
      title: "Afficher en bannière sur l'accueil",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title.fr", media: "image", active: "active" },
    prepare({ title, media, active }) {
      return {
        title: title ?? "(sans titre)",
        subtitle: active ? "Active" : "Inactive",
        media,
      };
    },
  },
});
