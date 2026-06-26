// @mode hydrate

import * as React from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";

interface Task {
  id: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
}

const AnalyticsChart = React.lazy(() => import("./AnalyticsChart"));

export default function AnalyticsPanel() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const saved = localStorage.getItem("revelt_tasks");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load tasks");
      }
    }

    // Simulate minor network delay to demonstrate the suspense skeleton loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Analytics Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Lazy loaded statistical calculations with asynchronous bundle
            loading.
          </p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4" /> Reload
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-75 gap-3 text-indigo-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">
            Preparing analytics stream...
          </span>
        </div>
      ) : (
        <React.Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-75 gap-3 text-indigo-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm font-semibold text-slate-500">
                Loading bundle chunk...
              </span>
            </div>
          }>
          <AnalyticsChart tasks={tasks} />
        </React.Suspense>
      )}
    </div>
  );
}
