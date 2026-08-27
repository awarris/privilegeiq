export const SEVERITY_WEIGHT = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
} as const;

export type Severity = keyof typeof SEVERITY_WEIGHT;

export function compareSeverityDescending(
  left: Severity,
  right: Severity,
): number {
  return SEVERITY_WEIGHT[right] - SEVERITY_WEIGHT[left];
}
