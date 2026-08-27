import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { formatRelativeDays, humanizeEnum } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { listUsers } from "@/services/user.service";

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default async function UsersPage() {
  const [users, locale] = await Promise.all([listUsers(), getLocale()]);
  const dictionary = getDictionary(locale);

  return (
    <>
      <PageHeader eyebrow={dictionary.users.eyebrow} title={dictionary.users.title} description={dictionary.users.description} />
      <Card className="table-card">
        <div className="table-card__header">
          <div><strong>{dictionary.users.identities(users.length)}</strong><span>{dictionary.users.governed}</span></div>
          <div className="table-card__legend"><span><i className="legend-dot legend-dot--safe" /> {dictionary.users.healthy}</span><span><i className="legend-dot legend-dot--risk" /> {dictionary.users.hasOpenRisks}</span></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{dictionary.users.user}</th><th>{dictionary.users.role}</th><th>{dictionary.users.status}</th><th>{dictionary.users.lastActivity}</th><th>{dictionary.users.riskExposure}</th><th /></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td data-label={dictionary.users.user}>
                    <div className="identity-cell">
                      <span className="identity-avatar">{initials(user.name)}</span>
                      <div className="primary-cell"><strong>{user.name}</strong><span>{user.email}</span></div>
                    </div>
                  </td>
                  <td data-label={dictionary.users.role}><span className="role-label"><Icon name="roles" size={13} /> {user.role.name}</span></td>
                  <td data-label={dictionary.users.status}><Badge tone={user.status === "ACTIVE" ? "success" : "neutral"}>{humanizeEnum(user.status, locale)}</Badge></td>
                  <td data-label={dictionary.users.lastActivity}>{formatRelativeDays(user.lastActiveAt, locale)}</td>
                  <td data-label={dictionary.users.riskExposure}><span className={user.accessRisks.length ? "risk-count risk-count--open" : "risk-count risk-count--clear"}>{user.accessRisks.length ? dictionary.users.open(user.accessRisks.length) : dictionary.users.clear}</span></td>
                  <td className="table-mobile-action"><Link className="row-action" href={`/users/${user.id}`}>{dictionary.users.inspect} <Icon name="arrow" size={13} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
