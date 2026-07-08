import type { Lang } from "@/types/db";

export const LANGS: Lang[] = ["ar", "en", "ku"];

export const LANG_LABELS: Record<Lang, string> = {
  ar: "Arabic",
  en: "English",
  ku: "Kurdish",
};

// Arabic and Kurdish (Sorani) are written right-to-left.
export const RTL_LANGS: Lang[] = ["ar", "ku"];
export const isRTL = (lang: Lang) => RTL_LANGS.includes(lang);

/**
 * Read a trilingual value off a row using `<base>_<lang>` columns, falling
 * back to English when the requested language is empty. Mirrors the
 * render-time fallback the website uses.
 *
 *   pick(car, "name", "ku")  ->  car.name_ku ?? car.name_en ?? ""
 */
export function pick<T extends object>(
  row: T | null | undefined,
  base: string,
  lang: Lang = "en"
): string {
  if (!row) return "";
  const r = row as Record<string, unknown>;
  const val = r[`${base}_${lang}`] as string | null | undefined;
  if (val && val.trim()) return val;
  const en = r[`${base}_en`] as string | null | undefined;
  return en?.trim() ? en : "";
}
