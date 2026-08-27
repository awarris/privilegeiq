import {
  ELEVATED_OVERRIDE_THRESHOLD,
  INACTIVE_ACCOUNT_DAYS,
} from "../constants";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskType =
  | "SENSITIVE_PERMISSION"
  | "INACTIVE_ACCOUNT"
  | "EXCESSIVE_PRIVILEGES";

export interface PermissionSnapshot {
  id: string;
  slug: string;
  riskLevel: RiskLevel;
}

export interface OverrideSnapshot {
  effect: "ALLOW" | "DENY";
  permission: PermissionSnapshot;
}

export interface UserAccessSnapshot {
  id: string;
  name: string;
  status: "ACTIVE" | "DISABLED";
  lastActiveAt: Date | null;
  rolePermissionIds: Set<string>;
  overrides: OverrideSnapshot[];
}

export interface RiskCandidate {
  fingerprint: string;
  userId: string;
  permissionId?: string;
  type: RiskType;
  severity: RiskLevel;
  title: string;
  description: string;
}

const ELEVATED_LEVELS = new Set<RiskLevel>(["HIGH", "CRITICAL"]);

function daysSince(value: Date, now: Date): number {
  return Math.floor((now.getTime() - value.getTime()) / 86_400_000);
}

export function analyzeUserAccess(
  user: UserAccessSnapshot,
  now = new Date(),
): RiskCandidate[] {
  const risks: RiskCandidate[] = [];

  if (
    user.status === "ACTIVE" &&
    user.lastActiveAt &&
    daysSince(user.lastActiveAt, now) > INACTIVE_ACCOUNT_DAYS
  ) {
    const inactiveDays = daysSince(user.lastActiveAt, now);
    risks.push({
      fingerprint: `inactive-account:${user.id}`,
      userId: user.id,
      type: "INACTIVE_ACCOUNT",
      severity: "MEDIUM",
      title: "Active account with prolonged inactivity",
      description: `${user.name} is still enabled after ${inactiveDays} days without activity.`,
    });
  }

  const elevatedDirectAllows = user.overrides.filter(
    (override) =>
      override.effect === "ALLOW" &&
      !user.rolePermissionIds.has(override.permission.id) &&
      ELEVATED_LEVELS.has(override.permission.riskLevel),
  );

  for (const override of elevatedDirectAllows) {
    risks.push({
      fingerprint: `sensitive-permission:${user.id}:${override.permission.id}`,
      userId: user.id,
      permissionId: override.permission.id,
      type: "SENSITIVE_PERMISSION",
      severity: override.permission.riskLevel,
      title: "Sensitive permission outside expected role",
      description: `${user.name} directly holds ${override.permission.slug}, a ${override.permission.riskLevel.toLowerCase()}-risk permission that is not inherited from the assigned role.`,
    });
  }

  if (elevatedDirectAllows.length >= ELEVATED_OVERRIDE_THRESHOLD) {
    risks.push({
      fingerprint: `excessive-privileges:${user.id}`,
      userId: user.id,
      type: "EXCESSIVE_PRIVILEGES",
      severity: "HIGH",
      title: "Multiple elevated permissions outside expected role",
      description: `${user.name} has ${elevatedDirectAllows.length} direct HIGH or CRITICAL permissions outside the assigned role.`,
    });
  }

  return risks;
}
