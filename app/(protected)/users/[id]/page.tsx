import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime, humanizeEnum } from "@/lib/format";
import { getDictionary, translatePermissionName } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { getUserAccess } from "@/services/user.service";

export default async function UserAccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [access, locale] = await Promise.all([getUserAccess(id), getLocale()]);
  const dictionary = getDictionary(locale);

  return (
    <>
      <PageHeader
        title={access.user.name}
        description={`${access.user.email} · ${access.user.role.name} · ${dictionary.userDetail.lastActivity} ${formatDateTime(access.user.lastActiveAt, locale)}`}
        actions={<Link href="/users" className="button button--secondary">{dictionary.userDetail.back}</Link>}
      />
      <div className="two-column-grid">
        <Card>
          <div className="section-heading"><div><p className="eyebrow">{dictionary.userDetail.effectiveAccess}</p><h2>{dictionary.userDetail.grantedPermissions}</h2></div><Badge tone={access.user.status === "ACTIVE" ? "success" : "neutral"}>{humanizeEnum(access.user.status, locale)}</Badge></div>
          <div className="permission-list">
            {access.permissions.map((permission) => (
              <div className="permission-row" key={permission.id}>
                <div><strong>{permission.slug}</strong><span>{translatePermissionName(permission.slug, permission.name, locale)}</span></div>
                <div className="permission-row__badges">
                  <Badge tone={permission.riskLevel === "CRITICAL" ? "danger" : permission.riskLevel === "HIGH" ? "warning" : "neutral"}>{humanizeEnum(permission.riskLevel, locale)}</Badge>
                  <Badge tone={permission.source === "DIRECT_ALLOW" ? "warning" : "info"}>{humanizeEnum(permission.source, locale)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="section-heading"><div><p className="eyebrow">{dictionary.userDetail.explicitRestrictions}</p><h2>{dictionary.userDetail.deniedPermissions}</h2></div></div>
          {access.deniedPermissions.length ? (
            <div className="permission-list">{access.deniedPermissions.map((slug) => <div className="permission-row" key={slug}><strong>{slug}</strong><Badge>{humanizeEnum("DENY", locale)}</Badge></div>)}</div>
          ) : <p className="muted">{dictionary.userDetail.noDenials}</p>}
        </Card>
      </div>
    </>
  );
}
