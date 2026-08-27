import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { WebMcpProvider } from "@/components/webmcp-provider";
import { requirePageSession } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const [session, locale] = await Promise.all([requirePageSession(), getLocale()]);

  return (
    <AppShell adminEmail={session.email} locale={locale}>
      <WebMcpProvider />
      {children}
    </AppShell>
  );
}
