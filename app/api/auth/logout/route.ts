import { clearSession } from "@/lib/auth/session";
import { ok } from "@/lib/api";

export async function POST() {
  await clearSession();
  return ok({ authenticated: false });
}
