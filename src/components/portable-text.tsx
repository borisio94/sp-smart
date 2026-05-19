import {
  PortableText as PortableTextBase,
  type PortableTextComponents,
} from "@portabletext/react";

import { SanityImage } from "@/components/sanity-image";
import type { SanityImageRef } from "../../sanity/lib/types";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="my-4 leading-relaxed">{children}</p>,
    h2: ({ children }) => (
      <h2 className="mt-10 mb-4 text-2xl font-bold tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 mb-3 text-xl font-semibold tracking-tight">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-6 mb-2 text-lg font-semibold">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-brand pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-4 list-disc space-y-1 pl-6">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="my-4 list-decimal space-y-1 pl-6">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.blank ? "_blank" : undefined}
        rel={value?.blank ? "noopener noreferrer" : undefined}
        className="text-brand underline underline-offset-2 hover:opacity-80"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }: { value: SanityImageRef & { alt?: string } }) => (
      <SanityImage
        image={value}
        alt={value?.alt ?? ""}
        width={1200}
        height={800}
        className="my-6 h-auto w-full rounded-lg"
      />
    ),
  },
};

/**
 * Rendu d'un contenu riche Sanity (Portable Text), déjà localisé en amont.
 */
export function PortableText({ value }: { value: unknown[] }) {
  if (!value || value.length === 0) return null;
  return (
    <div className="text-foreground/90">
      <PortableTextBase
        value={value as never}
        components={components}
      />
    </div>
  );
}
