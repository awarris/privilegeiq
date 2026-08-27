# Security policy

PrivilegeIQ is a hackathon prototype for access-governance workflows. It is **not** a production identity provider, PAM system, authorization server, or enterprise IAM replacement.

## Security goals of the prototype

The MVP is designed to demonstrate these controls:

- WebMCP access-inspection tools do not bypass the application's authenticated API layer.
- Sensitive WebMCP tools create approval requests rather than applying access changes directly.
- A human decision is required before permission revocation, user disablement, or role change.
- Approval creation validates target state, optional risk context, and relevant business invariants.
- Duplicate pending requests are idempotent where applicable.
- Conflicting pending role changes for the same user are blocked.
- Sensitive decisions, applied remediations, and risk lifecycle events are recorded in Audit Logs.
- Secrets are supplied through environment variables and are excluded from source control.

## Demo session security

PrivilegeIQ uses a signed demo session cookie for protected pages and APIs.

Current properties:

- HMAC-signed session payload
- HTTP-only cookie
- `SameSite=Lax`
- `Secure` in production
- eight-hour expiration
- constant-time signature comparison

`SESSION_SECRET` must contain at least 32 characters and must be replaced before public deployment.

## Important limitations

The current prototype does **not** provide:

- MFA
- enterprise SSO / OIDC / SAML federation
- SCIM lifecycle management
- delegated or granular administrator authorization
- tenant isolation suitable for production SaaS
- cryptographically immutable / externally anchored audit logs
- formal policy-as-code evaluation
- rate limiting or abuse prevention suitable for an Internet-scale service
- production-grade incident response, backup, retention, or compliance controls

The audit table should therefore be described as an application audit trail, not as a tamper-proof ledger.

## Demo data

Only synthetic demonstration identities and permissions should be used in the public hackathon deployment. Do not connect the prototype to a real enterprise directory or upload production access data.

## Secret handling

Never commit:

- `.env`
- Supabase database passwords
- `DATABASE_URL`
- `DIRECT_URL`
- Vercel secrets
- real administrator credentials

Use `.env.example` only for documented placeholders.

## Reporting a vulnerability

Please report security issues privately to the repository owner. Do not open a public issue containing exploit details, credentials, or sensitive deployment information.
