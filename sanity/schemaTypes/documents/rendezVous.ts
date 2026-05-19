import { defineType, defineField } from "sanity";
import { CalendarIcon } from "@sanity/icons";

/**
 * Prise de rendez-vous (créée automatiquement par le formulaire du site).
 * En lecture seule dans l'administration (sauf le statut).
 */
export const rendezVous = defineType({
  name: "rendezVous",
  title: "Rendez-vous",
  type: "document",
  icon: CalendarIcon,
  readOnly: ({ currentUser }) => !currentUser,
  fields: [
    defineField({ name: "name", title: "Nom", type: "string", readOnly: true }),
    defineField({ name: "email", title: "Email", type: "string", readOnly: true }),
    defineField({ name: "phone", title: "Téléphone", type: "string", readOnly: true }),
    defineField({
      name: "service",
      title: "Service concerné",
      type: "reference",
      to: [{ type: "service" }],
      readOnly: true,
    }),
    defineField({
      name: "requestedAt",
      title: "Date et heure souhaitées",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "message",
      title: "Message",
      type: "text",
      rows: 4,
      readOnly: true,
    }),
    defineField({
      name: "status",
      title: "Statut",
      type: "string",
      options: {
        list: [
          { title: "Nouveau", value: "nouveau" },
          { title: "Confirmé", value: "confirme" },
          { title: "Honoré", value: "honore" },
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
      title: "Date souhaitée (proche → lointain)",
      name: "requestedAsc",
      by: [{ field: "requestedAt", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "status", date: "requestedAt" },
    prepare({ title, subtitle, date }) {
      const d = date ? new Date(date).toLocaleString("fr-FR") : "";
      return { title: title ?? "(anonyme)", subtitle: `${subtitle ?? "nouveau"} — ${d}` };
    },
  },
});
