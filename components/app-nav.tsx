"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { getDictionary, type Locale } from "@/lib/i18n/config";

export function AppNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const dictionary = getDictionary(locale);

  const items: Array<{ href: string; label: string; icon: IconName }> = [
    { href: "/dashboard", label: dictionary.nav.overview, icon: "dashboard" },
    { href: "/users", label: dictionary.nav.users, icon: "users" },
    { href: "/roles", label: dictionary.nav.roles, icon: "roles" },
    { href: "/risks", label: dictionary.nav.risks, icon: "risk" },
    { href: "/approvals", label: dictionary.nav.approvals, icon: "approval" },
    { href: "/audit-logs", label: dictionary.nav.auditLogs, icon: "audit" },
  ];

  return (
    <nav className="app-nav" aria-label={dictionary.nav.ariaLabel}>
      <p className="app-nav__label">{dictionary.nav.workspace}</p>
      {items.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            className={active ? "app-nav__link app-nav__link--active" : "app-nav__link"}
            href={href}
          >
            <span className="app-nav__icon"><Icon name={icon} size={17} /></span>
            <span>{label}</span>
            {active ? <span className="app-nav__active-dot" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
