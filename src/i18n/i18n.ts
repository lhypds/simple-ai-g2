import { TRANSLATIONS, type Locale, type Translations } from "./translations";

export type { Locale };

const LOCALES = Object.keys(TRANSLATIONS) as Locale[];

function detectLocale(): Locale {
  const lang = navigator.language.toLowerCase();
  // Map browser tags that won't match our custom locale keys directly.
  if (lang.startsWith("zh-tw") || lang.startsWith("zh-hant")) return "zt";
  if (lang.startsWith("zh")) return "zh";
  return (LOCALES.find((l) => lang.startsWith(l)) as Locale | undefined) ?? "en";
}

export function parseLocale(value: string): Locale {
  return (LOCALES.find((l) => l === value) as Locale | undefined) ?? detectLocale();
}

let current: Translations = TRANSLATIONS.en;

export function setLocale(locale: Locale): void {
  current = TRANSLATIONS[locale];
}

export function t(key: keyof Omit<Translations, "message">): string {
  return current[key] as string;
}

export function msg(key: keyof Translations["message"]): string {
  return current.message[key];
}

export const UI_LANGUAGES: Array<{ value: string; label: string }> = [
  { value: "", label: "Auto (system)" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文（简体）" },
  { value: "zt", label: "中文（繁體）" },
  { value: "ko", label: "한국어" },
];
