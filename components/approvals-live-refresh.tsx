"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { getDictionary, type Locale } from "@/lib/i18n/config";

type PendingApproval = {
  id: string;
  requestedByType?: string;
};

type ApprovalsApiResponse = {
  data?: PendingApproval[];
};

type ApprovalsLiveRefreshProps = {
  locale: Locale;
  initialPendingIds: string[];
};

const POLL_INTERVAL_MS = 4_000;
const TOAST_DURATION_MS = 4_500;

function signature(ids: string[]): string {
  return [...ids].sort().join("|");
}

/**
 * Keeps the server-rendered approvals queue synchronized with requests created
 * outside the page, notably by a WebMCP agent. A modal in progress is treated
 * as a security boundary: refreshes are deferred until the reviewer closes it.
 */
export function ApprovalsLiveRefresh({
  locale,
  initialPendingIds,
}: ApprovalsLiveRefreshProps) {
  const router = useRouter();
  const dictionary = getDictionary(locale);
  const knownPendingIdsRef = useRef(new Set(initialPendingIds));
  const knownSignatureRef = useRef(signature(initialPendingIds));
  const refreshQueuedRef = useRef(false);
  const requestInFlightRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const dismissNotification = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setNotification(null);
  }, []);

  const showNotification = useCallback((count: number) => {
    dismissNotification();
    setNotification(dictionary.approvals.newRequestReceived(count));
    toastTimerRef.current = setTimeout(() => {
      setNotification(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);
  }, [dictionary.approvals, dismissNotification]);

  const canRefreshSafely = useCallback(() => {
    return !document.querySelector('[role="dialog"][aria-modal="true"]');
  }, []);

  const refreshWhenSafe = useCallback(() => {
    if (!canRefreshSafely()) {
      refreshQueuedRef.current = true;
      return;
    }

    refreshQueuedRef.current = false;
    router.refresh();
  }, [canRefreshSafely, router]);

  const poll = useCallback(async () => {
    if (requestInFlightRef.current || document.visibilityState === "hidden") return;
    requestInFlightRef.current = true;

    try {
      const response = await fetch("/api/approvals?status=PENDING", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) return;

      const payload = (await response.json()) as ApprovalsApiResponse;
      if (!Array.isArray(payload.data)) return;

      const nextPendingIds = payload.data.map((approval) => approval.id);
      const nextSignature = signature(nextPendingIds);
      const newIds = nextPendingIds.filter((id) => !knownPendingIdsRef.current.has(id));

      if (newIds.length > 0) {
        showNotification(newIds.length);
      }

      knownPendingIdsRef.current = new Set(nextPendingIds);

      if (nextSignature !== knownSignatureRef.current) {
        knownSignatureRef.current = nextSignature;
        refreshWhenSafe();
      } else if (refreshQueuedRef.current && canRefreshSafely()) {
        refreshWhenSafe();
      }
    } catch {
      // Polling is best-effort. A temporary network failure is retried silently.
    } finally {
      requestInFlightRef.current = false;
    }
  }, [canRefreshSafely, refreshWhenSafe, showNotification]);

  useEffect(() => {
    knownPendingIdsRef.current = new Set(initialPendingIds);
    knownSignatureRef.current = signature(initialPendingIds);
  }, [initialPendingIds]);

  useEffect(() => {
    const intervalId = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    const handleFocus = () => void poll();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void poll();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [poll]);

  return (
    <>
      <span className="live-sync-pill" title={dictionary.approvals.liveUpdatesDescription}>
        <span className="live-sync-pill__dot" aria-hidden="true" />
        {dictionary.approvals.liveUpdates}
      </span>

      {notification ? (
        <div className="approval-live-toast" role="status" aria-live="polite">
          <div className="approval-live-toast__icon">
            <Icon name="spark" size={16} />
          </div>
          <div className="approval-live-toast__content">
            <strong>{dictionary.approvals.liveNotificationTitle}</strong>
            <span>{notification}</span>
          </div>
          <button
            aria-label={dictionary.approvals.dismissNotification}
            className="approval-live-toast__close"
            onClick={dismissNotification}
            type="button"
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}
