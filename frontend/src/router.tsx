/**
 * router.tsx — Lightweight History API router for revelt islands.
 *
 * Public API:
 *
 *   <Router initialPath={activePath}>
 *     <Route path="/"      component={Home}    layout={AppLayout} />
 *     <Route path="/posts" component={Posts}   layout={AppLayout} props={{ initialPosts }} />
 *     <Route path="/login" component={Login} />   {/* no layout — bare page *\/}
 *   </Router>
 *
 *   // Layouts receive children and the current path:
 *   function AppLayout({ children }: LayoutProps) {
 *     return (
 *       <>
 *         <Navbar />
 *         <main className="...">{children}</main>
 *       </>
 *     );
 *   }
 *
 *   // Inside any descendant:
 *   const { navigate, currentPath } = useRouter();
 *   <Link to="/posts">Posts</Link>
 */

import * as React from "react";

// ---------------------------------------------------------------------------
// RouterContext
// ---------------------------------------------------------------------------

interface RouterContextValue {
  /** The currently active path (e.g. "/", "/analytics"). */
  currentPath: string;
  /**
   * Pushes a new entry onto the history stack and updates the active path.
   * No-ops if `to` already matches the current path.
   */
  navigate: (to: string) => void;
}

const RouterContext = React.createContext<RouterContextValue | null>(null);

// ---------------------------------------------------------------------------
// LayoutContext
// ---------------------------------------------------------------------------

/**
 * LayoutContextValue exposes the render function of the nearest enclosing
 * Layout to any descendant that wants to inspect or override it.
 *
 * Most components won't need this directly; it is used internally by Route
 * to wrap rendered page components.
 */
export interface LayoutContextValue {
  /** Wraps `children` in the current layout shell. */
  wrap: (children: React.ReactNode) => React.ReactNode;
}

const LayoutContext = React.createContext<LayoutContextValue>({
  // Default: identity — no layout wrapper applied.
  wrap: (children) => children,
});

/**
 * useLayout returns the nearest LayoutContext value.
 * Can be used by components that need to escape or inspect the current layout.
 */
export function useLayout(): LayoutContextValue {
  return React.useContext(LayoutContext);
}

// ---------------------------------------------------------------------------
// LayoutProps — the contract every layout component must satisfy
// ---------------------------------------------------------------------------

/**
 * LayoutProps is the props interface every layout component receives.
 *
 * Layouts are plain React components; the `children` prop holds the
 * rendered page content. Additional data (e.g. page title, breadcrumbs)
 * can be threaded through context rather than through this interface.
 */
export interface LayoutProps {
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

interface RouterProps {
  /**
   * The path to activate on first render, typically the server-supplied
   * `activePath` prop so SSR and hydration agree on the active route.
   */
  initialPath: string;
  children: React.ReactNode;
}

/**
 * Router owns the current-path state and synchronises it with the
 * browser's History API, including back/forward navigation via popstate.
 *
 * Render it once at the root of your island. All Route, Link, Layout,
 * and useRouter calls must be descendants.
 */
export function Router({ initialPath, children }: RouterProps) {
  const [currentPath, setCurrentPath] = React.useState(initialPath);

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
// Layout
// ---------------------------------------------------------------------------

interface LayoutComponentProps {
  /**
   * The layout component. Receives `children` (the wrapped page content)
   * and any other props passed to this Layout element.
   *
   * Using `React.ComponentType<LayoutProps & Record<string, unknown>>`
   * allows layouts that accept extra props (e.g. a title) while still
   * satisfying the minimum LayoutProps contract.
   */
  component: React.ComponentType<LayoutProps & Record<string, unknown>>;
  /** Extra props forwarded to the layout component alongside `children`. */
  layoutProps?: Record<string, unknown>;
  children: React.ReactNode;
}

/**
 * Layout wraps its children in the given layout component and publishes
 * the wrapper via LayoutContext so nested Route components can apply it
 * without receiving it as an explicit prop.
 *
 * Layouts nest: placing a Layout inside another Layout composes them,
 * with the inner layout wrapping first.
 *
 * Example — shared shell with a route-specific sidebar:
 *
 *   <Router initialPath={activePath}>
 *     <Layout component={AppShell}>
 *       <Route path="/"        component={Home} />
 *       <Layout component={DocsSidebar}>
 *         <Route path="/docs"  component={Docs} />
 *       </Layout>
 *     </Layout>
 *   </Router>
 */
export function Layout({
  component: LayoutComponent,
  layoutProps,
  children,
}: LayoutComponentProps) {
  // Inherit the parent layout's wrap function so nesting composes correctly.
  const parent = useLayout();

  const wrap = React.useCallback(
    (pageContent: React.ReactNode) =>
      parent.wrap(
        <LayoutComponent {...(layoutProps ?? {})}>
          {pageContent}
        </LayoutComponent>,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [LayoutComponent, parent.wrap, JSON.stringify(layoutProps)],
  );

  const value = React.useMemo(() => ({ wrap }), [wrap]);

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

interface RouteProps<P extends object = object> {
  /** The path this route matches (exact match). */
  path: string;
  /** The page component to render when this route is active. */
  component: React.ComponentType<P>;
  /** Optional props forwarded to the page component. */
  props?: P;
  /**
   * Optional layout component to wrap this page.
   *
   * When provided, the page is rendered inside this layout regardless of
   * any enclosing `<Layout>` elements. When omitted, the nearest enclosing
   * `<Layout>` (if any) is used instead.
   *
   * This lets you declare per-route layouts inline:
   *
   *   <Route path="/login" component={Login} layout={BlankLayout} />
   */
  layout?: React.ComponentType<LayoutProps>;
}

/**
 * Route renders its `component` only when the router's current path matches
 * `path` exactly, wrapping it in the active layout (from LayoutContext or
 * the inline `layout` prop). Renders null on a path mismatch.
 */
export function Route<P extends object>({
  path,
  component: Component,
  props,
  layout: InlineLayout,
}: RouteProps<P>) {
  const { currentPath } = useRouter();
  const { wrap } = useLayout();

  if (currentPath !== path) return null;

  const pageElement = <Component {...((props ?? {}) as P)} />;

  // Inline layout prop takes precedence over the inherited Layout context.
  if (InlineLayout) {
    return <InlineLayout>{pageElement}</InlineLayout>;
  }

  // Apply the nearest Layout context wrapper (identity if none).
  return <>{wrap(pageElement)}</>;
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
 * router's navigate function, avoiding a full-page reload.
 *
 * Degrades to a plain <a href> when rendered outside a RouterContext
 * (e.g. during SSR). Respects modifier keys so cmd/ctrl+click still
 * opens a new tab.
 */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const ctx = React.useContext(RouterContext);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
 * Must be called from a component rendered inside a <Router>.
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
