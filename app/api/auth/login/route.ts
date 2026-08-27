import { createSession } from "@/lib/auth/session";
import { errorResponse, ok, readJsonObject, readRequiredString } from "@/lib/api";
import { validateDemoCredentials } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const email = readRequiredString(body, "email");
    const password = readRequiredString(body, "password");
    validateDemoCredentials(email, password);
    await createSession(email.toLowerCase());
    return ok({ authenticated: true });
  } catch (error) {
    return errorResponse(error);
  }
}
