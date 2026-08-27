import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { humanizeEnum } from "@/lib/format";
import { getDictionary, translateRoleDescription } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { listRolesWithPermissions } from "@/services/user.service";

export default async function RolesPage() {
  const [roles, locale] = await Promise.all([listRolesWithPermissions(), getLocale()]);
  const dictionary = getDictionary(locale);

  return (
    <>
      <PageHeader eyebrow={dictionary.roles.eyebrow} title={dictionary.roles.title} description={dictionary.roles.description} />
      <div className="role-grid">
        {roles.map((role) => (
          <Card key={role.id} className="role-card">
            <div className="role-card__header">
              <div className="role-card__identity">
                <span className="role-card__icon"><Icon name="roles" size={18} /></span>
                <div><p className="eyebrow">{dictionary.roles.users(role._count.users)}</p><h2>{role.name}</h2></div>
              </div>
              <Badge>{dictionary.roles.permissions(role.permissions.length)}</Badge>
            </div>
            <p className="muted">{translateRoleDescription(role.slug, role.description, locale)}</p>
            <div className="permission-chip-list">
              {role.permissions
                .sort((a, b) => a.permission.slug.localeCompare(b.permission.slug))
                .map(({ permission }) => (
                  <span className={`permission-chip permission-chip--${permission.riskLevel.toLowerCase()}`} key={permission.id}>
                    <span>{permission.slug}</span>
                    <small>{humanizeEnum(permission.riskLevel, locale)}</small>
                  </span>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
