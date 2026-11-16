# TECHVERSE 30

An integrated technology workspace under staged development. Stage 1 established the project structure, service boundaries, local configuration, and a runnable web/API foundation. Stage 2 adds the responsive dashboard and design system, interactive 3D technology map, searchable and filterable directory of 30 planned domains, and live API health indicator. These domains are a platform catalog, not finished module tools; persistence, authentication, and AI arrive in later stages.

## Architecture

```text
Browser
  └── Next.js + React + TypeScript + Three.js frontend (apps/web, port 3000)
        ├── REST API health check (NEXT_PUBLIC_API_BASE_URL)
        └── FastAPI service (apps/api, port 8000)
              ├── PostgreSQL (relational data; local service scaffold)
              └── Redis (cache/queue foundation; local service scaffold)
```

The frontend and API are separate deployable services. The FastAPI service owns server-side integrations and secrets; browser code must never receive provider credentials. PostgreSQL and Redis are optional local infrastructure declared in `infra/docker-compose.yml`. Stage 3 adds PostgreSQL-backed accounts, Alembic migrations, and short-lived bearer tokens. Later stages can add module packages and the AI orchestration layer without coupling those concerns to the UI.

## Repository layout

```text
apps/
  api/
    app/
      main.py              FastAPI app and liveness endpoint
      schemas.py           Typed response contracts exposed through OpenAPI
      auth.py              Registration, login, and current-user endpoints
      database.py          SQLAlchemy database session and base model
      models.py            Persisted user account
      security.py          Password hashing and signed access tokens
    alembic/                Versioned database migrations
    tests/                  API authentication tests
    requirements.txt
  web/                     Next.js App Router application
    src/
      app/                 Dashboard route, layout, and design system
      components/          Interactive React Three Fiber universe
      data/                Typed directory of 30 technology domains
infra/
  docker-compose.yml       Local PostgreSQL and Redis services
.env.example               Local configuration template (no real secrets)
package.json                Root web development/build/lint commands
README.md
```

## Run locally

Requirements: Node.js 20.9+, npm, and Python 3.10+.

1. Create the API environment and install its dependencies:

   ```powershell
   py -3 -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r apps\api\requirements.txt
   ```

2. Copy `.env.example` to `.env`, set a unique `JWT_SECRET` (at least 32 characters), then start PostgreSQL and Redis if needed:

   ```powershell
   Copy-Item .env.example .env
   # Replace JWT_SECRET and local-only database credentials in .env.
   docker compose --env-file .env -f infra\docker-compose.yml up -d
   $env:DATABASE_URL = "postgresql+psycopg://techverse:YOUR_LOCAL_PASSWORD@localhost:5432/techverse"
   $env:JWT_SECRET = "YOUR_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS"
   .\.venv\Scripts\alembic.exe -c apps\api\alembic.ini upgrade head
   ```

3. Install frontend dependencies:

   ```powershell
   npm --prefix apps/web install
   ```

4. To show the API as connected on the dashboard, start it in a separate terminal (with `DATABASE_URL` and `JWT_SECRET` set for auth):

   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps\api --reload
   ```

5. In another terminal, start the frontend:

   ```powershell
   npm run dev:web
   ```

6. Visit `http://localhost:3000`; the dashboard checks `NEXT_PUBLIC_API_BASE_URL/health` in the browser. The default local API URL is `http://127.0.0.1:8000`. Check API readiness at `http://127.0.0.1:8000/health` and interactive API docs at `http://127.0.0.1:8000/docs`.

### Stage 3 authentication API

- `POST /auth/register` creates an account; passwords must be 12–128 characters and are stored as Argon2 hashes.
- `POST /auth/login` accepts a JSON email/password pair and returns a 30-minute JWT bearer token.
- `GET /auth/me` returns the authenticated account and requires `Authorization: Bearer <token>`.

Set `DATABASE_URL` and a random `JWT_SECRET` before using auth. The health endpoint remains available if these are not configured. Apply schema changes with Alembic; the API does not create tables automatically. Run API tests with `.\.venv\Scripts\python.exe -m pytest apps\api\tests`.

### Two-hour local checks

The optional Windows scheduled task runs under your logged-in account every two hours: ESLint with `--fix`, then TypeScript, a production build, and API tests. Only ESLint fixes are applied automatically; other failures are recorded for review under `%LOCALAPPDATA%\TECHVERSE30\checks`.

```powershell
.\scripts\register-check-task.ps1
```

Remove the task with `Unregister-ScheduledTask -TaskName "TECHVERSE30 - Automated checks" -Confirm:$false`.

For another local setup, copy `.env.example` to `.env` and set `NEXT_PUBLIC_API_BASE_URL` for the frontend and `FRONTEND_ORIGIN` for the API. `NEXT_PUBLIC_API_BASE_URL` is public browser configuration; never put secrets in `NEXT_PUBLIC_*` variables. The API allows browser requests only from `FRONTEND_ORIGIN` (defaults to `http://localhost:3000`). Set environment variables in each service process; do not commit a populated `.env` file.

### Optional local data services

Copy `.env.example` to `.env`, replace the local-only database password, then start the services from the repository root:

```powershell
docker compose --env-file .env -f infra\docker-compose.yml up -d
```

Do not use the example credentials outside local development. No schema or migration is applied yet.

## Delivery stages

1. Project initialization and architecture (complete)
2. Design system and 3D dashboard (complete)
3. Authentication and database (complete)
4–6. Technology modules 1–30
7. Central AI engine
8. Cross-module integrations and automation
9. Security, testing, and optimization
10. Deployment and documentation
