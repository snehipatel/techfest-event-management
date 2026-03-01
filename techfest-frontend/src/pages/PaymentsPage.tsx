import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { DollarSign, TrendingUp, CreditCard } from "lucide-react";

interface Payment {
  id: string;
  userName: string;
  amount: number;
  status: string;
  transactionId: string;
  createdAt: string;
}

const paymentStatusStyles: Record<string, string> = {
  SUCCESS: "bg-success/10 text-success border-success/20",
  PENDING: "bg-warning/10 text-warning border-warning/20",
  FAILED: "bg-destructive/10 text-destructive border-destructive/20",
};

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/payments").then((res) => setPayments(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalRevenue = payments.filter((p) => p.status === "SUCCESS").reduce((acc, p) => acc + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "PENDING").reduce((acc, p) => acc + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Overview</h1>
          <p className="text-muted-foreground">Track payments and revenue</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="glass-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div></CardContent>
          </Card>
          <Card className="glass-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">₹{totalPending.toLocaleString()}</div></CardContent>
          </Card>
          <Card className="glass-card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{payments.length}</div></CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>
                  ) : payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.userName}</TableCell>
                      <TableCell>₹{p.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className={paymentStatusStyles[p.status] || ""}>{p.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{p.transactionId}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PaymentsPage;
