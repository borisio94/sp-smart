import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Heading, Lead } from "@/components/layout/typography";
import { ButtonLink } from "@/components/ui/button-link";
import { ContactForm } from "@/components/forms/contact-form";
import { sanityFetch } from "../../../../../sanity/lib/fetch";
import { siteSettingsQuery } from "../../../../../sanity/lib/queries";
import type { SiteSettings } from "../../../../../sanity/lib/types";

const DAY_ORDER = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Nav" });
  return { title: t("contact") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Nav");
  const settings = await sanityFetch<SiteSettings>(
    siteSettingsQuery,
    {},
    null,
  );

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const geo = settings?.geo;
  const mapUrl =
    mapsKey && mapsKey !== "A_REMPLIR" && geo?.lat && geo?.lng
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${geo.lat},${geo.lng}`
      : null;

  const hours = (settings?.openingHours ?? [])
    .slice()
    .sort(
      (a, b) =>
        DAY_ORDER.indexOf(a.day ?? "") - DAY_ORDER.indexOf(b.day ?? ""),
    );

  return (
    <Section>
      <Heading level={1}>{t("contact")}</Heading>
      <Lead>{t("appointment")} — {t("quote")}</Lead>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        {/* Coordonnées */}
        <div className="space-y-6">
          {settings?.phones && settings.phones.length > 0 && (
            <ContactRow icon={<Phone className="size-5" />} label="Téléphone">
              {settings.phones.map((p) => (
                <a
                  key={p}
                  href={`tel:${p.replace(/\s/g, "")}`}
                  className="block hover:text-brand"
                >
                  {p}
                </a>
              ))}
            </ContactRow>
          )}

          {settings?.emails && settings.emails.length > 0 && (
            <ContactRow icon={<Mail className="size-5" />} label="Email">
              {settings.emails.map((e) => (
                <a
                  key={e}
                  href={`mailto:${e}`}
                  className="block hover:text-brand"
                >
                  {e}
                </a>
              ))}
            </ContactRow>
          )}

          {settings?.address && (
            <ContactRow icon={<MapPin className="size-5" />} label="Adresse">
              <p className="whitespace-pre-line">{settings.address}</p>
            </ContactRow>
          )}

          {settings?.whatsappNumber && (
            <ContactRow
              icon={<MessageCircle className="size-5" />}
              label="WhatsApp"
            >
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand"
              >
                {settings.whatsappNumber}
              </a>
            </ContactRow>
          )}

          {hours.length > 0 && (
            <ContactRow icon={<Clock className="size-5" />} label="Horaires">
              <ul className="space-y-1">
                {hours.map((h) => (
                  <li key={h.day} className="flex justify-between gap-6">
                    <span className="capitalize">{h.day}</span>
                    <span className="text-muted-foreground">
                      {h.closed ? "Fermé" : `${h.open ?? "?"} – ${h.close ?? "?"}`}
                    </span>
                  </li>
                ))}
              </ul>
            </ContactRow>
          )}

          <div className="rounded-lg border bg-muted/30 p-6">
            <ContactForm />
            <div className="mt-6 flex gap-3 border-t pt-4">
              <ButtonLink variant="outline" href="/devis">
                {t("quote")}
              </ButtonLink>
              <ButtonLink variant="outline" href="/rendez-vous">
                {t("appointment")}
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* Carte */}
        <div className="min-h-80 overflow-hidden rounded-xl border bg-muted">
          {mapUrl ? (
            <iframe
              src={mapUrl}
              title="Carte"
              className="size-full min-h-80"
              loading="lazy"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full min-h-80 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              {"La carte s'affichera une fois la clé Google Maps et les coordonnées GPS renseignées."}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-brand">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{label}</p>
        <div className="mt-1 text-sm">{children}</div>
      </div>
    </div>
  );
}
