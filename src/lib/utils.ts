/** Minimal className joiner (truthy values only). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Build a URL-safe slug from an English name.
 *   "Tucson N Line"  ->  "tucson-n-line"
 * Non-latin input collapses to empty, which the caller should treat as
 * "English name required".
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")     // non-alphanumeric -> hyphen
    .replace(/^-+|-+$/g, "")         // trim hyphens
    .replace(/-{2,}/g, "-");         // collapse repeats
}
