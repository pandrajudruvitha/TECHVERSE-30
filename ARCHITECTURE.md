# OMNIVERSE AI Target Architecture

## Current Architecture

```text
Browser
  Next.js / React / TypeScript
    Technology universe and browser-local workbenches
    Health and AI status requests
        |
        v
FastAPI
  Auth / assets / AI provider adapter / integration status
        |
        v
PostgreSQL
  users
  assets

Redis: optional infrastructure foundation, not yet used by application code
```

## Target Shared Architecture

```text
Browser
  App Shell
    Universal search
    Technology universe
    Industry universe
    OMNI AI command center
    Project workspace
        |
        v
FastAPI
  Catalog API
  User and organization API
  Project and report API
  AI orchestration API
  Workflow engine
  Integration adapters
  Permission and audit middleware
        |
        v
PostgreSQL
  catalogs
  users / organizations / roles
  projects / files / reports
  conversations / tasks
  workflows / executions
  audit and preferences

Redis
  cache / queues (Stage 9 or 10)
```

## Safe Migration

1. Keep the Next.js App Router and FastAPI applications separate and deployable.
2. Keep existing `/health`, `/auth/*`, `/assets/*`, `/ai/*`, and `/integrations/*`
   contracts unchanged until compatibility work is approved.
3. Add a shared catalog model instead of replacing the existing frontend module array in
   Stage 1.
4. Add industry routes and catalog data only after the shared navigation model is stable.
5. Introduce OMNIVERSE AI branding incrementally in Stage 2.
6. Add project persistence before claiming project-save functionality.
7. Add AI orchestration, workflows, and multi-agent roles only after catalog and permission
   foundations exist.

## Shared Catalog Entity

All technology domains and industry subindustries should eventually use a shared catalog
record with:

- `id`
- `name`
- `kind` (`technology` or `industry`)
- `category`
- `description`
- `icon`
- `route`
- `tags`
- `capabilities`
- `tools`
- `required_integrations`
- `status`
- `simulation_flag`
- `related_module_ids`
- `source`

## Shared Platform Surfaces

Both technology and industry modules should reuse:

- Catalog search and filtering
- Breadcrumb navigation
- Favorites and recent items
- Module/workbench layout
- Input/output components
- Project save and export
- AI assistant integration
- Status and disclaimer presentation
- Cross-module workflow selection
