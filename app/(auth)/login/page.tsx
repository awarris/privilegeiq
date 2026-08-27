import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "@/components/auth/login-form";
import { Icon } from "@/components/ui/icon";
import { getSession } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: getDictionary(locale).login.metadataTitle };
}

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-card__toolbar">
          <div className="brand brand--login">
            <div className="brand__mark"><Icon name="shield" size={21} /></div>
            <div className="brand__copy">
              <strong>PrivilegeIQ</strong>
              <span>{dictionary.shell.tagline}</span>
            </div>
          </div>
          <LanguageSwitcher locale={locale} label={dictionary.languageSwitcher} />
        </div>
        <div className="login-card__copy">
          <p className="eyebrow">{dictionary.login.eyebrow}</p>
          <h1>{dictionary.login.headline}</h1>
          <p>{dictionary.login.description}</p>
        </div>
        <LoginForm locale={locale} />
      </section>
    </main>
  );
}
