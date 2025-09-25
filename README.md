# ShopX Admin Portal

ShopX Admin is the internal control centre for the ShopX commerce stack. It gives merchandising, marketing, and support teams a browser-based UI to manage the same GraphQL domain that powers the storefront: inventory, pricing, customer accounts, order lifecycles, and CMS pages. The app is built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **MobX**, and **graphql-request** to provide reactive data views and optimistic workflows over the `e-commerce-backend` service.

---

## Capabilities at a Glance

| Area            | What you can do                                                                 |
|-----------------|----------------------------------------------------------------------------------|
| Dashboard       | Review revenue, order velocity, and inventory KPIs in a single snapshot.        |
| Orders          | Search, filter, and update orders (status changes, payment verification, notes). |
| Products        | Create/edit products, adjust pricing, toggle availability, and manage categories.|
| Users           | Manage customer accounts and support agents; reset access or update metadata.    |
| Support         | Look up a customer’s entire context (orders, carts, wishlists) for issue resolution. |
| CMS             | Author and publish marketing pages via a WYSIWYG editor; schedule or archive content. |

Every feature uses the GraphQL endpoints provided by `e-commerce-backend`, so any mutation performed in the portal is immediately reflected in the storefront.

---

## Runtime Requirements

- **Node.js 20+** (aligns with the backend’s minimum runtime). Use `nvm use` if the repo includes an `.nvmrc`.
- **npm 9+** (Yarn Classic is also supported; adjust commands to your tooling preference).
- A running instance of **`e-commerce-backend`** reachable at `http://localhost:4000/graphql` (overrideable via env).

---

## Environment Configuration

Create `.env.local` (or `.env`) from the template and update the GraphQL endpoint if it differs:

```dotenv
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
NEXT_PUBLIC_SITE_NAME=ShopX Admin
```

The `NEXT_PUBLIC_` prefix is required for values that must be available on the client. Any sensitive server-only secrets should live in the backend service instead.

---

## Getting Started

```bash
cd admin-portal
cp .env.example .env.local   # adjust values as needed
npm install
npm run dev                  # launches http://localhost:3000
```

- **Port 3000** is reserved for the admin portal. The storefront runs on port 3100 to avoid conflicts.
- When deploying, use `npm run build` followed by `npm start` (or the provided Dockerfile; see below).

---

## Project Structure

```
admin-portal/
├── src/
│   ├── app/
│   │   ├── (routes)/          # Authenticated app sections (dashboard, orders, products, support, users, cms)
│   │   └── layout.tsx         # Global layout + providers (MobX, theme)
│   ├── common/
│   │   ├── queries/           # QueryFactory definitions for every GraphQL operation
│   │   ├── services/          # ApiService wrapper around graphql-request
│   │   └── stores/            # RootContext + MobX domain stores (orders, products, cms, etc.)
│   ├── components/            # Shared UI (AppShell, tables, forms, widgets)
│   ├── hooks/                 # Custom hooks to access stores (`useCms`, `useOrders`, etc.)
│   └── types/                 # Shared TypeScript contracts mirroring GraphQL schema
├── Dockerfile                 # Multi-stage build for production deployments
├── next.config.mjs
├── package.json
└── README.md
```

MobX powers client-side state. `RootContext` instantiates all stores and the `ApiService`, exposing them via React context. Each route consumes a specific store through hooks, keeping data logic and presentation tightly scoped.

---

## Data Integration Details

- **GraphQL Client**: `ApiService` centralises authentication headers, error formatting, and post-processing logic. Operations are defined as `QueryFactory` instances for reuse on both server and client components.
- **Error Handling**: Stores capture GraphQL/API errors and expose user-friendly messages displayed through toast notifications or inline alerts.
- **CMS Editor**: Uses `react-quill` in a client component; content is persisted through the customer support namespace in the backend GraphQL schema. Redis caching is invalidated automatically after publish/delete mutations.
- **Session Handling**: The skeleton ships without auth. To integrate JWT-based access, invoke `rootContext.apiService.setAuthToken(token)` once you have a token from your identity provider.

---

## Production & Ops

- **Docker**: The provided `Dockerfile` installs dependencies, runs `npm run build`, and ships a lightweight runtime image exposing port 3000. Coordinate with the root `docker-compose.yml` (service name `admin`) to run alongside the backend and storefront.
- **CI Recommendations**: Add `npm run lint` and `npm run build` to CI workflows to enforce type safety and Next.js constraints before deploying.
- **Caching**: The backend invalidates Redis keys whenever CMS pages mutate. No additional cache busting is required on the admin side.

---

## Roadmap Suggestions

1. **Authentication Guard** – incorporate a secure login flow (username/password, SSO, etc.) and persist the token in MobX state.
2. **Granular Permissions** – extend the GraphQL schema and UI to support role-based access (merchandising vs. support vs. marketing).
3. **Bulk Operations** – add mass actions for catalog or order management (bulk price updates, status changes).
4. **Realtime Metrics** – layer in GraphQL subscriptions or polling for dashboards that require live SLA adherence.
5. **Testing** – employ Playwright or Testing Library for critical paths (publishing CMS pages, processing a refund, etc.).

---

## Support & License

For licensing, refer to the monorepo’s root LICENSE file. Raise issues or improvements through the team’s established workflow (GitHub issues, Jira, etc.).
