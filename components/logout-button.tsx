"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { getDictionary, type Locale } from "@/lib/i18n/config";

export function LogoutButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const dictionary = getDictionary(locale);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button className="button button--sidebar" type="button" onClick={logout} disabled={busy}>
      <Icon name="logout" size={15} />
      {busy ? dictionary.shell.signingOut : dictionary.shell.signOut}
    </button>
  );
}
