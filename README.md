# Stackline Local Setup

Stackline is a teammate-finding web app for multiplayer games. This project uses:

- `Next.js` for the frontend and backend API
- `Prisma` for the database layer
- `PostgreSQL` for local data
- seeded demo users so the app feels populated right away

This repo is now set up so you can run the full app locally with the least manual setup possible.

## What You Need

Install these first:

- `Node.js 22+`
- `npm`
- `Docker Desktop`

If you only want the simplest path, install Docker Desktop and use the Docker steps below. That is the recommended option.

## Quick Start

### Option A: Recommended, using Docker

1. Open Docker Desktop and wait until it says Docker is running.
2. Open PowerShell in this project folder:

```powershell
cd C:\Users\ipodm\Desktop\website
```

3. If you want, create the local env file automatically:

```powershell
.\scripts\setup-local.ps1
```

4. Start the full local stack:

```powershell
npm run docker:up
```

You can also use:

```powershell
.\scripts\start-local.ps1
```

5. Open the app:

- frontend + backend API: [http://localhost:3000](http://localhost:3000)
- PostgreSQL: `localhost:5432`

Important:

- this app does not use a separate standalone backend server on port `5000`
- the backend API lives inside the Next.js app under routes like `http://localhost:3000/api/...`

### Option B: Run without Docker

Only use this if you already know how to install PostgreSQL locally.

1. Install PostgreSQL 16 locally.
2. Create a database called `stackline`.
3. Make sure your `.env` file matches your local PostgreSQL credentials.
4. Run:

```powershell
cd C:\Users\ipodm\Desktop\website
npm install
npx prisma generate
npm run db:migrate
npm run db:seed
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

This project uses one root `.env` file.

Example values are already in [`.env.example`](C:/Users/ipodm/Desktop/website/.env.example).

Current variables:

- `DATABASE_URL`
- `SESSION_SECRET`
- `DEMO_USER_PASSWORD`

### Example

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stackline?schema=public"
SESSION_SECRET="replace-me-with-a-long-random-secret-change-this"
DEMO_USER_PASSWORD="Stackline!Local2026"
```

## Demo Accounts

The seed script creates demo users automatically.

All seeded demo users use this password by default:

```text
Stackline!Local2026
```

Three owner accounts are created with admin access:

- `nova@stackline.gg`
- `miko@stackline.gg`
- `sage@stackline.gg`

## Commands

### Main app

```powershell
npm run dev
```

Starts the Next.js dev server locally.

```powershell
npm run build
```

Builds the app for production.

On Vercel, the project uses:

```powershell
npm run vercel-build
```

That makes sure Prisma Client is generated before the Next.js production build runs.

```powershell
npm run start
```

Starts the production build.

### Database

```powershell
npm run db:generate
```

Generates the Prisma client.

```powershell
npm run db:migrate
```

Applies committed Prisma migrations.

```powershell
npm run db:migrate:dev
```

Creates and applies a new development migration.

```powershell
npm run db:seed
```

Seeds demo users, matches, messages, invites, notifications, reports, and community chat activity.

```powershell
npm run db:setup
```

Runs generate, migrate, and seed in one command.

### Docker

```powershell
npm run docker:up
```

Builds and starts the app and PostgreSQL together.

```powershell
npm run docker:down
```

Stops the Docker stack.

## GitHub Upload

This project is now set up to be uploaded as a normal source-code repository, so you can keep editing it after it is on GitHub.

Important:

- your real `.env` file is ignored and should not be uploaded
- `.env.example` is included so GitHub has the safe template
- `node_modules` and `.next` are ignored
- line endings are normalized with [`.gitattributes`](C:/Users/ipodm/Desktop/website/.gitattributes)
- editor formatting defaults are defined in [`.editorconfig`](C:/Users/ipodm/Desktop/website/.editorconfig)

### What to upload

Upload the whole project folder except ignored files. The important source files, Prisma schema, migrations, Docker setup, scripts, and README should all go to GitHub.

### Before you upload

Make sure these do not go to GitHub:

- `.env`
- `node_modules`
- `.next`
- any local database files

### If Git is not installed yet

Install `Git for Windows` first. Then you can create a repository and push it to GitHub.

Typical commands:

```powershell
cd C:\Users\ipodm\Desktop\website
git init
git add .
git commit -m "Initial Stackline setup"
```

Then create an empty GitHub repository and connect it:

```powershell
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

After that, you can keep making changes locally and push updates any time with:

```powershell
git add .
git commit -m "Describe your change"
git push
```

## How Local Development Works

### Frontend

- runs through Next.js
- hot reload works in development
- served at `http://localhost:3000`

### Backend

- lives in the same Next.js app
- API routes are inside the project, not a separate Express or Nest service
- authentication, profile actions, messaging, admin actions, and matching all use the same app server

### Database

- PostgreSQL runs in Docker on port `5432`
- Prisma migrations live in [prisma/migrations](C:/Users/ipodm/Desktop/website/prisma/migrations)
- Prisma config lives in [prisma.config.js](C:/Users/ipodm/Desktop/website/prisma.config.js)

### Seed Data

The seed script creates:

- demo users across multiple games
- owner/admin accounts
- realistic game ranks
- live queue activity
- matches and messages
- notifications
- reports
- community chat messages

## Beginner Step-By-Step

If you want the shortest beginner path, do exactly this:

1. Install Node.js.
2. Install Docker Desktop.
3. Open Docker Desktop.
4. Open PowerShell.
5. Run:

```powershell
cd C:\Users\ipodm\Desktop\website
npm install
.\scripts\setup-local.ps1
npm run docker:up
```

6. Wait for the logs to finish the first setup.
7. Open [http://localhost:3000](http://localhost:3000)
8. Log in with one of the owner emails above and the demo password.

## Troubleshooting

### Docker command not found

Install Docker Desktop, then fully close and reopen PowerShell.

### Port 3000 is already in use

Close the other app using port `3000`, or stop old local dev servers before starting this project.

### Port 5432 is already in use

Another PostgreSQL server is already running on your machine. Stop it or change the port mapping in [docker-compose.yml](C:/Users/ipodm/Desktop/website/docker-compose.yml).

### Prisma generate fails

Run:

```powershell
npx prisma generate
```

If it still fails, check internet access the first time because Prisma may need to download its engine binary.

### Login does not work after reseeding

Make sure you are using the current seeded password from `.env` or `.env.example`:

```text
Stackline!Local2026
```

### Changes do not appear in the browser

Wait a few seconds, then refresh the page. In Docker mode the app uses file polling to improve hot reload reliability.

## Files Added For Local Setup

Important files for local development:

- [docker-compose.yml](C:/Users/ipodm/Desktop/website/docker-compose.yml)
- [Dockerfile](C:/Users/ipodm/Desktop/website/Dockerfile)
- [scripts/docker-dev-entrypoint.sh](C:/Users/ipodm/Desktop/website/scripts/docker-dev-entrypoint.sh)
- [scripts/setup-local.ps1](C:/Users/ipodm/Desktop/website/scripts/setup-local.ps1)
- [scripts/start-local.ps1](C:/Users/ipodm/Desktop/website/scripts/start-local.ps1)
- [prisma/migrations/20260418_init_postgres/migration.sql](C:/Users/ipodm/Desktop/website/prisma/migrations/20260418_init_postgres/migration.sql)
- [.env.example](C:/Users/ipodm/Desktop/website/.env.example)

## Notes

- The project is prepared for Docker-first local development.
- I could not fully run Docker inside this environment because Docker is not installed on this machine.
- The database migration and Prisma client generation are set up and committed in the repo.
- The app is now structured for a clean local PostgreSQL workflow instead of the old SQLite-based setup.
