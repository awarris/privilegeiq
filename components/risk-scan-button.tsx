"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { getDictionary, type Locale } from "@/lib/i18n/config";

export function RiskScanButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dictionary = getDictionary(locale);

  async function scan() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/risks/scan", { method: "POST" });
    const payload = (await response.json()) as {
      data?: { activeRisks: number; created: number; resolved: number };
      error?: { message?: string };
    };
    if (response.ok && payload.data) {
      setMessage(dictionary.scan.result(payload.data.activeRisks, payload.data.created, payload.data.resolved));
      router.refresh();
    } else {
      setMessage(dictionary.scan.failed);
    }
    setBusy(false);
  }

  return (
    <div className="inline-action">
      <button className="button button--primary" type="button" onClick={scan} disabled={busy}>
        <Icon name="scan" size={16} />
        {busy ? dictionary.scan.scanning : dictionary.scan.run}
      </button>
      {message ? <span className="inline-action__message">{message}</span> : null}
    </div>
  );
}
