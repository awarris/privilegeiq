import { errorResponse, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth/session";
import { listAuditLogs } from "@/services/audit.service";

export async function GET() {
  try {
    await requireApiSession();
    return ok(await listAuditLogs());
  } catch (error) {
    return errorResponse(error);
  }
}
