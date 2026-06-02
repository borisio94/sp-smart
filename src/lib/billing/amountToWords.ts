/**
 * Conversion d'un montant entier en lettres (français), pour les documents.
 * Gère les règles françaises : « quatre-vingts », « cent » pluriel, « mille »
 * invariable, « millions/milliards » accordés. Devise : francs CFA.
 *
 * Exemples :
 *   1            → « un »
 *   80           → « quatre-vingts »
 *   200          → « deux cents »
 *   1 000 000    → « un million »
 *   1 250 000    → « un million deux cent cinquante mille »
 */

const UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];

const TENS = [
  "", "", "vingt", "trente", "quarante", "cinquante",
  "soixante", "soixante", "quatre-vingt", "quatre-vingt",
];

/** Convertit un entier 0..999 en lettres. */
function below1000(n: number): string {
  if (n === 0) return "";
  if (n < 20) return UNITS[n];

  if (n < 100) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;

    // 70-79 et 90-99 : base soixante / quatre-vingt + (10..19)
    if (ten === 7 || ten === 9) {
      const base = TENS[ten];
      const rest = below1000(10 + unit); // 10..19
      // 71 = « soixante et onze » (cas particulier) ; 91 = « quatre-vingt-onze »
      if (unit === 1 && ten === 7) {
        return `${base} et ${rest}`;
      }
      return `${base}-${rest}`;
    }

    const base = TENS[ten];
    if (unit === 0) {
      // « quatre-vingts » prend un s ; « vingt/trente… » non
      return ten === 8 ? "quatre-vingts" : base;
    }
    // 21, 31, 41, 51, 61 → « et un » ; pas 81/91 (gérés ci-dessus)
    if (unit === 1 && ten !== 8) {
      return `${base} et un`;
    }
    return `${base}-${UNITS[unit]}`;
  }

  // 100..999
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let prefix: string;
  if (hundreds === 1) {
    prefix = "cent";
  } else {
    prefix = `${UNITS[hundreds]} cent`;
  }
  if (rest === 0) {
    // « deux cents » pluriel si rien après ; « cent » seul invariable
    return hundreds > 1 ? `${prefix}s` : prefix;
  }
  return `${prefix} ${below1000(rest)}`;
}

/** Convertit un entier positif en lettres françaises. */
export function integerToWords(value: number): string {
  let n = Math.floor(Math.abs(value));
  if (n === 0) return "zéro";

  const billions = Math.floor(n / 1_000_000_000);
  n %= 1_000_000_000;
  const millions = Math.floor(n / 1_000_000);
  n %= 1_000_000;
  const thousands = Math.floor(n / 1_000);
  const rest = n % 1_000;

  const parts: string[] = [];

  if (billions > 0) {
    const w = below1000(billions);
    parts.push(billions === 1 ? "un milliard" : `${w} milliards`);
  }
  if (millions > 0) {
    const w = below1000(millions);
    parts.push(millions === 1 ? "un million" : `${w} millions`);
  }
  if (thousands > 0) {
    // « mille » est invariable ; « un mille » → « mille »
    parts.push(thousands === 1 ? "mille" : `${below1000(thousands)} mille`);
  }
  if (rest > 0) {
    parts.push(below1000(rest));
  }

  return parts.join(" ").trim();
}

/**
 * Montant en toutes lettres avec la devise, première lettre en majuscule.
 * Ex : 1 250 000 → « Un million deux cent cinquante mille francs CFA ».
 */
export function amountToWords(value: number): string {
  const words = integerToWords(value);
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} francs CFA`;
}
