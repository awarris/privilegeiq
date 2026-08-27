# WebMCP contract

PrivilegeIQ registers tools with `document.modelContext.registerTool` when WebMCP is available in the browser. The tools call PrivilegeIQ's authenticated HTTP APIs; they do not access the database directly from the browser.

The current MVP exposes **10 tools**.

## Read and analysis tools

| Tool | Required input | Purpose |
| --- | --- | --- |
| `list_users` | none | List users, roles, account status, activity, and open-risk context. |
| `list_roles` | none | List roles and their expected inherited permissions. |
| `get_user_access` | `userId` | Return one user's effective permissions and denied permission overrides. |
| `audit_organization_access` | none | Run the deterministic risk scan and return the current `OPEN` risks. |
| `list_access_risks` | none; optional `status` | List risk history, optionally filtered to `OPEN` or `RESOLVED`. |
| `get_access_risk` | `riskId` | Return one risk plus its associated remediation history. |
| `list_pending_approvals` | none | List requests waiting for a human decision. |

`audit_organization_access` changes risk records as part of reconciliation, so it is not annotated as read-only even though it does not change user access.

## Sensitive request tools

| Tool | Required input | Optional input | Direct access change? |
| --- | --- | --- | --- |
| `request_revoke_permission` | `userId`, `permissionSlug`, `reason` | `accessRiskId` | No |
| `request_disable_user` | `userId`, `reason` | `accessRiskId` | No |
| `request_change_user_role` | `userId`, `newRoleSlug`, `reason` | `accessRiskId` | No |

All three tools create or reuse a `PENDING` approval request. A human must approve the request in the PrivilegeIQ UI before the backend performs the sensitive action.

## Example: permission revocation request

```json
{
  "userId": "<user-id>",
  "permissionSlug": "users.delete",
  "accessRiskId": "<optional-open-risk-id>",
  "reason": "The permission is outside the user's expected role and should be removed."
}
```

Expected workflow result:

```text
WEBMCP_AGENT -> ApprovalRequest(PENDING) -> human APPROVE/REJECT -> backend action
```

## Example: role-change request

```json
{
  "userId": "<user-id>",
  "newRoleSlug": "viewer",
  "reason": "The user no longer requires elevated access."
}
```

## Validation and safety rules

Before a request is created, the backend validates the current state. Important guards include:

- target user must exist
- permission / role / access risk must exist when supplied
- related risk must belong to the target user
- related risk must still be `OPEN`
- permission must currently be effective before it can be revoked
- a disabled user cannot be disabled again
- the target role must differ from the current role
- remediation reason must contain at least 10 characters
- exact duplicate pending requests are idempotent
- a second conflicting pending role change for the same user is rejected

## Permission revocation semantics

A revocation behaves differently depending on the source of the permission:

- direct `ALLOW` -> the direct override is removed
- role-inherited permission -> a direct `DENY` override is created for that user

The shared role itself is not modified by a user-specific revocation.

## Error contract

Expected business failures are returned to WebMCP as structured JSON instead of surfacing as a generic tool invocation failure.

```json
{
  "success": false,
  "error": {
    "code": "ROLE_ALREADY_ASSIGNED",
    "message": "The user already has that role.",
    "status": 409
  }
}
```

Representative error codes include:

- `USER_NOT_FOUND`
- `ROLE_NOT_FOUND`
- `PERMISSION_NOT_FOUND`
- `ACCESS_RISK_NOT_FOUND`
- `INVALID_RISK_CONTEXT`
- `ACCESS_RISK_ALREADY_RESOLVED`
- `PERMISSION_NOT_HELD`
- `USER_ALREADY_DISABLED`
- `ROLE_ALREADY_ASSIGNED`
- `CONFLICTING_PENDING_APPROVAL`

## Browser lifecycle

Tool registration is tied to the PrivilegeIQ client lifecycle. Execution supports an optional abort signal from the WebMCP context. Intentional aborts are treated as cancellation, while expected application errors are converted into the structured error contract above.

## Language policy

WebMCP names, descriptions, input fields, and technical responses are intentionally written in English. The human-facing PrivilegeIQ interface can be switched between English and French independently.
