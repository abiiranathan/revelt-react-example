/**
 * router.tsx — Lightweight History API router for revelt islands.
 *
 * Usage:
 *
 *   <Router initialPath={activePath}>
 *     <Route path="/"          component={TaskBoard}     />
 *     <Route path="/analytics" component={AnalyticsPanel} />
 *     <Route path="/posts"     component={PostsPage}     props={{ initialPosts: posts }} />
 *   </Router>
 *
 *   // Inside any descendant:
 *   const { navigate, currentPath } = useRouter();
 *
 *   // Or declaratively:
 *   <Link to="/analytics">Analytics</Link>
 */

import * as React from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The shape of the value provided by RouterContext. */
interface RouterContextValue {
  /** The currently active path (e.g. "/", "/analytics"). */
  currentPath: string;
  /**
   * Pushes a new entry onto the history stack and updates the active path.
   * No-ops if `to` already matches the current path.
   */
  navigate: (to: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const RouterContext = React.createContext<RouterContextValue | null>(null);

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

interface RouterProps {
  /**
   * The path to activate on first render.
   * Typically the server-supplied `activePath` prop so the SSR'd markup
   * and the hydrated tree agree on which route is active.
   */
  initialPath: string;
  children: React.ReactNode;
}

/**
 * Router owns the current-path state and synchronises it with the
 * browser's History API, including back/forward navigation via popstate.
 *
 * Render it once at the root of your island; all `Route` and `Link`
 * components must be descendants.
 */
export function Router({ initialPath, children }: RouterProps) {
  const [currentPath, setCurrentPath] = React.useState(initialPath);

  // Sync state when the user presses back or forward.
  React.useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = React.useCallback((to: string) => {
    if (window.location.pathname === to) return;
    window.history.pushState(null, "", to);
    setCurrentPath(to);
  }, []);

  const value = React.useMemo(
    () => ({ currentPath, navigate }),
    [currentPath, navigate],
  );

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

interface RouteProps<P extends object = object> {
  /** The path this route matches (exact match). */
  path: string;
  /** The component to render when this route is active. */
  component: React.ComponentType<P>;
  /** Optional props forwarded to the component. */
  props?: P;
}

/**
 * Route renders its `component` only when the router's current path matches
 * `path` exactly. All other times it renders nothing.
 *
 * Props to forward to the component are passed via the `props` field so the
 * JSX stays readable even for components with many props.
 */
export function Route<P extends object>({
  path,
  component: Component,
  props,
}: RouteProps<P>) {
  const { currentPath } = useRouter();
  if (currentPath !== path) return null;
  // Props are optional; cast through unknown to satisfy the compiler when
  // P has required fields but the caller omits `props` (e.g. no-prop pages).
  return <Component {...((props ?? {}) as P)} />;
}

// ---------------------------------------------------------------------------
// Link
// ---------------------------------------------------------------------------

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The path to navigate to. */
  to: string;
}

/**
 * Link renders an anchor tag that intercepts clicks and delegates to the
 * router's `navigate` function, avoiding a full-page reload.
 *
 * It falls back to normal `<a href>` semantics in environments where the
 * RouterContext is absent (e.g. during SSR in render-server.js).
 *
 * All standard anchor attributes (className, children, aria-*, etc.) are
 * forwarded to the underlying element.
 */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const ctx = React.useContext(RouterContext);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Honour modifier keys so cmd/ctrl+click still opens a new tab.
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      ctx?.navigate(to);
    }
    onClick?.(e);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * useRouter returns the current RouterContext value.
 * Must be called from a component rendered inside a `<Router>`.
 *
 * @throws {Error} if called outside of a Router tree.
 */
export function useRouter(): RouterContextValue {
  const ctx = React.useContext(RouterContext);
  if (ctx === null) {
    throw new Error("useRouter must be used within a <Router>");
  }
  return ctx;
}

/**
 * useCurrentPath is a convenience hook that returns only the current path
 * string, for components that need to know the active route but don't
 * need to navigate.
 */
export function useCurrentPath(): string {
  return useRouter().currentPath;
}
