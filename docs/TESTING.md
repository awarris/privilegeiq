# Testing and release verification

PrivilegeIQ uses automated domain checks plus manual end-to-end WebMCP scenarios.

## Automated pre-release checks

Run all four commands before deployment:

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

The domain test suite currently covers the three core risk families:

- sensitive direct permission outside the role
- stale active account
- excessive elevated direct permissions

## Core WebMCP tool matrix

All 10 tools should be smoke-tested against a fresh demo dataset:

- `list_users`
- `list_roles`
- `get_user_access`
- `audit_organization_access`
- `list_access_risks`
- `get_access_risk`
- `list_pending_approvals`
- `request_revoke_permission`
- `request_disable_user`
- `request_change_user_role`

## Required end-to-end approval scenarios

### Approve permission revocation

1. Detect a risky direct permission.
2. Create `REVOKE_PERMISSION` through WebMCP.
3. Confirm that the request is `PENDING` and the permission is still effective.
4. Approve it in the UI.
5. Confirm that the permission is no longer effective.
6. Re-run the audit and confirm risk reconciliation.

### Approve user disablement

1. Detect a stale active account.
2. Request `DISABLE_USER`.
3. Confirm the account remains `ACTIVE` while pending.
4. Approve the request.
5. Confirm the account becomes `DISABLED`.
6. Re-run the audit and confirm the stale-account risk is resolved.

### Approve role change

1. Request `CHANGE_ROLE`.
2. Confirm the current role remains unchanged while pending.
3. Approve it.
4. Confirm the new role and recalculated role-derived permissions.

### Reject a sensitive request

1. Create a pending remediation.
2. Reject it in the UI.
3. Confirm the request is `REJECTED`.
4. Confirm the user's access is unchanged.
5. Confirm the rejection appears in Audit Logs.

## Required edge cases

Before release, verify that:

- disabling an already disabled user returns `USER_ALREADY_DISABLED`
- revoking a permission the user does not hold returns `PERMISSION_NOT_HELD`
- assigning the user's current role returns `ROLE_ALREADY_ASSIGNED`
- an unknown user is rejected
- an unknown role is rejected
- an unknown permission is rejected
- a risk belonging to another user is rejected with invalid risk context
- a resolved risk cannot be reused for a new remediation
- an exact duplicate pending request is idempotent and returns the existing row
- a conflicting pending role change is rejected with `CONFLICTING_PENDING_APPROVAL`
- revoking a role-inherited permission creates a user-specific `DENY` without changing the shared role
- failed requests do not create unexpected `PENDING` approval rows

## Approval live-update check

Keep the Approvals page open and create a request from WebMCP. The request should appear automatically without navigating away or manually refreshing the page. A currently open confirmation modal must not be disrupted by background refresh.

## Responsive smoke test

The UI is designed to work from 360 px upward. Before a public release, smoke-test at least:

- 1440 px desktop
- 1024 px laptop/tablet landscape
- 768 px tablet
- 430 px mobile
- 360 px small mobile

Prioritize Dashboard, Users, Access Risks, Approvals, Audit Logs, login, and confirmation modals. Verify there is no horizontal page overflow and that primary actions remain reachable.

## Production smoke test

After deployment:

1. `GET /api/health` -> database status `ok`.
2. Sign in using the configured demo administrator.
3. Confirm all 10 WebMCP tools are detected.
4. Run one audit.
5. Create one sensitive request.
6. Confirm it appears through live Approvals refresh.
7. Approve or reject it.
8. Verify the resulting user access and Audit Logs.
