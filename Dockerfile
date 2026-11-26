# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .

# Local development stage (used by docker-compose)
FROM base AS development
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Production stage (default, used by Render)
FROM base AS production
RUN npm run build
ENV NODE_ENV=production
EXPOSE 5000
# Apply migrations and seed demo data (idempotent upserts) before serving traffic.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/index.js"]
