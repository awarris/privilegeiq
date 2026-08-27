import { getDictionary, translateEnum, type Locale } from "@/lib/i18n/config";

export function formatDateTime(
  value: Date | string | null | undefined,
  locale: Locale = "en",
): string {
  if (!value) return getDictionary(locale).common.never;

  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeDays(
  value: Date | string | null | undefined,
  locale: Locale = "en",
): string {
  const dictionary = getDictionary(locale);
  if (!value) return dictionary.common.neverActive;

  const date = new Date(value);
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));

  if (days === 0) return dictionary.common.today;
  if (days === 1) return dictionary.common.oneDayAgo;
  return dictionary.common.daysAgo(days);
}

export function humanizeEnum(value: string, locale: Locale = "en"): string {
  return translateEnum(value, locale);
}
