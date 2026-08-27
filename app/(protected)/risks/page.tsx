import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { RiskScanButton } from "@/components/risk-scan-button";
import { formatDateTime, humanizeEnum } from "@/lib/format";
import { getDictionary, getRiskPresentation } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { listAccessRisks } from "@/services/risk.service";

export default async function RisksPage() {
  const [risks, locale] = await Promise.all([listAccessRisks(), getLocale()]);
  const dictionary = getDictionary(locale);

  return (
    <>
      <PageHeader eyebrow={dictionary.risks.eyebrow} title={dictionary.risks.title} description={dictionary.risks.description} actions={<RiskScanButton locale={locale} />} />
      <Card className="table-card">
        <div className="table-card__header">
          <div><strong>{dictionary.risks.openFindings(risks.filter((risk) => risk.status === "OPEN").length)}</strong><span>{dictionary.risks.ordered}</span></div>
          <div className="severity-key"><span><i className="severity-key__dot severity-key__dot--critical" /> {dictionary.risks.critical}</span><span><i className="severity-key__dot severity-key__dot--high" /> {dictionary.risks.high}</span><span><i className="severity-key__dot severity-key__dot--medium" /> {dictionary.risks.medium}</span></div>
        </div>
        {risks.length === 0 ? <EmptyState title={dictionary.risks.noRisks} description={dictionary.risks.noRisksDescription} /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>{dictionary.risks.finding}</th><th>{dictionary.risks.user}</th><th>{dictionary.risks.severity}</th><th>{dictionary.risks.status}</th><th>{dictionary.risks.detected}</th><th /></tr></thead>
              <tbody>
                {risks.map((risk) => {
                  const presentation = getRiskPresentation(risk, locale);
                  return (
                    <tr key={risk.id} className={`risk-row risk-row--${risk.severity.toLowerCase()}`}>
                      <td data-label={dictionary.risks.finding}><div className="risk-title-cell"><span className={`risk-indicator risk-indicator--${risk.severity.toLowerCase()}`}><Icon name="risk" size={14} /></span><div className="primary-cell"><strong>{presentation.title}</strong><span>{humanizeEnum(risk.type, locale)}{risk.permission ? ` · ${risk.permission.slug}` : ""}</span></div></div></td>
                      <td data-label={dictionary.risks.user}>{risk.user.name}<div className="cell-subtext">{risk.user.role.name}</div></td>
                      <td data-label={dictionary.risks.severity}><Badge tone={risk.severity === "CRITICAL" ? "danger" : risk.severity === "HIGH" ? "warning" : "info"}>{humanizeEnum(risk.severity, locale)}</Badge></td>
                      <td data-label={dictionary.risks.status}><Badge tone={risk.status === "OPEN" ? "warning" : "success"}>{humanizeEnum(risk.status, locale)}</Badge></td>
                      <td data-label={dictionary.risks.detected}>{formatDateTime(risk.detectedAt, locale)}</td>
                      <td className="table-mobile-action"><Link className="row-action" href={`/risks/${risk.id}`}>{dictionary.risks.review} <Icon name="arrow" size={13} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
