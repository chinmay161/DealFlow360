# DealFlow360

DealFlow360 scaffold with separated `frontend` (Next.js 15, Tailwind CSS, TypeScript, TanStack Query, React Hook Form, Zod, Recharts) and `backend` (Node.js, Express, TypeScript, Prisma ORM) alongside Dockerized PostgreSQL 16.

## Structure

```
DealFlow360/
├── docker-compose.yml     # PostgreSQL 16 service
├── .env.example           # Root environment configuration
├── backend/               # Express + TypeScript + Prisma ORM
│   ├── prisma/            # Prisma schema (PostgreSQL)
│   ├── src/               # Application logic
│   └── package.json
└── frontend/              # Next.js 15 App Router + Tailwind CSS
    ├── src/               # Next.js app & components
    └── package.json
```

## Getting Started

### 1. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

PostgreSQL will be running on `localhost:5432` with database `dealflow360`.

### 2. Backend Setup

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

Server runs at `http://localhost:5000` (Health check: `http://localhost:5000/health`).

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.
