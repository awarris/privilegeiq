# Architecture

PrivilegeIQ is a single Next.js application with a PostgreSQL database. UI flows and WebMCP tools deliberately converge on the same backend services so that agent actions do not bypass business rules.

```text
                  +----------------------+
                  | Human administrator  |
                  +----------+-----------+
                             |
                             v
+----------------+   +-------+--------+   +---------------------+
| WebMCP agent   |-->| Next.js app    |-->| Route handlers      |
| browser tools  |   | UI + API       |   | authenticated APIs  |
+----------------+   +-------+--------+   +----------+----------+
                             |                       |
                             +-----------+-----------+
                                         v
                                +--------+---------+
                                | Business services |
                                +--------+---------+
                                         |
                              +----------+----------+
                              | Prisma + pg adapter |
                              +----------+----------+
                                         |
                                         v
                                   PostgreSQL
```

## Responsibility boundaries

- `app/` owns routing, rendering, HTTP boundaries, and response shaping.
- `components/` owns UI interactions only; business rules do not belong here.
- `services/` owns authorization-sensitive workflows and persistence orchestration.
- `lib/domain/` contains deterministic rules that can be tested without a database.
- `lib/auth/` owns the signed demo session.
- `lib/errors.ts` defines machine-readable application errors.
- `webmcp/` registers browser tools and calls the same authenticated API surface used by the application.
- `prisma/` defines the relational model and deterministic demo seed.

## Core data model

The MVP uses eight main tables:

1. `users`
2. `roles`
3. `permissions`
4. `role_permissions`
5. `user_permission_overrides`
6. `access_risks`
7. `approval_requests`
8. `audit_logs`

A user has one role in the MVP. Roles inherit many permissions through `role_permissions`. User-specific exceptions are represented by `user_permission_overrides` with `ALLOW` or `DENY` effects.

## Effective permission model

PrivilegeIQ resolves effective access as:

```text
effective permissions
= role permissions
+ direct ALLOW overrides
- direct DENY overrides
```

Examples:

- A temporary `ALLOW` can give a Support user `billing.manage` even though the role does not normally contain it.
- Revoking a direct `ALLOW` removes that override.
- Revoking a role-inherited permission creates a user-specific `DENY`; the role remains unchanged for everyone else.

This distinction is important because remediation must not accidentally mutate a shared role when the intended target is one user.

## Deterministic risk engine

The MVP intentionally uses explainable rules instead of probabilistic scoring.

### Rule 1 — sensitive direct permission

A direct `ALLOW` permission rated `HIGH` or `CRITICAL` is risky when it is not inherited from the user's assigned role.

### Rule 2 — stale active account

An account is risky when it remains `ACTIVE` after more than 90 days without activity.

### Rule 3 — excessive privilege

A user is considered excessively privileged when two or more direct `HIGH` or `CRITICAL` permissions exist outside the assigned role.

Each detected condition receives a stable fingerprint. Scans reconcile fingerprints instead of deleting historical records:

- new condition -> `OPEN`
- previously resolved condition detected again -> reopened
- condition no longer detected -> `RESOLVED` with `resolvedAt`

## Human-in-the-loop approval lifecycle

Sensitive WebMCP tools never change access directly.

```text
Agent request
   |
   v
Validate target, requested action, risk context, and current state
   |
   v
Create/reuse PENDING ApprovalRequest
   |
   v
Human reviews in PrivilegeIQ
   |                     |
Approve                 Reject
   |                     |
   v                     v
Apply change          Leave access unchanged
   |
   v
Write audit records
   |
   v
Reconcile risks
```

Supported sensitive actions:

- `REVOKE_PERMISSION`
- `DISABLE_USER`
- `CHANGE_ROLE`

Exact duplicate pending requests are idempotent and return the existing request. Conflicting pending role changes for the same user are rejected with `CONFLICTING_PENDING_APPROVAL`.

## Audit trail

PrivilegeIQ records important transitions such as:

- risk detected / resolved
- approval created
- approval approved / rejected
- permission revoked
- user disabled
- role changed

The audit trail is **application-level history**, not a cryptographically immutable ledger. The prototype does not claim tamper-proof storage.

## Authentication boundary

Protected pages and APIs require the signed demo session. The session cookie is HTTP-only, `SameSite=Lax`, secure in production, and expires after eight hours.

This is sufficient for the hackathon demo but is intentionally not a replacement for enterprise identity, MFA, delegated administration, or production-grade authorization policy.

## UI state and internationalization

English is the default UI language. Users can switch to French and the preference persists. WebMCP tool names, JSON schemas, API fields, and technical error codes remain in English to keep the machine contract stable.
