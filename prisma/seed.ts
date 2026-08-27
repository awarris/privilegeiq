import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { analyzeUserAccess } from "../lib/domain/risk-engine";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed PrivilegeIQ.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const roleDefinitions = [
  ["Administrator", "administrator", "Full governance and security administration."],
  ["Manager", "manager", "Team and project oversight with reporting access."],
  ["Developer", "developer", "Standard engineering access to projects and logs."],
  ["Support", "support", "Customer support and ticket operations."],
  ["Viewer", "viewer", "Read-only access to non-sensitive resources."],
  ["Contractor", "contractor", "Restricted temporary access for external contributors."],
] as const;

const permissionDefinitions = [
  ["Read users", "users.read", "View user profiles and account status.", "LOW"],
  ["Delete users", "users.delete", "Permanently delete user accounts.", "CRITICAL"],
  ["Read projects", "projects.read", "View project information.", "LOW"],
  ["Update projects", "projects.update", "Modify project information.", "MEDIUM"],
  ["Read logs", "logs.read", "View application and operational logs.", "MEDIUM"],
  ["Read billing", "billing.read", "View billing information.", "MEDIUM"],
  ["Manage billing", "billing.manage", "Change billing and payment configuration.", "HIGH"],
  ["Manage permissions", "permissions.manage", "Change roles and access permissions.", "CRITICAL"],
  ["Security audit", "security.audit", "Run and review organization security audits.", "HIGH"],
  ["Read tickets", "tickets.read", "View support tickets.", "LOW"],
  ["Update tickets", "tickets.update", "Modify support tickets.", "MEDIUM"],
  ["Read reports", "reports.read", "View organization reports.", "LOW"],
] as const;

const rolePermissionSlugs: Record<string, string[]> = {
  administrator: permissionDefinitions.map((entry) => entry[1]),
  manager: ["users.read", "projects.read", "projects.update", "reports.read", "billing.read"],
  developer: ["projects.read", "projects.update", "logs.read"],
  support: ["users.read", "tickets.read", "tickets.update"],
  viewer: ["projects.read", "reports.read"],
  contractor: ["projects.read", "logs.read"],
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.accessRisk.deleteMany();
  await prisma.userPermissionOverride.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  const roles = new Map<string, { id: string }>();
  for (const [name, slug, description] of roleDefinitions) {
    const role = await prisma.role.create({ data: { name, slug, description } });
    roles.set(slug, role);
  }

  const permissions = new Map<string, { id: string }>();
  for (const [name, slug, description, riskLevel] of permissionDefinitions) {
    const permission = await prisma.permission.create({
      data: { name, slug, description, riskLevel },
    });
    permissions.set(slug, permission);
  }

  for (const [roleSlug, slugs] of Object.entries(rolePermissionSlugs)) {
    const role = roles.get(roleSlug)!;
    for (const permissionSlug of slugs) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permissions.get(permissionSlug)!.id,
        },
      });
    }
  }

  const adminEmail = process.env.DEMO_ADMIN_EMAIL ?? "admin@privilegeiq.dev";
  const admin = await prisma.user.create({
    data: {
      name: "Emma Wilson",
      email: adminEmail,
      status: "ACTIVE",
      roleId: roles.get("administrator")!.id,
      lastActiveAt: daysAgo(0),
    },
  });
  const alice = await prisma.user.create({
    data: {
      name: "Alice Martin",
      email: "alice@privilegeiq.dev",
      status: "ACTIVE",
      roleId: roles.get("developer")!.id,
      lastActiveAt: daysAgo(1),
    },
  });
  const bob = await prisma.user.create({
    data: {
      name: "Bob Johnson",
      email: "bob@privilegeiq.dev",
      status: "ACTIVE",
      roleId: roles.get("support")!.id,
      lastActiveAt: daysAgo(3),
    },
  });
  await prisma.user.create({
    data: {
      name: "John Smith",
      email: "john.contractor@privilegeiq.dev",
      status: "ACTIVE",
      roleId: roles.get("contractor")!.id,
      lastActiveAt: daysAgo(120),
    },
  });
  await prisma.user.create({
    data: {
      name: "Sarah Miller",
      email: "sarah@privilegeiq.dev",
      status: "ACTIVE",
      roleId: roles.get("manager")!.id,
      lastActiveAt: daysAgo(2),
    },
  });

  await prisma.userPermissionOverride.create({
    data: {
      userId: alice.id,
      permissionId: permissions.get("users.delete")!.id,
      effect: "ALLOW",
      reason: "Temporary maintenance access that was not removed after the task ended.",
      grantedByUserId: admin.id,
    },
  });

  await prisma.userPermissionOverride.create({
    data: {
      userId: bob.id,
      permissionId: permissions.get("permissions.manage")!.id,
      effect: "ALLOW",
      reason: "Legacy support escalation access.",
      grantedByUserId: admin.id,
    },
  });
  await prisma.userPermissionOverride.create({
    data: {
      userId: bob.id,
      permissionId: permissions.get("billing.manage")!.id,
      effect: "ALLOW",
      reason: "Legacy billing support access.",
      grantedByUserId: admin.id,
    },
  });

  const usersForScan = await prisma.user.findMany({
    include: {
      role: {
        include: {
          permissions: { select: { permissionId: true } },
        },
      },
      permissionOverrides: { include: { permission: true } },
    },
  });

  for (const user of usersForScan) {
    const candidates = analyzeUserAccess({
      id: user.id,
      name: user.name,
      status: user.status,
      lastActiveAt: user.lastActiveAt,
      rolePermissionIds: new Set(
        user.role.permissions.map((entry) => entry.permissionId),
      ),
      overrides: user.permissionOverrides.map((override) => ({
        effect: override.effect,
        permission: {
          id: override.permission.id,
          slug: override.permission.slug,
          riskLevel: override.permission.riskLevel,
        },
      })),
    });

    for (const candidate of candidates) {
      const risk = await prisma.accessRisk.create({
        data: {
          fingerprint: candidate.fingerprint,
          userId: candidate.userId,
          permissionId: candidate.permissionId,
          type: candidate.type,
          severity: candidate.severity,
          title: candidate.title,
          description: candidate.description,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorType: "SYSTEM",
          actionType: "RISK_DETECTED",
          targetUserId: candidate.userId,
          permissionId: candidate.permissionId,
          accessRiskId: risk.id,
          source: "SYSTEM",
          afterData: {
            type: candidate.type,
            severity: candidate.severity,
            fingerprint: candidate.fingerprint,
          },
          metadata: { reason: "Seeded demonstration risk." },
        },
      });
    }
  }

  console.log("PrivilegeIQ demo data seeded.");
  console.log("Demo risks are precomputed; run a scan anytime to reconcile the current access state.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
