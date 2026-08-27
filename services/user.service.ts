import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { EffectivePermission, UserAccessView } from "@/lib/domain/access";

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      role: true,
      accessRisks: {
        where: { status: "OPEN" },
        select: { id: true, severity: true, type: true },
      },
    },
  });
}

export async function getUserAccess(userId: string): Promise<UserAccessView> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
      permissionOverrides: {
        include: { permission: true },
      },
    },
  });

  if (!user) throw new NotFoundError("User not found.");

  const effective = new Map<string, EffectivePermission>();
  for (const rolePermission of user.role.permissions) {
    const permission = rolePermission.permission;
    effective.set(permission.id, {
      id: permission.id,
      name: permission.name,
      slug: permission.slug,
      riskLevel: permission.riskLevel,
      source: "ROLE",
    });
  }

  const deniedPermissions: string[] = [];
  for (const override of user.permissionOverrides) {
    if (override.effect === "DENY") {
      effective.delete(override.permissionId);
      deniedPermissions.push(override.permission.slug);
      continue;
    }

    effective.set(override.permissionId, {
      id: override.permission.id,
      name: override.permission.name,
      slug: override.permission.slug,
      riskLevel: override.permission.riskLevel,
      source: "DIRECT_ALLOW",
    });
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: {
        id: user.role.id,
        name: user.role.name,
        slug: user.role.slug,
      },
      lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    },
    permissions: [...effective.values()].sort((a, b) =>
      a.slug.localeCompare(b.slug),
    ),
    deniedPermissions: deniedPermissions.sort(),
  };
}

export async function listRolesWithPermissions() {
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: { select: { users: true } },
    },
  });
}
