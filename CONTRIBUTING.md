# Contributing

PrivilegeIQ is intentionally small, but security-sensitive workflows need clear boundaries and predictable review practices.

## Engineering conventions

- Use TypeScript with strict typing.
- Avoid `any` unless an external API makes it unavoidable; document why when used.
- Keep business rules in `services/` or `lib/domain/`, not in React components.
- Route handlers own HTTP validation/translation, not core business decisions.
- Reuse the same services for UI and WebMCP flows; do not create an agent-only bypass.
- Sensitive access changes must remain human-approved.
- Preserve the effective-access rule: role permissions + direct `ALLOW` - direct `DENY`.
- Keep machine-facing WebMCP names, fields, error codes, logs, code, and comments in professional English.
- Keep the human UI English by default and maintain the French translations when changing user-facing copy.
- Keep secrets out of source control and document required variables in `.env.example`.
- Prefer small, descriptive functions and names that express intent.
- Comments should explain non-obvious decisions, not restate the implementation.
- Add or update tests whenever a pure domain rule changes.
- Update `docs/WEBMCP.md` whenever a tool name, input schema, or safety rule changes.
- Update `docs/ARCHITECTURE.md` when business boundaries or access semantics change.

## Required checks before a pull request

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

`npm run check` currently runs the repository's combined lint/test/build workflow, but the explicit type check above should still be run before release.

## Security-sensitive review checklist

For changes touching approvals, access, risk logic, authentication, or WebMCP:

- Can the agent apply a sensitive action without human approval?
- Can a duplicate or conflicting request create an ambiguous state?
- Is the current database state revalidated before creating/applying the action?
- Does the change preserve auditability?
- Does the error response remain machine-readable and safe to expose?
- Are role-wide permissions accidentally being changed for a user-specific remediation?

## Repository hygiene

Before committing, confirm that none of these are staged:

- `.env` or other secret files
- generated Prisma Client
- `.next` or build output
- local database artifacts
- `.vercel`
- temporary test exports or screenshots not intended for the repository
