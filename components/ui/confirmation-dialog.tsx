"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";

type ConfirmationDialogTone = "approve" | "reject";

type Detail = {
  label: string;
  value: string;
};

type ConfirmationDialogProps = {
  open: boolean;
  tone: ConfirmationDialogTone;
  title: string;
  description: string;
  eyebrow: string;
  details: Detail[];
  reasonLabel: string;
  reason: string;
  noticeTitle: string;
  noticeDescription: string;
  cancelLabel: string;
  confirmLabel: string;
  closeLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Accessible confirmation dialog used for security-sensitive decisions.
 *
 * The dialog intentionally puts the exact target and access change in front of
 * the reviewer before execution. This makes the human-in-the-loop control
 * explicit instead of reducing a privileged action to a generic browser prompt.
 */
export function ConfirmationDialog({
  open,
  tone,
  title,
  description,
  eyebrow,
  details,
  reasonLabel,
  reason,
  noticeTitle,
  noticeDescription,
  cancelLabel,
  confirmLabel,
  closeLabel,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => confirmButtonRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, onCancel, open]);

  if (!open) return null;

  const isApprove = tone === "approve";

  return (
    <div
      className="confirmation-dialog__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section
        aria-describedby="security-confirmation-description"
        aria-labelledby="security-confirmation-title"
        aria-modal="true"
        className={`confirmation-dialog confirmation-dialog--${tone}`}
        role="dialog"
      >
        <div className="confirmation-dialog__header">
          <div className={`confirmation-dialog__icon confirmation-dialog__icon--${tone}`}>
            <Icon name={isApprove ? "shield" : "risk"} size={22} />
          </div>

          <div className="confirmation-dialog__heading">
            <p className="confirmation-dialog__eyebrow">{eyebrow}</p>
            <h2 id="security-confirmation-title">{title}</h2>
            <p id="security-confirmation-description">{description}</p>
          </div>

          <button
            aria-label={closeLabel}
            className="confirmation-dialog__close"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="confirmation-dialog__body">
          <div className="confirmation-dialog__details">
            {details.map((detail) => (
              <div className="confirmation-dialog__detail" key={detail.label}>
                <span>{detail.label}</span>
                <strong>{detail.value}</strong>
              </div>
            ))}
          </div>

          <div className="confirmation-dialog__reason">
            <span>{reasonLabel}</span>
            <p>{reason}</p>
          </div>

          <div className={`confirmation-dialog__notice confirmation-dialog__notice--${tone}`}>
            <Icon name={isApprove ? "shield" : "alert"} size={17} />
            <div>
              <strong>{noticeTitle}</strong>
              <p>{noticeDescription}</p>
            </div>
          </div>
        </div>

        <div className="confirmation-dialog__footer">
          <button
            className="button button--secondary confirmation-dialog__cancel"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            className={`button ${isApprove ? "button--primary" : "button--danger"} confirmation-dialog__confirm`}
            disabled={busy}
            onClick={onConfirm}
            type="button"
          >
            <Icon name={isApprove ? "check" : "risk"} size={16} />
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
