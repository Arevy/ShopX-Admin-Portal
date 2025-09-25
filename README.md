# ShopX Admin Portal

Operational cockpit for the ShopX commerce backend. Built with Next.js 14 (App Router), TypeScript, and MobX, the portal focuses on customer support, catalog management, and order operations over the existing GraphQL API exposed by `e-commerce-backend`.

## Prerequisites

- Node.js **>= 20** (backend currently targets Node 22).
- npm **>= 9**.
- Running instance of the ShopX backend (`e-commerce-backend`) on `http://localhost:4000/graphql` or update the environment variable below.

## Getting started

```bash
cd admin-portal
cp .env.example .env.local   # adjust if your backend runs elsewhere
npm install
npm run dev
```

The portal runs on `http://localhost:3000` by default. Ensure the backend is reachable so the GraphQL requests succeed.

## Project layout

```
admin-portal/
├── src/
│   ├── app/                 # Next.js App Router routes
│   │   ├── (routes)/        # Authenticated admin surface nested in the AppShell
│   │   │   ├── dashboard/   # Operational overview and KPIs
│   │   │   ├── orders/      # Order list + inline status workflows
│   │   │   ├── products/    # Catalog CRUD controls
│   │   │   ├── support/     # Deep customer lookup workspace
│   │   │   ├── users/       # Support agent + customer provisioning
│   │   │   └── cms/         # New WYSIWYG editor for the public pages
│   │   └── layout.tsx       # Root layout wiring global providers
│   ├── common/              # infrastructure (queries, services, stores)
│   │   ├── queries/         # QueryFactory definitions for every GraphQL call
│   │   ├── services/        # ApiService wrapper around graphql-request
│   │   └── stores/          # RootContext + MobX domain stores
│   ├── components/          # Shared UI primitives (AppShell, tables, etc.)
│   ├── hooks/               # UI hooks that consume stores via useStores
│   └── stores/              # React provider exposing the RootContext to the app
├── package.json
├── next.config.mjs
├── tsconfig.json
└── README.md
```

## Key implementation notes

- GraphQL access is centralised in `src/common/services/ApiService.ts`, which executes typed `QueryFactory` operations defined under `src/common/queries` and handles auth headers in one place.
- `RootContext` (`src/common/stores/RootContext.ts`) instantiates the ApiService and the domain MobX stores, architecture for shared services + store orchestration.
- UI code talks to stores through hooks (`src/hooks`) that call `useStores`, which exposes the `rootContext` (matching the `MobXProviderContext` ).
- Styles continue to live in SCSS modules with global tokens in `globals.scss`; swap for Tailwind or another system if desired.
- The `CMS` section integrates a WYSIWYG editor (`react-quill`) and manages the public pages exposed via GraphQL.

## Suggested next steps

1. **Authentication guard** – Replace the open layout with a login flow that exchanges credentials for JWT and forwards the token to `rootContext.setAuthToken(...)` so every request is authenticated.
2. **Pagination / virtualisation** – Extend the stores to accept cursor/offset parameters and page through large datasets.
3. **Testing** – Add component tests (e.g. Playwright, Testing Library) around the critical workflows and mock GraphQL responses.
4. **Realtime signals** – Consider wiring GraphQL subscriptions or a polling layer for SLA dashboards that require live updates.

## Docker

A dedicated `Dockerfile` makes it easy to run the portal in production (`yarn build && yarn start`). The root `docker-compose.yml` already includes an `admin` service—just ensure `NEXT_PUBLIC_GRAPHQL_ENDPOINT` points to the backend container.
