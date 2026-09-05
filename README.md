# DealFlow360

Enterprise Quotation Builder, Executive Dashboard, and Commercial Approval Platform built with Next.js 15 (App Router, TypeScript, Tailwind CSS), Prisma ORM, and PostgreSQL 16.

The Next.js application serves both frontend views and backend route handlers.

---

## 1. Local PostgreSQL (Docker)

Start the PostgreSQL 16 container:

```bash
docker compose up -d
```

Stop the PostgreSQL container:

```bash
docker compose down
```

PostgreSQL runs with database `dealflow360` and persistent data stored in Docker volume `postgres_data`.

---

## 2. Environment Configuration & Google OAuth

Copy `.env.example` into `.env.local` at the repository root:

```bash
# Database
DATABASE_URL="postgresql://dealflow:dealflow_password@localhost:5432/dealflow360"

# Auth.js / NextAuth
AUTH_SECRET="your-32-char-random-secret"
AUTH_URL="http://localhost:3000"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

*(Note: If port 5432 is already occupied by a host service on your machine, set `POSTGRES_PORT=5433` and use port `5433` in `DATABASE_URL`)*.

### Google Cloud Console Configuration:
1. Go to [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**.
2. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
4. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google`
5. Copy the generated **Client ID** and **Client Secret** into your `.env.local`.

---

## 3. Prisma Database Operations

From the `frontend/` directory:

- **Generate Prisma Client:**
  ```bash
  npx prisma generate
  ```

- **Create a new migration:**
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```

- **Apply pending migrations:**
  ```bash
  npx prisma migrate deploy
  ```

- **Open Prisma Studio (database GUI):**
  ```bash
  npx prisma studio
  ```

---

## 4. Running the Application

### Option A: Run Both Services Concurrently (Recommended)

From the repository root:

```bash
npm run dev
```

This starts both:
- **Frontend (Next.js):** [http://localhost:3000](http://localhost:3000)
- **Backend (Express):** [http://localhost:5000](http://localhost:5000) *(proxied automatically via `http://localhost:3000/api/v1/*`)*

### Option B: Run Services Individually

- **Frontend:**
  ```bash
  npm run dev:frontend    # or: cd frontend && npm run dev
  ```
- **Backend:**
  ```bash
  npm run dev:backend     # or: cd backend && npm run dev
  ```

---

## 5. Application URLs

- **Quotation Builder:** [http://localhost:3000](http://localhost:3000)
- **Executive Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Approvals Center:** [http://localhost:3000/approvals](http://localhost:3000/approvals)
- **Database & Backend Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

