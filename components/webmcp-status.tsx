"use client";

import { useEffect, useState } from "react";
import { getDictionary, type Locale } from "@/lib/i18n/config";
import { PRIVILEGEIQ_WEBMCP_READY_EVENT } from "@/webmcp/register-tools";

type WebMcpState =
  | { kind: "checking" }
  | { kind: "unavailable" }
  | { kind: "supported" }
  | { kind: "ready"; count: number };

export function WebMcpStatus({ locale }: { locale: Locale }) {
  const [state, setState] = useState<WebMcpState>({ kind: "checking" });
  const dictionary = getDictionary(locale);

  useEffect(() => {
    const update = (event: Event) => {
      const custom = event as CustomEvent<{ count: number }>;
      setState({ kind: "ready", count: custom.detail.count });
    };

    document.addEventListener(PRIVILEGEIQ_WEBMCP_READY_EVENT, update);

    // Run the initial browser capability check after the effect has subscribed,
    // avoiding a synchronous state update inside the effect body.
    const frame = window.requestAnimationFrame(() => {
      setState(document.modelContext ? { kind: "supported" } : { kind: "unavailable" });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener(PRIVILEGEIQ_WEBMCP_READY_EVENT, update);
    };
  }, []);

  const ready = state.kind === "ready" || state.kind === "supported";
  const label =
    state.kind === "checking"
      ? dictionary.webmcp.checking
      : state.kind === "unavailable"
        ? dictionary.webmcp.unavailable
        : state.kind === "supported"
          ? dictionary.webmcp.supported
          : dictionary.webmcp.ready(state.count);

  return (
    <div className="webmcp-status" aria-live="polite">
      <span className={ready ? "status-dot status-dot--ready" : "status-dot"} />
      <span>{label}</span>
    </div>
  );
}
