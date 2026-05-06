# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrudVuew is a full-stack employee management CRUD application using Vue 3 (frontend) and Express/Mongoose (backend) with MongoDB.

## Commands

### Prerequisites
Start MongoDB via Docker before running either server:
```
docker-compose up -d
```

### Backend (server/)
```
npm run dev    # Development with file watching (tsx watch)
npm start      # Production run
```

### Frontend (client/)
```
npm run dev    # Vite dev server on port 5173
npm run build  # Type-check (vue-tsc) + Vite build
npm run preview
```

## Architecture

### Full-Stack Layout
- `server/` — Express + Mongoose REST API on port 5000
- `client/` — Vue 3 + Vite SPA on port 5173

### Backend
- **Entry**: `server/index.ts` — Express app, Mongoose connection, CORS, routes mounted at `/api/employees`
- **Model**: `server/models/Employee.ts` — Mongoose schema (`name`, `phone`, `isActive`, timestamps)
- **Routes**: `server/routes/employees.ts` — GET / POST / PUT /:id / DELETE /:id with validation and proper HTTP status codes

### Frontend
- **EmployeeList.vue** is the monolithic main component holding all CRUD state and logic. Its template lives in `EmployeeList.html` and styles in `EmployeeList.css` (same pattern applies to App.vue / App.html / App.css).
- **Types**: `client/src/types.ts` — shared `Employee` and `EmployeeForm` interfaces
- **API**: Axios calls use `VITE_API_URL` env var (defaults to `/api`), proxied by Vite to `localhost:5000`
- No router or external state management — single-page app with component-local reactive state (Vue 3 Composition API / `<script setup>`)

### Key Environment Variables
| Variable | File | Value |
|---|---|---|
| `PORT` | server/.env | 5000 |
| `MONGO_URI` | server/.env | mongodb://localhost:27017/crudvuew |
| `CLIENT_URL` | server/.env | http://localhost:5173 |
| `VITE_API_URL` | client/.env | /api |
