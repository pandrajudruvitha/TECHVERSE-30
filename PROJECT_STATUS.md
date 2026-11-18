# Project Status

## Stage 1 Audit

Status: **Complete**

The existing application is runnable and the core frontend and API baselines pass.
Stage 1 changes are documentation and migration planning only; application behavior
is preserved.

## Technology Stack

| Area | Existing implementation |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS, Lucide icons, Framer Motion |
| 3D | Three.js and React Three Fiber |
| Backend | FastAPI, Pydantic, Uvicorn |
| Database | PostgreSQL through SQLAlchemy 2 and Alembic |
| Cache foundation | Redis in Docker Compose |
| Authentication | Argon2 passwords and signed JWT bearer tokens |
| AI | OpenAI-compatible backend chat adapter |
| Testing | pytest, TestClient, SQLite in-memory tests |
| Deployment | Dockerfiles, Docker Compose, GitHub Actions |

## Working Features

- Responsive dashboard and search/filterable 30-domain technology catalog
- Interactive Three.js technology universe with 2D fallback
- Registration, login, current-user endpoint, Argon2 hashing, and JWT authentication
- User-scoped asset inventory CRUD
- Browser-local tools for technology modules
- Server-side central AI chat; unconfigured mode returns an explicit 503
- Integration and deployment status endpoints
- CORS allowlist, security headers, body limits, route cache controls, and rate limits
- Docker and local deployment configuration
- Automated frontend lint/build and API tests

## Implemented Status

| Capability | Status |
| --- | --- |
| Technology catalog and workbench | Implemented / Tested |
| Account and asset management | Implemented / Tested |
| Central AI provider adapter | Implemented / Integration Required |
| AI local demo mode | Not Implemented |
| Industry universe | Planned |
| OMNI AI agent orchestration | Planned |
| Projects and saved reports | Planned |
| Cross-module workflows | Planned |
| Organization roles and permissions | Planned |
| Audit events and notifications | Planned |
| OMNIVERSE AI branding | Implemented / Tested |

## Stage 1 Inspection Findings

1. The API test suite passes with 16 tests after installing declared dependencies.
2. Frontend lint and production build pass.
3. The application has no dedicated 2D routes for technology modules; modules are selected
   inside the dashboard workbench.
4. The current AI endpoint is provider-backed but has no local demo fallback.
5. Project persistence is not implemented; one UI surface reports this correctly.
6. The database currently models only users and assets.
7. Redis is declared but no application queue or cache behavior exists.
8. CSRF is not required for the current bearer-token browser model, but security
   requirements should be re-evaluated if cookie sessions are introduced.
9. The Central AI UI does not route by industry or create tracked tasks.
10. The `LLM_API_KEY` remains backend-only, which should be preserved.

## Baseline Checks

- Frontend lint: passed
- Frontend production build: passed
- API tests: 16 passed
- Initial API test attempt: blocked only by missing local PyJWT dependency; rerun passed
  after installing `apps/api/requirements.txt`
