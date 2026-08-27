"use client";

import { callPrivilegeIqApi, toolErrorResult, toolResult } from "@/webmcp/api-client";

export const PRIVILEGEIQ_WEBMCP_READY_EVENT = "privilegeiq:webmcp-ready";

async function executeWebMcpTool(operation: () => Promise<unknown>): Promise<string> {
  try {
    return toolResult(await operation());
  } catch (error) {
    return toolErrorResult(error);
  }
}

export async function registerPrivilegeIqTools(signal: AbortSignal): Promise<number> {
  const modelContext = document.modelContext;
  if (!modelContext) return 0;

  const tools: WebMcpTool[] = [
    {
      name: "list_users",
      title: "List organization users",
      description: "List PrivilegeIQ users with their role, status, last activity, and open risk count.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: async (_input, context) =>
        executeWebMcpTool(() => callPrivilegeIqApi("/api/users", {}, context?.signal)),
    },
    {
      name: "list_roles",
      title: "List roles and expected permissions",
      description: "List PrivilegeIQ roles and the permissions each role is expected to inherit.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: async (_input, context) =>
        executeWebMcpTool(() => callPrivilegeIqApi("/api/roles", {}, context?.signal)),
    },
    {
      name: "get_user_access",
      title: "Inspect user access",
      description: "Inspect a user's effective permissions, role-derived permissions, direct access, and denied permissions.",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string", description: "PrivilegeIQ user identifier." },
        },
        required: ["userId"],
      },
      annotations: { readOnlyHint: true },
      execute: async ({ userId }, context) =>
        executeWebMcpTool(() =>
          callPrivilegeIqApi(`/api/users/${encodeURIComponent(String(userId))}/access`, {}, context?.signal),
        ),
    },
    {
      name: "audit_organization_access",
      title: "Audit organization access",
      description: "Run PrivilegeIQ's deterministic access-risk scan and return the current open risks.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: false },
      execute: async (_input, context) =>
        executeWebMcpTool(async () => {
          const scan = await callPrivilegeIqApi("/api/risks/scan", { method: "POST" }, context?.signal);
          const risks = await callPrivilegeIqApi("/api/risks?status=OPEN", {}, context?.signal);
          return { scan, risks };
        }),
    },
    {
      name: "list_access_risks",
      title: "List access risks",
      description: "List access risks already detected by PrivilegeIQ, optionally filtered to OPEN or RESOLVED.",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["OPEN", "RESOLVED"] },
        },
      },
      annotations: { readOnlyHint: true },
      execute: async ({ status }, context) =>
        executeWebMcpTool(() => {
          const query = status ? `?status=${encodeURIComponent(String(status))}` : "";
          return callPrivilegeIqApi(`/api/risks${query}`, {}, context?.signal);
        }),
    },
    {
      name: "get_access_risk",
      title: "Inspect access risk",
      description: "Get full details about one PrivilegeIQ access risk and its remediation history.",
      inputSchema: {
        type: "object",
        properties: { riskId: { type: "string" } },
        required: ["riskId"],
      },
      annotations: { readOnlyHint: true },
      execute: async ({ riskId }, context) =>
        executeWebMcpTool(() =>
          callPrivilegeIqApi(`/api/risks/${encodeURIComponent(String(riskId))}`, {}, context?.signal),
        ),
    },
    {
      name: "list_pending_approvals",
      title: "List pending human approvals",
      description: "List remediation requests that are waiting for a human decision in PrivilegeIQ.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: async (_input, context) =>
        executeWebMcpTool(() =>
          callPrivilegeIqApi("/api/approvals?status=PENDING", {}, context?.signal),
        ),
    },
    {
      name: "request_revoke_permission",
      title: "Request permission revocation",
      description: "Prepare a human approval request to revoke an effective permission. This tool never revokes access directly.",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string" },
          permissionSlug: { type: "string", description: "Permission slug such as users.delete." },
          accessRiskId: { type: "string", description: "Optional related risk identifier." },
          reason: { type: "string", minLength: 10 },
        },
        required: ["userId", "permissionSlug", "reason"],
      },
      annotations: { readOnlyHint: false },
      execute: async (input, context) =>
        executeWebMcpTool(() =>
          callPrivilegeIqApi(
            "/api/approvals",
            {
              method: "POST",
              body: JSON.stringify({
                requestedByType: "WEBMCP_AGENT",
                actionType: "REVOKE_PERMISSION",
                targetUserId: input.userId,
                permissionSlug: input.permissionSlug,
                accessRiskId: input.accessRiskId,
                reason: input.reason,
              }),
            },
            context?.signal,
          ),
        ),
    },
    {
      name: "request_disable_user",
      title: "Request user disablement",
      description: "Prepare a human approval request to disable a user account. This tool never disables the account directly.",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string" },
          accessRiskId: { type: "string" },
          reason: { type: "string", minLength: 10 },
        },
        required: ["userId", "reason"],
      },
      annotations: { readOnlyHint: false },
      execute: async (input, context) =>
        executeWebMcpTool(() =>
          callPrivilegeIqApi(
            "/api/approvals",
            {
              method: "POST",
              body: JSON.stringify({
                requestedByType: "WEBMCP_AGENT",
                actionType: "DISABLE_USER",
                targetUserId: input.userId,
                accessRiskId: input.accessRiskId,
                reason: input.reason,
              }),
            },
            context?.signal,
          ),
        ),
    },
    {
      name: "request_change_user_role",
      title: "Request user role change",
      description: "Prepare a human approval request to change a user's role. This tool never changes the role directly.",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string" },
          newRoleSlug: { type: "string", description: "Target role slug such as viewer or developer." },
          accessRiskId: { type: "string" },
          reason: { type: "string", minLength: 10 },
        },
        required: ["userId", "newRoleSlug", "reason"],
      },
      annotations: { readOnlyHint: false },
      execute: async (input, context) =>
        executeWebMcpTool(() =>
          callPrivilegeIqApi(
            "/api/approvals",
            {
              method: "POST",
              body: JSON.stringify({
                requestedByType: "WEBMCP_AGENT",
                actionType: "CHANGE_ROLE",
                targetUserId: input.userId,
                newRoleSlug: input.newRoleSlug,
                accessRiskId: input.accessRiskId,
                reason: input.reason,
              }),
            },
            context?.signal,
          ),
        ),
    },
  ];

  for (const tool of tools) {
    await modelContext.registerTool(tool, { signal });
  }

  document.dispatchEvent(
    new CustomEvent(PRIVILEGEIQ_WEBMCP_READY_EVENT, {
      detail: { count: tools.length },
    }),
  );
  return tools.length;
}
