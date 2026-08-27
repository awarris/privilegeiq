import { errorResponse, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth/session";
import { listRolesWithPermissions } from "@/services/user.service";

export async function GET() {
  try {
    await requireApiSession();
    return ok(await listRolesWithPermissions());
  } catch (error) {
    return errorResponse(error);
  }
}
