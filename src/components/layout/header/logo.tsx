import { Link } from "@/i18n/navigation";
import { SanityImage } from "@/components/sanity-image";
import type { SiteSettings } from "../../../../sanity/lib/types";

/**
 * Hauteur d'affichage du logo en px (150). Sert de base au calcul des
 * dimensions demandées à Sanity (rendu 2x rétine).
 */
const LOGO_HEIGHT_DESKTOP = 150;

/**
 * Déduit le ratio largeur/hauteur d'une image Sanity depuis son `_ref`
 * (format `image-<id>-<largeur>x<hauteur>-<ext>`). Repli sur 10:3 si absent.
 */
function aspectRatioFromRef(ref?: string): number {
  const match = ref?.match(/-(\d+)x(\d+)-/);
  if (!match) return 10 / 3;
  const [, w, h] = match;
  return Number(w) / Number(h);
}

/**
 * Logo cliquable (image Sanity) avec repli sur le nom de l'entreprise.
 * Les dimensions respectent le ratio réel du fichier pour éviter tout
 * recadrage ou déformation (le logo n'est jamais coupé en haut/bas).
 */
export function Logo({ settings }: { settings: SiteSettings }) {
  const name = settings?.companyName ?? "SP Smart Sarl";

  // Dimensions demandées à Sanity à partir du ratio réel, sur une base 2x
  // (hauteur desktop ×2) pour rester net sur écrans haute densité.
  const ratio = aspectRatioFromRef(settings?.logo?.asset?._ref);
  const height = LOGO_HEIGHT_DESKTOP * 2;
  const width = Math.round(height * ratio);

  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-bold text-brand"
      aria-label={name}
    >
      {settings?.logo?.asset?._ref ? (
        <SanityImage
          image={settings.logo}
          alt={name}
          width={width}
          height={height}
          priority
          className="h-[150px] w-auto"
        />
      ) : (
        // Logo texte de secours : nom de l'entreprise en bold, bleu marque.
        <span className="whitespace-nowrap text-xl font-extrabold tracking-tight text-brand md:text-2xl">
          {name}
        </span>
      )}
    </Link>
  );
}
