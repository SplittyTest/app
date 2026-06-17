# Copilot Instructions for SplittyTest

## Overview
SplittyTest is a monorepo for a split testing platform, with a TypeScript/Node.js API (`/api`) and a Vue 3 + Vite UI (`/ui`). The API manages experiments, users, and metrics, while the UI provides a dashboard for managing and viewing tests.

## Architecture
- **API (`/api`)**: Node.js + TypeScript backend. Organized by domain (Auth, Buffer, Cache, DB, Errors, Logger, Mail, SplitTest, Utils). Uses a migration system (`/api/migrate/`), and exposes routes under `/api/src/routes/`.
- **UI (`/ui`)**: Vue 3 SPA using Vite. Components in `/ui/src/components/`, views in `/ui/src/views/`, and state in `/ui/src/stores/`.
- **Config**: Environment/config files in `/api/config/` and `/ui/`.

## Developer Workflows
- **API**
  - Install: `cd api && npm install`
  - Run: `npm start` or `ts-node src/server.ts`
  - Test: `npm test` (uses Jest)
  - Migrations: `ts-node migrate/migrate.ts`
- **UI**
  - Install: `cd ui && npm install`
  - Run: `npm run dev`

## Patterns & Conventions
- **TypeScript everywhere** (strict mode recommended)
- **Domain-driven structure** in `/api/src/lib/` (e.g., `Auth/`, `DB/`, `SplitTest/`)
- **API routes**: Grouped by resource in `/api/src/routes/`
- **Migrations**: Each migration is a TypeScript file in `/api/migrate/migrations/`
- **UI**: Vue SFCs with `<script setup>`, composables in `/ui/src/lib/`, and Pinia for state management
- **Testing**: Integration tests in `/api/tests/integration/`

## Integration Points
- **Database**: API expects a Postgres instance (see `/api/scripts/start-postgres.sh`)
- **Other services**: Clickhouse and Valkey supported (see `/api/scripts/`)
- **Mail**: Templates in `/api/src/lib/Mail/templates/`

## Examples
- Add a new API route: `/api/src/routes/<resource>/`
- Add a new migration: `/api/migrate/migrations/00X-<desc>.ts`
- Add a new UI component: `/ui/src/components/`

## References
- API entry: `/api/src/server.ts`
- UI entry: `/ui/src/main.ts`
- API config: `/api/config/default.js`
- UI config: `/ui/vite.config.ts`

---
For more, see `/api/README.md` and `/ui/README.md`.
