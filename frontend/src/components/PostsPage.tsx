import * as React from "react";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Loader2, RefreshCw, User, Hash } from "lucide-react";

/** A single post from JSONPlaceholder. */
export interface Post {
  id: number; // Post identifier.
  userId: number; // Author identifier.
  title: string; // Post title.
  body: string; // Post body text.
}

interface PostsPageProps {
  /**
   * Posts pre-fetched by the Go server.
   * When supplied the page renders immediately without a client-side fetch.
   * When absent (e.g. after a client-side navigation) posts are fetched
   * from JSONPlaceholder directly.
   */
  initialPosts?: Post[];
}

const JSONPLACEHOLDER_URL =
  "https://jsonplaceholder.typicode.com/posts?_limit=20";

/**
 * PostsPage demonstrates the revelt end-to-end data flow:
 *
 *   1. Go server fetches posts from JSONPlaceholder and passes them as
 *      `initialPosts` props → zero-latency first paint, fully SSR'd HTML.
 *   2. After hydration the component can refresh the list client-side
 *      via the "Refresh" button, hitting JSONPlaceholder from the browser.
 *
 * When navigated to client-side (after hydration of App), `initialPosts`
 * is undefined and a client fetch runs automatically on mount.
 */
export default function PostsPage({ initialPosts }: PostsPageProps) {
  const [posts, setPosts] = React.useState<Post[]>(initialPosts ?? []);
  const [loading, setLoading] = React.useState(initialPosts === undefined);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPosts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(JSONPLACEHOLDER_URL);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: Post[] = await res.json();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Only auto-fetch when the server did not provide initial data
  // (i.e. component mounted via client-side navigation).
  React.useEffect(() => {
    if (initialPosts === undefined) {
      fetchPosts();
    }
  }, [fetchPosts, initialPosts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Posts
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            {initialPosts !== undefined
              ? "Data fetched server-side by Go, hydrated on the client."
              : "Data fetched client-side after navigation."}
          </p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={fetchPosts}
          disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
          Failed to load posts: {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-indigo-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">
            Fetching posts…
          </span>
        </div>
      )}

      {/* Post grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="flex flex-col hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col gap-3 flex-1">
                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {post.id}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    User {post.userId}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900 leading-snug capitalize">
                  {post.title}
                </h3>

                {/* Body */}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
                  {post.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && posts.length === 0 && (
        <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl h-40 text-slate-400 text-sm font-medium">
          No posts found.
        </div>
      )}
    </div>
  );
}
