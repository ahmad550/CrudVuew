# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrudVuew is a full-stack employee management CRUD application using Vue 3 (frontend) and Express/Mongoose (backend) with MongoDB.

## Commands

### Prerequisites
Start MongoDB via Docker before running the server or backend tests:
```
docker-compose up -d
```

### Backend (server/)
```
npm run dev    # Development with file watching (tsx watch)
npm start      # Production run
npm test       # Run Jest tests (requires MongoDB running)
```

### Frontend (client/)
```
npm run dev          # Vite dev server on port 5173
npm run build        # Type-check (vue-tsc --noEmit) + Vite build
npm test             # Run Vitest once
npm run test:watch   # Run Vitest in watch mode
```

### Running a single test
```
# Backend — pass a test name pattern
cd server && npx jest -t "should create an employee"

# Frontend — pass a test name pattern
cd client && npx vitest run -t "should render employee list"
```

## Architecture

### Full-Stack Layout
- `server/` — Express + Mongoose REST API on port 5000
- `client/` — Vue 3 + Vite SPA on port 5173
- No root-level package.json; each side is an independent npm workspace

### Backend
- **Entry**: `server/index.ts` — Express app, Mongoose connection, CORS, routes mounted at `/api/employees`
- **Model**: `server/models/Employee.ts` — Mongoose schema (`name`, `phone`, `isActive`, timestamps)
- **Routes**: `server/routes/employees.ts` — GET / POST / PUT /:id / DELETE /:id with validation and proper HTTP status codes
- **Logging**: `server/logger.ts` — Winston logger writing to `server/logs/`; the logger is mocked in tests via `server/tests/__mocks__/logger.ts`

### Frontend
- **`client/src/composables/useEmployees.ts`** — all Axios calls and shared reactive state (`employees`, `loading`, `fetchError`, `formError`). The `API` constant lives here.
- **`client/src/components/EmployeeList.vue`** — orchestrator component: renders `AddEmployeeForm` + the employees table using `EmployeeRow` per row; owns only `editingId` state; delegates API calls to the composable.
- **`client/src/components/AddEmployeeForm.vue`** — self-contained add-employee card; calls `addEmployee` from the composable and emits `submitted` on success.
- **`client/src/components/EmployeeRow.vue`** — single table row with view/edit mode toggle; emits events (`edit`, `cancel-edit`, `save-edit`, `delete`, `toggle-active`) up to `EmployeeList`.
- **`client/src/App.vue`** — root layout; all SFCs have inline `<template>`, `<script setup>`, and `<style>` blocks (no external `.html`/`.css` files).
- **Types**: `client/src/types.ts` — shared `Employee` and `EmployeeForm` interfaces
- **API**: Axios calls use `VITE_API_URL` env var (defaults to `/api`), proxied by Vite to `localhost:5000`
- No router or external state management — single-page app with component-local reactive state (Vue 3 Composition API / `<script setup>`)

### Testing
- **Backend**: Jest + ts-jest + Supertest; config at `server/jest.config.js`. Tests live in `server/tests/`. Database helpers (`connectDB`, `clearDB`, `disconnectDB`) are in `server/tests/setup/dbHelper.ts`. Tests hit a real MongoDB instance at `mongodb://localhost:27017/crudvuew_test`.
- **Frontend**: Vitest + @vue/test-utils; config at `client/vitest.config.ts`. Tests live in `client/src/tests/`. Axios is fully mocked with `vi.mock()`. `window.confirm` is stubbed in `client/src/tests/setup.ts` because happy-dom doesn't implement it.

### CI/CD
GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:
1. **server-test** — spins up a MongoDB 7 service container, installs deps, runs `npm test`
2. **client-test** — installs deps, runs `npm test`
3. **client-build** — runs after client-test, installs deps, runs `npm run build`

### Key Environment Variables
| Variable | File | Value |
|---|---|---|
| `PORT` | server/.env | 5000 |
| `MONGO_URI` | server/.env | mongodb://localhost:27017/crudvuew |
| `CLIENT_URL` | server/.env | http://localhost:5173 |
| `VITE_API_URL` | client/.env | /api |

Test runs override `MONGO_URI` to `mongodb://localhost:27017/crudvuew_test` (set in `server/tests/setup/env.ts` and via the CI env).
