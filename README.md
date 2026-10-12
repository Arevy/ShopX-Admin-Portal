# ShopX admin portal

The administration and support interface for ShopX, built with **Next.js 14.2.18 (Pages Router), React 18.3.1, TypeScript, and MobX**. It runs at **http://localhost:3000** by default and requires an account with the `SUPPORT` role.

This is an independent Git repository. Oracle, the backend, storefront, and RN app live in other workspace repositories/directories.

## Run this repository independently

This repository owns its source, lockfile, Dockerfile, tests, and [standalone Compose configuration](compose.yaml). It does not require the parent ShopX directory or sibling checkouts. Other services are accessed through configurable network endpoints and must implement the expected GraphQL/API contract; a different API schema requires a client adapter.

From this repository, create the private container configuration only if it does not already exist:

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` for your external services, then run:

```bash
docker compose --env-file .env.docker up -d --build --wait
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs --tail 80
docker compose --env-file .env.docker down
```

The standalone project has its own Compose name. Change `APP_PORT` if the workspace stack already occupies the default host port. `host.docker.internal` reaches services published on the host; `localhost` inside a container refers to that container. Use a reachable hostname for remote APIs/databases. Do not copy private environment files into images.

Set `GRAPHQL_UPSTREAM_ENDPOINT` to the backend and `REDIS_URL` to the desired cache instance. Set `SERVER_SERVICES_TOKEN` privately for cache tools. Product-image URLs and `SHOPX_PUBLIC_API_ORIGIN` must use an origin reachable by both the browser and the Next.js process; a backend returning `localhost` image URLs will not work with container-side image optimization unless that origin is routed appropriately. Use a shared public/LAN hostname for standalone deployments.

In the full local workspace, use the parent `docker-compose.yml` / `node scripts/compose.mjs up` instead. It orchestrates shared dependencies and configures service DNS centrally; it does not merge these Git repositories or require their standalone Compose projects to run alongside it.

## Local startup

Compose uses **Node 22.x** and installs Linux dependencies from `yarn.lock`. For standalone development on the Mac, run `yarn install --frozen-lockfile`. The admin manifest allows Node 20+, but the workspace is aligned on 22.x.

From this repository:

```bash
cd ..
node scripts/compose.mjs up
```

The [workspace README](../README.md) covers containers and local configuration. `../scripts/` is not included in a standalone clone. Compose mounts `src/`, `public/`, and `local/` for live recompilation. Open `http://localhost:3000` or `http://admin.shopx.localhost`. To run `npm run dev` on the Mac instead, stop Compose's `admin` service first to free port 3000. The storefront uses port 3100.

On this Mac, the backend uses recovered **`oracle19 / ORCLCDB / AREVY`** and persistent Compose Redis at `redis:6379/1`. The retired `clever_wilson` container is no longer required; this stack uses Compose Redis. Use a SUPPORT account in the active database. `../.local/admin-access.json` now selects the new general-store administrator in `AREVY`; the old test-database configuration was backed up privately. Sign in again after changing databases.

The backend documents the [SQL reset and its isolated tests](../e-commerce-backend/README.md#schema-and-sql-script). A demo reset deletes users too; it is not an access-recovery procedure. SQL corrections were tested in a temporary schema; existing `AREVY` accounts and business-table definitions were preserved.

### Starter data and local access

The backend owns the [general-store dataset and additive installer](../e-commerce-backend/docs/data-seeding.md). It adds persisted tech, home and lifestyle catalog/CMS content plus demonstration commerce scenarios. This portal consumes the configured API; it does not seed Oracle or substitute mock responses. A standalone deployment can use its own compatible backend and independent data.

In this workspace, `../docs/local-accounts.private.md` contains the generated general-administrator and support-operator accounts, URLs and passwords. Both profiles have the existing `SUPPORT` role and the same permissions. `CUSTOMER` accounts belong in the storefront/RN account flows. Global administrators now belong to a separate control registry and console deployment; their bootstrap account is stored separately. Managed shop owners use the existing scoped `SUPPORT` role, while restricted commerce staff roles remain unimplemented. Keep private guides outside repository history; standalone clones must provision credentials through their own backend.

## Catalog and visual identity

The portal uses the same graphite surfaces and lime accents as the storefront and RN clients, through [global tokens](src/styles/globals.scss) and the shared application shell. The sidebar uses SVG icons; on narrow screens navigation becomes horizontally scrollable and tables retain their own horizontal scroll area. Product photos preserve the complete item on a white background.

The product list provides previous/next pagination and resets to page one when filters change. Current product prices and monetary displays use the shared [EUR formatter](src/lib/formatCurrency.ts). The new catalog's reference prices include VAT; the backend owns their sources and verification dates. The importer preserves historical order/payment amounts without currency conversion, and changing their display symbol does not establish their original currency.

Product name, image, description and price editing continue through the existing backend operations. The real-model import runs from the backend repository, separately from portal startup. Each independent platform owns its catalog and theme; no sibling source checkout is required at runtime.

## Configuration

Compose injects `GRAPHQL_UPSTREAM_ENDPOINT=http://backend:4000/graphql`, `GRAPHQL_PROXY_ORIGIN=http://admin:3000`, and `REDIS_URL=redis://redis:6379/1`. Browsers use `/api/support-graphql` on their own origin. `SHOPX_PUBLIC_API_ORIGIN` configures the image origin allowed by Next.js.

For standalone host development or a new checkout, copy `.env.example` to `.env.local` only if it does not already exist, then adjust values. The legacy setup preserves existing configuration while updating connections. Keep environment comments on separate lines for clarity.

```dotenv
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/support-graphql
NEXT_PUBLIC_SITE_NAME=ShopX Admin
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3100
GRAPHQL_UPSTREAM_ENDPOINT=http://127.0.0.1:4000/graphql
GRAPHQL_PROXY_ORIGIN=http://localhost:3000
NEXT_PUBLIC_USE_SUPPORT_SERVICES=true
NEXT_PUBLIC_SUPPORT_SERVICES_BASE_PATH=/api/support-services
REDIS_CACHE_PREFIX=shopx:admin
REDIS_CACHE_TTL=300
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_GRAPHQL_ENDPOINT` | Client endpoint; locally the `/api/support-graphql` proxy |
| `NEXT_PUBLIC_GRAPHQL_PROXY_ENDPOINT` | Explicit client endpoint override, when configured |
| `GRAPHQL_UPSTREAM_ENDPOINT` | Real backend API reachable by Next.js |
| `GRAPHQL_PROXY_ORIGIN` | Admin origin used to resolve relative server-side URLs |
| `NEXT_PUBLIC_STOREFRONT_URL` | Destination for customer impersonation |
| `NEXT_PUBLIC_SITE_NAME` | Label used in metadata/UI |
| `NEXT_PUBLIC_USE_SUPPORT_SERVICES` | Controls cache options sent by ApiService; does not itself change the endpoint URL |
| `NEXT_PUBLIC_SUPPORT_SERVICES_BASE_PATH` | Cache-tool path, default `/api/support-services` |
| `REDIS_URL` | Compose uses Docker DNS; standalone mode requires the actual host port and logical database |
| `REDIS_CACHE_PREFIX`, `REDIS_CACHE_TTL` | Admin prefix and default 300-second TTL for eligible public queries |
| `SERVER_SERVICES_TOKEN` | Private cache-tool credential; never expose through `NEXT_PUBLIC_*` |

[env.ts](src/config/env.ts) defines defaults and URL resolution. `NEXT_PUBLIC_*` values are embedded in browser builds; changing them for production requires rebuilding. Oracle is not configured in this repository.

## Existing features

| Route | Implementation |
| --- | --- |
| `/dashboard` | Aggregated order/product/customer metrics, recent orders, and customer list |
| `/products`, `/products/[id]` | Catalog, product creation/editing, prices, categories, and images |
| `/orders` | Listing, filtering, and order status updates |
| `/users`, `/users/[id]` | User management, session revocation, and impersonation |
| `/support` | Aggregated customer context for support operations |
| `/cms` | Rich-text editing, creation/update/publication/archive, and publication-date input |
| `/profile` | Signed-in agent profile |
| `/login` | SUPPORT authentication |

The UI does not establish physical inventory, product-availability toggles, order notes, or real payment/refund processing. Displayed revenue aggregates order records rather than reconciling bank receipts. A CMS publication-date field does not establish the existence of a scheduled publishing worker.

Translations exist for **en, ro, fr, de, ar, he**, with RTL direction in language configuration. Full translation parity and RTL behavior still need UI verification.

## Authentication and authorization

1. `/login` submits to `POST /api/auth/login`, which forwards login to the backend and rejects users without `SUPPORT`.
2. The backend issues the HttpOnly `support_sid` cookie by default; customers use `sid`. The admin proxy forwards cookies and requests support-session preference.
3. Sign out posts to `/api/auth/logout`, revoking the backend session and clearing the browser cookie.
4. Customer management can revoke sessions with `customerSupport.logoutUserSessions` or generate a short-lived ticket with `customerSupport.impersonateUser`. The storefront's `/impersonate` route redeems the ticket and refreshes customer context; the customer's password is not passed to the browser.

Separate support/customer cookies allow admin and shopper sessions to coexist. [SupportSessionGuard](src/components/SupportSessionGuard.tsx) controls UI navigation. Data authorization is enforced in the backend through `customerSupport` and resolver checks; the mere presence of a cookie is not authorization.

[src/middleware.page.ts](src/middleware.page.ts) is the active middleware, matching this project's custom page extensions. It restricts a control deployment to the global console and its API proxy. Tenant mode passes through to the existing UI guards and backend authorization. The old root [middleware.ts](middleware.ts) still checks `sid`, not `support_sid`, and is not the active implementation; it must not be relied on for tenant authentication.

## Data integration

[RootStore and MobX stores](src/stores) expose shared state through React context. The consolidated `userStore` owns agent authentication, customer administration, and order workflows; products, support, and CMS retain their own stores. Hooks consume these stores without duplicating API logic.

[QueryFactory operations](src/graphql) feed [ApiService](src/lib/apiService.ts), which centralizes transport and error handling. Support uses `customerSupport.userContext` for identity, cart, wishlist, and addresses in one request. Stores expose errors through inline feedback/toasts.

The CMS editor uses `react-quill` on the client. Image inputs convert files to base64 for `ProductImageUploadInput`; previews use the backend's `/products/:id/image` URL. Backend writes invalidate their own caches, but this does not imply immediate invalidation of every Next.js/browser cache.

## Proxy and caching

`/api/support-graphql` forwards requests to `GRAPHQL_UPSTREAM_ENDPOINT`. Authenticated requests, `customerSupport` queries, and mutations **are not cached**. Older references to caching the SUPPORT product catalog no longer describe the implementation.

Only anonymous public queries allowed by [operationMetadata.ts](src/server/graphql/operationMetadata.ts) can use the cache. The server derives `graphql:public-v2:...` keys from query/variables under the `shopx:admin` prefix. Client-supplied keys are not authoritative.

## Cache tools

All routes require `?api=<SERVER_SERVICES_TOKEN>` and are scoped to the admin prefix. Keep this token private. The development fallback is not the random token generated for Compose.

| Route, relative to admin | Methods | Behavior |
| --- | --- | --- |
| `/api/support-services/cache` | GET | List actual keys without the application prefix |
| `/api/support-services/cache` | DELETE | Clear all admin-prefixed cache entries |
| `/api/support-services/cache` | POST | `flushAll`, `flushNamespace`, or `flushKey` |
| `/api/support-services/cache/[key]` | GET / DELETE | Inspect value/TTL or remove one URL-encoded key |
| `/api/support-services/cache/namespace/[namespace]` | GET / DELETE | List/remove by namespace or pattern |

With `SERVER_SERVICES_TOKEN` already set in your local shell:

```bash
curl -sS --get --data-urlencode "api=$SERVER_SERVICES_TOKEN" http://localhost:3000/api/support-services/cache
```

For a POST to `/api/support-services/cache?api=<token>`, use an exact key returned by listing, without adding `shopx:admin:`:

```json
{"action":"flushKey","namespace":"<exact-key-from-listing>"}
```

The field is named `namespace` even for single-key deletion. `{"action":"flushNamespace","namespace":"graphql:public-v2"}` removes the current public-query namespace; `{"action":"flushAll"}` clears the admin prefix. The storefront has [separate cache tools](../shopx-frontend/README.md#cache-tools): clearing admin cache does not clear storefront responses, which can remain until TTL expiry or explicit invalidation.

## Commands and verification

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js development on port 3000 |
| `npm run build` | Production Next.js build |
| `npm start` | Executes `prestart` (`next build`), then `next start` |
| `npx tsc --noEmit` | Separate TypeScript check |
| `npm run lint` | ESLint through `next lint` |
| `npm run test:contracts` | Two tests for cache eligibility and private-data isolation |

Both contract tests and TypeScript passed again on October 12; lint passed during the October 11 checks. Workspace starter-data verification checked both SUPPORT accounts through the admin proxy against `AREVY`, including session cookies, role-restricted viewer/users/orders access and customer denial. Chrome also passed login, dashboard and product filtering against `AREVY`, using temporary QA records that were removed afterward. The catalog initially requests 20 products; use the name/category filter to find later records. See the [workspace verification record](../docs/development-status.md) for scope; this is not coverage of every administrative operation.

Stop this repository's development server before `next build`: both use `.next`. The [shared status](../docs/development-status.md) separates builds, automated tests, and UI evidence.

## Code organization and Docker

- [src/pages](src/pages): `*.page.tsx` routes and `*.api.ts` API routes; `_app.page.tsx` hosts the shared layout/providers. `experimental.typedRoutes` is currently disabled.
- [src/stores](src/stores), [src/hooks](src/hooks): state ownership and store access.
- [src/graphql](src/graphql), [ApiService](src/lib/apiService.ts): API operations and transport.
- [src/server](src/server): Redis cache, proxy, and cache-tool token validation.
- [src/components](src/components), [src/routes](src/routes): reusable UI and navigation metadata.
- [src/i18n](src/i18n), [local](local), [src/styles](src/styles): translations and presentation.

The Dockerfile uses Node 22 bookworm-slim. Compose selects `development` with `next dev`; `production` builds the app and starts Next CLI on 3000 without rebuilding at startup. Compose uses recovered `AREVY` and its own persistent Redis. The October 12 catalog milestone verified authenticated catalog pagination against the recovered database; the factory milestone also verified owner login and product images in two independently provisioned store admins using Chrome.

## Remaining work

SSO/MFA, granular merchandising/marketing roles, bulk catalog/order operations, live dashboard updates, and broader CMS/account/browser regression coverage remain possible next steps. Refund UI tests must wait for a real refund implementation. Add lint/type/build checks to CI where appropriate rather than assuming local checks already constitute a pipeline. No workspace license file is present; the older claim of an inherited monorepo license was not substantiated.

## Optional global platform console

This application has a separate control deployment at `/platforms`. Enable it on the server with:

```dotenv
SHOPX_ADMIN_MODE=control
SHOPX_CONTROL_API_ORIGIN=http://control-api:4100
SHOPX_CONTROL_ORIGIN=http://localhost:3200
```

The console uses the existing React/MobX/SCSS stack and the control API's own management session. A commerce `SUPPORT` login does not grant global rights. `/api/control/*` is disabled in ordinary tenant deployments, validates the exact mutation origin, and only proxies an allowlist of management routes. `/platforms` returns 404 without control mode.

The local console provides invitation-only signup, sign-in, platform counts, creation preview/submission, service observations, access links, start/stop/restart and failed-operation retry. Global administrators manage all platforms and invitations; invited `PLATFORM_CREATOR` accounts can create and operate only their own platforms. Only a global administrator can recover an incomplete creation using the current approved release. Successful deployments cannot be silently moved to another release through that recovery action. Old observations become unknown; a stale green indicator is not an uptime guarantee.

The authenticated setup form includes business name, address, store owner, default language, empty/demo starting content and all three brand colors with a preview. EUR and VAT-inclusive display are explicit supported constraints. Original-store data remains in that store; demos receive a separate content-only pack. **Account & access** contains invitations, account disabling and password changes. Invitation links expire after 24 hours and are consumed once; they must be delivered securely by the administrator. No email is sent automatically. See the control-plane [onboarding guide](../shopx-control-plane/docs/onboarding.md) in the integration workspace.

Deploy the console separately from store administration. The local factory is loopback-only and does not implement production MFA/SSO, customer-domain onboarding or native app publication. Credentials are delivered through a private operator file, not displayed in the dashboard or committed here.

## Managed store branding

In ordinary tenant mode, optional server settings `SHOPX_PLATFORM_API_ORIGIN` and `SHOPX_PLATFORM_ID` enable a validated public configuration proxy. `PlatformStore` applies the business name and existing CSS theme tokens on focus/periodic refresh. The same API identity backs the store admin, storefront and configured mobile clients. Relative product photos use `/api/products/:id/image`; legacy absolute URLs remain supported.

Without these settings, standalone support/admin behavior remains unchanged. The production Docker target handles an empty `public/` directory.
