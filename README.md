# TravelMate-backend

Express + TypeScript + Prisma API for the TravelMate travel and tour booking platform.

## Stack

- Node.js + Express.js + TypeScript
- PostgreSQL 16 + Prisma ORM
- Zod validation
- JWT auth via HttpOnly cookies
- Vitest + Supertest

## Setup

```bash
npm install
cp .env.example .env   # then set DATABASE_URL and JWT secrets
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

The API listens on `http://localhost:5000` and exposes a health check at `GET /api/health`.

## Environment

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens |
| `JWT_ACCESS_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS |
| `PORT` | Server port (default `5000`) |
| `NODE_ENV` | `development` / `production` |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run the compiled server |
| `npm run prisma:migrate` | Create/apply dev migrations |
| `npm run prisma:deploy` | Apply migrations in production |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run seed` | Seed demo data |
| `npm test` | Run unit tests |

## Demo accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@travelmate.com | admin123 |
| Agency | agency@travelmate.com | agency123 |
| Customer | customer@travelmate.com | customer123 |

## API

Base path: `/api`

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Destinations | `GET /destinations`, `GET /destinations/:id`, `POST/PATCH/DELETE /destinations` (Admin) |
| Packages | `GET /packages`, `GET /packages/:id`, `POST/PATCH/DELETE /packages` (Agency/Admin) |
| Bookings | `POST /bookings`, `GET /bookings/me`, `PATCH /bookings/:id/cancel`, `GET /bookings/agency`, `PATCH /bookings/agency/:id/status` |
| Admin | `GET /admin/dashboard`, `GET /admin/users`, `PATCH /admin/agencies/:id/status`, `GET /admin/bookings` |
