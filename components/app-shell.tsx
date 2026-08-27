import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { WebMcpStatus } from "@/components/webmcp-status";
import { getDictionary, type Locale } from "@/lib/i18n/config";

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function AppShell({
  children,
  adminEmail,
  locale,
}: {
  children: ReactNode;
  adminEmail: string;
  locale: Locale;
}) {
  const dictionary = getDictionary(locale);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__top">
          <div className="brand">
            <div className="brand__mark"><Icon name="shield" size={21} /></div>
            <div className="brand__copy">
              <strong>PrivilegeIQ</strong>
              <span>{dictionary.shell.tagline}</span>
            </div>
          </div>
          <div className="challenge-pill"><Icon name="spark" size={13} /> {dictionary.shell.challenge}</div>
        </div>

        <AppNav locale={locale} />

        <div className="sidebar__footer">
          <div className="agent-card">
            <div className="agent-card__header">
              <span className="agent-card__icon"><Icon name="spark" size={16} /></span>
              <div>
                <strong>{dictionary.shell.agentBridge}</strong>
                <span>{dictionary.shell.structuredTools}</span>
              </div>
            </div>
            <WebMcpStatus locale={locale} />
          </div>

          <div className="signed-user">
            <div className="signed-user__avatar">{initials(adminEmail)}</div>
            <div className="signed-user__copy">
              <span className="signed-user__label">{dictionary.shell.demoAdministrator}</span>
              <span className="signed-user__email">{adminEmail}</span>
            </div>
          </div>
          <LogoutButton locale={locale} />
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar__context">
            <div className="topbar__status"><span /> {dictionary.shell.protectedWorkspace}</div>
            <p>{dictionary.shell.protectedDescription}</p>
          </div>
          <div className="topbar__actions">
            <div className="environment-pill">{dictionary.shell.demo}</div>
            <LanguageSwitcher locale={locale} label={dictionary.languageSwitcher} />
            <ThemeToggle locale={locale} />
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
