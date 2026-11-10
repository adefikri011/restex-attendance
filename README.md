This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database (Neon PostgreSQL)

The Prisma schema is in `prisma/schema.prisma`. Runtime queries use Neon's pooled
connection, while Prisma migrations should use the direct, non-pooled connection.

1. Rotate any database password that has been shared outside a secret manager.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to Neon's pooled connection
   string and `DIRECT_URL` to its direct connection string. Never commit `.env`.
3. Generate the Prisma client and validate the schema:

   ```bash
   npm run db:generate
   npm run db:validate
   ```

4. Apply migrations to a development database:

   ```bash
   npm run db:migrate
   ```

   Use `npm run db:deploy` to apply committed migrations in a deployment environment.

Do not run migrations against production until the schema and migration have been
reviewed and the database has a backup. The current UI still uses local preview data;
the Prisma client is the server-side foundation for the next integration step.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
