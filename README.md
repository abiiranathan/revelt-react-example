# revelt-react-example

A reference application built on [revelt](https://github.com/abiiranathan/revelt) — a Go-backed server-side rendering framework with a Node.js sidecar for React and Svelte components.

---

## What this demonstrates

**Islands architecture with full SSR.** The Go server renders each page's initial HTML by calling the Node.js sidecar over a stdin/stdout NDJSON protocol. The browser receives fully-formed markup and hydrates it in place — no layout shift, no loading skeletons on first paint.

**A single hydration island.** The entire application hydrates as one `<App>` island rather than many disconnected fragments. This keeps React's component tree intact for shared state and context, while still letting the server own the data-fetching layer.

**Client-side routing without a reload.** A lightweight router (`router.tsx`, ~150 lines, zero dependencies) owns the History API. After hydration, navigating between `/`, `/analytics`, `/posts`, and `/login` is instant — the shell never reloads.

**Layout composition via context.** `<Router>` → `<Layout>` → `<Route>` is a declarative stack. A route inherits the nearest enclosing layout automatically; routes that need a blank canvas (e.g. `/login`) opt out with `layout={BlankLayout}`.

**Server-side data fetching.** The `/posts` route fetches from [JSONPlaceholder](https://jsonplaceholder.typicode.com) in the Go handler and passes the result as props to the `App` island. The React component receives fully-resolved data — no client-side waterfall on the first request. If the upstream fetch fails, the component degrades gracefully and fetches client-side instead.

---

## Project structure

```
.
├── main.go                        # Go HTTP server, route handlers, upstream fetch
├── revelt.json                    # Framework config (port, workers, paths)
└── frontend/
    ├── build.mjs                  # esbuild pipeline (server + client bundles, CSS, asset injection)
    ├── render-server.js           # Node.js SSR sidecar (NDJSON over stdio)
    ├── index.html                 # HTML shell template
    └── src/
        ├── router.tsx             # Router, Route, Layout, Link, useRouter
        ├── layouts/
        │   ├── AppLayout.tsx      # Navbar + main wrapper
        │   └── BlankLayout.tsx    # Bare canvas for login / full-screen pages
        └── components/
            ├── App.tsx            # Single hydration island, route declarations
            ├── Navbar.tsx         # Top nav, reads active path from RouterContext
            ├── TaskBoard.tsx      # Kanban board backed by localStorage
            ├── AnalyticsPanel.tsx # Lazy-loaded analytics with Suspense skeleton
            ├── AnalyticsChart.tsx # Chart chunk (loaded asynchronously)
            ├── PostsPage.tsx      # SSR-preloaded or client-fetched post list
            └── Login.tsx          # Auth form shell (submission wired by caller)
```

---

## Running locally

```bash
# 1. Install frontend dependencies
cd frontend && npm install

# 2. Build the React bundles
npm run build
cd ..

# 3. Start the Go server
go run .
# → http://localhost:8080
```

For development with hot-reload on frontend changes:
Install `revelt` CLI and then run:

```bash
revelt dev
```

---

## Related

- **[revelt](https://github.com/abiiranathan/revelt)** — the tiny framework this example runs on.