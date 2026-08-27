import { errorResponse, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth/session";
import { scanOrganizationAccess } from "@/services/risk.service";

export async function POST() {
  try {
    await requireApiSession();
    return ok(await scanOrganizationAccess());
  } catch (error) {
    return errorResponse(error);
  }
}
