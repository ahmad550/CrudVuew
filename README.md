# Employee CRUD App

A full-stack single-page Employee management application — add, view, edit, delete, and toggle employee status.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Vue 3** | Progressive JavaScript UI framework (Composition API + `<script setup>`) |
| **Vite** | Next-generation frontend build tool and dev server |
| **Axios** | Promise-based HTTP client for API requests |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime environment for the server |
| **Express** | Minimal and flexible Node.js web application framework |
| **Mongoose** | MongoDB object modeling (ODM) for Node.js |
| **dotenv** | Loads environment variables from `.env` files |
| **CORS** | Express middleware to enable cross-origin resource sharing |

### Database
| Technology | Purpose |
|---|---|
| **MongoDB** | NoSQL document database |
| **Docker** | Runs MongoDB in a container (no local installation needed) |
| **Docker Compose** | Defines and manages the MongoDB container |

---

## Project Structure

```
CrudVuew/
├── docker-compose.yml        # MongoDB Docker container config
├── .gitignore
├── server/
│   ├── .env                  # PORT, MONGO_URI, CLIENT_URL
│   ├── package.json
│   ├── index.ts              # Express app entry point
│   ├── app.ts                # Middleware + route wiring
│   ├── logger.ts             # Winston logger
│   ├── models/
│   │   └── Employee.ts       # Mongoose schema (name, phone, isActive)
│   └── routes/
│       └── employees.ts      # CRUD REST API routes
└── client/
    ├── .env                  # VITE_API_URL
    ├── package.json
    ├── index.html
    ├── vite.config.ts        # Vite config + dev proxy
    └── src/
        ├── main.ts
        ├── App.vue           # Root layout (inline template + styles)
        ├── types.ts          # Shared Employee / EmployeeForm interfaces
        ├── composables/
        │   └── useEmployees.ts   # All API calls + shared reactive state
        └── components/
            ├── EmployeeList.vue  # Table view — orchestrates child components
            ├── AddEmployeeForm.vue  # Add-employee card
            └── EmployeeRow.vue     # Single table row (view + edit mode)
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for MongoDB)
- npm

---

## Setup & Run

### 1. Start MongoDB (Docker)

```bash
docker compose up -d
```

MongoDB will be available at `mongodb://localhost:27017`.

---

### 2. Start the Backend Server

```bash
cd server
npm install
npm start
```

Server runs at **http://localhost:5000**

---

### 3. Start the Frontend Dev Server

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/employees` | Get all employees |
| POST | `/api/employees` | Create a new employee |
| PUT | `/api/employees/:id` | Update an employee |
| DELETE | `/api/employees/:id` | Delete an employee |

### Employee Fields

```json
{
  "name": "John Doe",
  "phone": "555-1234",
  "isActive": true
}
```

---

## Environment Variables

### `server/.env`
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/crudvuew
CLIENT_URL=http://localhost:5173
```

### `client/.env`
```
VITE_API_URL=/api
```
