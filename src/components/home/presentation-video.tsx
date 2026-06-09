import { pickLocale } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { urlForImage } from "../../../sanity/lib/image";
import type { HomePage } from "../../../sanity/lib/types";

/**
 * Section « vidéo de présentation » de l'accueil : lecteur d'un fichier vidéo
 * téléversé dans Sanity (avec image d'aperçu). Ne s'affiche que si une vidéo
 * est renseignée — respecte la règle zéro hard-coding.
 */
export function PresentationVideo({
  data,
  locale,
}: {
  data: HomePage;
  locale: string;
}) {
  const videoUrl = data?.presentationVideoUrl;
  if (!videoUrl) return null;

  const title = pickLocale(data?.presentationTitle, locale);
  const text = pickLocale(data?.presentationText, locale);
  const poster = data?.presentationPoster?.asset?._ref
    ? urlForImage(data.presentationPoster).width(1280).height(720).url()
    : undefined;

  return (
    <Section tone="muted">
      {title && <SectionHeader title={title} lead={text ?? undefined} />}
      <div className="mx-auto max-w-4xl overflow-hidden rounded-xl shadow-lg ring-1 ring-foreground/10">
        <video
          className="aspect-video size-full bg-black"
          controls
          preload="metadata"
          poster={poster}
        >
          <source src={videoUrl} />
        </video>
      </div>
    </Section>
  );
}
