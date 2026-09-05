# DealFlow360

Fullstack application built with Next.js 15 (App Router, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts), Prisma ORM, and Dockerized PostgreSQL 16.

Frontend and Backend APIs run together seamlessly on **the same port (`3000`)**.

## Project Architecture

```
DealFlow360/
├── docker-compose.yml     # PostgreSQL 16 container
├── .env.example           # Root environment configuration
├── frontend/              # Fullstack Next.js 15 app (Frontend & Backend on port 3000)
│   ├── prisma/            # Prisma schema (PostgreSQL)
│   ├── src/
│   │   ├── app/           # App Router (pages & /api backend routes)
│   │   │   ├── api/
│   │   │   │   └── health/route.ts
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── lib/           # Prisma client singleton & shared utilities
│   └── package.json
└── backend/               # Standalone Express + TypeScript service (alternative)
    ├── prisma/
    ├── src/
    └── package.json
```

## Getting Started

### 1. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

PostgreSQL will be running on `localhost:5432` with database `dealflow360`.

### 2. Run Application (Same Port: 3000)

```bash
cd frontend
npm run dev
```

- **Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### 3. Database Migrations (Prisma)

From the `frontend` folder:

```bash
npx prisma generate
npx prisma db push # or npx prisma migrate dev
```
