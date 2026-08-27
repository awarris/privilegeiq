import { errorResponse, ok, readJsonObject, readRequiredString } from "@/lib/api";
import { requireApiSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { decideApproval } from "@/services/approval.service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession();
    const { id } = await context.params;
    const body = await readJsonObject(request);
    const decision = readRequiredString(body, "decision");
    if (decision !== "APPROVE" && decision !== "REJECT") {
      throw new AppError("decision must be APPROVE or REJECT.");
    }
    return ok(await decideApproval(id, decision, session.email));
  } catch (error) {
    return errorResponse(error);
  }
}
