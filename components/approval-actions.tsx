"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Icon } from "@/components/ui/icon";
import { getDictionary, translateEnum, type Locale } from "@/lib/i18n/config";

type ApprovalActionsProps = {
  approvalId: string;
  locale: Locale;
  targetName: string;
  actionType: string;
  permissionSlug?: string | null;
  newRoleName?: string | null;
  riskSeverity?: string | null;
  reason: string;
};

export function ApprovalActions({
  approvalId,
  locale,
  targetName,
  actionType,
  permissionSlug,
  newRoleName,
  riskSeverity,
  reason,
}: ApprovalActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"APPROVE" | "REJECT" | null>(null);
  const [pendingDecision, setPendingDecision] = useState<"APPROVE" | "REJECT" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dictionary = getDictionary(locale);

  const decide = useCallback(async (decision: "APPROVE" | "REJECT") => {
    setBusy(decision);
    setError(null);

    try {
      const response = await fetch(`/api/approvals/${approvalId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      if (!response.ok) {
        setError(dictionary.approvals.unableToDecide);
        return;
      }

      setPendingDecision(null);
      router.refresh();
    } catch {
      setError(dictionary.approvals.unableToDecide);
    } finally {
      setBusy(null);
    }
  }, [approvalId, dictionary.approvals.unableToDecide, router]);

  const isApproval = pendingDecision === "APPROVE";
  const details = [
    { label: dictionary.approvals.modalTarget, value: targetName },
    { label: dictionary.approvals.modalAction, value: translateEnum(actionType, locale) },
    ...(permissionSlug ? [{ label: dictionary.approvals.permission, value: permissionSlug }] : []),
    ...(newRoleName ? [{ label: dictionary.approvals.newRole, value: newRoleName }] : []),
    ...(riskSeverity ? [{ label: dictionary.approvals.modalRisk, value: translateEnum(riskSeverity, locale) }] : []),
  ];

  return (
    <>
      <div className="approval-actions">
        <button
          className="button button--secondary button--small"
          type="button"
          onClick={() => setPendingDecision("REJECT")}
          disabled={busy !== null}
        >
          {busy === "REJECT" ? dictionary.approvals.rejecting : dictionary.approvals.reject}
        </button>
        <button
          className="button button--primary button--small"
          type="button"
          onClick={() => setPendingDecision("APPROVE")}
          disabled={busy !== null}
        >
          <Icon name="check" size={14} />
          {busy === "APPROVE" ? dictionary.approvals.approving : dictionary.approvals.approveChange}
        </button>
        {error ? <span className="form-error">{error}</span> : null}
      </div>

      <ConfirmationDialog
        open={pendingDecision !== null}
        tone={isApproval ? "approve" : "reject"}
        eyebrow={dictionary.approvals.modalEyebrow}
        title={isApproval ? dictionary.approvals.modalApproveTitle : dictionary.approvals.modalRejectTitle}
        description={isApproval ? dictionary.approvals.modalApproveDescription : dictionary.approvals.modalRejectDescription}
        details={details}
        reasonLabel={dictionary.approvals.modalReason}
        reason={reason}
        noticeTitle={isApproval ? dictionary.approvals.modalApprovalNotice : dictionary.approvals.modalRejectNotice}
        noticeDescription={isApproval ? dictionary.approvals.modalApprovalNoticeDescription : dictionary.approvals.modalRejectNoticeDescription}
        cancelLabel={dictionary.approvals.modalCancel}
        confirmLabel={isApproval ? dictionary.approvals.modalConfirmApprove : dictionary.approvals.modalConfirmReject}
        closeLabel={dictionary.approvals.modalClose}
        busy={busy !== null}
        onCancel={() => setPendingDecision(null)}
        onConfirm={() => pendingDecision && void decide(pendingDecision)}
      />
    </>
  );
}
