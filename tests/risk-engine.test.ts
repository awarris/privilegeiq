import assert from "node:assert/strict";
import test from "node:test";
import { analyzeUserAccess, type UserAccessSnapshot } from "../lib/domain/risk-engine";

const NOW = new Date("2026-08-26T12:00:00Z");

function baseUser(overrides: UserAccessSnapshot["overrides"] = []): UserAccessSnapshot {
  return {
    id: "user-1",
    name: "Alice",
    status: "ACTIVE",
    lastActiveAt: new Date("2026-08-25T12:00:00Z"),
    rolePermissionIds: new Set(["projects-read"]),
    overrides,
  };
}

test("detects a critical direct permission outside the role", () => {
  const risks = analyzeUserAccess(
    baseUser([
      {
        effect: "ALLOW",
        permission: { id: "users-delete", slug: "users.delete", riskLevel: "CRITICAL" },
      },
    ]),
    NOW,
  );

  assert.equal(risks.length, 1);
  assert.equal(risks[0]?.type, "SENSITIVE_PERMISSION");
  assert.equal(risks[0]?.severity, "CRITICAL");
});

test("does not flag a role-inherited elevated permission as a direct-access risk", () => {
  const user = baseUser([
    {
      effect: "ALLOW",
      permission: { id: "projects-read", slug: "projects.read", riskLevel: "HIGH" },
    },
  ]);
  const risks = analyzeUserAccess(user, NOW);
  assert.equal(risks.length, 0);
});

test("detects an active account with more than 90 days of inactivity", () => {
  const user = baseUser();
  user.lastActiveAt = new Date("2026-04-01T12:00:00Z");
  const risks = analyzeUserAccess(user, NOW);
  assert.equal(risks.some((risk) => risk.type === "INACTIVE_ACCOUNT"), true);
});

test("detects excessive privileges when two elevated direct permissions are present", () => {
  const risks = analyzeUserAccess(
    baseUser([
      {
        effect: "ALLOW",
        permission: { id: "users-delete", slug: "users.delete", riskLevel: "CRITICAL" },
      },
      {
        effect: "ALLOW",
        permission: { id: "billing-manage", slug: "billing.manage", riskLevel: "HIGH" },
      },
    ]),
    NOW,
  );

  assert.equal(risks.some((risk) => risk.type === "EXCESSIVE_PRIVILEGES"), true);
});
