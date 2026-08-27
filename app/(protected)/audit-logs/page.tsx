import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime, humanizeEnum } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { listAuditLogs } from "@/services/audit.service";

export default async function AuditLogsPage() {
  const [events, locale] = await Promise.all([listAuditLogs(), getLocale()]);
  const dictionary = getDictionary(locale);

  return (
    <>
      <PageHeader eyebrow={dictionary.audit.eyebrow} title={dictionary.audit.title} description={dictionary.audit.description} />
      <Card className="table-card">
        <div className="table-card__header">
          <div><strong>{dictionary.audit.recordedEvents(events.length)}</strong><span>{dictionary.audit.traceable}</span></div>
          <div className="audit-assurance"><Icon name="shield" size={14} /> {dictionary.audit.assurance}</div>
        </div>
        {events.length === 0 ? <EmptyState title={dictionary.audit.noEvents} description={dictionary.audit.noEventsDescription} /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>{dictionary.audit.event}</th><th>{dictionary.audit.actor}</th><th>{dictionary.audit.target}</th><th>{dictionary.audit.source}</th><th>{dictionary.audit.time}</th></tr></thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td data-label={dictionary.audit.event}><div className="audit-event-cell"><span className="audit-event-icon"><Icon name={event.source === "WEBMCP" ? "spark" : "audit"} size={14} /></span><div className="primary-cell"><strong>{humanizeEnum(event.actionType, locale)}</strong><span>{event.permission?.slug ?? event.role?.name ?? humanizeEnum(event.actorType, locale)}</span></div></div></td>
                    <td data-label={dictionary.audit.actor}>{event.actorUser?.name ?? humanizeEnum(event.actorType, locale)}</td>
                    <td data-label={dictionary.audit.target}>{event.targetUser?.name ?? dictionary.audit.organization}</td>
                    <td data-label={dictionary.audit.source}><Badge tone={event.source === "WEBMCP" ? "info" : "neutral"}>{humanizeEnum(event.source, locale)}</Badge></td>
                    <td data-label={dictionary.audit.time}>{formatDateTime(event.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
