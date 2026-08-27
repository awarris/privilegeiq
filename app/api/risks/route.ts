import { errorResponse, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { listAccessRisks } from "@/services/risk.service";

export async function GET(request: Request) {
  try {
    await requireApiSession();
    const rawStatus = new URL(request.url).searchParams.get("status");
    if (rawStatus && rawStatus !== "OPEN" && rawStatus !== "RESOLVED") {
      throw new AppError("status must be OPEN or RESOLVED.");
    }
    return ok(
      await listAccessRisks(
        rawStatus as "OPEN" | "RESOLVED" | undefined,
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
