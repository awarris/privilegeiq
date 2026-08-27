"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE_NAME, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();

  function setLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;

    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    router.refresh();
  }

  return (
    <div className="language-switcher" role="group" aria-label={label} title={label}>
      <button
        type="button"
        className={locale === "en" ? "language-switcher__button language-switcher__button--active" : "language-switcher__button"}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={locale === "fr" ? "language-switcher__button language-switcher__button--active" : "language-switcher__button"}
        onClick={() => setLocale("fr")}
        aria-pressed={locale === "fr"}
      >
        FR
      </button>
    </div>
  );
}
