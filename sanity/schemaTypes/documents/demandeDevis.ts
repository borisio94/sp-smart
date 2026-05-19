import { defineType, defineField } from "sanity";
import { DocumentsIcon } from "@sanity/icons";

/**
 * Demande de devis (créée automatiquement par le formulaire du site).
 * En lecture seule dans l'administration (champs non éditables, sauf statut).
 */
export const demandeDevis = defineType({
  name: "demandeDevis",
  title: "Demande de devis",
  type: "document",
  icon: DocumentsIcon,
  // Champs renseignés par le site : non modifiables à la main
  readOnly: ({ currentUser }) => !currentUser,
  fields: [
    defineField({ name: "name", title: "Nom", type: "string", readOnly: true }),
    defineField({ name: "email", title: "Email", type: "string", readOnly: true }),
    defineField({ name: "phone", title: "Téléphone", type: "string", readOnly: true }),
    defineField({
      name: "service",
      title: "Service demandé",
      type: "reference",
      to: [{ type: "service" }],
      readOnly: true,
    }),
    defineField({
      name: "description",
      title: "Description du besoin",
      type: "text",
      rows: 5,
      readOnly: true,
    }),
    defineField({
      name: "status",
      title: "Statut",
      type: "string",
      options: {
        list: [
          { title: "Nouveau", value: "nouveau" },
          { title: "Traité", value: "traite" },
          { title: "Converti", value: "converti" },
          { title: "Annulé", value: "annule" },
        ],
        layout: "radio",
      },
      initialValue: "nouveau",
    }),
    defineField({
      name: "createdAt",
      title: "Reçue le",
      type: "datetime",
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: "Plus récentes",
      name: "createdDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "status", date: "createdAt" },
    prepare({ title, subtitle, date }) {
      const d = date ? new Date(date).toLocaleDateString("fr-FR") : "";
      return { title: title ?? "(anonyme)", subtitle: `${subtitle ?? "nouveau"} — ${d}` };
    },
  },
});
