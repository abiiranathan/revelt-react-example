import * as React from "react";
import { Sparkles, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "./ui/Button";

interface LoginProps {
  /** Called with email and password when the form is submitted. */
  onSubmit?: (credentials: { email: string; password: string }) => void;
  /** When true, shows a loading spinner on the submit button. */
  loading?: boolean;
  /** Error message to display beneath the form (e.g. "Invalid credentials"). */
  error?: string;
}

/**
 * Login renders a self-contained authentication form.
 *
 * It manages its own field state but delegates submission to the caller
 * via `onSubmit`. Wire `loading` and `error` from whatever auth handler
 * you connect it to.
 */
export default function Login({
  onSubmit,
  loading = false,
  error,
}: LoginProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ email, password });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h1 className="font-extrabold text-xl tracking-tight bg-linear-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              reveltWorkspace
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Sign in to your account
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }>
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Request access
              </a>
            </p>
          </div>
        </div>

        {/* Fine print */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Berakhah Medical Centre · Clinical Workspace
        </p>
      </div>
    </div>
  );
}
