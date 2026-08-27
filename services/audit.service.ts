import { prisma } from "@/lib/prisma";

export async function listAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({
    take: Math.min(Math.max(limit, 1), 250),
    orderBy: { createdAt: "desc" },
    include: {
      actorUser: true,
      targetUser: true,
      permission: true,
      role: true,
      accessRisk: true,
      approvalRequest: true,
    },
  });
}
