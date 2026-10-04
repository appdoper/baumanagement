# syntax=docker/dockerfile:1

# Multi-stage build for Next.js in standalone mode (output: 'standalone').
# Produces a small runtime image that runs .next/standalone/server.js and
# applies pending Prisma migrations on startup (see docker-entrypoint.sh).

FROM node:22-alpine AS base
# libc6-compat + openssl are needed by Next.js and the Prisma query engine on Alpine.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---- Dependencies (cached layer) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client for this platform (Alpine/musl) before building.
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone server bundle (includes a traced subset of node_modules).
COPY --from=builder /app/.next/standalone ./
# Static assets are NOT part of the standalone bundle and must be copied in.
COPY --from=builder /app/.next/static ./.next/static
# Prisma generated client + query engine (ensure the musl engine ships even if
# the standalone tracer misses the native binary).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Prisma CLI + engines + the `.bin/prisma` symlink so `npx prisma migrate
# deploy` resolves locally at startup (no network fetch).
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
# Schema + migrations consumed by `prisma migrate deploy`.
COPY --from=builder /app/prisma ./prisma

COPY --chmod=755 docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

# Run migrations, then start the standalone server.
ENTRYPOINT ["./docker-entrypoint.sh"]
