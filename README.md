# PrivilegeIQ

**Agent-powered access governance for the OpenAI WebMCP Challenge.**

PrivilegeIQ is a hackathon prototype that lets humans and AI agents investigate access, identify risky permissions, and prepare remediation through WebMCP while keeping sensitive changes under explicit human control.

The product is intentionally focused on one question: **how can an agent help with access governance without becoming an unreviewed privileged administrator?**

## What the demo proves

1. A compatible agent discovers PrivilegeIQ's WebMCP tools.
2. The agent inspects users, roles, effective permissions, and existing risks.
3. A deterministic audit detects risky direct permissions, excessive privilege, and stale active accounts.
4. The agent can request a remediation, but it cannot apply a sensitive change directly.
5. A human reviews the request in PrivilegeIQ and explicitly approves or rejects it.
6. Approved changes are applied by the backend, recorded in the audit trail, and followed by risk reconciliation.
7. Rejected changes leave access unchanged.

## Key capabilities

- 10 WebMCP tools for access inspection, risk analysis, and remediation requests.
- Human-in-the-loop approval for permission revocation, account disablement, and role changes.
- Effective-permission resolution using role permissions plus direct `ALLOW` overrides minus direct `DENY` overrides.
- Deterministic risk detection with stable fingerprints and `OPEN` / `RESOLVED` history.
- Idempotent pending requests and conflict protection for concurrent role-change proposals.
- Audit trail for agent requests, human decisions, access changes, and risk lifecycle events.
- Live approval updates in the UI without a full page reload.
- English UI by default with a persistent French switch.
- Responsive interface and light/dark appearance support.

## Technology stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- PostgreSQL
- Prisma ORM 7 + `@prisma/adapter-pg`
- WebMCP Imperative API (`document.modelContext.registerTool`)
- Vercel for application hosting
- Supabase PostgreSQL for the hosted database

## Local setup

### Prerequisites

- Node.js 22+
- npm
- Docker Desktop, or another PostgreSQL instance
- Chrome with WebMCP testing enabled when testing locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Set a strong `SESSION_SECRET` before sharing the application. Never commit `.env`.

### 3. Start PostgreSQL locally

```bash
docker compose up -d postgres
```

The bundled PostgreSQL container is exposed on host port `55473`.

### 4. Create the schema and seed deterministic demo data

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

> `db:seed` resets the PrivilegeIQ demo dataset. Do not run it against a database containing data you intend to keep.

### 5. Start the application

```bash
npm run dev
```

Open `http://localhost:3000` and sign in using the demo administrator credentials configured in `.env`.

## Quality checks

Run all four checks before a release or deployment:

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

`npm run check` is also available for the repository's combined lint/test/build workflow.

## WebMCP local testing

PrivilegeIQ uses the current WebMCP Imperative API on `document.modelContext`.

1. Open `chrome://flags/#enable-webmcp-testing`.
2. Enable WebMCP testing.
3. Relaunch Chrome.
4. Open PrivilegeIQ and sign in.
5. Confirm that the browser detects all 10 PrivilegeIQ tools.

Tool names and machine-facing schemas intentionally remain in English even when the PrivilegeIQ UI is switched to French.

See [`docs/WEBMCP.md`](docs/WEBMCP.md) for the complete tool contract and [`docs/DEMO.md`](docs/DEMO.md) for the recommended hackathon walkthrough.

## Project structure

```text
app/                  Next.js pages, layouts, and route handlers
components/           Reusable UI and client-side interaction components
lib/                  Shared infrastructure, auth, errors, formatting, i18n
lib/domain/           Pure access and risk-analysis rules
services/             Business workflows and persistence orchestration
webmcp/               WebMCP registration and API bridge
prisma/               Prisma schema and deterministic demo seed
tests/                Domain-level automated tests
docs/                 Architecture, WebMCP, security, testing, demo, deployment
app/generated/prisma/ Generated Prisma client (gitignored)
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — boundaries, data model, permission resolution, risk engine, approval lifecycle.
- [`docs/WEBMCP.md`](docs/WEBMCP.md) — all 10 tools, inputs, safety behavior, and error contract.
- [`docs/TESTING.md`](docs/TESTING.md) — automated checks and manual edge-case matrix.
- [`docs/DEMO.md`](docs/DEMO.md) — recommended judge-facing demo flow.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel + Supabase release procedure and smoke checks.
- [`SECURITY.md`](SECURITY.md) — prototype security model, guarantees, limitations, and vulnerability reporting.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — engineering conventions and pull-request checklist.

## Intentional MVP constraints

PrivilegeIQ is not a production identity provider, PAM system, or enterprise IAM replacement. The hackathon version intentionally excludes LDAP, Microsoft Entra ID, Google Workspace, SSO federation, SCIM, Kubernetes integrations, notification delivery, advanced tenancy, and an embedded proprietary AI model. The emphasis is the **human + agent governance workflow enabled by WebMCP**.

## Official references

- WebMCP Challenge: https://openai.com/webmcp-challenge/
- Chrome WebMCP: https://developer.chrome.com/docs/ai/webmcp
- WebMCP Imperative API: https://developer.chrome.com/docs/ai/webmcp/imperative-api
- Supabase database connections: https://supabase.com/docs/guides/database/connecting-to-postgres
- Prisma + Supabase: https://www.prisma.io/docs/orm/overview/databases/supabase

## License

MIT. See [`LICENSE`](LICENSE).
