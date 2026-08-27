"use client";

import { normalizeLocale, getDictionary, LOCALE_COOKIE_NAME } from "@/lib/i18n/config";

function getClientLocale() {
  if (typeof document === "undefined") return "en" as const;
  const localeCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split("=")[1];
  return normalizeLocale(localeCookie);
}

export default function ProtectedError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const dictionary = getDictionary(getClientLocale());

  return (
    <div className="standalone-message standalone-message--inline">
      <h1>{dictionary.error.title}</h1>
      <p>{dictionary.error.description}</p>
      <button className="button button--primary" type="button" onClick={reset}>{dictionary.error.retry}</button>
    </div>
  );
}
