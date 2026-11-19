# OMNIVERSE AI

**One AI. Thirty Technologies. Twenty Industries. One Connected Universe.**

> Stage 1–2 migration: the application is now presented as OMNIVERSE AI while legacy
> API service names and routes remain compatible. Existing functionality is preserved.

An integrated technology workspace delivered across 10 stages. The project includes the shared dashboard and 3D technology map, 20 industry universes, browser-local technology workbenches, database-backed accounts and assets, an OpenAI-compatible central AI adapter, browser-local OMNI task tracking, and cross-module workflow summaries. All 10 stages are complete, including final optimization and production quality gates.

## Dashboard preview

![OMNIVERSE AI dashboard showing the technology directory and connected API](apps/web/public/dashboard-screenshot.png)

## Industry workspace preview

![Healthcare industry workspace with searchable subindustries](apps/web/public/industry-workspace-screenshot.png)

## OMNI AI demo preview

![OMNI AI browser-local demo response](apps/web/public/omni-ai-demo-screenshot.png)

## Workflow workbench preview

![Cross-module workflow execution preview](apps/web/public/workflow-workbench-screenshot.png)

## GitHub repository preview

![TECHVERSE-30 repository README and file overview](apps/web/public/github-repository-screenshot.png)

## Release status

All 10 stages are complete. Stage 10 includes 3D rendering optimization,
reduced-motion support, responsive navigation, skip navigation, deployment quality
gates, and production operations.

## Architecture

```text
Browser
  └── Next.js + React + TypeScript + Three.js frontend (apps/web, port 3000)
        ├── REST API health check (NEXT_PUBLIC_API_BASE_URL)
        └── FastAPI service (apps/api, port 8000)
              ├── PostgreSQL (relational data; local service scaffold)
              └── Redis (cache/queue foundation; local service scaffold)
```

The frontend and API are separate deployable services. The FastAPI service owns server-side integrations and secrets; browser code must never receive provider credentials. PostgreSQL and Redis are declared in `infra/docker-compose.yml`. User assets are stored in PostgreSQL and scoped to the signed-in account. Technology and industry plans run locally in the browser; snippets are not executed, and tool inputs are not sent to the API.

## Repository layout

```text
apps/
  api/
    app/
      main.py              FastAPI app and liveness endpoint
      schemas.py           Typed response contracts exposed through OpenAPI
      assets.py            Authenticated IT asset inventory endpoints
      auth.py              Registration, login, and current-user endpoints
      database.py          SQLAlchemy database session and base model
      models.py            Persisted user account
      security.py          Password hashing and signed access tokens
    alembic/                Versioned account and asset migrations
    tests/                  API authentication tests
    requirements.txt
  web/                     Next.js App Router application
    src/
      app/                 Dashboard route, layout, and design system
      components/          3D universe, asset inventory, and browser-local module workbenches
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

### Authentication and IT asset inventory

- `POST /auth/register` creates an account; passwords must be 12–128 characters and are stored as Argon2 hashes.
- `POST /auth/login` accepts a JSON email/password pair and returns a 30-minute JWT bearer token.
- `GET /auth/me` returns the authenticated account and requires `Authorization: Bearer <token>`.
- `GET /assets` lists the signed-in user's assets.
- `POST /assets` creates an asset; asset tags are unique per account.
- `PATCH /assets/{id}` updates an owned asset, and `DELETE /assets/{id}` removes it.

Open **IT management** in the dashboard to register or sign in and manage assets. Asset data is private to the account, and the short-lived access token stays in browser memory. Set `DATABASE_URL` and a random `JWT_SECRET` before using authentication or inventory. The health endpoint remains available if these are not configured. Apply schema changes with Alembic; the API does not create tables automatically. Run API tests with `.\.venv\Scripts\python.exe -m pytest apps\api\tests`.

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

Do not use the example credentials outside local development. Apply migrations with `.\.venv\Scripts\alembic.exe -c apps\api\alembic.ini upgrade head` before using authentication or the asset inventory.

## Container deployment

The repository includes Dockerfiles for the FastAPI API and Next.js frontend plus a full Compose stack for PostgreSQL, Redis, the API, and the web app:

```powershell
Copy-Item .env.example .env
# Replace every development-only secret and set public origins.
docker compose --env-file .env -f infra\docker-compose.yml up --build
```

Deployable services:

- API: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- Interactive API documentation: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`
- Deployment status: `http://localhost:8000/deployment/status`

The API container runs Alembic migrations before starting Uvicorn. Set `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, and `NEXT_PUBLIC_API_BASE_URL` for each deployment environment. Never place `LLM_API_KEY` or `JWT_SECRET` in a `NEXT_PUBLIC_*` variable. GitHub Actions runs frontend lint/build and API tests for pushes and pull requests to `main`.

### Render temporary preview

The root `render.yaml` Blueprint defines the web app, API, and PostgreSQL database in
Singapore. In the Render Dashboard, create a new Blueprint from this GitHub repository
and apply the Blueprint. The API runs Alembic migrations at startup; its JWT secret is
generated by Render, and the frontend/API origins are linked automatically. Add
`LLM_API_KEY` in the API service's Render environment if provider-backed AI is needed.

This Blueprint intentionally uses Render's free plans for a temporary preview. Free
services can sleep when idle, and the free PostgreSQL database expires after 30 days.
Do not use it for production or store important data in it.

## Delivery stages and status

All 10 stages are complete in this repository.

| Stage | Scope | Status |
| --- | --- | --- |
| 1. Project foundation | Repository structure, frontend/API boundaries, local configuration, and runnable web/API services. | Complete |
| 2. Dashboard and design system | Responsive dashboard, interactive 3D technology map, searchable/filterable directory of 30 domains, and API health indicator. | Complete |
| 3. Accounts and database | Database-backed registration and login, password hashing, Alembic migrations, and signed bearer-token authentication. | Complete |
| 4. IT management | Authenticated, user-scoped asset inventory with create, list, update, and delete operations. | Complete |
| 5. Industry universe foundation | Add 20 industry categories, official subindustry catalogs, reusable routed workspaces, filtering, breadcrumbs, and related universes. | Complete |
| 6. Industry modules | Reusable education, administrative, simulation, and integration workspace modes for industry subindustries. | Complete |
| 7. Central OMNI AI agent | Browser-local demo routing, provider-backed chat, approval tasks, task states, and browser-persistent task history. | Complete |
| 8. Integrations and automation | Cross-module workflow templates, status snapshots, run context, saved local runs, and the integration workbench. | Complete |
| 9. Database, security, and testing | Persisted accounts and assets, signed bearer authentication, security middleware, and the 16-test API baseline. | Complete |
| 10. Deployment and documentation | Container deployment, CI automation, environment guidance, preview images, optimization, and production quality gates. | Complete |
