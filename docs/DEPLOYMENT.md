# Deployment — Vercel + Supabase PostgreSQL

PrivilegeIQ is designed to run as a Next.js application on Vercel with PostgreSQL hosted by Supabase.

## 1. Release gate

Do not deploy until these commands pass locally:

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

Also make sure no approval request created only for testing remains unintentionally `PENDING`.

## 2. Create the Supabase database

Create a dedicated Supabase project for the public demo.

For a Vercel/serverless runtime, use Supabase's **Transaction Pooler** connection for application traffic. Use a direct or Session Pooler connection for Prisma CLI operations such as `db push`.

Recommended environment split:

```text
DATABASE_URL=<Supabase Transaction Pooler URL, usually port 6543>
DIRECT_URL=<Supabase Session Pooler/direct URL, usually port 5432>
```

`DATABASE_URL` is consumed by the running Next.js application through `@prisma/adapter-pg`. `prisma.config.ts` uses `DIRECT_URL` when present and falls back to `DATABASE_URL` for local simplicity.

Keep both variables server-side only.

## 3. Initialize the hosted schema

From a trusted development machine with the production database variables loaded:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

Important:

- `db:push` is intentionally acceptable for this hackathon MVP.
- `db:seed` deletes and recreates the PrivilegeIQ demo dataset. Run it only when resetting the demo database is intentional.
- A long-lived production system should use reviewed Prisma migrations instead of `db:push`.

## 4. Vercel environment variables

Configure these variables for the relevant Vercel environments:

```text
DATABASE_URL=<Supabase pooled runtime URL>
DIRECT_URL=<Supabase direct/session URL>
DEMO_ADMIN_EMAIL=<demo administrator email>
DEMO_ADMIN_PASSWORD=<strong unique demo password>
SESSION_SECRET=<random value of at least 32 characters>
```

Generate a strong session secret locally, for example:

```bash
openssl rand -base64 48
```

Never commit production secrets.

## 5. Deploy to Vercel

Import the repository into Vercel and use the Next.js framework preset. The repository's `vercel-build` script generates Prisma Client before the Next.js production build.

After a successful deployment, open:

```text
https://<deployment-host>/api/health
```

Expected response:

```json
{
  "status": "ok",
  "database": "ok"
}
```

## 6. Production WebMCP smoke test

The public application must run over HTTPS.

1. Sign in to PrivilegeIQ.
2. Confirm all 10 WebMCP tools are detected.
3. Run `audit_organization_access`.
4. Create one sensitive request through WebMCP.
5. Confirm it appears automatically on Approvals.
6. Approve or reject it through the human confirmation modal.
7. Verify the resulting access through `get_user_access`.
8. Confirm the decision and remediation in Audit Logs.

## 7. Security checklist

- Use demo-only identities and synthetic access data.
- Rotate `DEMO_ADMIN_PASSWORD` before publishing.
- Generate a new `SESSION_SECRET` before publishing.
- Keep `DATABASE_URL` and `DIRECT_URL` out of client components and source control.
- Do not disable the human-approval requirement for sensitive actions.
- Do not expose a production Supabase service-role key; PrivilegeIQ does not need one for this architecture.
- Confirm the session cookie is secure on the HTTPS deployment.

## 8. Demo reset procedure

If the public demo state becomes messy after judging or rehearsal:

```bash
npm run db:seed
```

This resets users, overrides, risks, approvals, and audit logs to the deterministic demo state.

## References

- Supabase connection modes: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase + Prisma: https://supabase.com/docs/guides/database/prisma
- Prisma + Supabase: https://www.prisma.io/docs/orm/overview/databases/supabase
