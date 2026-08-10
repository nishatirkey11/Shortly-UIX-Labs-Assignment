# ⚡ Shortly — Enterprise-Grade URL Shortener & Analytics

Shortly is a modern, high-performance, full-stack URL shortener application. It is engineered with a **React + TypeScript + Vite + Tailwind CSS** frontend and a secure **Express.js** REST API backend powered by **PostgreSQL** and **Drizzle ORM**.

---

## 🚀 Clone to working app in under 5 minutes

Follow these step-by-step instructions to get the application running locally in no time.

### 📋 Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **PostgreSQL** database instance *(A sandbox Neon database connection string is pre-configured in `server/.env.example` so you can test it instantly without installing local database servers!)*

---

### 1. Clone & Navigate
```bash
# Clone the repository
git clone https://github.com/nishatirkey11/Shortly-UIX-Labs-Assignment.git

# Navigate to the project root
cd Shortly-UIX-Labs-Assignment
```

### 2. Install Dependencies
Installs all required node modules recursively for the workspace root, Express backend, and React client in a single command:
```bash
npm run install-all
```

### 3. Setup Environment Variables
Configure the backend server environment variables.
* **Mac/Linux (Bash/Zsh):**
  ```bash
  cp server/.env.example server/.env
  ```
* **Windows (PowerShell):**
  ```powershell
  cp server/.env.example server/.env
  ```
* **Windows (Command Prompt):**
  ```cmd
  copy server\.env.example server\.env
  ```

### 4. Push Database Schema
Instantly push the database tables and schema migrations directly to the PostgreSQL instance:
```bash
npm run db:push
```

### 5. Run the Application
Open two terminal windows to run both the API server and the frontend client simultaneously.

#### 🖥️ Terminal 1: Backend API Server
```bash
npm run dev:server
```
*The backend API server will start on [http://localhost:5000](http://localhost:5000).*

#### 🖥️ Terminal 2: Frontend Web Client
```bash
npm run dev:client
```
*The Vite frontend dev server will launch on [http://localhost:5173](http://localhost:5173).*

Once both are running, open your browser and navigate to **[http://localhost:5173](http://localhost:5173)** to start using Shortly!

---

## ✨ Features Overview
* **Deterministic Custom Slugs**: Custom slug conflict validation returning strict `409 Conflict` statuses.
* **Atomic Concurrency Handling**: High-concurrency protection on click caps using a single atomic SQL update to prevent TOCTOU race conditions.
* **Aggregated Visual Metrics**: Interactive daily metrics dashboards built using Recharts, with dates resolved in UTC timezone directly in SQL.
* **Operational Control**: Disable, delete, and inspect links cleanly from a paginated user dashboard.

---

## 🛠️ Repository Architecture
* [/client](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/client) — React SPA (Vite + Tailwind CSS + Recharts).
* [/server](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/server) — Express API and routing logic.
* [/drizzle](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/drizzle) — Database migrations schema.
* [DECISIONS.md](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/DECISIONS.md) — Technical review of core design choices, concurrency, and trade-offs.

---

## 📦 Workspace CLI Commands
Manage the monorepo from the root directory using these scripts:
* `npm run install-all` — Installs modules for root, client, and server.
* `npm run dev:server` — Launches Express server in hot-reload mode.
* `npm run dev:client` — Launches Vite frontend development server.
* `npm run db:push` — Pushes schema states directly to your PostgreSQL database.
* `npm run db:studio` — Launches Drizzle Studio database viewer GUI.
