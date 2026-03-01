import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { Users, Calendar, ClipboardList, DollarSign, TrendingUp, BarChart3 } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalRegistrations: number;
  revenue: number;
}

const statConfig = [
  { key: "totalUsers" as const, label: "Total Users", icon: Users, color: "text-primary" },
  { key: "totalEvents" as const, label: "Total Events", icon: Calendar, color: "text-info" },
  { key: "totalRegistrations" as const, label: "Registrations", icon: ClipboardList, color: "text-success" },
  { key: "revenue" as const, label: "Revenue", icon: DollarSign, color: "text-warning", prefix: "₹" },
];

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, totalEvents: 0, totalRegistrations: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/admin/stats")
    .then((res) => {
      const data = res.data?.data || res.data;
      setStats({
        totalUsers: data.totalUsers ?? 0,
        totalEvents: data.totalEvents ?? 0,
        totalRegistrations: data.totalRegistrations ?? 0,
        revenue: data.revenue ?? 0,
      });
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your tech fest management</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statConfig.map((s) => (
            <Card key={s.key} className="glass-card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : `${s.prefix || ""}${stats[s.key].toLocaleString()}`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Registration Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">Chart coming soon</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-info" />
                Revenue Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">Chart coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
