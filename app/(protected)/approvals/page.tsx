import { ApprovalActions } from "@/components/approval-actions";
import { ApprovalsLiveRefresh } from "@/components/approvals-live-refresh";
import { Badge } from "@/components/ui/badge";
import { Card, MetricCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime, humanizeEnum } from "@/lib/format";
import { getDictionary, getRiskPresentation } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { listApprovals } from "@/services/approval.service";

export default async function ApprovalsPage() {
  const [approvals, locale] = await Promise.all([listApprovals(), getLocale()]);
  const dictionary = getDictionary(locale);
  const pending = approvals.filter((item) => item.status === "PENDING").length;
  const approved = approvals.filter((item) => item.status === "APPROVED").length;
  const rejected = approvals.filter((item) => item.status === "REJECTED").length;
  const pendingIds = approvals.filter((item) => item.status === "PENDING").map((item) => item.id);

  return (
    <>
      <PageHeader
        eyebrow={dictionary.approvals.eyebrow}
        title={dictionary.approvals.title}
        description={dictionary.approvals.description}
      />

      <div className="metric-grid metric-grid--three">
        <MetricCard label={dictionary.approvals.pendingDecisions} value={pending} hint={dictionary.approvals.requireReview} icon="clock" tone="warning" />
        <MetricCard label={dictionary.approvals.approved} value={approved} hint={dictionary.approvals.changesAuthorized} icon="check" tone="success" />
        <MetricCard label={dictionary.approvals.rejected} value={rejected} hint={dictionary.approvals.changesPrevented} icon="risk" tone="danger" />
      </div>

      <Card className="approval-board">
        <div className="section-heading section-heading--board">
          <div>
            <p className="eyebrow">{dictionary.approvals.decisionQueue}</p>
            <h2>{dictionary.approvals.sensitiveChanges}</h2>
            <p className="section-heading__description">{dictionary.approvals.queueDescription}</p>
          </div>
          <div className="approval-board__controls">
            <ApprovalsLiveRefresh locale={locale} initialPendingIds={pendingIds} />
            <div className="human-control-pill"><Icon name="shield" size={14} /> {dictionary.approvals.humanApproval}</div>
          </div>
        </div>

        {approvals.length === 0 ? (
          <EmptyState title={dictionary.approvals.noRequests} description={dictionary.approvals.noRequestsDescription} />
        ) : (
          <div className="approval-list">
            {approvals.map((approval) => {
              const riskPresentation = approval.accessRisk
                ? getRiskPresentation({ ...approval.accessRisk, user: approval.targetUser, permission: approval.permission }, locale)
                : null;
              return (
                <article className={`approval-item approval-item--${approval.status.toLowerCase()}`} key={approval.id}>
                  <div className="approval-item__status-rail" />
                  <div className="approval-item__main">
                    <div className="approval-item__header">
                      <div className="approval-item__identity">
                        <span className="approval-item__avatar">{approval.targetUser.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                        <div>
                          <div className="approval-item__title">
                            <strong>{humanizeEnum(approval.actionType, locale)}</strong>
                            {approval.accessRisk ? <Badge tone={approval.accessRisk.severity === "CRITICAL" ? "danger" : approval.accessRisk.severity === "HIGH" ? "warning" : "info"}>{humanizeEnum(approval.accessRisk.severity, locale)}</Badge> : null}
                            <Badge tone={approval.status === "PENDING" ? "warning" : approval.status === "APPROVED" ? "success" : "neutral"}>{humanizeEnum(approval.status, locale)}</Badge>
                          </div>
                          <span className="approval-item__target">{approval.targetUser.name}</span>
                        </div>
                      </div>
                      <span className="approval-item__source"><Icon name="spark" size={13} /> {humanizeEnum(approval.requestedByType, locale)}</span>
                    </div>

                    <p className="approval-item__reason">{riskPresentation?.description ?? approval.reason}</p>

                    <div className="approval-item__details">
                      {approval.permission ? <div><span>{dictionary.approvals.permission}</span><strong>{approval.permission.slug}</strong></div> : null}
                      {approval.newRole ? <div><span>{dictionary.approvals.newRole}</span><strong>{approval.newRole.name}</strong></div> : null}
                      <div><span>{dictionary.approvals.requested}</span><strong>{formatDateTime(approval.requestedAt, locale)}</strong></div>
                      <div><span>{dictionary.approvals.control}</span><strong>{dictionary.approvals.humanConfirmation}</strong></div>
                    </div>
                  </div>
                  <div className="approval-item__decision">
                    {approval.status === "PENDING" ? (
                      <ApprovalActions
                        approvalId={approval.id}
                        locale={locale}
                        targetName={approval.targetUser.name}
                        actionType={approval.actionType}
                        permissionSlug={approval.permission?.slug}
                        newRoleName={approval.newRole?.name}
                        riskSeverity={approval.accessRisk?.severity}
                        reason={riskPresentation?.description ?? approval.reason}
                      />
                    ) : (
                      <div className="decision-complete"><Icon name={approval.status === "APPROVED" ? "check" : "risk"} size={16} /><span>{dictionary.approvals.decisionRecorded}</span></div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
