import * as React from "react";
import type { LayoutProps } from "@/router";

/**
 * BlankLayout renders page content with no surrounding chrome.
 *
 * Use this on routes that need a full-canvas experience (login pages,
 * print views, full-screen embeds) by passing it to Route's layout prop:
 *
 *   <Route path="/login" component={Login} layout={BlankLayout} />
 */
export default function BlankLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
