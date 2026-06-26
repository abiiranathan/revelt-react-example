// @mode hydrate

import * as React from "react";
import { Router, Route } from "@/router";
import Navbar from "./Navbar";
import TaskBoard from "./TaskBoard";
import AnalyticsPanel from "./AnalyticsPanel";
import PostsPage from "./PostsPage";
import type { Post } from "./PostsPage";

interface AppProps {
  /** The path that was active when the server rendered this page. */
  activePath: string;
  /**
   * Posts pre-fetched by the Go server. Only populated when
   * activePath === "/posts"; undefined otherwise.
   */
  posts?: Post[];
}

/**
 * App is the single hydration island for the entire application.
 *
 * It delegates all routing concerns to `<Router>` and declares each
 * page view with `<Route>`. The History API and popstate handling live
 * entirely inside router.tsx; App stays declarative.
 */
export default function App({ activePath, posts }: AppProps) {
  return (
    <Router initialPath={activePath}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Route path="/" component={TaskBoard} />
        <Route path="/analytics" component={AnalyticsPanel} />
        <Route
          path="/posts"
          component={PostsPage}
          props={{ initialPosts: posts }}
        />
      </main>
    </Router>
  );
}
