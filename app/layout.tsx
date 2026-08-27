import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PrivilegeIQ",
    template: "%s · PrivilegeIQ",
  },
  description: "Agent-powered access governance with human-controlled remediation through WebMCP.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
