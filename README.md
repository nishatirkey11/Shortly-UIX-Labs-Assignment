# Shortly — Short Link Manager

Shortly is a full-stack URL shortener application built using a React + TypeScript + Vite + Tailwind CSS frontend, and an Express.js backend using Postgres with Drizzle ORM.

---

## ⚡ Clone to Working App in Under 5 Minutes

Follow these steps to set up and run the application locally.

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **PostgreSQL** database instance (or use the pre-configured Neon database URL in the repository for quick testing)

### Step 1: Install Dependencies
Run the custom script in the root directory to install all dependencies for the root, backend server, and frontend client:
```bash
npm run install-all
```

### Step 2: Configure Environment Variables
1. Navigate to the `server` directory.
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp server/.env.example server/.env
   ```
   *(Note: The server already includes a default Neon database URL inside `server/.env` for convenience. If you prefer to use your own local database, update the `DATABASE_URL` value inside `server/.env`.)*

### Step 3: Run Database Migrations
Apply the database schemas and migrations to your Postgres instance directly from the root directory:
```bash
npm run db:push
```

### Step 4: Run the Application
Start both the backend server and frontend client. You will need two terminal windows:

**Terminal 1 (Backend Server):**
```bash
npm run dev:server
```
*Runs on [http://localhost:5000](http://localhost:5000)*

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
```
*Runs on [http://localhost:5173](http://localhost:5173)*

Open [http://localhost:5173](http://localhost:5173) in your browser to start using Shortly!

---

## 🛠️ Project Structure
- [/client](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/client) — React (Vite, Tailwind, Recharts) web interface.
- [/server](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/server) — Express.js API serving link redirects, metrics, and operations.
- [/drizzle](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/drizzle) — Database schema definitions and migration configurations.

## 📦 Available Root Scripts
You can run the following scripts directly from the workspace root directory:
- `npm run install-all` — Installs node modules recursively for root, client, and server.
- `npm run dev:server` — Starts the backend server in watch mode.
- `npm run dev:client` — Starts the Vite frontend client.
- `npm run db:push` — Pushes database changes defined in the Drizzle schema directly to the database.
- `npm run db:studio` — Opens Drizzle Studio (a local database GUI) in your browser.
