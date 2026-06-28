// @mode lazy-client

import { TrendingUp, Award, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";

interface Task {
  id: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
}

interface AnalyticsChartProps {
  tasks: Task[];
}

export default function AnalyticsChart({ tasks }: AnalyticsChartProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const todo = tasks.filter((t) => t.status === "todo").length;

  const highPriority = tasks.filter((t) => t.priority === "high").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-linear-to-br from-indigo-50/50 to-indigo-100/30 border-indigo-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Completion Rate
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900">
                {completionRate}%
              </h2>
            </div>
            <Award className="w-10 h-10 text-indigo-500" />
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-emerald-50/50 to-emerald-100/30 border-emerald-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Completed Tasks
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900">
                {done}{" "}
                <span className="text-xs text-slate-400 font-medium">
                  / {total}
                </span>
              </h2>
            </div>
            <TrendingUp className="w-10 h-10 text-emerald-500" />
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-rose-50/50 to-rose-100/30 border-rose-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                High Priority Tasks
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900">
                {highPriority}
              </h2>
            </div>
            <Clock className="w-10 h-10 text-rose-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribution Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>TO DO ({todo})</span>
              <span>{total > 0 ? Math.round((todo / total) * 100) : 0}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 transition-all duration-500"
                style={{ width: `${total > 0 ? (todo / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-indigo-700">
              <span>IN PROGRESS ({inProgress})</span>
              <span>
                {total > 0 ? Math.round((inProgress / total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{
                  width: `${total > 0 ? (inProgress / total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-emerald-700">
              <span>DONE ({done})</span>
              <span>{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
