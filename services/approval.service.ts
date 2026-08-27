import { prisma } from "@/lib/prisma";
import { AppError, ConflictError, NotFoundError } from "@/lib/errors";
import { getUserAccess } from "@/services/user.service";
import { scanOrganizationAccess } from "@/services/risk.service";

export type RequestSource = "HUMAN" | "WEBMCP_AGENT";
export type ApprovalAction =
  | "REVOKE_PERMISSION"
  | "DISABLE_USER"
  | "CHANGE_ROLE";

export interface CreateApprovalInput {
  requestedByType: RequestSource;
  requestedByUserEmail?: string;
  actionType: ApprovalAction;
  targetUserId: string;
  permissionSlug?: string;
  newRoleSlug?: string;
  accessRiskId?: string;
  reason: string;
}

export async function listApprovals(
  status?: "PENDING" | "APPROVED" | "REJECTED",
) {
  return prisma.approvalRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { requestedAt: "desc" },
    include: {
      targetUser: { include: { role: true } },
      permission: true,
      newRole: true,
      approvedByUser: true,
      accessRisk: true,
    },
  });
}

export async function createApprovalRequest(input: CreateApprovalInput) {
  const [targetUser, permission, newRole, requestedByUser, accessRisk] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: input.targetUserId } }),
      input.permissionSlug
        ? prisma.permission.findUnique({ where: { slug: input.permissionSlug } })
        : Promise.resolve(null),
      input.newRoleSlug
        ? prisma.role.findUnique({ where: { slug: input.newRoleSlug } })
        : Promise.resolve(null),
      input.requestedByUserEmail
        ? prisma.user.findUnique({ where: { email: input.requestedByUserEmail } })
        : Promise.resolve(null),
      input.accessRiskId
        ? prisma.accessRisk.findUnique({ where: { id: input.accessRiskId } })
        : Promise.resolve(null),
    ]);

  if (!targetUser) throw new NotFoundError("Target user not found.", "USER_NOT_FOUND");
  validateApprovalShape(input, permission?.id, newRole?.id);

  if (input.accessRiskId) {
    if (!accessRisk) throw new NotFoundError("Related access risk not found.", "ACCESS_RISK_NOT_FOUND");
    if (accessRisk.userId !== targetUser.id) {
      throw new AppError(
        "The selected access risk does not belong to the target user.",
        400,
        "INVALID_RISK_CONTEXT",
      );
    }
    if (accessRisk.status !== "OPEN") {
      throw new ConflictError(
        "The selected access risk is already resolved.",
        "ACCESS_RISK_ALREADY_RESOLVED",
      );
    }
  }

  if (input.actionType === "REVOKE_PERMISSION" && permission) {
    const access = await getUserAccess(targetUser.id);
    if (!access.permissions.some((item) => item.id === permission.id)) {
      throw new ConflictError(
        `${permission.slug} is not currently effective for ${targetUser.name}.`,
        "PERMISSION_NOT_HELD",
      );
    }
  }

  if (input.actionType === "DISABLE_USER" && targetUser.status === "DISABLED") {
    throw new ConflictError(
      `${targetUser.name} is already disabled.`,
      "USER_ALREADY_DISABLED",
    );
  }

  if (input.actionType === "CHANGE_ROLE" && newRole?.id === targetUser.roleId) {
    throw new ConflictError(
      `${targetUser.name} already has that role.`,
      "ROLE_ALREADY_ASSIGNED",
    );
  }

  if (input.actionType === "CHANGE_ROLE" && newRole) {
    const pendingRoleChange = await prisma.approvalRequest.findFirst({
      where: {
        status: "PENDING",
        actionType: "CHANGE_ROLE",
        targetUserId: targetUser.id,
      },
      include: { targetUser: true, permission: true, newRole: true },
      orderBy: { requestedAt: "asc" },
    });

    if (pendingRoleChange) {
      if (pendingRoleChange.newRoleId === newRole.id) return pendingRoleChange;

      throw new ConflictError(
        `${targetUser.name} already has a pending role change request.`,
        "CONFLICTING_PENDING_APPROVAL",
      );
    }
  }

  const duplicate = await prisma.approvalRequest.findFirst({
    where: {
      status: "PENDING",
      actionType: input.actionType,
      targetUserId: targetUser.id,
      permissionId: permission?.id ?? null,
      newRoleId: newRole?.id ?? null,
    },
    include: { targetUser: true, permission: true, newRole: true },
  });
  if (duplicate) return duplicate;

  return prisma.$transaction(async (tx) => {
    const approval = await tx.approvalRequest.create({
      data: {
        accessRiskId: accessRisk?.id,
        requestedByType: input.requestedByType,
        requestedByUserId: requestedByUser?.id,
        actionType: input.actionType,
        targetUserId: targetUser.id,
        permissionId: permission?.id,
        newRoleId: newRole?.id,
        reason: input.reason,
      },
      include: { targetUser: true, permission: true, newRole: true },
    });

    await tx.auditLog.create({
      data: {
        actorType:
          input.requestedByType === "WEBMCP_AGENT"
            ? "WEBMCP_AGENT"
            : "HUMAN",
        actorUserId: requestedByUser?.id,
        actionType: "APPROVAL_CREATED",
        targetUserId: targetUser.id,
        permissionId: permission?.id,
        roleId: newRole?.id,
        accessRiskId: accessRisk?.id,
        approvalRequestId: approval.id,
        source:
          input.requestedByType === "WEBMCP_AGENT" ? "WEBMCP" : "WEB_APP",
        afterData: {
          actionType: input.actionType,
          status: "PENDING",
        },
        metadata: { reason: input.reason },
      },
    });

    return approval;
  });
}

function validateApprovalShape(
  input: CreateApprovalInput,
  permissionId?: string,
  newRoleId?: string,
): void {
  if (input.reason.trim().length < 10) {
    throw new AppError(
      "A remediation reason of at least 10 characters is required.",
    );
  }

  if (input.actionType === "REVOKE_PERMISSION" && !permissionId) {
    if (!input.permissionSlug?.trim()) {
      throw new AppError("permissionSlug is required to revoke a permission.");
    }
    throw new NotFoundError(
      `Permission ${input.permissionSlug} was not found.`,
      "PERMISSION_NOT_FOUND",
    );
  }

  if (input.actionType === "CHANGE_ROLE" && !newRoleId) {
    if (!input.newRoleSlug?.trim()) {
      throw new AppError("newRoleSlug is required to change a role.");
    }
    throw new NotFoundError(
      `Role ${input.newRoleSlug} was not found.`,
      "ROLE_NOT_FOUND",
    );
  }
}

async function getApprovalForDecision(approvalId: string) {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: {
      targetUser: true,
      permission: true,
      newRole: true,
    },
  });

  if (!approval) throw new NotFoundError("Approval request not found.");
  return approval;
}

type ApprovalForDecision = Awaited<ReturnType<typeof getApprovalForDecision>>;

export async function decideApproval(
  approvalId: string,
  decision: "APPROVE" | "REJECT",
  approverEmail: string,
) {
  const approval = await getApprovalForDecision(approvalId);
  if (approval.status !== "PENDING") {
    throw new ConflictError("This approval request has already been decided.");
  }

  if (approval.actionType === "CHANGE_ROLE" && decision === "APPROVE") {
    const competingRequest = await prisma.approvalRequest.findFirst({
      where: {
        id: { not: approval.id },
        status: "PENDING",
        actionType: "CHANGE_ROLE",
        targetUserId: approval.targetUserId,
      },
      select: { id: true },
    });

    if (competingRequest) {
      throw new ConflictError(
        "Another role change request is still pending for this user. Reject it before approving this request.",
        "CONFLICTING_PENDING_APPROVAL",
      );
    }
  }

  const approver = await prisma.user.findUnique({
    where: { email: approverEmail },
  });
  if (!approver) {
    throw new AppError(
      "The signed-in administrator is missing from the seeded organization.",
      403,
      "APPROVER_NOT_FOUND",
    );
  }

  if (decision === "REJECT") {
    return rejectApproval(approval, approver.id);
  }

  const applied = await approveAndApply(approval, approver.id);
  try {
    await scanOrganizationAccess();
  } catch (error) {
    // The approved access change must not be rolled back because a follow-up scan failed.
    console.error("Access remediation applied, but risk reconciliation failed", error);
  }
  return applied;
}

async function rejectApproval(
  approval: ApprovalForDecision,
  approverId: string,
) {
  return prisma.$transaction(async (tx) => {
    const rejected = await tx.approvalRequest.update({
      where: { id: approval.id },
      data: {
        status: "REJECTED",
        approvedByUserId: approverId,
        decidedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorType: "HUMAN",
        actorUserId: approverId,
        actionType: "APPROVAL_REJECTED",
        targetUserId: approval.targetUserId,
        permissionId: approval.permissionId,
        roleId: approval.newRoleId,
        accessRiskId: approval.accessRiskId,
        approvalRequestId: approval.id,
        source: "WEB_APP",
        beforeData: { status: "PENDING" },
        afterData: { status: "REJECTED" },
      },
    });

    return rejected;
  });
}

async function approveAndApply(
  approval: ApprovalForDecision,
  approverId: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.approvalRequest.update({
      where: { id: approval.id },
      data: {
        status: "APPROVED",
        approvedByUserId: approverId,
        decidedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorType: "HUMAN",
        actorUserId: approverId,
        actionType: "APPROVAL_APPROVED",
        targetUserId: approval.targetUserId,
        permissionId: approval.permissionId,
        roleId: approval.newRoleId,
        accessRiskId: approval.accessRiskId,
        approvalRequestId: approval.id,
        source: "WEB_APP",
        beforeData: { status: "PENDING" },
        afterData: { status: "APPROVED" },
      },
    });

    if (approval.actionType === "REVOKE_PERMISSION") {
      if (!approval.permissionId || !approval.permission) {
        throw new AppError("Approval is missing its permission.");
      }

      const currentOverride = await tx.userPermissionOverride.findUnique({
        where: {
          userId_permissionId: {
            userId: approval.targetUserId,
            permissionId: approval.permissionId,
          },
        },
      });

      if (currentOverride?.effect === "ALLOW") {
        await tx.userPermissionOverride.delete({
          where: { id: currentOverride.id },
        });
      } else {
        await tx.userPermissionOverride.upsert({
          where: {
            userId_permissionId: {
              userId: approval.targetUserId,
              permissionId: approval.permissionId,
            },
          },
          create: {
            userId: approval.targetUserId,
            permissionId: approval.permissionId,
            effect: "DENY",
            reason: `Approved remediation: ${approval.reason}`,
            grantedByUserId: approverId,
          },
          update: {
            effect: "DENY",
            reason: `Approved remediation: ${approval.reason}`,
            grantedByUserId: approverId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorType: "HUMAN",
          actorUserId: approverId,
          actionType: "PERMISSION_REVOKED",
          targetUserId: approval.targetUserId,
          permissionId: approval.permissionId,
          accessRiskId: approval.accessRiskId,
          approvalRequestId: approval.id,
          source:
            approval.requestedByType === "WEBMCP_AGENT"
              ? "WEBMCP"
              : "WEB_APP",
          beforeData: { granted: true },
          afterData: { granted: false },
          metadata: { initiatedBy: approval.requestedByType },
        },
      });
    } else if (approval.actionType === "DISABLE_USER") {
      await tx.user.update({
        where: { id: approval.targetUserId },
        data: { status: "DISABLED" },
      });

      await tx.auditLog.create({
        data: {
          actorType: "HUMAN",
          actorUserId: approverId,
          actionType: "USER_DISABLED",
          targetUserId: approval.targetUserId,
          accessRiskId: approval.accessRiskId,
          approvalRequestId: approval.id,
          source:
            approval.requestedByType === "WEBMCP_AGENT"
              ? "WEBMCP"
              : "WEB_APP",
          beforeData: { status: "ACTIVE" },
          afterData: { status: "DISABLED" },
          metadata: { initiatedBy: approval.requestedByType },
        },
      });
    } else {
      if (!approval.newRoleId || !approval.newRole) {
        throw new AppError("Approval is missing its new role.");
      }

      const previousUser = await tx.user.findUniqueOrThrow({
        where: { id: approval.targetUserId },
      });

      await tx.user.update({
        where: { id: approval.targetUserId },
        data: { roleId: approval.newRoleId },
      });

      await tx.auditLog.create({
        data: {
          actorType: "HUMAN",
          actorUserId: approverId,
          actionType: "ROLE_CHANGED",
          targetUserId: approval.targetUserId,
          roleId: approval.newRoleId,
          accessRiskId: approval.accessRiskId,
          approvalRequestId: approval.id,
          source:
            approval.requestedByType === "WEBMCP_AGENT"
              ? "WEBMCP"
              : "WEB_APP",
          beforeData: { roleId: previousUser.roleId },
          afterData: { roleId: approval.newRoleId },
          metadata: { initiatedBy: approval.requestedByType },
        },
      });
    }

    return tx.approvalRequest.findUniqueOrThrow({
      where: { id: approval.id },
      include: { targetUser: true, permission: true, newRole: true },
    });
  });
}
