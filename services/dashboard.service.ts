import { prisma } from "@/lib/prisma";
import { compareSeverityDescending } from "@/lib/domain/severity";

export async function getDashboardData() {
  const [totalUsers, openRisks, criticalRisks, pendingApprovals, recentRisks, recentAudit] =
    await Promise.all([
      prisma.user.count(),
      prisma.accessRisk.count({ where: { status: "OPEN" } }),
      prisma.accessRisk.count({ where: { status: "OPEN", severity: "CRITICAL" } }),
      prisma.approvalRequest.count({ where: { status: "PENDING" } }),
      prisma.accessRisk.findMany({
        where: { status: "OPEN" },
        orderBy: { detectedAt: "desc" },
        include: { user: true, permission: true },
      }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { actorUser: true, targetUser: true },
      }),
    ]);

  return {
    metrics: { totalUsers, openRisks, criticalRisks, pendingApprovals },
    recentRisks: recentRisks
      .sort((left, right) =>
        compareSeverityDescending(left.severity, right.severity),
      )
      .slice(0, 5),
    recentAudit,
  };
}
