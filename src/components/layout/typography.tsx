import { cn } from "@/lib/utils";

const HEADING_STYLES: Record<number, string> = {
  1: "text-4xl font-bold tracking-tight sm:text-5xl",
  2: "text-3xl font-bold tracking-tight sm:text-4xl",
  3: "text-2xl font-semibold tracking-tight sm:text-3xl",
  4: "text-xl font-semibold tracking-tight",
};

type HeadingProps = React.ComponentProps<"h2"> & {
  level?: 1 | 2 | 3 | 4;
};

/** Titre de section, niveau sémantique configurable. */
export function Heading({
  level = 2,
  className,
  children,
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  return (
    <Tag className={cn(HEADING_STYLES[level], className)} {...props}>
      {children}
    </Tag>
  );
}

/** Paragraphe d'introduction (accroche sous un titre). */
export function Lead({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "mt-4 max-w-2xl text-lg text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Sur-titre / label de section (petites majuscules colorées marque). */
export function Eyebrow({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-sm font-semibold uppercase tracking-wider text-brand",
        className,
      )}
      {...props}
    />
  );
}
