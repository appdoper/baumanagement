# Hausmanagement

Maßgeschneidertes Task- & Projektmanagement-System fürs Haus (Home-ERP / Mini-Jira).

## Tech-Stack

- **Next.js 15** (App Router) + **TypeScript**
- **PostgreSQL 16** (via Docker) + **Prisma** ORM
- **Tailwind CSS v4** (shadcn/ui folgt in Phase 3)
- **Zod** für Input-Validierung (Anti-Corruption Layer)

## Architektur (Clean Architecture)

```
src/
  domain/          Entities + Repository-Ports (reines TS, keine Framework-Imports)
  application/     Use-Cases/Services + Zod-DTOs (hängt nur von domain-Ports ab)
  infrastructure/  Prisma-Client + Repository-Implementierungen + Mapper
  app/             Next.js UI, Server Actions, Pages
  container.ts     Composition Root (verdrahtet Infra -> Services)
```

Abhängigkeitsrichtung zeigt **immer nach innen**: `app → application → domain`.
`infrastructure` implementiert die `domain`-Ports. Die Fachlogik kennt weder
Prisma noch React und ist isoliert testbar.

## Setup

1. **Env anlegen:** `cp .env.example .env` (Defaults passen zu docker-compose).
2. **Dependencies:** `npm install`
3. **Datenbank starten:** `npm run db:up` *(benötigt Docker Desktop)*
4. **Migration + Client:** `npm run db:migrate` (führt die erste Migration aus und generiert den Client)
5. **Smoke-Test (optional):** `npm run db:seed`
6. **Dev-Server:** `npm run dev` → http://localhost:3000

## Nützliche Skripte

| Script | Zweck |
|---|---|
| `npm run dev` | Next.js Dev-Server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:up` / `db:down` | Postgres-Container starten/stoppen |
| `npm run db:migrate` | Prisma-Migration (dev) |
| `npm run db:studio` | Prisma Studio (DB-GUI) |
| `npm run db:seed` | Fundament-Smoke-Test |

## Status

- ✅ **Phase 1** – Konzept, Stack, Datenbankschema
- ✅ **Phase 2** – Fundament: Setup, Schema, CRUD-Services für Project & Task
- ⏳ **Phase 3** – Core-UI & Task-Management
- ⏳ **Phase 4** – Dependency-Logik (FS/SS, Blocker, Zyklen-Check)
- ⏳ **Phase 5** – Visualisierung (React Flow / Gantt)
