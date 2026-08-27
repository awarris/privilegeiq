"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { getDictionary, type Locale } from "@/lib/i18n/config";

export function ThemeToggle({ locale }: { locale: Locale }) {
  const [dark, setDark] = useState(false);
  const dictionary = getDictionary(locale);

  useEffect(() => {
    const saved = localStorage.getItem("privilegeiq-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = saved ? saved === "dark" : prefersDark;

    document.documentElement.dataset.theme = useDark ? "dark" : "light";

    // Defer the React state synchronization so the effect itself only syncs
    // with the browser theme state and does not trigger a synchronous cascade.
    const frame = window.requestAnimationFrame(() => setDark(useDark));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("privilegeiq-theme", next ? "dark" : "light");
  }

  return (
    <button
      className="icon-button"
      type="button"
      onClick={toggle}
      aria-label={dictionary.shell.toggleTheme}
      title={dictionary.shell.toggleTheme}
    >
      <Icon name={dark ? "sun" : "moon"} size={17} />
    </button>
  );
}
