import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Composants/fonctions de navigation conscients de la langue.
 * Utiliser ce `Link` et ces helpers partout (jamais next/link directement).
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
