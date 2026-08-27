import { created, errorResponse, ok, readJsonObject, readRequiredString } from "@/lib/api";
import { requireApiSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { createApprovalRequest, listApprovals } from "@/services/approval.service";

const REQUESTER_TYPES = new Set(["HUMAN", "WEBMCP_AGENT"]);
const ACTION_TYPES = new Set(["REVOKE_PERMISSION", "DISABLE_USER", "CHANGE_ROLE"]);

export async function GET(request: Request) {
  try {
    await requireApiSession();
    const status = new URL(request.url).searchParams.get("status");
    if (status && !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      throw new AppError("Invalid approval status.");
    }
    return ok(await listApprovals(status as "PENDING" | "APPROVED" | "REJECTED" | undefined));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    const body = await readJsonObject(request);
    const requestedByType = readRequiredString(body, "requestedByType");
    const actionType = readRequiredString(body, "actionType");
    const targetUserId = readRequiredString(body, "targetUserId");
    const reason = readRequiredString(body, "reason");

    if (!REQUESTER_TYPES.has(requestedByType) || !ACTION_TYPES.has(actionType)) {
      throw new AppError("Invalid approval request type.");
    }

    const approval = await createApprovalRequest({
      requestedByType: requestedByType as "HUMAN" | "WEBMCP_AGENT",
      requestedByUserEmail: requestedByType === "HUMAN" ? session.email : undefined,
      actionType: actionType as "REVOKE_PERMISSION" | "DISABLE_USER" | "CHANGE_ROLE",
      targetUserId,
      permissionSlug: typeof body.permissionSlug === "string" ? body.permissionSlug : undefined,
      newRoleSlug: typeof body.newRoleSlug === "string" ? body.newRoleSlug : undefined,
      accessRiskId: typeof body.accessRiskId === "string" ? body.accessRiskId : undefined,
      reason,
    });
    return created(approval);
  } catch (error) {
    return errorResponse(error);
  }
}
