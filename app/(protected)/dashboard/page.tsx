import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, MetricCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { RiskScanButton } from "@/components/risk-scan-button";
import { formatDateTime, humanizeEnum } from "@/lib/format";
import { getDictionary, getRiskPresentation } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { getDashboardData } from "@/services/dashboard.service";

export default async function DashboardPage() {
  const [data, locale] = await Promise.all([getDashboardData(), getLocale()]);
  const dictionary = getDictionary(locale);
  const criticalShare = data.metrics.openRisks === 0 ? 0 : Math.round((data.metrics.criticalRisks / data.metrics.openRisks) * 100);

  return (
    <>
      <PageHeader
        eyebrow={dictionary.dashboard.eyebrow}
        title={dictionary.dashboard.title}
        description={dictionary.dashboard.description}
        actions={<RiskScanButton locale={locale} />}
      />

      <section className="posture-banner" aria-label={dictionary.dashboard.snapshot}>
        <div className="posture-banner__copy">
          <span className="posture-banner__icon"><Icon name="shield" size={22} /></span>
          <div>
            <span className="posture-banner__label">{dictionary.dashboard.snapshot}</span>
            <strong>{data.metrics.openRisks === 0 ? dictionary.dashboard.clear : dictionary.dashboard.requiresAttention(data.metrics.openRisks)}</strong>
            <p>{data.metrics.criticalRisks > 0 ? dictionary.dashboard.criticalFirst(data.metrics.criticalRisks) : dictionary.dashboard.noCritical}</p>
          </div>
        </div>
        <div className="posture-banner__meter" aria-label={`${dictionary.dashboard.criticalShare} ${criticalShare}%`}>
          <div className="posture-banner__meter-head"><span>{dictionary.dashboard.criticalShare}</span><strong>{criticalShare}%</strong></div>
          <div className="posture-banner__track"><span style={{ width: `${criticalShare}%` }} /></div>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard label={dictionary.dashboard.usersInScope} value={data.metrics.totalUsers} hint={dictionary.dashboard.accountsMonitored} icon="users" tone="info" />
        <MetricCard label={dictionary.dashboard.openRisks} value={data.metrics.openRisks} hint={dictionary.dashboard.requireReview} icon="risk" tone="warning" />
        <MetricCard label={dictionary.dashboard.criticalRisks} value={data.metrics.criticalRisks} hint={dictionary.dashboard.highestPriority} icon="alert" tone="danger" />
        <MetricCard label={dictionary.dashboard.pendingApprovals} value={data.metrics.pendingApprovals} hint={dictionary.dashboard.humanDecision} icon="approval" tone="success" />
      </div>

      <div className="two-column-grid">
        <Card className="dashboard-panel">
          <div className="section-heading">
            <div><p className="eyebrow">{dictionary.dashboard.prioritize}</p><h2>{dictionary.dashboard.openAccessRisks}</h2><p className="section-heading__description">{dictionary.dashboard.openAccessRisksDescription}</p></div>
            <Link href="/risks" className="text-link">{dictionary.dashboard.viewAll} <Icon name="arrow" size={13} /></Link>
          </div>
          {data.recentRisks.length === 0 ? (
            <EmptyState title={dictionary.dashboard.noOpenRisks} description={dictionary.dashboard.noOpenRisksDescription} />
          ) : (
            <div className="stack-list">
              {data.recentRisks.map((risk) => {
                const presentation = getRiskPresentation(risk, locale);
                return (
                  <Link href={`/risks/${risk.id}`} className="stack-list__item stack-list__item--interactive" key={risk.id}>
                    <div className="stack-list__leading">
                      <span className={`risk-indicator risk-indicator--${risk.severity.toLowerCase()}`}><Icon name="risk" size={15} /></span>
                      <div>
                        <strong>{presentation.title}</strong>
                        <span>{risk.user.name}{risk.permission ? ` · ${risk.permission.slug}` : ""}</span>
                      </div>
                    </div>
                    <div className="stack-list__trailing"><Badge tone={risk.severity === "CRITICAL" ? "danger" : risk.severity === "HIGH" ? "warning" : "info"}>{humanizeEnum(risk.severity, locale)}</Badge><Icon name="arrow" size={14} /></div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="dashboard-panel">
          <div className="section-heading">
            <div><p className="eyebrow">{dictionary.dashboard.traceability}</p><h2>{dictionary.dashboard.recentActivity}</h2><p className="section-heading__description">{dictionary.dashboard.recentActivityDescription}</p></div>
            <Link href="/audit-logs" className="text-link">{dictionary.dashboard.viewAll} <Icon name="arrow" size={13} /></Link>
          </div>
          {data.recentAudit.length === 0 ? (
            <EmptyState title={dictionary.dashboard.noAudit} description={dictionary.dashboard.noAuditDescription} />
          ) : (
            <div className="timeline-list">
              {data.recentAudit.map((event) => (
                <div className="timeline-list__item" key={event.id}>
                  <span className="timeline-list__dot"><Icon name={event.source === "WEBMCP" ? "spark" : "audit"} size={13} /></span>
                  <div className="timeline-list__copy">
                    <strong>{humanizeEnum(event.actionType, locale)}</strong>
                    <span>{event.targetUser?.name ?? dictionary.dashboard.organization} · {formatDateTime(event.createdAt, locale)}</span>
                  </div>
                  <Badge tone={event.source === "WEBMCP" ? "info" : "neutral"}>{humanizeEnum(event.source, locale)}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
