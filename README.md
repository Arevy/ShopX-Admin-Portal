# ShopX Admin Portal

ShopX Admin is the internal control centre for the ShopX commerce stack. It gives merchandising, marketing, and support teams a browser-based UI to manage the same GraphQL domain that powers the store front: inventory, pricing, customer accounts, order lifecycles, and CMS pages. The app is built with **Next.js 14 (Pages Router)**, **React 18**, **TypeScript**, **MobX**, and **graphql-request** to provide reactive data views and optimistic workflows over the `e-commerce-backend` service.

---

## Capabilities at a Glance

| Area            | What you can do                                                                 |
|-----------------|----------------------------------------------------------------------------------|
| Dashboard       | Review revenue, order velocity, and inventory KPIs in a single snapshot.        |
| Orders          | Search, filter, and update orders (status changes, payment verification, notes). |
| Products        | Create/edit products, adjust pricing, manage imagery, toggle availability, and manage categories.|
| Users           | Manage customer/support accounts, revoke sessions, and launch customer impersonation. |
| Support         | Look up a customer’s entire context (orders, carts, wishlists) for issue resolution. |
| CMS             | Author and publish marketing pages via a WYSIWYG editor; schedule or archive content. |

Every feature uses the GraphQL endpoints provided by `e-commerce-backend`, so any mutation performed in the portal is immediately reflected in the store front.

---

## Runtime Requirements

- **Node.js 20+** (aligns with the backend’s minimum runtime). Use `nvm use` if the repo includes an `.nvmrc`.
- **npm 9+** (Yarn Classic is also supported; adjust commands to your tooling preference).
- A running instance of **`e-commerce-backend`** reachable at `http://localhost:4000/graphql` (overrideable via env).

---

## Environment Configuration

Create `.env.local` (or `.env`) from the template and update the GraphQL settings if they differ:

```dotenv
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/support-graphql
NEXT_PUBLIC_SITE_NAME=ShopX Admin
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3100
GRAPHQL_UPSTREAM_ENDPOINT=http://localhost:4000/graphql
GRAPHQL_PROXY_ORIGIN=http://localhost:3000
NEXT_PUBLIC_USE_SUPPORT_SERVICES=true
NEXT_PUBLIC_SUPPORT_SERVICES_BASE_PATH=/api/support-services
SERVER_SERVICES_TOKEN=development
REDIS_URL=redis://127.0.0.1:6379
REDIS_CACHE_PREFIX=shopx:admin
REDIS_CACHE_TTL=300
```

> **Note:** Inline comments appended to `.env` values (for example `GRAPHQL_PROXY_ORIGIN=http://localhost:3000 # comment`) are treated as part of the value and will produce invalid URLs. Keep comments on their own lines.

The `NEXT_PUBLIC_` prefix is required for values that must be available on the client. Any sensitive server-only secrets should live in the backend service instead.

- `NEXT_PUBLIC_GRAPHQL_ENDPOINT` — Client-facing proxy path. The admin app posts here and the API route forwards the request (along with the session cookie) to the backend.
- `NEXT_PUBLIC_STOREFRONT_URL` — Base URL for the customer-facing app. Used when opening impersonation sessions in a new tab.
- `NEXT_PUBLIC_SITE_NAME` — Optional label rendered in metadata and select UI components.
- `GRAPHQL_UPSTREAM_ENDPOINT` — Actual GraphQL endpoint exposed by `e-commerce-backend`. Defaults to `http://localhost:4000/graphql` if unspecified.
- `GRAPHQL_PROXY_ORIGIN` — Origin used to turn relative proxy paths into absolute URLs during server-side rendering. Defaults to `http://localhost:3000`.
- `NEXT_PUBLIC_USE_SUPPORT_SERVICES` — Toggle for routing through `/api/support-graphql` (true by default). Set to `false` if you need the UI to hit the backend GraphQL endpoint directly (useful in local setups without the proxy).
- `NEXT_PUBLIC_SUPPORT_SERVICES_BASE_PATH` — Base path for the admin cache tooling (defaults to `/api/support-services`).
- `SERVER_SERVICES_TOKEN` — Shared secret appended as `?api=<token>` when calling cache tooling endpoints.
- `REDIS_URL`, `REDIS_CACHE_PREFIX`, `REDIS_CACHE_TTL` — Redis connection and default TTL (seconds) for cached GraphQL responses.

---

## Getting Started

```bash
cd admin-portal
cp .env.example .env.local   # adjust values as needed
npm install
npm run dev                  # launches http://localhost:3000
```

- **Port 3000** is reserved for the admin portal. The store front runs on port 3100 to avoid conflicts.
- When deploying, use `npm run build` followed by `npm start` (or the provided Dockerfile; see below).
- Seed data ships with a support agent account: `support@example.com` / `Password123!`.

---

## Authentication Flow

1. Navigate to `/login` and sign in with a support credential. The API route forwards the backend `login` mutation and returns the HTTP-only `support_sid` cookie set by the GraphQL server.
2. Authenticated pages live under `src/pages` (dashboard, orders, products, support, users, cms). The shared layout now sits in `_app.page.tsx`, so middleware still blocks unauthenticated users and redirects them back to `/login` while preserving their intended destination.
3. The header’s “Sign out” action posts to `/api/auth/logout`, which clears the session in Redis and expires the cookie for the browser.
4. From the **Customers** area you can revoke shopper sessions (`Force logout`) or generate an impersonation ticket. Impersonation opens the storefront’s `/impersonate` route in a new tab, sets a fresh cookie for the target user, and refreshes their context automatically.

> Support logins use a dedicated `support_sid` cookie while shopper sessions keep using `sid`, so admins can stay signed in while impersonating storefront users in the same browser.

---

## GraphQL Cache (Support Services)

The admin proxy (`/api/support-graphql`) now shares the same Redis-backed caching strategy introduced in the storefront. Read-heavy operations such as the support product catalogue reuse the result for 60 seconds to keep the dashboard responsive.

- Product catalogue (`CustomerSupportProducts`) → namespace `support:products` (TTL 300s).
- All other queries retain live behaviour; user/order/customer lookups always bypass the cache.

When a product or CMS entry is changed you can invalidate cache entries instantly via the support-services API (token required):

```bash
API_TOKEN=${SERVER_SERVICES_TOKEN:-development}

# list every cached key
curl "http://localhost:3000/api/support-services/cache?api=${API_TOKEN}"

# flush the entire admin cache
curl -X DELETE "http://localhost:3000/api/support-services/cache?api=${API_TOKEN}"

# view + TTL for a single key (URL-encode when needed)
curl "http://localhost:3000/api/support-services/cache/$(python3 - <<'PY'
from urllib.parse import quote
print(quote('support:products'))
PY)?api=${API_TOKEN}"

# namespace flush helpers
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"flushNamespace","namespace":"support:products"}' \
  "http://localhost:3000/api/support-services/cache?api=${API_TOKEN}"

# delete a precise cache key
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"flushKey","namespace":"support:products"}' \
  "http://localhost:3000/api/support-services/cache?api=${API_TOKEN}"
```

| Route | Method(s) | Description |
|-------|-----------|-------------|
| `/api/support-services/cache?api=<token>` | GET | Lists cached keys scoped to the admin prefix |
| `/api/support-services/cache?api=<token>` | DELETE | Flushes all admin cache entries |
| `/api/support-services/cache?api=<token>` | POST | Supports `flushAll`, `flushNamespace`, `flushKey` actions |
| `/api/support-services/cache/[key]?api=<token>` | GET / DELETE | Inspect or remove a single cache key |
| `/api/support-services/cache/namespace/[namespace]?api=<token>` | GET / DELETE | List or purge by namespace/pattern |

> Use the same token across admin and storefront when running via `docker-compose`. When developing locally without Docker, the default `development` token works out of the box.

---

## Project Structure

```
admin-portal/
├── src/
│   ├── components/            # Shared UI (AppShell, tables, forms, widgets)
│   ├── config/                # Environment helpers and constants
│   ├── graphql/               # QueryFactory definitions for every GraphQL operation
│   ├── hooks/                 # Custom hooks to access stores (`useCms`, `useOrders`, etc.)
│   ├── i18n/                  # Translation setup
│   ├── lib/                   # ApiService, error helpers, misc utilities
│   ├── pages/                 # Next.js routes (`_app`, `_document`, login, dashboard, etc.)
│   ├── routes/                # Navigation metadata + utilities
│   ├── stores/                # RootStore + MobX stores (user/auth/orders, products, support, cms)
│   ├── styles/                # Global styles and shared Sass tokens
│   └── types/                 # Shared TypeScript contracts mirroring GraphQL schema
├── Dockerfile                 # Multi-stage build for production deployments
├── next.config.mjs
├── package.json
└── README.md
```

MobX powers client-side state. `RootStore` instantiates all stores and the `ApiService`, exposing them via React context. The consolidated `userStore` now represents support-agent session state, customer administration, and order workflows, while the remaining stores keep their product/support/CMS responsibilities. Each route consumes the slice it needs through hooks, keeping data logic and presentation tightly scoped.

---

## Data Integration Details

- **GraphQL Client**: `ApiService` centralises authentication headers, error formatting, and post-processing logic. Operations are defined as `QueryFactory` instances for reuse on both server and client components. All requests flow through `/api/support-graphql`, which forwards the browser’s session cookie to the backend to satisfy support-only resolvers.
- **User & Order Management**: A single `userStore` now owns support-agent authentication, customer administration, and order lifecycle updates. Hooks such as `useOrders` and `useDashboard` pull from that store so UI pieces no longer juggle separate auth/order abstractions.
- **User context aggregate**: Support-desk flows call `customerSupport.userContext` to hydrate carts, wishlists, addresses, and identity in a single round trip, mirroring the shopper-facing `getUserContext` query.
- **Error Handling**: Stores capture GraphQL/API errors and expose user-friendly messages displayed through toast notifications or inline alerts.
- **CMS Editor**: Uses `react-quill` in a client component; content is persisted through the customer support namespace in the backend GraphQL schema. Redis caching is invalidated automatically after publish/delete mutations.
- **Product imagery**: Upload widgets convert selected files to base64, call the `ProductImageUploadInput`
  GraphQL argument, and rely on the backend-hosted `/products/:id/image` URL for live previews.
- **Session handling**: Support staff authenticate with `/api/auth/login`, which proxies the backend `login` mutation and forwards the issued HTTP-only `sid` cookie back to the browser. Middleware gates all routes based on that cookie, and the shared `ApiService` always sends credentials so GraphQL calls execute under the active session. `userStore.login` also mirrors the session user locally so hooks/components can render immediately. Logging out clears both the Redis session and the browser cookie.
- **Impersonation & forced logout**: User management pages expose actions that call `customerSupport.logoutUserSessions` and `customerSupport.impersonateUser`. The first revokes Redis sessions so the customer is logged out on their next request; the second generates a short-lived token that opens the storefront’s `/impersonate` route with a fresh cookie for the selected customer.

---

## Production & Ops

- **Docker**: The provided `Dockerfile` installs dependencies, runs `npm run build`, and ships a lightweight runtime image exposing port 3000. Coordinate with the root `docker-compose.yml` (service name `admin`) to run alongside the backend and store front.
- **CI Recommendations**: Add `npm run lint` and `npm run build` to CI workflows to enforce type safety and Next.js constraints before deploying.
- **Caching**: The backend invalidates Redis keys whenever CMS pages mutate. No additional cache busting is required on the admin side.

---

## Roadmap Suggestions

1. **Advanced authentication** – layer SSO or MFA on top of the session-based login to align with enterprise identity policies.
2. **Granular Permissions** – extend the GraphQL schema and UI to support role-based access (merchandising vs. support vs. marketing).
3. **Bulk Operations** – add mass actions for catalog or order management (bulk price updates, status changes).
4. **Realtime Metrics** – layer in GraphQL subscriptions or polling for dashboards that require live SLA adherence.
5. **Testing** – employ Playwright or Testing Library for critical paths (publishing CMS pages, processing a refund, etc.).

---

## Support & License

For licensing, refer to the monorepo’s root LICENSE file. Raise issues or improvements through the team’s established workflow (GitHub issues, Jira, etc.).
