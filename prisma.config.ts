import "dotenv/config";

const fallbackDatabaseUrl =
  "postgresql://postgres:postgres@localhost:55473/privilegeiq?schema=public";

const runtimeDatabaseUrl = process.env.DATABASE_URL ?? fallbackDatabaseUrl;

// Prisma CLI operations should prefer a direct/session connection when one is
// available. Runtime application traffic continues to use DATABASE_URL via
// lib/prisma.ts, which allows a serverless deployment to use a transaction pooler.
const prismaCliDatabaseUrl = process.env.DIRECT_URL ?? runtimeDatabaseUrl;

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: prismaCliDatabaseUrl,
  },
};
