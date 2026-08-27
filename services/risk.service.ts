import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { analyzeUserAccess, type RiskCandidate } from "@/lib/domain/risk-engine";
import { compareSeverityDescending } from "@/lib/domain/severity";

export async function listAccessRisks(status?: "OPEN" | "RESOLVED") {
  const risks = await prisma.accessRisk.findMany({
    where: status ? { status } : undefined,
    orderBy: { detectedAt: "desc" },
    include: {
      user: { include: { role: true } },
      permission: true,
    },
  });

  return risks.sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "OPEN" ? -1 : 1;
    }
    return compareSeverityDescending(left.severity, right.severity);
  });
}

export async function getAccessRisk(riskId: string) {
  const risk = await prisma.accessRisk.findUnique({
    where: { id: riskId },
    include: {
      user: { include: { role: true } },
      permission: true,
      approvalRequests: {
        orderBy: { requestedAt: "desc" },
      },
    },
  });

  if (!risk) throw new NotFoundError("Access risk not found.");
  return risk;
}

export async function scanOrganizationAccess() {
  const users = await prisma.user.findMany({
    include: {
      role: {
        include: {
          permissions: { select: { permissionId: true } },
        },
      },
      permissionOverrides: {
        include: { permission: true },
      },
    },
  });

  const candidates = users.flatMap((user) =>
    analyzeUserAccess({
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
    }),
  );

  return reconcileRiskCandidates(candidates, users.length);
}

async function reconcileRiskCandidates(candidates: RiskCandidate[], analyzedUsers: number) {
  const existingOpen = await prisma.accessRisk.findMany({
    where: { status: "OPEN" },
  });
  const activeFingerprints = new Set(candidates.map((item) => item.fingerprint));

  let created = 0;
  let reopened = 0;
  let resolved = 0;

  await prisma.$transaction(async (tx) => {
    for (const candidate of candidates) {
      const previous = await tx.accessRisk.findUnique({
        where: { fingerprint: candidate.fingerprint },
      });

      await tx.accessRisk.upsert({
        where: { fingerprint: candidate.fingerprint },
        create: {
          fingerprint: candidate.fingerprint,
          userId: candidate.userId,
          permissionId: candidate.permissionId,
          type: candidate.type,
          severity: candidate.severity,
          title: candidate.title,
          description: candidate.description,
          status: "OPEN",
        },
        update: {
          permissionId: candidate.permissionId,
          severity: candidate.severity,
          title: candidate.title,
          description: candidate.description,
          status: "OPEN",
          resolvedAt: null,
        },
      });

      if (!previous) {
        created += 1;
        const risk = await tx.accessRisk.findUniqueOrThrow({
          where: { fingerprint: candidate.fingerprint },
        });
        await tx.auditLog.create({
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
          },
        });
      } else if (previous.status === "RESOLVED") {
        reopened += 1;
      }
    }

    for (const risk of existingOpen) {
      if (activeFingerprints.has(risk.fingerprint)) continue;

      await tx.accessRisk.update({
        where: { id: risk.id },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorType: "SYSTEM",
          actionType: "RISK_RESOLVED",
          targetUserId: risk.userId,
          permissionId: risk.permissionId,
          accessRiskId: risk.id,
          source: "SYSTEM",
          beforeData: { status: "OPEN" },
          afterData: { status: "RESOLVED" },
          metadata: { reason: "Risk condition no longer detected during scan." },
        },
      });
      resolved += 1;
    }
  });

  return {
    analyzedUsers,
    activeRisks: candidates.length,
    created,
    reopened,
    resolved,
  };
}
