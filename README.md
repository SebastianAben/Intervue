# Intervue

Intervue adalah MVP web app latihan interview kerja berbasis suara. Repository ini disiapkan sebagai monorepo TypeScript untuk frontend, backend, shared types, dan schema database.

## Tech Stack Phase 0

- Frontend: Next.js App Router, React, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL, Prisma
- Package manager: pnpm
- AI key: hanya disiapkan di backend, belum dipakai di Phase 0

## Struktur

```text
apps/web        Next.js frontend
apps/api        Express backend + Prisma schema
packages/shared Shared API response types
cache           Product and architecture documents
```

## Prerequisites

- Node.js
- pnpm
- PostgreSQL lokal

## Setup Lokal

1. Install dependencies.

```bash
pnpm install
```

2. Buat file environment.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. Buat database lokal dan sesuaikan `DATABASE_URL` di `apps/api/.env`.

```bash
createdb intervue
```

```text
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/intervue"
```

Jika PostgreSQL lokal memakai user macOS tanpa password, gunakan format
`postgresql://YOUR_LOCAL_USER@localhost:5432/intervue`.

4. Generate Prisma client dan jalankan migration.

```bash
pnpm db:generate
pnpm db:migrate
```

5. Jalankan frontend dan backend.

```bash
pnpm dev
```

Frontend berjalan di `http://localhost:3000`.
Backend berjalan di `http://localhost:4000/api`.

## Commands

```bash
pnpm dev          # run web and api
pnpm dev:web      # run frontend only
pnpm dev:api      # run backend only
pnpm lint         # lint all packages
pnpm typecheck    # typecheck all packages
pnpm format       # check formatting
pnpm db:generate  # generate Prisma client
pnpm db:migrate   # run Prisma migration
pnpm db:studio    # open Prisma Studio
```

## Environment

Frontend only receives public backend URL:

```text
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api"
```

Backend owns secrets:

```text
DATABASE_URL="postgresql://..."
JWT_SECRET="replace-with-a-long-random-secret"
GEMINI_API_KEY="replace-when-ai-phase-starts"
CORS_ORIGIN="http://localhost:3000"
PORT="4000"
```

Do not put `GEMINI_API_KEY`, `JWT_SECRET`, or database credentials in frontend environment variables.

## Phase 0 Acceptance

- Frontend and backend run locally.
- `GET /api/health` returns `{ "data": { "status": "ok" }, "error": null }`.
- Frontend can read backend health through `NEXT_PUBLIC_API_BASE_URL`.
- Prisma schema covers the MVP data model.
- `pnpm lint` and `pnpm typecheck` pass.

## Deployment Note

Phase 0 is local-first. Vercel deployment, home-server reverse proxy, DDNS, TLS, and process manager setup should be completed after the local foundation is stable.
