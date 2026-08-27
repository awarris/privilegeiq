import { errorResponse, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth/session";
import { listUsers } from "@/services/user.service";

export async function GET() {
  try {
    await requireApiSession();
    const users = await listUsers();
    return ok(users);
  } catch (error) {
    return errorResponse(error);
  }
}
