import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import { Activity } from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  user: string;
  details: string;
  createdAt: string;
}

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/activity-logs")
      .then((res) => setLogs(res.data))
      .catch(() => {
        // fallback to empty
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">Timeline of recent actions</p>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {loading ? (
              <p className="pl-10 text-muted-foreground">Loading...</p>
            ) : logs.length === 0 ? (
              <Card className="glass-card ml-10">
                <CardContent className="py-12 text-center text-muted-foreground">No activity logs available</CardContent>
              </Card>
            ) : logs.map((log) => (
              <div key={log.id} className="relative flex items-start gap-4 pl-0">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-border">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                <Card className="flex-1 glass-card-hover">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h4 className="text-sm font-medium">{log.action}</h4>
                      <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">by {log.user}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogsPage;
