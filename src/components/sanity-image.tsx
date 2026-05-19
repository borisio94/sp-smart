import Image from "next/image";

import { urlForImage } from "../../sanity/lib/image";
import type { SanityImageRef } from "../../sanity/lib/types";

type Props = {
  image: SanityImageRef | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

/**
 * Image optimisée servie depuis Sanity (WebP auto, lazy loading).
 * Ne rend rien si aucune image n'est définie (évite les erreurs).
 */
export function SanityImage({
  image,
  alt,
  width,
  height,
  className,
  priority,
  sizes,
}: Props) {
  if (!image?.asset?._ref) return null;

  const src = urlForImage(image).width(width).height(height).url();

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  );
}
