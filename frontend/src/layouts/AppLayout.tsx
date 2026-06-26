import * as React from "react";
import Navbar from "@/components/Navbar";
import type { LayoutProps } from "@/router";

/**
 * AppLayout is the primary application shell.
 *
 * It renders the top navigation bar above the page content and constrains
 * the content to the standard max-width container. All main routes use
 * this layout. Routes that need a blank canvas (e.g. a login page or a
 * full-screen embed) should declare `layout={BlankLayout}` on their Route
 * element to opt out.
 */
export default function AppLayout({ children }: LayoutProps) {
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </>
  );
}
