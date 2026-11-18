# TECHVERSE 30

An integrated technology workspace under staged development. Stages 1–5 provide the project foundation, responsive dashboard and 3D technology map, database-backed accounts, signed bearer tokens, a private, authenticated IT asset inventory, and first-pass tools for technology modules 2–16. Stage 6 is complete with browser-local tools for IoT, robotics, automation, quantum computing, computer hardware, semiconductors, networking, database management, IT consulting, AR/VR/XR, edge computing, DevOps, SaaS management, and telecommunications. Stage 7 adds a server-side, OpenAI-compatible central AI engine with provider credentials kept out of the browser. Stage 8 adds cross-platform integration status and browser-local workflow automation. Stage 9 adds security headers, request limits, provider URL validation, sensitive-route cache policies, and an exposed security-status view. Stage 10 remains planned.

## Dashboard preview

![TECHVERSE 30 dashboard showing the technology directory and connected API](apps/web/public/dashboard-screenshot.png)

## Architecture

```text
Browser
  └── Next.js + React + TypeScript + Three.js frontend (apps/web, port 3000)
        ├── REST API health check (NEXT_PUBLIC_API_BASE_URL)
        └── FastAPI service (apps/api, port 8000)
              ├── PostgreSQL (relational data; local service scaffold)
              └── Redis (cache/queue foundation; local service scaffold)
```

The frontend and API are separate deployable services. The FastAPI service owns server-side integrations and secrets; browser code must never receive provider credentials. PostgreSQL and Redis are optional local infrastructure declared in `infra/docker-compose.yml`. Stage 4 stores assets in PostgreSQL and scopes every inventory operation to the signed-in user. Stage 5 and 6 module tools run locally in the browser; snippets are not executed, and tool inputs are not sent to the API.

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

## Delivery stages and status

Stages 1–9 are implemented in this repository. Stage 10 is planned. A stage is marked complete only after its deliverables are implemented and verified.

| Stage | Scope | Status |
| --- | --- | --- |
| 1. Project foundation | Repository structure, frontend/API boundaries, local configuration, and runnable web/API services. | Complete |
| 2. Dashboard and design system | Responsive dashboard, interactive 3D technology map, searchable/filterable directory of 30 domains, and API health indicator. | Complete |
| 3. Accounts and database | Database-backed registration and login, password hashing, Alembic migrations, and signed bearer-token authentication. | Complete |
| 4. IT management | Authenticated, user-scoped asset inventory with create, list, update, and delete operations. | Complete |
| 5. Technology modules 2–16 | Browser-local MVP tools: code snippets; AI use-case brief; generative-AI prompt composer; classification metrics; dense-layer parameter estimator; descriptive statistics; conversion funnel; ingestion/retention estimator; cloud cost estimator; defensive incident checklist; information-risk rating; transaction-fee estimator; fluid type scale; dp-to-pixel converter; and expected-damage calculator. | Complete |
| 6. Technology modules 17–30 | Browser-local tools for IoT, robotics, automation, quantum computing, computer hardware, semiconductors, networking, database management, IT consulting, AR/VR/XR, edge computing, DevOps, SaaS management, and telecommunications. Stage 6 includes telemetry and retention estimates, robotics motion, automation ROI, quantum workload planning, PC power budgets, wafer yield, network capacity, database growth, consulting effort, XR frame budgets, edge capacity, reliability budgets, SaaS license costs, and telecom link capacity. | Complete |
| 7. Central AI engine | Add a server-side AI orchestration layer with provider integrations, configuration, and safe handling of credentials. | Complete |
| 8. Integrations and automation | Connect modules through defined interfaces and add cross-module workflows and automation. | Complete |
| 9. Security, testing, and optimization | Extend security controls and automated coverage across the platform; measure and improve reliability and performance. | Complete |
| 10. Deployment and documentation | Define production deployment, environment configuration, operational guidance, and user-facing documentation. | Planned |
