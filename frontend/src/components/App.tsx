// @mode hydrate

import * as React from "react";
import { Router, Layout, Route, useRouter } from "@/router";
import AppLayout from "@/layouts/AppLayout";
import TaskBoard from "./TaskBoard";
import AnalyticsPanel from "./AnalyticsPanel";
import PostsPage from "./PostsPage";
import type { Post } from "./PostsPage";
import Login from "./Login";
import BlankLayout from "@/layouts/BlankLayout";

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
 * Routing is handled by <Router>, layout composition by <Layout>, and
 * each page is declared with <Route>. Adding a new route is one line;
 * routes that need a different shell pass a `layout` prop to opt out of
 * the enclosing <Layout>.
 *
 * Example of a bare route alongside the standard ones:
 *
 *   <Route path="/login" component={Login} layout={BlankLayout} />
 */
export default function App({ activePath, posts }: AppProps) {
  return (
    <Router initialPath={activePath}>
      <AppRoutes posts={posts} />
    </Router>
  );
}

function AppRoutes({ posts }: { posts?: Post[] }) {
  const { navigate } = useRouter();

  return (
    <Layout component={AppLayout}>
      <Route path="/" component={TaskBoard} />
      <Route path="/analytics" component={AnalyticsPanel} />
      <Route
        path="/posts"
        component={PostsPage}
        props={{ initialPosts: posts }}
      />
      <Route
        path="/login"
        component={Login}
        layout={BlankLayout}
        props={{ onSubmit: () => navigate("/") }}
      />
    </Layout>
  );
}
