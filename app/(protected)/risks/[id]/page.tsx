import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime, humanizeEnum } from "@/lib/format";
import { getDictionary, getRiskPresentation } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { getAccessRisk } from "@/services/risk.service";

export default async function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [risk, locale] = await Promise.all([getAccessRisk(id), getLocale()]);
  const dictionary = getDictionary(locale);
  const presentation = getRiskPresentation(risk, locale);

  return (
    <>
      <PageHeader
        eyebrow={humanizeEnum(risk.type, locale)}
        title={presentation.title}
        description={presentation.description}
        actions={<Link href="/risks" className="button button--secondary">{dictionary.riskDetail.back}</Link>}
      />
      <div className="two-column-grid">
        <Card>
          <div className="section-heading"><div><p className="eyebrow">{dictionary.riskDetail.finding}</p><h2>{dictionary.riskDetail.context}</h2></div><Badge tone={risk.severity === "CRITICAL" ? "danger" : risk.severity === "HIGH" ? "warning" : "info"}>{humanizeEnum(risk.severity, locale)}</Badge></div>
          <dl className="detail-list">
            <div><dt>{dictionary.riskDetail.user}</dt><dd><Link className="text-link" href={`/users/${risk.user.id}`}>{risk.user.name}</Link></dd></div>
            <div><dt>{dictionary.riskDetail.role}</dt><dd>{risk.user.role.name}</dd></div>
            <div><dt>{dictionary.riskDetail.permission}</dt><dd>{risk.permission?.slug ?? dictionary.riskDetail.notPermissionSpecific}</dd></div>
            <div><dt>{dictionary.riskDetail.status}</dt><dd><Badge tone={risk.status === "OPEN" ? "warning" : "success"}>{humanizeEnum(risk.status, locale)}</Badge></dd></div>
            <div><dt>{dictionary.riskDetail.detected}</dt><dd>{formatDateTime(risk.detectedAt, locale)}</dd></div>
            <div><dt>{dictionary.riskDetail.resolved}</dt><dd>{risk.resolvedAt ? formatDateTime(risk.resolvedAt, locale) : dictionary.riskDetail.notResolved}</dd></div>
          </dl>
        </Card>
        <Card>
          <div className="section-heading"><div><p className="eyebrow">{dictionary.riskDetail.humanControl}</p><h2>{dictionary.riskDetail.remediationRequests}</h2></div></div>
          {risk.approvalRequests.length ? (
            <div className="stack-list">
              {risk.approvalRequests.map((approval) => (
                <div className="stack-list__item" key={approval.id}>
                  <div><strong>{humanizeEnum(approval.actionType, locale)}</strong><span>{presentation.description}</span></div>
                  <Badge tone={approval.status === "PENDING" ? "warning" : approval.status === "APPROVED" ? "success" : "neutral"}>{humanizeEnum(approval.status, locale)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">{dictionary.riskDetail.noRemediation}</p>
          )}
        </Card>
      </div>
    </>
  );
}
