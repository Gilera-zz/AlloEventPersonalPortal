import type { Lang } from "./i18n";

export function localized(
  row: any,
  field: string,
  lang: Lang,
): string | null {
  if (lang === "en") {
    const en = row[`${field}_en`];
    if (typeof en === "string" && en.trim().length > 0) return en;
  }
  const sv = row[field];
  return typeof sv === "string" ? sv : null;
}
