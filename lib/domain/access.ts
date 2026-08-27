export interface EffectivePermission {
  id: string;
  name: string;
  slug: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source: "ROLE" | "DIRECT_ALLOW";
}

export interface UserAccessView {
  user: {
    id: string;
    name: string;
    email: string;
    status: "ACTIVE" | "DISABLED";
    role: { id: string; name: string; slug: string };
    lastActiveAt: string | null;
  };
  permissions: EffectivePermission[];
  deniedPermissions: string[];
}
