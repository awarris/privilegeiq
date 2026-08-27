# Hackathon demo walkthrough

This walkthrough is designed to show the core value of PrivilegeIQ quickly: **the agent can investigate and propose, while the human remains in control of privileged changes.**

## Demo preparation

Use a freshly seeded demo database when recording the final video:

```bash
npm run db:seed
```

This intentionally resets demo data and recreates the seeded risk conditions.

Do not hardcode database IDs in the presentation. Let the agent discover users and risks through WebMCP tools so the demo proves the tool interface is real.

## Recommended narrative

### 1. Establish the problem

Open the PrivilegeIQ dashboard and explain that access reviews usually require a human to inspect users, roles, direct exceptions, and stale accounts manually.

### 2. Let the agent audit

Ask the agent:

> Audit our organization access and identify the most dangerous issues.

The agent should use `audit_organization_access` and, when useful, `get_access_risk` / `get_user_access`.

On a fresh seed, the demo dataset is designed to surface multiple risk types, including critical direct permissions, excessive privilege, and a stale active contractor account.

### 3. Ask for remediation

Choose one critical risk and ask the agent to prepare a safe remediation.

The key moment: the WebMCP tool returns a `PENDING` approval instead of applying the change.

### 4. Show human control

Keep the Approvals page visible. The new WebMCP request should appear through live refresh. Open the confirmation modal and show:

- action
- target user
- permission or role
- risk severity when available
- remediation reason

Approve the request.

### 5. Prove the backend actually changed access

Ask the agent to inspect the same user's access using `get_user_access`. Confirm the risky permission or role is changed only after human approval.

### 6. Prove reconciliation and traceability

Re-run `audit_organization_access`, then open Audit Logs. Show that PrivilegeIQ records:

- agent-created approval request
- human decision
- access remediation
- risk resolution when the condition disappears

### 7. Optional rejection moment

If time allows, create a harmless role-change proposal and reject it. Then use `get_user_access` to prove the user's role stayed unchanged.

## What judges should understand

By the end of the demo, the audience should have seen this complete chain:

```text
Agent discovers tools
        -> investigates access
        -> finds explainable risk
        -> requests remediation
        -> human reviews
        -> human approves/rejects
        -> backend enforces decision
        -> audit trail records it
        -> risk state reconciles
```

The differentiator is not an autonomous security bot. It is **structured human-agent collaboration for sensitive access governance**.
