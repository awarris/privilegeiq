import { errorResponse, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth/session";
import { getUserAccess } from "@/services/user.service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireApiSession();
    const { id } = await context.params;
    return ok(await getUserAccess(id));
  } catch (error) {
    return errorResponse(error);
  }
}
