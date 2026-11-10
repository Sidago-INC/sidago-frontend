# CLAUDE.md — sidago-frontend

Guidance for Claude (and engineers) working in this repository.

## What this is

The browser client of Sidago CRM, an outbound-sales CRM. Sales agents work a call queue and log call
results; managers ("backoffice") and admins manage leads, companies, reports, SMS/email queues, Level 2
requests and fix-lead work across three brands (`svg`, `95rm`, `benton`). The app is a React + Vite +
TypeScript single-page app that talks to the Sidago backend REST API (and one socket.io namespace).

Full documentation lives in the private sidago-backend repo under docs/ (start at docs/README.md). The
frontend reference is `docs/01-overview/frontend-structure-and-routes.md` there.

## Safety

- Never run npm scripts from unreviewed commits. Install dependencies with `npm ci --ignore-scripts`
  (or `npm install --ignore-scripts`).
- Never commit `.env` files or real credentials. Only variable names belong in `.env.example`.

## Commands

| Command | Purpose |
|---|---|
| `npm ci --ignore-scripts` | Install dependencies |
| `npm run dev` | Dev server on http://localhost:5173 |
| `./node_modules/.bin/tsc -b` | Type-check (strict). Must pass with zero errors |
| `./node_modules/.bin/vite build` | Production build into `dist/` (a large-chunk warning is expected today) |
| `npm run build` | Both of the above, as Vercel runs it |
| `npm run preview` | Serve `dist/` locally |

`tsc -b` rewrites the committed `tsconfig.tsbuildinfo`; restore it with `git checkout -- tsconfig.tsbuildinfo`
before committing unless you mean to change it. `npm run lint` is not usable yet: there is no ESLint
config in the repo. There are no automated tests.

Environment (`.env`, see `.env.example`):

- `VITE_API_URL` — backend base URL including `/api`, e.g. `http://localhost:4000/api`.
- `VITE_STORAGE_SECRET_KEY` — key used to obfuscate tokens in localStorage.

`VITE_*` values are compiled into the bundle at build time and are public. Never put a secret in one.

## Structure

```
src/
  App.tsx              # providers + every route
  main.tsx
  components/guards/   # PrivateRoute, GuestRoute
  components/layouts/  # AuthLayout (sidebar + header), public layout
  components/ui/       # shared UI: Table (+ table/), Drawer, Modal, Select, EmailLink, EmailListField, ...
  features/<feature>/  # one folder per screen/domain
    _components/       # page component, drawers, sub-components
    _lib/hooks.ts      # React Query hooks + API calls (some features use _lib/use-*.ts or _lib/data.ts)
    _lib/data.ts       # columns, row types, option lists
  hooks/               # useMe, useBrandsWithAgents, useAuthActions, useRouteMeta
  lib/                 # api.ts, token.ts, navigation*.ts, auth-routing.ts, est.ts, use-grid-page.ts, validation/
  pages/               # thin route wrappers (SmsPage, EmailPage, ResetPasswordPage)
  providers/           # AuthProvider, DrawerProvider, ThemeProvider
  types/
```

Imports use the `@/` alias for `src/`.

## Conventions

- **API calls** go through `api` in `src/lib/api.ts` (`api.get/post/patch/put/delete`). It adds the bearer
  token, refreshes once on 401, and throws `{ status, message: string[], code }`. It does not unwrap the
  `{ ok, data, meta }` envelope; hooks read `json.data` themselves.
- **Query hooks** live in the feature's `_lib/`. Put every request parameter in the `queryKey`. List and grid
  hooks set `placeholderData: keepPreviousData`. Mutations invalidate by key prefix and report failures with
  `showErrorToast` from `src/lib/toast.ts`.
- **Grids** use `useGridPage` (`src/lib/use-grid-page.ts`) and the shared `<Table>` with `serverPagination`,
  `serverSearch` and `serverGrid` (pass `groupCounts: result?.meta?.groups`). Search, filters, sort and
  groupBy live in the URL and are sent to the API as query params. Never gate the whole page on
  `isLoading`; use `gridLoadingState` (`showSkeleton` on the first load, `isRefreshing` afterwards).
- **Dates**: the backend counts days in America/New_York. Use `src/lib/est.ts` (`easternTodayDate`,
  `toDateParam`, `rangeToDateParams`, `formatEasternDateTime`). Never build a day parameter with
  `toISOString().slice(0, 10)` — it is UTC and shifts the day for users outside UTC.
- **Emails**: a lead's `email` is a comma-joined list of addresses. Display with `EmailLink`, edit with
  `EmailListField`, split with `splitEmails`, validate with `emailList()`. Never compare it with `===` to a
  single address and never bind it to one `<input type="email">`.
- **Printing** uses `printHtml` / `openPrintFrame` from `src/lib/print-html.ts`. Do not call
  `window.open(url, name, features)`; external links (recordings) are `<a target="_blank" rel="noopener noreferrer">`.
- **Roles** on the client are `agent`, `backoffice` and `admin`. Client checks are for presentation; the
  backend enforces permissions.

## Adding a page or route

1. Create `src/features/<name>/_components/<Name>.tsx` and `src/features/<name>/_lib/hooks.ts`.
2. Register `<Route path="/<path>" element={<P><Name /></P>} />` in `src/App.tsx` (`P` wraps the page in
   `AuthLayout`, which includes `PrivateRoute`).
3. Add a `NavigationItem` to the right role's list in `src/lib/navigation.ts`. Route access is derived from
   the navigation lists (`src/lib/auth-routing.ts`): a path that appears in no list is unreachable and
   redirects to `/dashboard`. Per-agent pages go in `AGENT_PAGE_CONFIG` (`src/lib/navigation-agents.ts`)
   and need the matching page code on the backend nav feed.
4. Add a header label to `ROUTE_LABEL_FALLBACKS` in `src/lib/navigation.ts`.

## Verifying a change

1. `./node_modules/.bin/tsc -b` — zero errors.
2. `./node_modules/.bin/vite build` — succeeds.
3. Run the backend locally, set `VITE_API_URL` to it, `npm run dev`, and check the change in the browser
   as each affected role (agent, backoffice, admin): the page loads, the network tab shows the expected
   requests and no 4xx/5xx, and paging/search/filter keep the rows on screen while loading.
4. Restore `tsconfig.tsbuildinfo` and delete `dist/` before committing.
