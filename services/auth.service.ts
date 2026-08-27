import { timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/errors";

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validateDemoCredentials(email: string, password: string): void {
  const expectedEmail = process.env.DEMO_ADMIN_EMAIL;
  const expectedPassword = process.env.DEMO_ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword) {
    throw new Error("Demo administrator credentials are not configured.");
  }

  if (!safeEqual(email.toLowerCase(), expectedEmail.toLowerCase()) || !safeEqual(password, expectedPassword)) {
    throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }
}
