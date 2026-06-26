import * as React from "react";
import {
  BarChart3,
  CheckSquare,
  Sparkles,
  BookOpen,
  LogInIcon,
} from "lucide-react";
import { Link, useCurrentPath } from "@/router";

const NAV_ITEMS = [
  { label: "Task Board", to: "/", Icon: CheckSquare },
  { label: "Analytics", to: "/analytics", Icon: BarChart3 },
  { label: "Posts", to: "/posts", Icon: BookOpen },
  { label: "Login", to: "/login", Icon: LogInIcon },
] as const;

/**
 * Navbar renders the top application navigation bar.
 *
 * It reads the active path from RouterContext via `useCurrentPath` and
 * uses `<Link>` for client-side navigation, so it requires no props and
 * no callback injection from the parent.
 *
 * Note: `useCurrentPath` will throw if Navbar is rendered outside a
 * `<Router>`. During SSR, render-server.js renders App (which wraps
 * Router), so this is always satisfied.
 */
export default function Navbar() {
  const currentPath = useCurrentPath();

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                reveltWorkspace
              </span>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map(({ label, to, Icon }) => {
                const isActive = currentPath === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-inner"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    }`}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-900 px-3 py-1.5 rounded-full font-medium shadow-sm">
              v0.1.0 (React 18 Hydration)
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
